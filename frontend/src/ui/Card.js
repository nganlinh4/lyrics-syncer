// filepath: c:\WORK_win\lyrics-syncer\frontend\src\ui\Card.js
import React from 'react';
import theme from '../theme/theme';

const Card = ({
  children,
  variant = 'default',
  elevation = 'md',
  className = '',
  onClick,
  interactive = false,
  fullWidth = false,
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
      className={`card ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.background.main,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        width: fullWidth ? '100%' : 'auto',
        transition: theme.transitions.medium,
        cursor: interactive ? 'pointer' : 'default',
        '&:hover': interactive ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows.lg
        } : {},
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
Card.Header = ({ children, style = {}, ...props }) => (
  <div
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

Card.Title = ({ children, variant = 'h3', style = {}, ...props }) => {
  const titleStyle = theme.typography[variant] || theme.typography.h3;
  
  return (
    <div
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

Card.Content = ({ children, style = {}, ...props }) => (
  <div
    style={{
      flex: 1,
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

Card.Footer = ({ children, style = {}, ...props }) => (
  <div
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