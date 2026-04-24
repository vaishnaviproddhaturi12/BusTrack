import React from 'react';
import './ToastContainer.css';

const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`app-toast app-toast-${toast.type}`}>
          <div className="app-toast-content">
            <strong>{toast.type === 'success' ? 'Success' : 'Notice'}</strong>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            className="app-toast-close"
            onClick={() => onClose(toast.id)}
            aria-label="Close notification"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
