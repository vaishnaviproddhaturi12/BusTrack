import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';
import './Auth.css';

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

const DriverDashboard = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [autoTracking, setAutoTracking] = useState(false);
  const watchIdRef = useRef(null);
  const lastSentLocationRef = useRef(null);
  const lastSentAtRef = useRef(0);

  const updateLocationOnServer = useCallback(async (locationData) => {
    if (!bus) return false;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bus/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationData)
      });

      return response.ok;
    } catch (error) {
      console.error('Network error:', error);
      return false;
    }
  }, [bus]);

  useEffect(() => {
    if (user && user.role === 'driver') {
      fetch(`${API_BASE_URL}/api/bus/my-bus`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Unable to load assigned bus');
          }
          return res.json();
        })
        .then(busData => {
          setBus(busData);
          setLocation({
            lat: busData.location?.lat || '',
            lng: busData.location?.lng || ''
          });
        })
        .catch(err => {
          console.log(err);
          setMessage('No assigned bus found. Please contact admin.');
        });
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString()
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setMessage('Unable to get current location. Please enter coordinates manually.');
        }
      );
    } else {
      setMessage('Geolocation is not supported by this browser.');
    }
  };

  const startAutoTracking = () => {
    if (!bus) {
      setMessage('No assigned bus found. Please contact admin.');
      return;
    }

    if (watchIdRef.current) {
      return;
    }

    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Ignore noisy fixes that can cause marker jumps.
          const accuracy = position.coords.accuracy || 999;
          if (accuracy > 50) {
            return;
          }

          const now = Date.now();
          const minIntervalMs = 4000;
          const minDistanceMeters = Math.max(15, accuracy * 0.6);
          const lastLocation = lastSentLocationRef.current;
          const elapsed = now - lastSentAtRef.current;

          if (lastLocation && elapsed < minIntervalMs) {
            return;
          }

          if (lastLocation) {
            const moved = distanceInMeters(lastLocation, newLocation);
            if (moved < minDistanceMeters && elapsed < 30000) {
              return;
            }
          }

          setLocation({
            lat: newLocation.lat.toFixed(6),
            lng: newLocation.lng.toFixed(6)
          });

          const updated = await updateLocationOnServer(newLocation);
          if (updated) {
            lastSentLocationRef.current = newLocation;
            lastSentAtRef.current = now;
          }
          setMessage(updated
            ? 'Live tracking is active. Your bus location is being shared.'
            : 'Live tracking is active, but the last server update failed.'
          );
        },
        (error) => {
          console.error('Location tracking error:', error);
          setMessage('Location tracking failed. Please check GPS permissions.');
          setAutoTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 2000
        }
      );

      watchIdRef.current = id;
      setAutoTracking(true);
      setMessage('Live tracking started. Keep this page open on the driver phone.');
    } else {
      setMessage('Geolocation is not supported by this device.');
    }
  };

  const stopAutoTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setAutoTracking(false);
    setMessage('Auto-tracking stopped.');
  };

  const updateLocation = async () => {
    if (!bus || !location.lat || !location.lng) {
      setMessage('Please provide valid coordinates.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const updated = await updateLocationOnServer({
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      });

      if (updated) {
        setMessage('Location updated successfully!');
      } else {
        setMessage('Failed to update location');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'driver') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>This page is only accessible to drivers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3>Driver Dashboard</h3>
              <p>Update your bus location</p>
            </div>
            <div className="card-body">
              {bus && (
                <div className="mb-3">
                  <h5>Bus: {bus.busNumber}</h5>
                  <p>Route: {bus.route}</p>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Latitude</label>
                <input
                  type="text"
                  className="form-control"
                  value={location.lat}
                  onChange={(e) => setLocation({...location, lat: e.target.value})}
                  placeholder="Enter latitude"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Longitude</label>
                <input
                  type="text"
                  className="form-control"
                  value={location.lng}
                  onChange={(e) => setLocation({...location, lng: e.target.value})}
                  placeholder="Enter longitude"
                />
              </div>

              <div className="mb-3">
                <button
                  type="button"
                  className="btn btn-outline-primary me-2"
                  onClick={getCurrentLocation}
                >
                  Get Current Location
                </button>
                {!autoTracking ? (
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={startAutoTracking}
                  >
                    Start Auto-Tracking
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger me-2"
                    onClick={stopAutoTracking}
                  >
                    Stop Auto-Tracking
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={updateLocation}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Location'}
                </button>
              </div>

              {message && (
                <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
