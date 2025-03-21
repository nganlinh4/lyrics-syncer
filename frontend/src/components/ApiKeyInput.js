import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [showKey, setShowKey] = useState(false);
  
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
          {t(`settings.${type}ApiKey`)}
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
                paddingRight: '40px',
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: theme.typography.body.fontSize,
                transition: theme.transitions.fast
              }}
              placeholder={t('settings.apiKeyPlaceholder')}
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
              title={showKey ? t('common.hide') : t('common.view')}
            >
              {showKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <Button
            onClick={() => onSave(type, value)}
            variant="primary"
            size="small"
          >
            {t('common.save')}
          </Button>

          <StatusIndicator status={status} />
        </div>
      </div>

      <ApiKeyInstructions type={type} />
    </div>
  );
};

export default ApiKeyInput;