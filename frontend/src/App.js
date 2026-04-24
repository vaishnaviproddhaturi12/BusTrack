import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RoutePage from './pages/RoutePage';
import Contacts from './pages/Contacts';
import Track from './pages/Track';
import BusPass from './pages/BusPass';
import AdminQR from './pages/AdminQR';
import AdminAttendance from './pages/AdminAttendance';
import Attendance from './pages/Attendance';
import Login from './pages/Login';
import Register from './pages/Register';
import DriverDashboard from './pages/DriverDashboard';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/routes" element={<RoutePage />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/track" element={<Track />} />
              <Route path="/buspass" element={<BusPass />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/admin-qr" element={<AdminQR />} />
              <Route path="/admin-attendance" element={<AdminAttendance />} />
              <Route path="/driver" element={<DriverDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;