import React from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

const API_INSTRUCTIONS = {
  youtube: {
    link: "https://console.cloud.google.com/apis/credentials"
  },
  genius: {
    link: "https://genius.com/api-clients"
  },
  gemini: {
    link: "https://makersuite.google.com/app/apikey"
  }
};

const ApiKeyInstructions = ({ type }) => {
  const { t } = useTranslation();
  
  const getSteps = (type) => {
    return Array.from({ length: 5 }, (_, i) => {
      const key = `settings.apiKeyInstructions.${type}.step${i + 1}`;
      const translation = t(key, { returnNull: true });
      return translation;
    }).filter(Boolean);
  };

  const steps = getSteps(type);

  return (
    <div style={{ 
      display: 'grid',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.background.light,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      border: `1px solid ${theme.colors.border}`
    }}>
      <a 
        href={API_INSTRUCTIONS[type].link} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          color: theme.colors.primary,
          fontSize: theme.typography.small.fontSize,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: theme.spacing.xs
        }}
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        {t(`settings.apiKeyInstructions.${type}.title`)}
      </a>

      <div style={{
        display: 'grid',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs
      }}>
        {steps.map((step, index) => (
          <div 
            key={index}
            style={{
              ...theme.typography.small,
              color: theme.colors.text.secondary,
              display: 'flex',
              alignItems: 'start',
              gap: theme.spacing.sm
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiKeyInstructions;