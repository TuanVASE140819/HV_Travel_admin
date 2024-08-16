import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button, Form, message, Upload } from 'antd';
import { collection, updateDoc, doc, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { firestore } from '../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { UploadOutlined } from '@ant-design/icons';

const modules = {
  toolbar: [
    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
    [{size: []}],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, 
     {'indent': '-1'}, {'indent': '+1'}],
    [{ 'color': [] }, { 'background': [] }], // Thêm tùy chọn màu sắc
    ['link', 'image', 'video'],
    ['clean']                                         
  ],
};

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'color', 'background', // Thêm định dạng màu sắc
  'link', 'image', 'video'
];

const CompanyIntroduction = () => {
  const [content, setContent] = useState('');
  const [docId, setDocId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        fetchContent();
      } else {
        setIsLoggedIn(false);
      }
    });
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    const hide = message.loading('Đang tải nội dung...', 0);
    try {
      const querySnapshot = await getDocs(collection(firestore, 'companyIntroduction'));
      querySnapshot.forEach((doc) => {
        setContent(doc.data().content);
        setDocId(doc.id);
        setImageUrl(doc.data().imageUrl || '');
      });
    } catch (error) {
      message.error('Lấy nội dung thất bại!');
    } finally {
      hide();
      setLoading(false);
    }
  };

  const handleUpload = async (file : any) => {
    const storage = getStorage();
    const storageRef = ref(storage, `company-introduction/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const hide = message.loading('Đang lưu nội dung...', 0);
    try {
      let newImageUrl = imageUrl;
      if (fileList.length > 0) {
        newImageUrl = await handleUpload(fileList[0].originFileObj);
      }

      const docRef = doc(firestore, 'companyIntroduction', docId);
      await updateDoc(docRef, {
        content: content,
        imageUrl: newImageUrl,
        updatedAt: new Date(),
      });
      setImageUrl(newImageUrl);
      message.success('Nội dung đã được cập nhật thành công!');
    } catch (error) {
      message.error('Cập nhật nội dung thất bại!');
    } finally {
      hide();
      setLoading(false);
    }
  };

  const handleChange = ({ fileList }: { fileList: any[] }) => setFileList(fileList.slice(-1));

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item label="Nội dung giới thiệu công ty">
        <ReactQuill 
          value={content} 
          onChange={setContent} 
          modules={modules}
          formats={formats}
          readOnly={!isLoggedIn || loading}
        />
      </Form.Item>
      <Form.Item label="Tải lên hình ảnh">
        <Upload
          listType="picture"
          beforeUpload={() => false}
          onChange={handleChange}
          fileList={fileList}
        >
          <Button icon={<UploadOutlined />}>Chọn hình ảnh</Button>
        </Upload>
        {imageUrl && <img src={imageUrl} alt="Company Introduction" 
          style={{ width: 200, height: 200, objectFit: 'cover' }}
         />}
      </Form.Item>
      {isLoggedIn && (
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default CompanyIntroduction;