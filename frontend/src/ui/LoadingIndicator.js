import React from 'react';
import theme from '../theme/theme';

// Create a style element to inject animations into the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0% { transform: scale(0.85); opacity: 0.7; }
      50% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.85); opacity: 0.7; }
    }
    
    @keyframes dots {
      0% { content: "."; }
      33% { content: ".."; }
      66% { content: "..."; }
      100% { content: "."; }
    }
    
    .loading-spinner {
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loading-pulse {
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    .loading-dots::after {
      content: ".";
      animation: dots 1.5s infinite steps(1);
    }
    
    .loading-bar {
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
      background-size: 200%;
      animation: slide 1.5s infinite;
    }
    
    @keyframes slide {
      0% { background-position: -100% 0; }
      100% { background-position: 100% 0; }
    }
    
    .loading-dots-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .loading-dot {
      width: 8px;
      height: 8px;
      margin: 0 3px;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    .loading-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .loading-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
  `;
  document.head.appendChild(style);
}

const LoadingIndicator = ({ 
  size = 'md', 
  color = 'primary', 
  center = false, 
  type = 'spinner', 
  text = ''
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: '16px', height: '16px', borderWidth: '2px' };
      case 'lg':
        return { width: '32px', height: '32px', borderWidth: '3px' };
      default:
        return { width: '24px', height: '24px', borderWidth: '2px' };
    }
  };

  const getColorStyles = () => {
    const borderColor = theme.colors[color] || theme.colors.primary;
    return {
      borderColor: `${borderColor}40`,
      borderTopColor: borderColor,
      borderLeftColor: borderColor,
      backgroundColor: type === 'dots' ? borderColor : 'transparent'
    };
  };

  const getTypeMarkup = () => {
    switch (type) {
      case 'pulse':
        return (
          <div
            className="loading-spinner loading-pulse"
            style={{
              ...getSizeStyles(),
              borderRadius: '50%',
              backgroundColor: getColorStyles().borderTopColor
            }}
            role="status"
            aria-label="Loading"
          />
        );
      
      case 'dots':
        return (
          <div className="loading-dots-container">
            <div 
              className="loading-dot" 
              style={{ backgroundColor: getColorStyles().borderTopColor }} 
            />
            <div 
              className="loading-dot" 
              style={{ backgroundColor: getColorStyles().borderTopColor }} 
            />
            <div 
              className="loading-dot" 
              style={{ backgroundColor: getColorStyles().borderTopColor }} 
            />
          </div>
        );
      
      case 'bar':
        return (
          <div
            className="loading-bar"
            style={{
              backgroundColor: `${getColorStyles().borderTopColor}40`,
              height: size === 'sm' ? '2px' : size === 'lg' ? '4px' : '3px'
            }}
            role="status"
            aria-label="Loading"
          />
        );
        
      case 'text':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div
              className="loading-spinner"
              style={{
                ...getSizeStyles(),
                ...getColorStyles()
              }}
              role="status"
              aria-label="Loading"
            />
            <span 
              className="loading-dots" 
              style={{ color: getColorStyles().borderTopColor }}
            >
              {text || 'Loading'}
            </span>
          </div>
        );
      
      default: // spinner
        return (
          <div
            className="loading-spinner"
            style={{
              ...getSizeStyles(),
              ...getColorStyles(),
              border: 'solid',
              borderRadius: '50%'
            }}
            role="status"
            aria-label="Loading"
          />
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: center ? 'center' : 'flex-start',
      alignItems: 'center',
      padding: theme.spacing.sm
    }}>
      {getTypeMarkup()}
    </div>
  );
};

export default LoadingIndicator;