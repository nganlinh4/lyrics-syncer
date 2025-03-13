import React from 'react';

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
    fontSize: '0.8em', 
    marginTop: '5px',
    color: '#666' 
  }}>
    <a 
      href={API_INSTRUCTIONS[type].link} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{ color: '#0066cc' }}
    >
      Get {type.charAt(0).toUpperCase() + type.slice(1)} API Key
    </a>
    <div style={{ marginTop: '3px' }}>
      {API_INSTRUCTIONS[type].steps.map((step, index) => (
        <div key={index}>{step}</div>
      ))}
    </div>
  </div>
);

export default ApiKeyInstructions;