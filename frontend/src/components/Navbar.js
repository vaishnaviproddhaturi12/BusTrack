import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src="/bus-logo.svg" alt="Bus logo" className="navbar-logo" />
          <span>TrackMyBus</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/routes">Bus Routes</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contacts">Contacts</Link>
            </li>
            {user && user.role === 'student' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/track">Track My Bus</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/buspass">Digital Bus Pass</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/attendance">Attendance</Link>
                </li>
              </>
            )}
            {user && user.role === 'driver' && (
              <li className="nav-item">
                <Link className="nav-link" to="/driver">Driver Dashboard</Link>
              </li>
            )}
            {user && user.role === 'admin' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin-qr">QR Generator</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin-attendance">Attendance</Link>
                </li>
              </>
            )}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <>
                <li className="nav-item notification-item">
                  <NotificationBell />
                </li>
                <li className="nav-item">
                  <span className="nav-link">Welcome, {user.name}</span>
                </li>
                <li className="nav-item">
                  <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
