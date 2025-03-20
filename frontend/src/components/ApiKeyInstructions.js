import React from 'react';
import theme from '../theme/theme';

const API_INSTRUCTIONS = {
  youtube: {
    link: "https://console.cloud.google.com/apis/credentials",
    steps: [
      "1. Go to Google Cloud Console",
      "2. Create or select a project",
      "3. Enable 'YouTube Data API v3'",
      "4. Go to Credentials",
      "5. Create API Key"
    ]
  },
  genius: {
    link: "https://genius.com/api-clients",
    steps: [
      "1. Sign in to Genius",
      "2. Click 'New API Client'",
      "3. Fill in app details",
      "4. Get Client Access Token"
    ]
  },
  gemini: {
    link: "https://makersuite.google.com/app/apikey",
    steps: [
      "1. Sign in to Google AI Studio",
      "2. Click 'Get API key'",
      "3. Create new key or select existing"
    ]
  }
};

const ApiKeyInstructions = ({ type }) => (
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
      Get {type.charAt(0).toUpperCase() + type.slice(1)} API Key
    </a>

    <div style={{
      display: 'grid',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs
    }}>
      {API_INSTRUCTIONS[type].steps.map((step, index) => (
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
          <span style={{
            color: theme.colors.primary,
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {step.split('.')[0]}.
          </span>
          <span>{step.split('.').slice(1).join('.').trim()}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ApiKeyInstructions;