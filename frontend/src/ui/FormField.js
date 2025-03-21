import React from 'react';
import { useTheme } from '../theme/theme';

const FormField = ({
  label,
  error,
  helperText,
  children,
  required,
  className = '',
  style = {},
  ...props
}) => {
  const theme = useTheme();

  return (
    <div 
      className={`form-group ${className}`}
      style={style}
      {...props}
    >
      {label && (
        <label style={{
          ...theme.typography.body,
          fontWeight: 500,
          color: error ? 'var(--error-color)' : 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs
        }}>
          {label}
          {required && (
            <span style={{ color: 'var(--error-color)' }}>*</span>
          )}
        </label>
      )}
      
      {children}
      
      {(helperText || error) && (
        <span style={{
          fontSize: theme.typography.small.fontSize,
          color: error ? 'var(--error-color)' : 'var(--text-secondary)'
        }}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};

export default FormField;