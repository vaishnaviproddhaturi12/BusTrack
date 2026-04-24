// Driver Mobile Location Tracker (React Native / PWA version)
import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../apiConfig';

const DriverLocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [busId, setBusId] = useState('YOUR_BUS_ID'); // Get from driver login
  const [token, setToken] = useState('YOUR_JWT_TOKEN'); // From authentication

  useEffect(() => {
    // Request location permissions
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);

          // Automatically send location update to server
          sendLocationUpdate(newLocation);
        },
        (error) => {
          console.error('Location error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      // Cleanup
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const sendLocationUpdate = async (locationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bus/location/${busId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationData)
      });

      if (response.ok) {
        console.log('Location updated successfully');
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  return (
    <div>
      <h2>Driver Location Tracker</h2>
      {location && (
        <p>Current Location: {location.lat}, {location.lng}</p>
      )}
      <p>Location updates are sent automatically every few seconds</p>
    </div>
  );
};

export default DriverLocationTracker;