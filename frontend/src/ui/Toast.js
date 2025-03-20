import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
import theme from '../theme/theme';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [position, setPosition] = useState('top-right');
  const [stackBehavior, setStackBehavior] = useState('stack'); // 'stack' or 'queue'

  const addToast = useCallback((message, options = {}) => {
    const {
      type = 'info',
      duration = 5000,
      icon,
      actions = [],
      position: toastPosition,
      stackBehavior: newStackBehavior
    } = options;

    const id = Math.random().toString(36).substr(2, 9);
    
    if (toastPosition) setPosition(toastPosition);
    if (newStackBehavior) setStackBehavior(newStackBehavior);
    
    setToasts(prev => {
      const newToast = { id, message, type, duration, icon, actions };
      return stackBehavior === 'stack' 
        ? [...prev, newToast]
        : [newToast, ...prev];
    });
    
    if (duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
    
    return id;
  }, [stackBehavior]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer position={position}>
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
            index={index}
            total={toasts.length}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastContainer = ({ children, position = 'top-right' }) => {
  const getPositionStyle = () => {
    const positions = {
      'top-right': { top: 20, right: 20 },
      'top-left': { top: 20, left: 20 },
      'bottom-right': { bottom: 20, right: 20 },
      'bottom-left': { bottom: 20, left: 20 }
    };
    return positions[position] || positions['top-right'];
  };

  return ReactDOM.createPortal(
    <div 
      className="toast-container"
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.sm,
        ...getPositionStyle()
      }}
      role="region"
      aria-label="Notifications"
    >
      {children}
    </div>,
    document.body
  );
};

const defaultIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠'
};

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  icon,
  actions = [],
  index,
  total
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    const types = {
      success: {
        bg: `${theme.colors.success}15`,
        border: `${theme.colors.success}30`,
        color: theme.colors.success
      },
      error: {
        bg: `${theme.colors.error}15`,
        border: `${theme.colors.error}30`,
        color: theme.colors.error
      },
      info: {
        bg: `${theme.colors.info}15`,
        border: `${theme.colors.info}30`,
        color: theme.colors.info
      },
      warning: {
        bg: `${theme.colors.warning}15`,
        border: `${theme.colors.warning}30`,
        color: theme.colors.warning
      }
    };

    return types[type] || types.info;
  };

  const typeStyles = getTypeStyles();
  const displayIcon = icon || defaultIcons[type];

  return (
    <div
      className={`toast ${isExiting ? 'toast-exit' : ''}`}
      style={{
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: typeStyles.bg,
        border: `1px solid ${typeStyles.border}`,
        color: typeStyles.color,
        boxShadow: theme.shadows.md,
        minWidth: '280px',
        maxWidth: '400px',
        transform: `translateY(${index * 5}px)`,
        zIndex: total - index,
        opacity: isExiting ? 0 : 1,
        transition: 'all 0.3s ease'
      }}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-relevant="additions removals"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        {displayIcon && (
          <span 
            className="toast-icon" 
            role="img" 
            aria-label={`${type} notification`}
            style={{
              fontSize: '1.2em',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {displayIcon}
          </span>
        )}
        <div style={{ flex: 1 }}>{message}</div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: theme.spacing.xs
          }}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
      
      {actions.length > 0 && (
        <div 
          style={{ 
            display: 'flex', 
            gap: theme.spacing.sm, 
            marginTop: theme.spacing.sm,
            justifyContent: 'flex-end' 
          }}
          role="group"
          aria-label="Toast actions"
        >
          {actions.map((action, actionIndex) => (
            <button
              key={actionIndex}
              onClick={action.onClick}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                backgroundColor: action.primary ? typeStyles.color : 'transparent',
                color: action.primary ? typeStyles.bg : typeStyles.color,
                border: `1px solid ${typeStyles.color}`,
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              aria-label={action.ariaLabel || action.text}
            >
              {action.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Toast;