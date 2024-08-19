import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, notification } from 'antd';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Đảm bảo bạn đã cấu hình Firebase

interface ContactInfo {
  key: string;
  name: string;
  email: string;
  message: string;
}

const Contact: React.FC = () => {
  const [contacts, setContacts] = useState<ContactInfo[]>([]);

  useEffect(() => {
    const q = query(collection(firestore, 'contacts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newContacts: ContactInfo[] = [];
      snapshot.forEach((doc) => {
        newContacts.push({ key: doc.id, ...doc.data() } as ContactInfo);
      });
      setContacts(newContacts);

      // Gửi thông báo khi có liên hệ mới
      if (snapshot.docChanges().length > 0) {
        const newContact = snapshot.docChanges()[0].doc.data() as ContactInfo;
        notification.success({
          message: 'Liên hệ mới',
          description: `Khách hàng ${newContact.name} đã gửi một liên hệ mới.`,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (values: ContactInfo) => {
    try {
      await addDoc(collection(firestore, 'contacts'), values);
    } catch (error) {
      console.error("Error adding new contact: ", error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể thêm liên hệ mới.',
      });
    }
  };

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Tin nhắn',
      dataIndex: 'message',
      key: 'message',
    },
  ];

  return (
    <div className="contact-container">
      {/* <Card className="contact-form-card">
        <h2>Liên hệ</h2>
        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên của bạn' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email của bạn' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="message" label="Tin nhắn" rules={[{ required: true, message: 'Vui lòng nhập tin nhắn của bạn' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Gửi
            </Button>
          </Form.Item>
        </Form>
      </Card> */}
      <Card className="contact-list-card" style={{ marginTop: 20 }}>
        <h2>Danh sách liên hệ</h2>
        <Table dataSource={contacts} columns={columns} />
      </Card>
    </div>
  );
};

export default Contact;