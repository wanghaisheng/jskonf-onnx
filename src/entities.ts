import { OnnxValue, Tensor } from "onnxruntime-web";

export enum EmbeddingStatus {
    NotLoaded = "Not Loaded",
    Loading = "Loading",
    Loaded = "Loaded",
    Failed = "Failed",
}


export interface IModelScale {
    samScale: number;
    height: number;
    width: number;
}

export interface IClickPoint {
    x: number;
    y: number;
    clickType: ClickType;
}

export enum ClickType {
    Remove = 0,
    Add = 1,
}

export interface IModelData {
    clicks?: Array<IClickPoint>;
    tensor: Tensor;
    modelScale: IModelScale;
}

export interface ToolProps {
    handleMouseMove: (e: any) => void;
}

export interface ModelReturnType {
    // iou_predictions: OnnxValue;
    // masks: OnnxValue;
    // low_res_masks: OnnxValue;
    mask: OnnxValue;
    output: OnnxValue;
}
