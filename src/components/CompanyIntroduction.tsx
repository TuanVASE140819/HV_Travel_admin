import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button, Form, message } from 'antd';
import { collection, updateDoc, doc, getDocs } from 'firebase/firestore';

import { firestore } from '../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const modules = {
  toolbar: [
    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
    [{size: []}],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, 
     {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image', 'video'],
    ['clean']                                         
  ],
};

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image', 'video'
];

const CompanyIntroduction = () => {
  const [content, setContent] = useState('');
  const [docId, setDocId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

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
      });
    } catch (error) {
      message.error('Lấy nội dung thất bại!');
    } finally {
      hide();
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const hide = message.loading('Đang lưu nội dung...', 0);
    try {
      const docRef = doc(firestore, 'companyIntroduction', docId);
      await updateDoc(docRef, {
        content: content,
        updatedAt: new Date(),
      });
      message.success('Nội dung đã được cập nhật thành công!');
    } catch (error) {
      message.error('Cập nhật nội dung thất bại!');
    } finally {
      hide();
      setLoading(false);
    }
  };

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