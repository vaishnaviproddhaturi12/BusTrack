import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../apiConfig';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications and set up polling
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Fetch immediately
    fetchNotifications();

    // Poll every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notifications/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
