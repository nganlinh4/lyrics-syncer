import React from 'react';
import { useTheme } from '../theme/theme';

const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
  className = '',
  style = {},
  ...props
}) => {
  const theme = useTheme();

  const sizeStyles = {
    small: {
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      fontSize: theme.typography.small.fontSize,
    },
    medium: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.button.fontSize,
    },
    large: {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.h3.fontSize,
    },
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    fontWeight: theme.typography.button.fontWeight,
    transition: theme.transitions.fast,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    ...sizeStyles[size],
    opacity: disabled ? 0.6 : 1,
    ...theme.components.button[variant],
    ...style
  };

  const handleClick = (event) => {
    if (!disabled) {
      handleRippleEffect(event);
      if (props.onClick) {
        props.onClick(event);
      }
    }
  };

  const handleRippleEffect = (event) => {
    if (disabled) return;

    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <button
      {...props}
      className={`button ${variant} ${size} ${className}`}
      disabled={disabled}
      style={baseStyles}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default Button;