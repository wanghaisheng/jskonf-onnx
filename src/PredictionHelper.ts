import { signal } from "@preact/signals-react";
import { env, InferenceSession, Tensor } from "onnxruntime-web";
import { ClickType, EmbeddingStatus, IClickPoint, ModelReturnType } from "./entities";
import { onnxMaskToImage } from "./utils/maskUtils";

export class PredictionHelper {
    embedding: string;
    embeddingStatus = signal<EmbeddingStatus>(EmbeddingStatus.NotLoaded);
    session: InferenceSession;
    embeddingUrl = "https://model-zoo.metademolab.com/predictions/segment_everything_box_model";
    modelUrl = "/sam.onnx";
    clicks = signal<Array<IClickPoint>>([]);
    result: ModelReturnType;
    imageDataUri: string;

    constructor (public ImageId: string) {
        this.onDropImage = this.onDropImage.bind(this);
        this.onRemoveImage = this.onRemoveImage.bind(this);
        this.onClickImage = this.onClickImage.bind(this);
        this.clearCanvas = this.clearCanvas.bind(this);

        this.initModel();

        console.log(this);
    }

    get canvas(): HTMLCanvasElement {
        return document.getElementById(this.ImageId) as HTMLCanvasElement;
    }

    get context(): CanvasRenderingContext2D {
        return this.canvas?.getContext("2d");
    }

    get predictionResult() {
        return this.result?.output?.data as Float32Array;
    }

    get maskInput() {
        return this.result?.mask?.data as Float32Array;
    }

    async initModel() {
        env.wasm.wasmPaths = this.wasmPaths;

        this.session = await InferenceSession.create(this.modelUrl);
    }

    onDropImage(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files?.length > 0) {
            this.loadImage(files[0]);
        }
    }

    loadImage(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imageDataUri = e.target?.result as string;

            this.paintImage();

            const binary = this.convertDataUriToBinary(this.imageDataUri);
            this.getEmbedding(binary);
        };
        reader.readAsDataURL(file);
    }

    paintImage(): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.context.drawImage(img, 0, 0);
                resolve();
            };
            img.onerror = reject;
            img.src = this.imageDataUri;

            img.remove();
        });
    }

    clearCanvas() {
        this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.paintImage();
        this.clicks.value = [];
    }

    onRemoveImage() {
        this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    onClickImage(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        if (!this.embedding) return;
        const rect = this.canvas.getBoundingClientRect();

        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        const imageScale = this.canvas ? this.canvas.width / this.canvas.offsetWidth : 1;
        x *= imageScale;
        y *= imageScale;

        const click = this.getClick(x, y, e.ctrlKey ? "Remove" : "Add");

        this.clicks.value.push(click);

        this.segment();
    }

    getClick(x: number, y: number, strategy: "Add" | "Remove" = "Add") {
        const clickType = ClickType[strategy];
        return { x, y, clickType };
    }

    convertDataUriToBinary(dataUri: string) {
        const BASE64_MARKER = ";base64,";
        const base64Index = dataUri.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        const base64 = dataUri.substring(base64Index);
        const raw = window.atob(base64);
        const rawLength = raw.length;
        const array = new Uint8Array(new ArrayBuffer(rawLength));
        for (let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    }

    async getEmbedding(imageBinary: Uint8Array) {
        if (!imageBinary) return;
        try {
            this.embeddingStatus.value = EmbeddingStatus.Loading;

            const response = await fetch(this.embeddingUrl, {
                method: "POST",
                body: imageBinary,
            });

            const data = await response.json();

            this.embedding = data[0];

            this.embeddingStatus.value = EmbeddingStatus.Loaded;
        } catch (error) {
            console.error(error);
            this.embeddingStatus.value = EmbeddingStatus.Failed;
        }
    }

    async segment() {
        await this.initModel();

        const input = this.getModelInput();
        if (!input) return;

        try {
            this.result = (await this.session.run(input)) as any;

            const output = this.result.output;

            const mask = onnxMaskToImage(output.data as Float32Array, output.dims[0], output.dims[1]);

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            await this.paintImage();
            await this.applyMaskToImage(mask);
            this.paintPoints();

        } catch (error) {
            console.error(error);
        }
    }

    applyMaskToImage(maskSrc: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.context.drawImage(img, 0, 0);
                resolve();
            };
            img.onerror = reject;
            img.src = maskSrc;
        });
    }

    paintPoints() {
        const points = this.clicks.value;

        points.forEach(p => {
            this.context.beginPath();
            this.context.arc(p.x, p.y, 5, 0, 2 * Math.PI);
            this.context.strokeStyle = p.clickType === ClickType.Add ? "#3CA954" : "#FD4B50";
            this.context.stroke();
            this.context.closePath();
        });
    }

    getModelInput() {
        let pointCoords;
        let pointLabels;
        let pointCoordsTensor;
        let pointLabelsTensor;
        let useLastPred = true;
        const clicks = this.clicks.value;

        // Check there are input click prompts
        if (!clicks || clicks.length === 0) return;

        let n = clicks.length;
        const points = clicks.flatMap(p => [p.x, p.y]);
        // If there is no box input, a single padding point with
        // label -1 and coordinates (0.0, 0.0) should be concatenated
        // so initialize the array to support (n + 1) points.
        pointCoords = new Float32Array(2 * (n + 1));
        pointLabels = new Float32Array(n + 1);

        // Add clicks and scale to what SAM expects
        for (let i = 0; i < n; i++) {
            pointCoords[2 * (i)] = points[2 * i];
            pointCoords[2 * (i) + 1] = points[2 * i + 1];
            pointLabels[i] = clicks[i].clickType;
        }

    // Add in the extra point/label when only clicks and no box
    // The extra point is at (0, 0) with label -1

        pointCoords[2 * n] = 0.0;
        pointCoords[2 * n + 1] = 0.0;
        pointLabels[n] = -1.0;
        // update n for creating the tensor
        n = n + 1;

        // Create the tensor
        pointCoordsTensor = new Tensor('float32', pointCoords, [1, n, 2]);
        pointLabelsTensor = new Tensor('float32', pointLabels, [1, n]);


        if (pointCoordsTensor === undefined || pointLabelsTensor === undefined) return;

        const input = {
            low_res_embedding: new Tensor('float32', new Float32Array(Uint8Array.from(atob(this.embedding), c => c.charCodeAt(0)).buffer), [1, 256, 64, 64]),
            // original image size
            image_size: new Tensor('float32', new Float32Array([this.canvas.height, this.canvas.width])),
            // empty mask
            last_pred_mask: new Tensor('float32', new Float32Array(256 * 256), [1, 1, 256, 256]),
            has_last_pred: new Tensor('float32', new Float32Array([0])),
            point_coords: pointCoordsTensor,
            point_labels: pointLabelsTensor,
        };

        if (useLastPred && this.maskInput) {
            input.last_pred_mask = new Tensor('float32', this.maskInput, [1, 1, 256, 256]);
            input.has_last_pred = new Tensor('float32', new Float32Array([1]));
        }

        return input;
    }

    wasmPaths = {
        'ort-wasm.wasm': '/ort-wasm.wasm',
        'ort-wasm-simd.wasm': '/ort-wasm-simd.wasm',
        'ort-wasm-threaded.wasm': '/ort-wasm-threaded.wasm',
        'ort-wasm-simd-threaded.wasm': '/ort-wasm-simd-threaded.wasm',
    } as const;
}

export const predictionHelper = new PredictionHelper("prediction-image");