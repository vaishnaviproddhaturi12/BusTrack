import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../apiConfig';
import './AdminAttendance.css';

const AdminAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAttendance();
    }
  }, [user, startDate, endDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/api/attendance/all?startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container my-5">
        <h2>Admin Attendance</h2>
        <p className="text-muted">Please log in as admin to view this page.</p>
      </div>
    );
  }

  const totalRecords = attendance.length;
  const morningPresent = attendance.filter(a => a.morning).length;
  const eveningPresent = attendance.filter(a => a.evening).length;

  return (
    <div className="container my-5">
      <div className="admin-attendance-container">
        <h2>📊 Attendance Dashboard</h2>
        
        <div className="attendance-stats">
          <div className="stat-card">
            <h3>{totalRecords}</h3>
            <p>Total Records</p>
          </div>
          <div className="stat-card">
            <h3>{morningPresent}</h3>
            <p>Morning Present</p>
          </div>
          <div className="stat-card">
            <h3>{eveningPresent}</h3>
            <p>Evening Present</p>
          </div>
        </div>

        <div className="date-filter">
          <label>From:</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginRight: '15px' }}
          />
          <label>To:</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : attendance.length === 0 ? (
          <p className="text-muted">No attendance records found for this date</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Bus</th>
                  <th>Morning</th>
                  <th>Evening</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, index) => (
                  <tr key={index}>
                    <td>{record.date}</td>
                    <td>{record.studentId?.name || 'N/A'}</td>
                    <td>{record.studentId?.email || 'N/A'}</td>
                    <td>{record.busId?.busNumber || 'N/A'}</td>
                    <td>
                      {record.morning ? (
                        <span className="badge bg-success">✓ Present</span>
                      ) : (
                        <span className="badge bg-secondary">-</span>
                      )}
                    </td>
                    <td>
                      {record.evening ? (
                        <span className="badge bg-success">✓ Present</span>
                      ) : (
                        <span className="badge bg-secondary">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendance;
