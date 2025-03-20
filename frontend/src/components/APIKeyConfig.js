// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\APIKeyConfig.js
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ApiKeyInput from './ApiKeyInput';
import theme from '../theme/theme';

const APIKeyConfig = ({
  apiKeys,
  onApiKeyChange,
  onSaveApiKey,
  selectedModel,
  onModelChange,
  ModelSelector
}) => {
  return (
    <Card title="API Configuration">
      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {Object.entries(apiKeys).map(([type, { key, status }]) => (
          <div key={type} style={{ 
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.light,
            borderRadius: theme.borderRadius.sm
          }}>
            <ApiKeyInput
              type={type}
              value={key}
              status={status}
              onChange={(value) => onApiKeyChange(type, value)}
              onSave={onSaveApiKey}
            />
          </div>
        ))}

        <div style={{
          marginTop: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background.light,
          borderRadius: theme.borderRadius.sm
        }}>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        </div>
      </div>
    </Card>
  );
};

export default APIKeyConfig;