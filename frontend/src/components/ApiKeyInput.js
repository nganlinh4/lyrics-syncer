import React, { useState } from 'react';
import Button from '../ui/Button';
import ApiKeyInstructions from './ApiKeyInstructions';
import StatusIndicator from './StatusIndicator';
import theme from '../theme/theme';

const ApiKeyInput = ({ 
  type, 
  value, 
  status, 
  onChange, 
  onSave 
}) => {
  const [showKey, setShowKey] = useState(false);
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  
  return (
    <div style={{ display: 'grid', gap: theme.spacing.md }}>
      <div style={{ display: 'grid', gap: theme.spacing.sm }}>
        <label 
          htmlFor={`${type}ApiKey`}
          style={{
            ...theme.typography.body,
            fontWeight: '500',
            color: theme.colors.text.primary
          }}
        >
          {capitalizedType} API Key:
        </label>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: theme.spacing.sm,
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              id={`${type}ApiKey`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                paddingRight: '40px', // Space for the eye icon
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: theme.typography.body.fontSize,
                transition: theme.transitions.fast
              }}
              placeholder={`Enter your ${capitalizedType} API key`}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: theme.colors.text.secondary
              }}
              title={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <Button
            onClick={() => onSave(type, value)}
            variant="primary"
            size="small"
          >
            Save
          </Button>

          <StatusIndicator status={status} />
        </div>
      </div>

      <ApiKeyInstructions type={type} />
    </div>
  );
};

export default ApiKeyInput;