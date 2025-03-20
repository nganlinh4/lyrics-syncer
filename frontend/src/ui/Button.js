// filepath: c:\WORK_win\lyrics-syncer\frontend\src\ui\Button.js
import React from 'react';
import theme from '../theme/theme';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
  startIcon,
  endIcon,
  loading = false,
  ...props
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          fontSize: '0.875rem'
        };
      case 'large':
        return {
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          fontSize: '1rem'
        };
      default: // medium
        return {
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          fontSize: '0.875rem'
        };
    }
  };

  const getVariantStyles = () => {
    const variantStyles = theme.components.button[variant] || theme.components.button.primary;
    return {
      backgroundColor: disabled ? theme.colors.text.disabled : variantStyles.backgroundColor,
      color: disabled ? theme.colors.background.main : variantStyles.color,
      border: variantStyles.border || 'none',
      '&:hover': !disabled && variantStyles['&:hover'],
      '&:active': !disabled && {
        transform: 'translateY(1px)'
      },
      opacity: disabled ? 0.7 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer'
    };
  };

  return (
    <button
      type={type}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      className={`button ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        fontWeight: theme.typography.button.fontWeight,
        transition: theme.transitions.fast,
        width: fullWidth ? '100%' : 'auto',
        ...getSizeStyles(),
        ...getVariantStyles(),
      }}
      {...props}
    >
      {startIcon && !loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {startIcon}
        </span>
      )}
      
      {loading ? (
        <>
          <div className="loading-spinner" />
          <span style={{ marginLeft: theme.spacing.sm }}>Loading...</span>
        </>
      ) : (
        children
      )}
      
      {endIcon && !loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {endIcon}
        </span>
      )}
    </button>
  );
};

export default Button;