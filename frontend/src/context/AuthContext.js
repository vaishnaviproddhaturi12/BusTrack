import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../apiConfig';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const attachBusInfo = async (userData, token) => {
    if (!['student', 'driver', 'parent'].includes(userData.role)) {
      return userData;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bus/my-bus`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (!response.ok) {
        console.log('Bus fetch not ok, continuing without bus data');
        return userData;
      }

      const busData = await response.json();
      return busData.id ? { ...userData, bus: busData } : userData;
    } catch (err) {
      console.log('Error fetching bus info (continuing anyway):', err.message);
      return userData;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      })
        .then(res => {
          if (!res.ok) throw new Error('Verification failed');
          return res.json();
        })
        .then(async data => {
          if (data.user) {
            const userWithBus = await attachBusInfo(data.user, token);
            setUser(userWithBus);
          }
          setLoading(false);
        })
        .catch(err => {
          console.log('Token verification error:', err.message);
          localStorage.removeItem('token');
          setLoading(false);
        })
        .finally(() => clearTimeout(timeoutId));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
