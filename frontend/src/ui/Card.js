// filepath: c:\WORK_win\lyrics-syncer\frontend\src\ui\Card.js
import React from 'react';
import theme from '../theme/theme';

// Create a style element to inject animations into the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    
    .card-animated {
      animation: fadeInUp 0.4s ease-out forwards;
    }
    
    .card-header-animated {
      animation: slideIn 0.4s ease-out forwards;
    }
    
    .card-content-animated {
      animation: fadeIn 0.5s ease-out forwards;
      animation-delay: 0.1s;
      opacity: 0;
      animation-fill-mode: forwards;
    }

    .card-interactive:hover {
      transform: translateY(-3px);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      box-shadow: 0 8px 15px rgba(0,0,0,0.1);
    }
  `;
  document.head.appendChild(style);
}

const Card = ({
  children,
  variant = 'default',
  elevation = 'md',
  className = '',
  onClick,
  interactive = false,
  fullWidth = false,
  animated = true,
  style = {},
  ...props
}) => {
  const getElevationStyle = () => {
    return theme.shadows[elevation] || theme.shadows.md;
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          border: `1px solid ${theme.colors.border}`,
          boxShadow: 'none'
        };
      case 'flat':
        return {
          boxShadow: 'none',
          backgroundColor: theme.colors.background.light
        };
      default:
        return {
          boxShadow: getElevationStyle()
        };
    }
  };

  return (
    <div
      className={`card ${animated ? 'card-animated' : ''} ${interactive ? 'card-interactive' : ''} ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.background.main,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        width: fullWidth ? '100%' : 'auto',
        transition: theme.transitions.medium,
        cursor: interactive ? 'pointer' : 'default',
        ...getVariantStyle(),
        ...style
      }}
      {...props}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md
      }}>
        {children}
      </div>
    </div>
  );
};

// Subcomponents for structured card content
Card.Header = ({ children, animated = true, style = {}, ...props }) => (
  <div
    className={animated ? 'card-header-animated' : ''}
    style={{
      borderBottom: `1px solid ${theme.colors.border}`,
      paddingBottom: theme.spacing.md,
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

Card.Title = ({ children, variant = 'h3', animated = true, style = {}, ...props }) => {
  const titleStyle = theme.typography[variant] || theme.typography.h3;
  
  return (
    <div
      className={animated ? 'card-header-animated' : ''}
      style={{
        ...titleStyle,
        color: theme.colors.text.primary,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Content = ({ children, animated = true, style = {}, ...props }) => (
  <div
    className={animated ? 'card-content-animated' : ''}
    style={{
      flex: 1,
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

Card.Footer = ({ children, animated = true, style = {}, ...props }) => (
  <div
    className={animated ? 'card-content-animated' : ''}
    style={{
      borderTop: `1px solid ${theme.colors.border}`,
      paddingTop: theme.spacing.md,
      marginTop: 'auto',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

Card.Actions = ({ children, align = 'right', style = {}, ...props }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: align === 'left' ? 'flex-start' : 
                     align === 'center' ? 'center' : 'flex-end',
      gap: theme.spacing.sm,
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

export default Card;