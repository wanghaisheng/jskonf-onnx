import { Layout, Typography } from 'antd';
import Styles from './assets/App.module.scss';
import ImageUpload from './ImageUpload';
import { predictionHelper } from './PredictionHelper';
import PredictionImage from './PredictionImage';

function App() {
    return (
        <Layout className={Styles.PageContainer}>
            <Layout.Content>
                <ImageUpload />

                <Typography.Text
                    strong
                    className={Styles.StatusText}
                >
                    EmbeddingStatus: <Typography.Text>{predictionHelper.embeddingStatus}</Typography.Text>
                </Typography.Text>

                <PredictionImage />
            </Layout.Content>
        </Layout>
    );
}

export default App;
