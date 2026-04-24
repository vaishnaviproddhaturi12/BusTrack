import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutRefs = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timer = timeoutRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutRefs.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast = { id, message, type };

    setToasts((current) => [...current, nextToast]);

    const timer = setTimeout(() => {
      removeToast(id);
    }, 3000);

    timeoutRefs.current.set(id, timer);
  }, [removeToast]);

  const value = useMemo(() => ({
    showToast,
    removeToast
  }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};
