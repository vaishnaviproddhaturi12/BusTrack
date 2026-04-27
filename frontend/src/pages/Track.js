import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';
import './Track.css';

// Traffic detection thresholds (in meters per second)
const NORMAL_SPEED = 11; // ~40 km/h (expected bus speed)
const SLOW_SPEED = 3; // ~11 km/h (traffic/congestion detected)

const toRadians = (value) => (value * Math.PI) / 180;

const distanceInMeters = (a, b) => {
  const earthRadius = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
};

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const Track = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trafficAlert, setTrafficAlert] = useState(null);
  const [, setBusSpeed] = useState(0);
  const [, setEstimatedDelay] = useState(0);
  const [trafficStartTime, setTrafficStartTime] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [attendanceUpdated, setAttendanceUpdated] = useState(null);
  const previousLocationRef = React.useRef(null);
  const previousTimeRef = React.useRef(null);

  // Calculate bus speed and detect traffic
  const detectTraffic = (newLocation, newTime) => {
    if (!previousLocationRef.current || !previousTimeRef.current) {
      previousLocationRef.current = newLocation;
      previousTimeRef.current = newTime;
      console.log('📍 Traffic detection initialized');
      return;
    }

    // Calculate distance moved (in meters)
    const distance = distanceInMeters(previousLocationRef.current, newLocation);

    // Calculate time elapsed (in seconds)
    const timeDiff = (newTime - previousTimeRef.current) / 1000;

    // Calculate speed (meters per second)
    const speed = timeDiff > 0 ? distance / timeDiff : 0;
    const speedKmh = (speed * 3.6).toFixed(1);
    
    setBusSpeed(speed);

    // Calculate estimated delay
    let delayMinutes = 0;
    if (speed > 0 && speed < NORMAL_SPEED) {
      // Calculate how much slower than normal speed
      const normalTimeForDistance = distance / NORMAL_SPEED; // seconds at normal speed
      const actualTimeForDistance = timeDiff; // seconds at current speed
      delayMinutes = ((actualTimeForDistance - normalTimeForDistance) / 60).toFixed(1);
    }

    // Log traffic calculations
    console.log('🚌 Traffic Detection:', {
      distanceMovedMeters: distance.toFixed(2),
      timeElapsedSeconds: timeDiff.toFixed(2),
      speedMeterPerSecond: speed.toFixed(2),
      speedKmh: speedKmh,
      normalSpeedThreshold: NORMAL_SPEED * 3.6 + ' km/h',
      slowSpeedThreshold: SLOW_SPEED * 3.6 + ' km/h',
      estimatedDelayMinutes: delayMinutes,
      status: speed < SLOW_SPEED ? '🚦 SLOW - TRAFFIC DETECTED' : (speed >= NORMAL_SPEED ? '✅ NORMAL' : '⚠️ MODERATE')
    });

    // Detect traffic if speed drops below threshold
    if (speed < SLOW_SPEED && speed > 0) {
      if (!trafficStartTime) {
        setTrafficStartTime(newTime);
      }
      
      const trafficDuration = trafficStartTime ? (newTime - trafficStartTime) / 1000 / 60 : 0; // minutes
      const totalDelay = Math.max(delayMinutes, trafficDuration * 0.5); // Estimate based on duration
      
      setEstimatedDelay(totalDelay);
      
      console.warn('⏰ TRAFFIC ALERT: Bus speed dropped to', speedKmh, 'km/h - Estimated delay:', totalDelay.toFixed(1), 'minutes');
      setTrafficAlert(`🚦 Bus is moving slowly (${speedKmh} km/h) - Estimated delay: ${totalDelay.toFixed(1)} minutes`);
      
      // Create backend notification for traffic delay
      if (bus && totalDelay > 1) { // Only notify if delay is significant
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/api/notifications/traffic-delay/${bus.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            delayMinutes: totalDelay,
            currentSpeed: speedKmh
          })
        }).catch(error => console.error('Error creating traffic notification:', error));
      }
      
      // Show browser notification with delay info
      if (Notification.permission === 'granted') {
        new Notification('Bus Traffic Alert', {
          body: `Your bus is experiencing traffic. Estimated delay: ${totalDelay.toFixed(1)} minutes.`,
          icon: '/favicon.ico'
        });
      }
    } else if (speed >= NORMAL_SPEED) {
      setTrafficAlert(null);
      setTrafficStartTime(null);
      setEstimatedDelay(0);
    }

    // Update references for next calculation
    previousLocationRef.current = newLocation;
    previousTimeRef.current = newTime;
  };

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check if user is a student/parent and has a bus assigned
    if (!['student', 'parent'].includes(user.role) || !user.bus) {
      setLoading(false);
      return;
    }

    setBus(user.bus);

    // Function to fetch attendance (for parents)
    const fetchAttendanceData = async () => {
      if (user.role !== 'parent') return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/attendance/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data) && data.length > 0) {
          // Get today's record if available
          const today = new Date().toISOString().split('T')[0];
          const todayRecord = data.find(record => record.date === today);
          setAttendance(todayRecord || null);
          setAttendanceUpdated(new Date());
        } else {
          setAttendance(null);
        }
      } catch (error) {
        console.log('Error fetching attendance:', error);
      }
    };

    // Start tracking the bus location
    const fetchLocation = () => {
      const token = localStorage.getItem('token');
      fetch(`${API_BASE_URL}/api/bus/location/${user.bus.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.status === 403) {
            throw new Error('You can only track your assigned bus');
          }
          if (!res.ok) {
            throw new Error('Failed to fetch location');
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.lat !== undefined && data.lng !== undefined) {
            const nextLocation = {
              lat: Number(data.lat),
              lng: Number(data.lng)
            };
            const currentTime = Date.now();

            // Detect traffic based on speed
            detectTraffic(nextLocation, currentTime);

            setLocation((prev) => {
              if (!prev) {
                return nextLocation;
              }

              const moved = distanceInMeters(prev, nextLocation);

              // Ignore tiny jitter that happens with GPS drift.
              if (moved < 15) {
                return prev;
              }

              // Smooth visible movement so marker does not jump.
              return {
                lat: prev.lat * 0.8 + nextLocation.lat * 0.2,
                lng: prev.lng * 0.8 + nextLocation.lng * 0.2
              };
            });
            setLastUpdated(new Date());
            setError(null);

            // Also fetch attendance for parents on each location update
            if (user.role === 'parent') {
              fetchAttendanceData();
            }
          } else {
            setError('Bus location not available');
          }
        })
        .catch((err) => {
          console.log('Error fetching location:', err);
          setError(err.message);
        });
    };

    // Fetch location immediately
    fetchLocation();

    // Set up interval for real-time tracking
    const interval = setInterval(fetchLocation, 5000); // Update every 5 seconds

    setLoading(false);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'driver') {
    return <Navigate to="/driver" />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/" />;
  }

  if (!['student', 'parent'].includes(user.role)) {
    return (
      <div className="track-container">
        <div className="container">
          <h1 className="page-title">Bus Tracking</h1>
          <div className="alert alert-info">
            <h4>Access Restricted</h4>
            <p>Live bus tracking is only available for students and parents.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="track-container">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading your bus information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="track-container">
        <div className="container">
          <h1 className="page-title">Bus Tracking</h1>
          <div className="alert alert-warning">
            <h4>No Bus Assigned</h4>
            <p>{user.role === 'parent' ? "Your linked student has not been assigned to a bus yet." : "You haven't been assigned to a bus yet."} Please contact the administration.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="track-container">
      <div className="container">
        <h1 className="page-title">Live Bus Tracking</h1>
        <p className="page-subtitle">
          {user.role === 'parent' && user.student?.name
            ? `Track ${user.student.name}'s assigned bus in real-time`
            : 'Track your assigned bus in real-time'}
        </p>

        <div className="bus-info-card">
          <h3>{user.role === 'parent' ? "Student's Bus" : 'Your Bus'}: {bus.busNumber}</h3>
          {user.role === 'parent' && user.student?.name && (
            <p><strong>Student:</strong> {user.student.name}</p>
          )}
          <p><strong>Route:</strong> {bus.route}</p>
          <p><strong>Driver:</strong> {bus.driver.name} ({bus.driver.phone})</p>
        </div>

        {user.role === 'parent' && attendance && (
          <div className="attendance-status-card">
            <h5>📋 Today's Attendance</h5>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <div>
                <strong>Morning:</strong> {' '}
                {attendance.morning ? (
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Present</span>
                ) : (
                  <span style={{ color: '#6c757d' }}>- Not marked</span>
                )}
              </div>
              <div>
                <strong>Evening:</strong> {' '}
                {attendance.evening ? (
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Present</span>
                ) : (
                  <span style={{ color: '#6c757d' }}>- Not marked</span>
                )}
              </div>
            </div>
            <small style={{ color: '#6c757d', marginTop: '8px', display: 'block' }}>
              Last updated: {attendanceUpdated ? attendanceUpdated.toLocaleTimeString() : 'N/A'}
            </small>
          </div>
        )}

        {trafficAlert && (
          <div className="alert alert-warning">
            <h5>⚠️ Traffic Detected</h5>
            <p>{trafficAlert}</p>
            <small>Bus is moving slower than normal. Keep checking for updates!</small>
          </div>
        )}

        <div className="map-container">
          {error ? (
            <div className="error-message">
              <div className="alert alert-danger">
                <h5>Unable to Load Bus Location</h5>
                <p>{error}</p>
                <p>The bus may not be actively transmitting its location, or there might be a connection issue.</p>
              </div>
            </div>
          ) : location ? (
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={15}
              className="map"
            >
              <MapResizeFix />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  <div className="popup-content">
                    <h5>🚌 {bus.busNumber}</h5>
                    <p><strong>Route:</strong> {bus.route}</p>
                    <p><strong>Driver:</strong> {bus.driver.name}</p>
                    <p>Latitude: {location.lat.toFixed(6)}</p>
                    <p>Longitude: {location.lng.toFixed(6)}</p>
                    <p>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="loading-map">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading bus location...</p>
              <small className="text-muted">This may take a few moments if the bus hasn't started transmitting location data.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MapResizeFix = () => {
  const map = useMap();

  useEffect(() => {
    const syncSize = () => map.invalidateSize();
    const timerId = setTimeout(syncSize, 150);

    window.addEventListener('resize', syncSize);

    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', syncSize);
    };
  }, [map]);

  return null;
};

export default Track;
