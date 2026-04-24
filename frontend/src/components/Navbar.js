import React, { useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const collapseRef = useRef(null);

  const closeMobileMenu = () => {
    if (!collapseRef.current || window.innerWidth > 991) {
      return;
    }

    collapseRef.current.classList.remove('show');
  };

  const handleLogout = () => {
    closeMobileMenu();
    logout();
    showToast('Logged out successfully.');
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark app-navbar">
      <div className="container">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <Link className="navbar-brand" to="/">
          <img src="/bus-logo.svg" alt="Bus logo" className="navbar-logo" />
          <span>TrackMyBus</span>
        </Link>
        <div className="mobile-nav-actions">
          {user && user.role === 'student' && <NotificationBell />}
          {user ? (
            <button className="mobile-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <NavLink className="mobile-auth-link" to="/login" onClick={closeMobileMenu}>
              Login
            </NavLink>
          )}
        </div>
        <div className="collapse navbar-collapse" id="navbarNav" ref={collapseRef}>
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end onClick={closeMobileMenu}>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/routes" onClick={closeMobileMenu}>Bus Routes</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/contacts" onClick={closeMobileMenu}>Contacts</NavLink>
            </li>
            {user && user.role === 'student' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/track" onClick={closeMobileMenu}>Track My Bus</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/buspass" onClick={closeMobileMenu}>Digital Bus Pass</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/attendance" onClick={closeMobileMenu}>Attendance</NavLink>
                </li>
              </>
            )}
            {user && user.role === 'driver' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/driver" onClick={closeMobileMenu}>Driver Dashboard</NavLink>
              </li>
            )}
            {user && user.role === 'admin' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin-qr" onClick={closeMobileMenu}>QR Generator</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin-attendance" onClick={closeMobileMenu}>Attendance</NavLink>
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
                  <NavLink className="nav-link" to="/login" onClick={closeMobileMenu}>Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register" onClick={closeMobileMenu}>Register</NavLink>
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
