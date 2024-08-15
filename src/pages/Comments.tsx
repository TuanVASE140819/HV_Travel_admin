import React from 'react';
import { Card } from 'antd';
import CustomerComments from '../components/CustomerComments';
import CommentForm from '../components/CommentForm';

const Comments: React.FC = () => {
  return (
    <Card title="Bình luận của khách hàng">
      <CustomerComments />
      {/* <Card title="Add a Comment" style={{ marginTop: 16 }}>
        <CommentForm />
      </Card> */}
    </Card>
  );
};

export default Comments;
