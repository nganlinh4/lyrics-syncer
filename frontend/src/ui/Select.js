import React from 'react';
import { useTheme } from '../theme/theme';

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  variant = 'outlined',
  size = 'medium',
  error,
  fullWidth = false,
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
      fontSize: theme.typography.body.fontSize,
    },
    large: {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.h3.fontSize,
    },
  };

  const getVariantStyles = () => {
    const variants = {
      outlined: {
        backgroundColor: 'var(--background-paper)',
        border: `1px solid var(--border-color)`,
        '&:hover:not(:disabled)': {
          borderColor: 'var(--primary-color)',
          backgroundColor: 'var(--hover-overlay)'
        },
        '&:focus': {
          borderColor: 'var(--primary-color)',
          boxShadow: '0 0 0 2px var(--primary-color-light)',
          outline: 'none'
        }
      },
      filled: {
        backgroundColor: 'var(--background-light)',
        border: 'none',
        '&:hover:not(:disabled)': {
          backgroundColor: 'var(--hover-overlay)'
        },
        '&:focus': {
          boxShadow: '0 0 0 2px var(--primary-color-light)',
          outline: 'none'
        }
      }
    };
    return variants[variant] || variants.outlined;
  };

  const baseStyles = {
    width: fullWidth ? '100%' : 'auto',
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.fast,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    ...sizeStyles[size],
    ...getVariantStyles(),
    '&:disabled': {
      backgroundColor: 'var(--background-light)',
      cursor: 'not-allowed',
      opacity: 0.7
    },
    ...(error && {
      borderColor: 'var(--error-color)',
      '&:hover': {
        borderColor: 'var(--error-color)'
      },
      '&:focus': {
        borderColor: 'var(--error-color)',
        boxShadow: '0 0 0 2px var(--error-color-light)'
      }
    }),
    ...style
  };

  return (
    <select
      value={value}
      onChange={onChange}
      className={`select ${variant} ${size} ${className}`}
      style={baseStyles}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;