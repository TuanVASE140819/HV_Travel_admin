import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Tours from './pages/Tours';
import Bookings from './pages/Bookings';
import Comments from './pages/Comments';
import Login from './pages/Login';
import Contact from './pages/Contact';
import TourDetails from './pages/TourDetails';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tours" element={<Tours />} />
                <Route path="/tour/:id" element={<TourDetails />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/comments" element={<Comments />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;