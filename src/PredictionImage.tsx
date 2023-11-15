import { predictionHelper } from './PredictionHelper';
import Styles from './assets/App.module.scss';

export default function PredictionImage() {
    return (
        <canvas
            id={predictionHelper.ImageId}
            className={Styles.PredictionImage}
            onClick={predictionHelper.onClickImage}
        />
    );
}
