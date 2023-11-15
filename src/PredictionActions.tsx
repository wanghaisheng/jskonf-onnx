import { Button, Typography } from 'antd';
import { predictionHelper } from './PredictionHelper';
import Styles from './assets/App.module.scss';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { EmbeddingStatus } from './entities';

export default function PredictionActions() {
    return (
        <div className={Styles.PredictionActions}>
            <Typography.Text
                strong
                className={Styles.StatusText}
            >
                EmbeddingStatus: <Typography.Text>{predictionHelper.embeddingStatus}</Typography.Text>{' '}
                {predictionHelper.embeddingStatus.value === EmbeddingStatus.Loading ? <LoadingOutlined spin /> : null}
            </Typography.Text>

            <Button onClick={predictionHelper.clearCanvas}>Clear</Button>
        </div>
    );
}
