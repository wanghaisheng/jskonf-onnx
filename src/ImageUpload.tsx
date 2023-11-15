import { InboxOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import Styles from './assets/App.module.scss';
import { predictionHelper } from './PredictionHelper';

const { Dragger } = Upload;

export default function ImageUpload() {
    return (
        <Dragger
            name="file"
            onChange={predictionHelper.onDropImage}
            action={() => Promise.resolve('done')}
            customRequest={e => e.onSuccess({ file: e.file })}
            className={Styles.ImageUpload}
            accept="image/*"
            multiple={false}
            maxCount={1}
            onRemove={predictionHelper.onRemoveImage}
        >
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
        </Dragger>
    );
}
