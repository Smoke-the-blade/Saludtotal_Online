import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import RegistroPaciente from './pages/RegistroPaciente';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PacienteDashboard from './pages/PacienteDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<RegistroPaciente />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      <Route path="/paciente-dashboard" element={<PacienteDashboard />} />
    </Routes>
  );
}

export default App;
