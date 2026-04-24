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
    if (!['student', 'driver'].includes(userData.role)) {
      return userData;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bus/my-bus`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        return userData;
      }

      const busData = await response.json();
      return busData.id ? { ...userData, bus: busData } : userData;
    } catch (err) {
      console.log('Error fetching bus info:', err);
      return userData;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(async data => {
          if (data.user) {
            const userWithBus = await attachBusInfo(data.user, token);
            setUser(userWithBus);
            setLoading(false);
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.log(err);
          setLoading(false);
        });
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
