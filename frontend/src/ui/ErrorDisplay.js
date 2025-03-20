import React from 'react';
import theme from '../theme/theme';

const ErrorDisplay = ({ error, variant = 'inline', onRetry }) => {
  if (!error) return null;

  const getStyles = () => {
    const baseStyles = {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: `${theme.colors.error}15`,
      border: `1px solid ${theme.colors.error}30`,
      color: theme.colors.error,
    };

    if (variant === 'banner') {
      return {
        ...baseStyles,
        width: '100%',
        marginBottom: theme.spacing.lg,
      };
    }

    return baseStyles;
  };

  return (
    <div className="error-display" style={getStyles()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div style={{ flex: 1 }}>
          {typeof error === 'string' ? error : error.message || 'An error occurred'}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: `${theme.colors.error}15`,
              border: `1px solid ${theme.colors.error}30`,
              color: 'inherit',
              cursor: 'pointer',
              transition: theme.transitions.fast,
              '&:hover': {
                backgroundColor: `${theme.colors.error}25`,
              }
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;