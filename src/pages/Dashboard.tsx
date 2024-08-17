import React, { useState, useEffect } from 'react';
import { Upload, Button, Form, Input, message, Card, Row, Col } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { storage, firestore } from '../firebaseConfig';
import { ref, listAll, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { collection, updateDoc, doc, getDocs } from 'firebase/firestore';
import CompanyIntroduction from '../components/CompanyIntroduction';

interface CompanyInfo {
  website: string;
  phone: string;
  address: string;
  gmail: string;
  facebook?: string;
  instagram?: string;
  zalo?: string;
  [key: string]: any;
}

const Dashboard: React.FC = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [banners, setBanners] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    website: '',
    phone: '',
    address: '',
    gmail: '',
    facebook: '',
    instagram: '',
    zalo: '',
  });
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const hideLoading = message.loading('Loading images...', 0);
      try {
        // Fetch logo
        const logoRef = ref(storage, 'logos/');
        const logoList = await listAll(logoRef);
        if (logoList.items.length > 0) {
          const logoUrl = await getDownloadURL(logoList.items[0]);
          setLogo(logoUrl);
        }

        // Fetch banners
        const bannersRef = ref(storage, 'banners/');
        const bannersList = await listAll(bannersRef);
        const bannersUrls = await Promise.all(bannersList.items.map(item => getDownloadURL(item)));
        setBanners(bannersUrls);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        hideLoading();
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, 'companyInfo'));
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CompanyInfo;
        setCompanyInfo(data);
        form.setFieldsValue(data); // Set form values
      });
    } catch (error) {
      message.error('Failed to fetch company information!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const handleUpload = (file: File, folder: string, callback: (url: string) => void) => {
    const storageRef = ref(storage, `${folder}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        message.error('Upload failed');
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          callback(downloadURL);
          message.success('Upload successful');
        });
      }
    );
  };

  const handleLogoUpload = (file: File) => {
    const renamedFile = new File([file], 'logo.png', { type: file.type });
    handleUpload(renamedFile, 'logos', (url) => {
      setLogo(url);
      localStorage.setItem('logo', url); // Save to local storage
    });
    return false;
  };

  const handleBannerUpload = (file: File) => {
    handleUpload(file, 'banners', (url) => {
      setBanners((prevBanners) => {
        const newBanners = [...prevBanners, url];
        localStorage.setItem('banners', JSON.stringify(newBanners)); // Save to local storage
        return newBanners;
      });
    });
    return false;
  };

  const handleBannerUpdate = (file: File, index: number) => {
    handleUpload(file, 'banners', (url) => {
      setBanners((prevBanners) => {
        const newBanners = [...prevBanners];
        newBanners[index] = url;
        localStorage.setItem('banners', JSON.stringify(newBanners)); // Save to local storage
        return newBanners;
      });
    });
    return false;
  };

  const handleCompanyInfoSubmit = async (values: CompanyInfo) => {
    setLoading(true);
    const hideLoading = message.loading('Saving company information...', 0);
    try {
      await updateDoc(doc(firestore, 'companyInfo', 'info'), values);
      message.success('Company information saved successfully');
    } catch (error) {
      console.error('Error saving company information:', error);
      message.error('Failed to save company information');
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Logo">
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              beforeUpload={handleLogoUpload}
            >
              {logo ? <img src={logo} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
            </Upload>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Banners">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {banners.map((banner, index) => (
                <Upload
                  key={index}
                  name="banner"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={(file) => handleBannerUpdate(file, index)}
                >
                  {banner ? <img src={banner} alt={`Banner ${index + 1}`} style={{ width: '100%' }} /> : uploadButton}
                </Upload>
              ))}
              <Upload
                name="banner"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={handleBannerUpload}
              >
                {uploadButton}
              </Upload>
            </div>
          </Card>
        </Col>
        <Col span={24} style={{ marginTop: 16 }}>
          <Card title="Thông tin công ty">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCompanyInfoSubmit}
              initialValues={companyInfo}
            >
              <Form.Item
                label="Website"
                name="website"
                rules={[{ required: true, message: 'Please input your website!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[{ required: true, message: 'Please input your phone number!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: 'Please input your address!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Gmail"
                name="gmail"
                rules={[{ required: true, message: 'Please input your Gmail!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Facebook"
                name="facebook"
                rules={[{ required: true, message: 'Please input your Facebook link!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Instagram"
                name="instagram"
                rules={[{ required: true, message: 'Please input your Instagram link!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Zalo"
                name="zalo"
                rules={[{ required: true, message: 'Please input your Zalo link!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={24} style={{ marginTop: 16 }}>
          <Card title="Giới thiệu công ty">
            <CompanyIntroduction />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;