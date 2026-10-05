import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import CitizenDashboard from './pages/CitizenDashboard';
import PatientMonitoring from './pages/PatientMonitoring';
import DoctorDashboard from './pages/DoctorDashboard';
import TrafficAuthorityDashboard from './pages/TrafficAuthorityDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import EmergencySOS from './pages/EmergencySOS';
import EmergencyCaseDashboard from './pages/EmergencyCaseDashboard';
import ProtectedRoute from './components/ui/ProtectedRoute';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/emergency" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/admin/dashboard"
        element={(
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/hospital/dashboard"
        element={(
          <ProtectedRoute requiredRole="hospital">
            <HospitalDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/ambulance/dashboard"
        element={(
          <ProtectedRoute requiredRole="ambulance">
            <AmbulanceDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/citizen/dashboard"
        element={(
          <ProtectedRoute requiredRole="citizen">
            <CitizenDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/dashboard"
        element={(
          <ProtectedRoute requiredRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/traffic/dashboard"
        element={(
          <ProtectedRoute requiredRole="traffic">
            <TrafficAuthorityDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/patient/monitoring"
        element={(
          <ProtectedRoute requiredRole="citizen">
            <PatientMonitoring />
          </ProtectedRoute>
        )}
      />
      <Route path="/emergency" element={<EmergencySOS />} />
      <Route path="/emergency/sos" element={<EmergencySOS />} />
      <Route path="/emergency-case/:emergencyId" element={<EmergencyCaseDashboard />} />
      <Route path="*" element={<Navigate replace to="/emergency" />} />
    </Routes>
  );
}

export default AppRouter;