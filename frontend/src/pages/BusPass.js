import React from 'react';
import { useAuth } from '../context/AuthContext';
import './BusPass.css';

const BusPass = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'student') {
    return (
      <div className="container my-5">
        <h2>Digital Bus Pass</h2>
        <p className="text-muted">Please log in as a student to view your bus pass.</p>
      </div>
    );
  }

  const rollNumber = user.rollNumber
    ? user.rollNumber
    : user.email
      ? user.email.split('@')[0].replace(/\.|\s+/g, '').toUpperCase()
      : 'STUDENT-0001';

  const busNumber = user.bus?.busNumber || 'N/A';
  const route = user.bus?.route || 'Assigned Route';

  return (
    <div className="bus-pass-page py-5">
      <div className="container">
        <div className="bus-pass-card mx-auto">
        <div className="bus-pass-header">
          <div>
            <h3>BusTrack</h3>
            <p>Digital Student Bus Pass</p>
          </div>
          <div className="bus-pass-chip">BUS PASS</div>
        </div>

        <div className="bus-pass-details">
          <div className="bus-pass-row">
            <span>Student Name</span>
            <strong>{user.name}</strong>
          </div>
          <div className="bus-pass-row">
            <span>Roll Number</span>
            <strong>{rollNumber}</strong>
          </div>
          <div className="bus-pass-row">
            <span>Bus Number</span>
            <strong>{busNumber}</strong>
          </div>
          <div className="bus-pass-row">
            <span>Route</span>
            <strong>{route}</strong>
          </div>
        </div>

        <div className="bus-pass-code">
          <small>Valid for 2025-2026</small>
        </div>

          <div className="bus-pass-footer">
            <span>Issued by CVR</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusPass;
