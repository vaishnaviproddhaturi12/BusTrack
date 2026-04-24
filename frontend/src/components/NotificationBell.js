import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <div className="notification-bell">
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h5>Notifications</h5>
            {notifications.length > 0 && (
              <button
                className="clear-btn"
                onClick={() => {
                  clearAll();
                  setIsOpen(false);
                }}
              >
                Clear All
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification._id);
                    }
                  }}
                >
                  <div className="notification-icon">
                    {notification.type === 'bus_late' ? '⏰' : '📢'}
                  </div>
                  <div className="notification-content">
                    <h6>{notification.title}</h6>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.createdAt).toLocaleTimeString()}</small>
                  </div>
                  {!notification.read && (
                    <div className="unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
