import React from 'react';
import theme from '../theme/theme';

const LoadingIndicator = ({ size = 'md', color = 'primary', center = false }) => {
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
      borderLeftColor: borderColor
    };
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: center ? 'center' : 'flex-start',
      alignItems: 'center',
      padding: theme.spacing.sm
    }}>
      <div
        className="loading-spinner"
        style={{
          ...getSizeStyles(),
          ...getColorStyles()
        }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

export default LoadingIndicator;