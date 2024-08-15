import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Rate, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from '../firebaseConfig';

interface UpdateCommentFormProps {
  commentKey: string;
  onClose: () => void;
}

const UpdateCommentForm: React.FC<UpdateCommentFormProps> = ({ commentKey, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchComment = async () => {
      const commentRef = doc(firestore, `comments/${commentKey}`);
      const snapshot = await getDoc(commentRef);
      if (snapshot.exists()) {
        form.setFieldsValue(snapshot.data());
      }
    };

    fetchComment();
  }, [commentKey, form]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const { name, comment, rating, avatar } = values;
      if (!name || !comment || !rating || !avatar || !avatar.file) {
        message.error('Please fill all the fields.');
        setLoading(false);
        return;
      }

      const file = avatar.file.originFileObj;
      const reader = new FileReader();

      reader.onloadend = async () => {
        const avatarUrl = reader.result as string;

        await setDoc(doc(firestore, `comments/${commentKey}`), {
          name,
          comment,
          rating,
          avatar: avatarUrl,
        });

        message.success('Comment updated successfully.');
        setLoading(false);
        onClose();
      };

      if (file) {
        reader.readAsDataURL(file);
      } else {
        message.error('Failed to read the file.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating comment: ', error);
      message.error('Failed to update comment.');
      setLoading(false);
    }
  };

  return (
    <Form form={form} name="updateCommentForm" onFinish={onFinish} layout="vertical">
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="comment" label="Comment" rules={[{ required: true }]}>
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item name="rating" label="Rating" rules={[{ required: true }]}>
        <Rate />
      </Form.Item>
      <Form.Item name="avatar" label="Avatar" rules={[{ required: true }]}>
        <Upload maxCount={1} beforeUpload={() => false}>
          <Button icon={<UploadOutlined />}>Upload Avatar</Button>
        </Upload>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Update Comment
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UpdateCommentForm;
