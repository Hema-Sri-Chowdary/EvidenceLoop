import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from '../components/Icons.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Error') => addToast({ type: 'error', title, message, duration: 6000 }),
    warning: (message, title = 'Attention') => addToast({ type: 'warning', title, message }),
    info: (message, title = 'Information') => addToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast viewport */}
      <aside aria-label="Notifications" className="toast-container">
        {toasts.map((item) => {
          const typeClass = `toast-${item.type}`;
          const iconColors = {
            success: 'var(--ready-text)',
            error: 'var(--overdue-text)',
            warning: 'var(--due-soon-text)',
            info: 'var(--missing-text)',
          };

          return (
            <div key={item.id} role="alert" className={`toast ${typeClass}`}>
              <div style={{ marginTop: 2, flexShrink: 0, color: iconColors[item.type] }}>
                {item.type === 'success' && <CheckCircle2 size={18} />}
                {item.type === 'error' && <AlertCircle size={18} />}
                {item.type === 'warning' && <AlertTriangle size={18} />}
                {item.type === 'info' && <Info size={18} />}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)' }}>{item.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2, lineHeight: 1.45 }}>
                  {item.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(item.id)}
                className="btn-icon"
                style={{ width: 22, height: 22 }}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
