import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { Badge, Button, Typography } from 'antd';
import { predictionHelper } from './PredictionHelper';
import Styles from './assets/App.module.scss';
import { EmbeddingStatus, StatusMap } from './entities';

export default function PredictionActions() {
    return (
        <div className={Styles.PredictionActions}>
            <Typography.Text
                strong
                className={Styles.Status}
            >
                EmbeddingStatus: <Badge status={StatusMap[predictionHelper.embeddingStatus.value]} />
                <Typography.Text className={Styles.StatusText}>{predictionHelper.embeddingStatus}</Typography.Text>
                {predictionHelper.embeddingStatus.value === EmbeddingStatus.Loading ? <LoadingOutlined spin /> : null}
            </Typography.Text>

            <Button onClick={predictionHelper.clearCanvas}>Clear Predictions</Button>
        </div>
    );
}
