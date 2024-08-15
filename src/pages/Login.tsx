import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Typography } from 'antd';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import a CSS file for custom styles

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      message.error('Login failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={2} className="login-title">Welcome Back</Title>
        <Text type="secondary" className="login-description">Please login to your account</Text>
        <Form onFinish={handleLogin} layout="vertical" className="login-form">
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please enter your email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;