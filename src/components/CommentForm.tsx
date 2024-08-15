import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Rate } from 'antd';
import { LoadingOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { uploadImage } from './utils/uploadImage';

const getBase64 = (img: File, callback: (result: string | ArrayBuffer | null) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
};

const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('Bạn chỉ có thể tải lên tệp JPG/PNG!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Hình ảnh phải nhỏ hơn 2MB!');
  }
  return isJpgOrPng && isLt2M;
};

const CommentForm = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleChange = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj, (imageUrl) => {
        setAvatarUrl(imageUrl as string);
        setLoading(false);
      });
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Tải lên</div>
    </div>
  );

  const handleSubmitImage = async (file: File) => {
    setLoading(true);
    try {
      const avatarUrl = await uploadImage(file);
      setAvatarUrl(avatarUrl);

      // Đặt giá trị của ô input avatar với đường dẫn ảnh
      form.setFieldsValue({ avatar: avatarUrl });

      message.success('Tải lên thành công!');
    } catch (error) {
      message.error('Tải lên thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAll = async (values: any) => {
    setLoading(true);
    try {
      const file = values.avatar[0].originFileObj;
      await handleSubmitImage(file);

      const { name, comment, rating } = values;
      console.log('Avatar URL:', avatarUrl);
      console.log('Name:', name);
      console.log('Comment:', comment);
      console.log('Rating:', rating);

      message.success('Gửi biểu mẫu thành công!');
    } catch (error) {
      message.error('Gửi biểu mẫu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmitAll} layout="vertical">
      <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên của bạn' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="comment" label="Bình luận" rules={[{ required: true, message: 'Vui lòng nhập bình luận của bạn' }]}>
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item name="rating" label="Đánh giá" rules={[{ required: true, message: 'Vui lòng đánh giá' }]}>
        <Rate />
      </Form.Item>
      <Form.Item
        name="avatar"
        label="Ảnh đại diện"
        valuePropName="fileList"
        getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
        rules={[{ required: true, message: 'Vui lòng tải lên ảnh đại diện' }]}
      >
        <Upload
          name="avatar"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}
          beforeUpload={beforeUpload}
          onChange={handleChange}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{ width: '100%' }} />
          ) : (
            uploadButton
          )}
        </Upload>
      </Form.Item>
      {avatarUrl && (
        <Form.Item label="URL ảnh đại diện">
          <Input value={avatarUrl} readOnly />
        </Form.Item>
      )}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Gửi
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CommentForm;