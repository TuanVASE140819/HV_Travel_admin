import React, { useState, useEffect } from 'react';
import { Upload, Button, Form, message, Card, Row, Col } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { storage } from '../firebaseConfig';
import { ref, listAll, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import CompanyIntroduction from '../components/CompanyIntroduction';

const Dashboard: React.FC = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [banners, setBanners] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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

  const handleUpload = (file: any, folder: string, callback: (url: string) => void) => {
    const storageRef = ref(storage, `${folder}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Progress function
      },
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

  const handleLogoUpload = (file: any) => {
    const renamedFile = new File([file], 'logo.png', { type: file.type });
    handleUpload(renamedFile, 'logos', (url) => {
      setLogo(url);
      localStorage.setItem('logo', url); // Lưu URL vào local storage
    });
    return false;
  };

  const handleBannerUpload = (file: any) => {
    handleUpload(file, 'banners', (url) => {
      setBanners((prevBanners) => {
        const newBanners = [...prevBanners, url];
        localStorage.setItem('banners', JSON.stringify(newBanners)); // Lưu URL vào local storage
        return newBanners;
      });
    });
    return false;
  };

  const handleBannerUpdate = (file: any, index: number) => {
    handleUpload(file, 'banners', (url) => {
      setBanners((prevBanners) => {
        const newBanners = [...prevBanners];
        newBanners[index] = url;
        localStorage.setItem('banners', JSON.stringify(newBanners)); // Lưu URL vào local storage
        return newBanners;
      });
    });
    return false;
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
        <Col span={24}>
          <Card title="Giới thiệu công ty">
            <CompanyIntroduction />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;