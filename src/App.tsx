import { Layout } from 'antd';
import ImageUpload from './ImageUpload';
import PredictionActions from './PredictionActions';
import PredictionImage from './PredictionImage';
import Styles from './assets/App.module.scss';

function App() {
    return (
        <Layout className={Styles.PageContainer}>
            <ImageUpload />

            <PredictionActions />

            <PredictionImage />
        </Layout>
    );
}

export default App;
