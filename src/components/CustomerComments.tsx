import React, { useEffect, useState } from 'react';
import { Table, Avatar, Rate, Button, Modal, Form, Input, Popconfirm, message, Upload } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firestore } from '../firebaseConfig';
import { read, utils, writeFile } from 'xlsx';
import { Typography } from 'antd';
const { Text } = Typography;

interface Comment {
  key: string;
  avatar: string;
  name: string;
  comment: string;
  rating: number;
}

const CustomerComments: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tempComments, setTempComments] = useState<Comment[]>([]);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [searchText, currentPage, pageSize]);

  const fetchComments = async () => {
    const commentsCollection = collection(firestore, 'comments');
    let q;
    if (searchText) {
      q = query(
        commentsCollection,
        where('name', '>=', searchText),
        where('name', '<=', searchText + '\uf8ff')
      );
    } else {
      q = commentsCollection;
    }
    const querySnapshot = await getDocs(q);
    const commentsData: Comment[] = [];
    querySnapshot.forEach((doc) => {
      commentsData.push({
        key: doc.id,
        avatar: doc.data().avatar,
        name: doc.data().name,
        comment: doc.data().comment,
        rating: doc.data().rating,
      });
    });
    setComments(commentsData);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const newComment = {
        avatar: imageUrl || '', // Đảm bảo avatar luôn là một chuỗi
        name: values.name,
        comment: values.comment,
        rating: values.rating,
      };
      const docRef = await addDoc(collection(firestore, 'comments'), newComment);
      setComments([...comments, { key: docRef.id, ...newComment }]);
      form.resetFields();
      setIsModalVisible(false);
      setImageUrl(null);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setImageUrl(null);
  };

  const handleEdit = (comment: Comment) => {
    setSelectedComment(comment);
    editForm.setFieldsValue(comment);
    setIsEditModalVisible(true);
  };

const handleEditOk = async () => {
  try {
    const values = await editForm.validateFields();
    const updatedComment = {
      avatar: imageUrl || selectedComment!.avatar, // Đảm bảo avatar luôn là một chuỗi
      name: values.name,
      comment: values.comment,
      rating: values.rating,
    };
    await updateDoc(doc(firestore, 'comments', selectedComment!.key), updatedComment);
    setComments(comments.map(comment => comment.key === selectedComment!.key ? { key: comment.key, ...updatedComment } : comment));
    setIsEditModalVisible(false);
    setSelectedComment(null);
    setImageUrl(null);
  } catch (error) {
    console.error("Error updating document: ", error);
  }
};

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setSelectedComment(null);
    setImageUrl(null);
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteDoc(doc(firestore, 'comments', key));
      setComments(comments.filter(comment => comment.key !== key));
      message.success('Xóa bình luận thành công');
    } catch (error) {
      console.error("Error deleting document: ", error);
      message.error('Xóa bình luận thất bại');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleUpload = async (file: any) => {
    const storage = getStorage();
    const storageRef = ref(storage, `avatars/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);

    uploadTask.on('state_changed', 
      (snapshot) => {
        // Handle progress
      }, 
      (error) => {
        console.error("Error uploading file: ", error);
        setUploading(false);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageUrl(downloadURL);
          setUploading(false);
        });
      }
    );
  };

  const handleImportExcel = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet);
        // Xử lý dữ liệu jsonData và cập nhật state tempComments
        const importedComments = jsonData.map((item: any) => ({
          key: item.key || '', // Đảm bảo key không phải là undefined
          avatar: item.avatar || '',
          name: item.name || '',
          comment: item.comment || '',
          rating: item.rating || 0,
        }));
        setTempComments(importedComments);
        setIsPreviewModalVisible(true); // Hiển thị modal
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    const worksheet = utils.json_to_sheet(comments);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Comments');
    writeFile(workbook, 'comments.xlsx');
  };
  const handleApprove = async () => {
    const commentsCollection = collection(firestore, 'comments');
    for (const comment of tempComments) {
      const validComment = Object.fromEntries(
        Object.entries(comment).filter(([_, v]) => v !== undefined)
      );
      await addDoc(commentsCollection, validComment);
    }
    await fetchComments(); // Tải lại dữ liệu sau khi thêm thành công
    setIsPreviewModalVisible(false);
    message.success('Import và đẩy dữ liệu lên Firebase thành công!');
    window.location.reload();
  };
  const columns = [
    {
      title: 'STT',
      key: 'index',
      render: (text: any, record: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (text: string) => <Avatar src={text} />,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Bình luận',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Comment) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm title="Bạn có chắc chắn muốn xóa bình luận này?" onConfirm={() => handleDelete(record.key)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const previewColumns = columns.filter(column => column.key !== 'actions');

  return (
    <div style={{ position: 'relative' }}>
      
   <div style={{ display: 'flex', justifyContent: 'flex-end',alignItems: 'center', marginBottom: '10px',gap: '10px' }}>
   <Text strong>Tổng số bình luận: {comments.length}</Text>
  <Button
    type="primary"
    onClick={showModal}
    style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', borderRadius: 4 }}
  >
    Thêm bình luận
  </Button>
  <Upload
    accept=".xlsx, .xls"
    showUploadList={false}
    beforeUpload={(file) => {
      handleImportExcel(file);
      return false;
    }}
  >
    <Button icon={<UploadOutlined />}>Import Excel</Button>
  </Upload>
  <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
    Export Excel
  </Button>
</div>
      <Input.Search
        placeholder="Tìm kiếm theo tên"
        value={searchText}
        onChange={handleSearch}
        style={{ marginBottom: 16, width: 300, borderRadius: 4, padding: '8px 12px' }}
      />
      <Table
        dataSource={comments}
        columns={columns}
        pagination={{ current: currentPage, pageSize: pageSize, total: comments.length }}
        onChange={handleTableChange}
      />
      
      <Modal title="Thêm bình luận" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <Form form={form} layout="vertical">
          <Form.Item name="avatar" label="URL Avatar">
            <Upload
              customRequest={({ file }) => handleUpload(file)}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Tải lên Avatar</Button>
            </Upload>
            {imageUrl && <Avatar src={imageUrl} size={64} />}
          </Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên của bạn!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="comment" label="Bình luận" rules={[{ required: true, message: 'Vui lòng nhập bình luận của bạn!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rating" label="Đánh giá" rules={[{ required: true, message: 'Vui lòng nhập đánh giá của bạn!' }]}>
            <Rate />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="Sửa bình luận" visible={isEditModalVisible} onOk={handleEditOk} onCancel={handleEditCancel}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="avatar" label="URL Avatar">
            <Upload
              customRequest={({ file }) => handleUpload(file)}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Tải lên Avatar</Button>
            </Upload>
            {imageUrl && <Avatar src={imageUrl} size={64} />}
          </Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên của bạn!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="comment" label="Bình luận" rules={[{ required: true, message: 'Vui lòng nhập bình luận của bạn!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rating" label="Đánh giá" rules={[{ required: true, message: 'Vui lòng nhập đánh giá của bạn!' }]}>
            <Rate />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
  title="Xem trước dữ liệu"
  visible={isPreviewModalVisible}
  onCancel={() => setIsPreviewModalVisible(false)}
  onOk={handleApprove}
  okText="Duyệt"
  cancelText="Hủy"
>
<Table dataSource={tempComments} columns={previewColumns} pagination={false} />
</Modal>
    </div>
  );
};

export default CustomerComments;