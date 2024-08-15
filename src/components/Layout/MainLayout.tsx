import React, { ReactNode, useEffect, useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Badge } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardOutlined, BookOutlined, ShoppingCartOutlined, CommentOutlined, BellOutlined, UserOutlined, LogoutOutlined, PhoneOutlined } from '@ant-design/icons';
import { getAuth, signOut } from 'firebase/auth';
// import { useNotification } from './NotificationContext';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const auth = getAuth();
  // const { notifications } = useNotification();
  const [data, setData] = useState([]);

  useEffect(() => {
    // Hàm gọi API
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.example.com/data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // Gọi API khi component được mount
    fetchData();
  }, []); // Mảng phụ thuộc rỗng để chỉ gọi API một lần khi component được mount

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Đăng xuất thành công, chuyển hướng đến trang đăng nhập
        console.log('Logout successful!');
        navigate('/login');
      })
      .catch((error) => {
        // Xử lý lỗi nếu có
        console.error('Error logging out: ', error);
      });
  };

  const items = [
    { key: '1', icon: <DashboardOutlined />, label: <Link to="/dashboard">Bảng điều khiển</Link> },
    { key: '2', icon: <BookOutlined />, label: <Link to="/tours">Quản lý Tour</Link> },
    { key: '3', icon: <ShoppingCartOutlined />, label: <Link to="/bookings">Quản lý Đặt chỗ</Link> },
    { key: '4', icon: <CommentOutlined />, label: <Link to="/comments">Bình luận</Link> },
    { key: '5', icon: <PhoneOutlined />, label: <Link to="/contact">Liên hệ</Link> } // Thêm liên kết đến trang Liên hệ
  ];
  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Item key="2" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible style={{ position: 'fixed', height: '100vh' }}>
        <Menu theme="dark" mode="inline" items={items} />
      </Sider>
      <Layout style={{ marginLeft: 200 }}> {/* Adjust margin to match Sider width */}
        <Header style={{ background: '#fff', padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div></div> {/* Placeholder để căn giữa các mục */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* <Badge count={notifications.length} offset={[10, 0]} style={{ marginRight: 16 }}>
              <Button type="text" icon={<BellOutlined />} />
            </Badge> */}
            <Dropdown overlay={menu} placement="bottomRight">
              <Avatar icon={<UserOutlined />} style={{ marginLeft: 16 }} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;