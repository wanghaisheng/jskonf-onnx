import { Tensor } from "onnxruntime-web";

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
    clickType: number;
}

export enum ClickType {
    Point = 1,
    Box = 2,
}

export interface IModelData {
    clicks?: Array<IClickPoint>;
    tensor: Tensor;
    modelScale: IModelScale;
}

export interface ToolProps {
    handleMouseMove: (e: any) => void;
}
