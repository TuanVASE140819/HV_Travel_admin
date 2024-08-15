import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Rate, Modal, Form, message, Upload, Popconfirm } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { uploadImage } from '../components/utils/uploadImage';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Define the Tour interface
interface Tour {
  key?: string;
  name: string;
  duration: string;
  price: number;
  departure: string;
  rating: number;
  image: string;
}

const Tours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    const querySnapshot = await getDocs(collection(firestore, 'tours'));
    const data: Tour[] = querySnapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as Tour));
    setTours(data);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/tour/${id}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleAddTour = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const file = values.image[0].originFileObj;
      const imageUrl = await uploadImage(file);

      const newTour: Tour = {
        name: values.name,
        duration: values.duration,
        price: values.price,
        departure: values.departure,
        rating: values.rating,
        image: imageUrl,
      };

      await addDoc(collection(firestore, 'tours'), newTour);

      message.success('Tour added successfully!');
      setIsModalVisible(false);
      fetchTours(); // Refresh the tours list
    } catch (error) {
      message.error('Failed to add tour!');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleEdit = (tour: Tour) => {
    setSelectedTour(tour);
    editForm.setFieldsValue(tour);
    setIsEditModalVisible(true);
  };

  const handleEditOk = async () => {
    try {
      const values = await editForm.validateFields();
      const updatedTour = {
        ...selectedTour,
        ...values,
      };

      if (values.image && values.image[0].originFileObj) {
        const file = values.image[0].originFileObj;
        const imageUrl = await uploadImage(file);
        updatedTour.image = imageUrl;
      }

      await updateDoc(doc(firestore, 'tours', selectedTour!.key!), updatedTour);

      message.success('Tour updated successfully!');
      setIsEditModalVisible(false);
      setSelectedTour(null);
      fetchTours(); // Refresh the tours list
    } catch (error) {
      message.error('Failed to update tour!');
    }
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setSelectedTour(null);
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteDoc(doc(firestore, 'tours', key));
      setTours(tours.filter(tour => tour.key !== key));
      message.success('Tour deleted successfully!');
    } catch (error) {
      message.error('Failed to delete tour!');
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      render: (text: any, record: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Tên Tour',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Thời Gian',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Khởi Hành',
      dataIndex: 'departure',
      key: 'departure',
    },
    {
      title: 'Đánh Giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: 'Hình Ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (image: string) => <img src={image} alt="Tour" style={{ width: 100 }} />,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Tour) => (
        <>
        {/* <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button> */}
        <Button type="link" onClick={() => handleViewDetails(record.key!)}>Chi tiết</Button>
        <Popconfirm title="Bạn có chắc chắn muốn xóa tour này?" onConfirm={() => handleDelete(record.key!)}>
          <Button type="link" danger>Xóa</Button>
        </Popconfirm>
      </>
      ),
    },
  ];

  return (
    <Card title="Quản Lý Tour">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm theo tên tour"
          value={searchText}
          onChange={handleSearch}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTour}>
          Thêm Tour
        </Button>
      </div>
      <Table
        dataSource={tours.filter(tour => tour.name.includes(searchText))}
        columns={columns}
        pagination={{ current: currentPage, pageSize: pageSize, total: tours.length }}
        onChange={handleTableChange}
      />
      <Modal title="Thêm Tour" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên Tour" rules={[{ required: true, message: 'Vui lòng nhập tên tour' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="duration" label="Thời Gian" rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="departure" label="Khởi Hành" rules={[{ required: true, message: 'Vui lòng nhập khởi hành' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rating" label="Đánh Giá" rules={[{ required: true, message: 'Vui lòng nhập đánh giá' }]}>
            <Rate />
          </Form.Item>
          <Form.Item
            name="image"
            label="Hình Ảnh"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
            rules={[{ required: true, message: 'Vui lòng tải lên hình ảnh' }]}
          >
            <Upload name="image" listType="picture" beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Tải lên hình ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="Sửa Tour" visible={isEditModalVisible} onOk={handleEditOk} onCancel={handleEditCancel}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Tên Tour" rules={[{ required: true, message: 'Vui lòng nhập tên tour' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="duration" label="Thời Gian" rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="departure" label="Khởi Hành" rules={[{ required: true, message: 'Vui lòng nhập khởi hành' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rating" label="Đánh Giá" rules={[{ required: true, message: 'Vui lòng nhập đánh giá' }]}>
            <Rate />
          </Form.Item>
          <Form.Item
            name="image"
            label="Hình Ảnh"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <Upload name="image" listType="picture" beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Tải lên hình ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Tours;