import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button, Card, Form, Input ,Row, Col, Rate, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface Tour {
  key?: string;
  name: string;
  duration: string;
  price: number;
  departure: string;
  rating: number;
  image: string;
  address?: string;
  phone?: string;
  highlights?: string[];
  itinerary?: string;
}

interface ItineraryItem {
  image: string;
  title: string;
  content: string;
}

const TourDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const firestore = getFirestore();
  const storage = getStorage();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchTour = async () => {
      if (id) {
        const docRef = doc(firestore, 'tours', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const tourData = docSnap.data() as Tour;
          setTour(tourData);
          setHighlights(tourData.highlights || []);
          const itineraryData = tourData.itinerary ? JSON.parse(tourData.itinerary) : [];
          setItinerary(itineraryData);
          form.setFieldsValue({
            name: tourData.name,
            duration: tourData.duration,
            price: tourData.price,
            departure: tourData.departure,
            rating: tourData.rating,
            image: [
              {
                uid: '-1',
                name: 'image.png',
                status: 'done',
                url: tourData.image,
              },
            ],
            address: tourData.address,
            phone: tourData.phone,
            highlights: tourData.highlights?.join('\n'),
            itinerary: itineraryData.map((item: ItineraryItem, index: number) => ({
              ...item,
              image: [
                {
                  uid: `${index}`,
                  name: 'image.png',
                  status: 'done',
                  url: item.image,
                },
              ],
            })),
          });
        }
      }
    };

    fetchTour();
  }, [id, form]);

  const handleUpdate = async (values: any) => {
    if (id) {
      const docRef = doc(firestore, 'tours', id);
      let imageUrl = tour?.image || ''; // Giữ nguyên URL hình ảnh cũ nếu không có thay đổi
  
      if (values.image && values.image[0].originFileObj) {
        const imageFile = values.image[0].originFileObj;
        const storageRef = ref(storage, `tour-images/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
  
      const updatedTour: Partial<Tour> = {
        name: values.name,
        duration: values.duration,
        price: values.price,
        departure: values.departure,
        rating: values.rating,
        image: imageUrl,
        address: values.address,
        phone: values.phone,
        highlights: highlights,
        itinerary: JSON.stringify(itinerary),
      };
  
      // Remove fields with undefined values
      const sanitizedTour = Object.fromEntries(
        Object.entries(updatedTour).filter(([_, value]) => value !== undefined)
      );
  
      await updateDoc(docRef, sanitizedTour);
      message.success('Cập nhật tour thành công!');
      navigate(`/tours/${id}`);
    }
  };

  const addHighlight = () => {
    setHighlights([...highlights, '']);
  };

  const addItineraryItem = () => {
    setItinerary([...itinerary, { image: '', title: '', content: '' }]);
  };

  const handleHighlightChange = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  const handleItineraryChange = async (index: number, key: keyof ItineraryItem, value: string | File | undefined) => {
    const newItinerary = [...itinerary];
  
    if (key === 'image' && value instanceof File) {
      const storageRef = ref(storage, `itinerary-images/${value.name}`);
      await uploadBytes(storageRef, value);
      const imageUrl = await getDownloadURL(storageRef);
      newItinerary[index][key] = imageUrl;
    } else if (value !== undefined) {
      newItinerary[index][key] = value as string;
    }
  
    setItinerary(newItinerary);
  };

  const handleDeleteItineraryItem = (index: number) => {
    const newItinerary = itinerary.filter((_, i) => i !== index);
    setItinerary(newItinerary);
  };

  if (!tour) {
    return <div>Loading...</div>;
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleUpdate}>
<Card title="Thông Tin Tour">
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item name="name" label="Tên Tour" rules={[{ required: true, message: 'Vui lòng nhập tên tour' }]}>
        <Input />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item name="duration" label="Thời Gian" rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}>
        <Input />
      </Form.Item>
      
    </Col>
  </Row>
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
        <Input />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item name="departure" label="Khởi Hành" rules={[{ required: true, message: 'Vui lòng nhập khởi hành' }]}>
        <Input />
      </Form.Item>
    </Col>
  </Row>
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item name="rating" label="Đánh Giá" rules={[{ required: true, message: 'Vui lòng nhập đánh giá' }]}>
        <Rate />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item name="address" label="Địa Chỉ">
        <Input />
      </Form.Item>
    </Col>
  </Row>
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item name="phone" label="Số Điện Thoại">
        <Input />
      </Form.Item>
    </Col>
  </Row>
  <Row gutter={16}>
  <Form.Item
        name="image"
        label="Hình Ảnh"
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
      >
        <Upload name="image" listType="picture" beforeUpload={
          () =>
            false
        } maxCount={1}>
          <Button icon={<UploadOutlined />}>Tải lên hình ảnh</Button>
        </Upload>
      </Form.Item>
    </Row>
 
</Card>
<Card title="Thông Tin Chi Tiết" style={{ marginTop: 16 }}>
<Form.Item label="Danh Sách Điểm Nổi Bật">
  {highlights.map((highlight, index) => (
    <Row key={index} gutter={16} style={{ marginBottom: 8 }}>
      <Col span={20}>
        <Input
          value={highlight}
          onChange={(e) => handleHighlightChange(index, e.target.value)}
        />
      </Col>
      <Col span={4}>
        <Button danger
        //  onClick={() => removeHighlight(index)}
         >Xóa</Button>
      </Col>
    </Row>
  ))}
  <Button type="dashed" onClick={addHighlight} style={{ width: '100%' }}>
    Thêm Điểm Nổi Bật
  </Button>
</Form.Item>
</Card>
     <Form.Item label="Lịch Trình Chi Tiết">
  {itinerary.map((item, index) => (
    <div key={index} style={{ marginBottom: 16 }}>
      <Card title="Lịch Trình" extra={<Button danger onClick={() => handleDeleteItineraryItem(index)}>Xóa</Button>}>
        <Form.Item label="Hình Ảnh">
          <Upload
            name={`itinerary[${index}].image`}
            listType="picture"
            beforeUpload={() => false}
            maxCount={1}
            fileList={item.image ? [{ uid: `${index}`, name: 'image.png', status: 'done', url: item.image }] : []}
            onChange={(info) => handleItineraryChange(index, 'image', info.fileList[0]?.originFileObj)}
          >
            <Button icon={<UploadOutlined />}>Tải lên hình ảnh</Button>
          </Upload>
        </Form.Item>
        <Form.Item label="Tiêu Đề">
          <Input
            value={item.title}
            onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Nội Dung">
          <Input.TextArea
            value={item.content}
            onChange={(e) => handleItineraryChange(index, 'content', e.target.value)}
            rows={2}
          />
        </Form.Item>
      </Card>
    </div>
  ))}
  <Button type="dashed" onClick={addItineraryItem} style={{ width: '100%' }}>
    Thêm Lịch Trình
  </Button>
</Form.Item>

 
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Cập nhật
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TourDetails;