import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import HospitalDetail from './pages/HospitalDetail';
import DoctorDetail from './pages/DoctorDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hospitals/:id" element={<HospitalDetail />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute role="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<div className="py-24 text-center text-ink-400">Page not found</div>} />
      </Routes>
    </div>
  );
}
