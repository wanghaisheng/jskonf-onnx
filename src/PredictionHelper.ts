import { signal } from "@preact/signals-react";
import { env, InferenceSession } from "onnxruntime-web";
import { ClickType, EmbeddingStatus, IClickPoint } from "./entities";

export class PredictionHelper {
    embedding: string;
    embeddingStatus = signal<EmbeddingStatus>(EmbeddingStatus.NotLoaded);
    model: InferenceSession;
    embeddingUrl = "https://model-zoo.metademolab.com/predictions/segment_everything_box_model";
    clicks = signal<Array<IClickPoint>>([]);

    constructor (public ImageId: string) {
        this.onDropImage = this.onDropImage.bind(this);
        this.onRemoveImage = this.onRemoveImage.bind(this);
        this.onClickImage = this.onClickImage.bind(this);
    }

    get canvas(): HTMLCanvasElement {
        return document.getElementById(this.ImageId) as HTMLCanvasElement;
    }

    get context(): CanvasRenderingContext2D {
        return this.canvas?.getContext("2d");
    }

    async initORT() {
        env.wasm.wasmPaths = {
            "ort-wasm-simd-threaded.wasm": "/ort-wasm-simd-threaded.wasm",
            "ort-wasm-simd.wasm": "/ort-wasm-simd.wasm",
            "ort-wasm-threaded.wasm": "/ort-wasm-threaded.wasm",
            "ort-wasm.wasm": "/ort-wasm.wasm",
        };
        this.model = await InferenceSession.create(
            "/interactive_module_quantized_592547_2023_03_19_sam6_long_uncertain.onnx"
        );
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

            this.paintImage(e.target?.result as string);

            const binary = this.convertDataUriToBinary(e.target?.result as string);
            this.getEmbedding(binary);
        };
        reader.readAsDataURL(file);
    }

    paintImage(imageSrc: string) {
        const img = new Image();
        img.onload = () => {
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.context.drawImage(img, 0, 0);
        };
        img.src = imageSrc;

        img.remove();
    }

    onRemoveImage() {
        this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    onClickImage(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        const rect = this.canvas.getBoundingClientRect();

        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        const imageScale = this.canvas ? this.canvas.width / this.canvas.offsetWidth : 1;
        x *= imageScale;
        y *= imageScale;

        const click = this.getClick(x, y);

        this.clicks.value.push(click);

        console.log(this.clicks.value);
    }

    getClick(x: number, y: number) {
        const clickType = ClickType.Point;
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


}

export const predictionHelper = new PredictionHelper("prediction-image");