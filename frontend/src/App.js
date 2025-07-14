import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import LoginPage from './Components/loginpage/loginpage/LoginPage';
import AdminDashboard from './Components/loginpage/loginpage/AdminDashboard';
import EmployeeDashboard from './Components/loginpage/loginpage/EmployeeDashboard';
import './index.css';

function App() {
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    document.title = "ISAR EMS";
    AOS.init({ duration: 1000 });
  }, []);

  // 🔁 Re-check token/user on every route change
  useEffect(() => {
    setToken(localStorage.getItem('token'));
    const u = localStorage.getItem('user');
    setUser(u ? JSON.parse(u) : null);
  }, [location]);

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<LoginPage />} />

      {/* Protected Admin Dashboard */}
      <Route
        path="/admin-dashboard"
        element={
          token && user?.role === 'admin'
            ? <AdminDashboard />
            : <Navigate to="/" replace />
        }
      />

      {/* Protected Employee Dashboard */}
      <Route
        path="/employee-dashboard"
        element={
          token && user?.role === 'employee'
            ? <EmployeeDashboard />
            : <Navigate to="/" replace />
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
