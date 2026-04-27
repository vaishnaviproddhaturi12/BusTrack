import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../apiConfig';
import './Attendance.css';

const Attendance = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const updateCameraLabels = () => {
    const scannerRoot = document.getElementById('qr-reader');
    if (!scannerRoot) {
      return false;
    }

    const cameraSelect = scannerRoot.querySelector('select');
    if (!cameraSelect) {
      return false;
    }

    let updated = false;

    Array.from(cameraSelect.options).forEach((option, index) => {
      if (!option.value) {
        return;
      }

      option.text = index === 0 ? 'Front Camera' : 'Back Camera';
      updated = true;
    });

    return updated;
  };

  useEffect(() => {
    if (user && ['student', 'parent'].includes(user.role)) {
      fetchAttendance();

      // Set up polling for real-time attendance updates (every 5 seconds for parents)
      if (user.role === 'parent') {
        const attendanceInterval = setInterval(fetchAttendance, 5000);
        return () => clearInterval(attendanceInterval);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!scanning) {
      return undefined;
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true
      },
      false
    );

    scanner.render(
      (decodedText) => {
        try {
          const qrData = JSON.parse(decodedText);
          if (qrData.busId) {
            handleScan(qrData.busId);
          } else {
            setMessage('Invalid QR code format');
            setMessageType('error');
          }
        } catch (error) {
          handleScan(decodedText);
        }

        scanner.clear();
        setScanning(false);
      },
      (error) => {
        console.log('QR scan error:', error);
      }
    );

    let retryCount = 0;
    const labelTimer = setInterval(() => {
      const updated = updateCameraLabels();
      retryCount += 1;

      if (updated || retryCount >= 8) {
        clearInterval(labelTimer);
      }
    }, 400);

    return () => {
      clearInterval(labelTimer);
      try {
        scanner.clear();
      } catch (error) {
        console.log('QR scanner cleanup skipped:', error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/attendance/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        setAttendance(data);
      } else if (!response.ok) {
        console.error('Error fetching attendance:', data.message || 'Unknown error');
        setAttendance([]);
      } else {
        setAttendance([]);
      }
      
      // Update the last refreshed timestamp
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Location access is not supported on this device.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location permission denied. Please allow location to mark attendance.'));
            return;
          }

          reject(new Error('Unable to fetch your location. Please try again.'));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleScan = async (busId) => {
    try {
      setMessage('Getting your location...');
      setMessageType('info');

      const location = await getCurrentPosition();
      const token = localStorage.getItem('token');
      const qrData = { busId };

      setMessage('Recording attendance...');

      const response = await fetch(`${API_BASE_URL}/api/attendance/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          busId,
          qrData,
          latitude: location.latitude,
          longitude: location.longitude
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType('success');
        fetchAttendance();
      } else {
        setMessage(data.message || 'Attendance failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
    }
  };

  const openScanner = () => {
    setScanning(true);
    setMessage('');
  };

  const closeScanner = () => {
    setScanning(false);
  };

  if (!user || !['student', 'parent'].includes(user.role)) {
    return (
      <div className="container my-5">
        <h2>Attendance</h2>
        <p className="text-muted">Please log in as a student or parent to view attendance.</p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="attendance-page py-5">
      <div className="container">
        <div className="attendance-container">
          <h2>{user.role === 'parent' ? "Student Attendance" : "Bus Attendance"}</h2>
          {user.role === 'parent' && user.student?.name && (
            <div className="alert alert-info">
              Viewing attendance for {user.student.name}
            </div>
          )}

          {user.role === 'student' && (
            <div className="attendance-window-notice" style={{ background: '#d4edda', borderColor: '#c3e6cb' }}>
              <p>Morning attendance: 7:00 AM to 9:00 AM</p>
              <p>Evening attendance: 3:45 PM to 6:00 PM</p>
              <p className="text-muted">Current time: {now.toLocaleTimeString()}</p>
            </div>
          )}

          {user.role === 'student' && (
            <div className="scan-section">
              <p className="scan-instructions">
                Scan the QR code inside your bus to mark attendance.
              </p>

              <div className="scan-buttons">
                <button className="btn btn-primary btn-lg" onClick={openScanner}>
                  Scan Bus QR
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`alert alert-${messageType === 'error' ? 'danger' : messageType === 'success' ? 'success' : 'info'}`}>
              {message}
            </div>
          )}

          {scanning && (
            <div className="scanner-modal">
              <div className="scanner-content">
                <h4>QR Scanner</h4>
                <p>Point your camera at the bus QR code</p>
                <div id="qr-reader" style={{ width: '100%' }}></div>
                <p className="text-muted small">Position the QR code inside the frame</p>
                <button className="btn scanner-close-btn" onClick={closeScanner}>
                  Close
                </button>
              </div>
            </div>
          )}

          <div className="attendance-history mt-5">
            <h3>{user.role === 'parent' ? "Attendance History" : "Your Attendance History"}</h3>
            {user.role === 'parent' && lastRefreshed && (
              <small style={{ color: '#6c757d', display: 'block', marginBottom: '10px' }}>
                🔄 Auto-updating • Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </small>
            )}

            {loading ? (
              <p>Loading...</p>
            ) : attendance.length === 0 ? (
              <p className="text-muted">No attendance records found</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bus</th>
                      <th>Morning</th>
                      <th>Evening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, index) => (
                      <tr key={index}>
                        <td>{record.date}</td>
                        <td>{record.busId?.busNumber || 'N/A'}</td>
                        <td>
                          {record.morning ? (
                            <span className="badge bg-success">Present</span>
                          ) : (
                            <span className="badge bg-secondary">-</span>
                          )}
                        </td>
                        <td>
                          {record.evening ? (
                            <span className="badge bg-success">Present</span>
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
      </div>
    </div>
  );
};

export default Attendance;
