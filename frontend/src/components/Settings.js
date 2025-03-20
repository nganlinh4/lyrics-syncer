import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ApiKeyInput from './ApiKeyInput';
import theme from '../theme/theme';

const Settings = ({
  isOpen,
  onClose,
  apiKeys,
  onApiKeyChange,
  onSaveApiKey,
  selectedModel,
  onModelChange,
  selectedImageModel,
  onImageModelChange,
  selectedPromptModel,
  onPromptModelChange,
  ModelSelector,
  ImageModelSelector,
  PromptModelSelector
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: theme.colors.background.main,
        borderRadius: theme.borderRadius.md,
        boxShadow: theme.shadows.lg,
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <div style={{ 
          padding: theme.spacing.lg,
          display: 'grid',
          gap: theme.spacing.lg
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={theme.typography.h2}>Settings</h2>
            <Button
              onClick={onClose}
              variant="secondary"
              size="small"
            >
              Close
            </Button>
          </div>

          <div style={{ display: 'grid', gap: theme.spacing.lg }}>
            {/* API Keys Section */}
            <section>
              <h3 style={theme.typography.h3}>API Keys</h3>
              <div style={{ display: 'grid', gap: theme.spacing.md }}>
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
              </div>
            </section>

            {/* Models Section */}
            <section>
              <h3 style={theme.typography.h3}>Models</h3>
              <div style={{ display: 'grid', gap: theme.spacing.md }}>
                <div style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.light,
                  borderRadius: theme.borderRadius.sm
                }}>
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                  />
                </div>
                <div style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.light,
                  borderRadius: theme.borderRadius.sm
                }}>
                  <PromptModelSelector
                    selectedModel={selectedPromptModel}
                    onModelChange={onPromptModelChange}
                  />
                </div>
                <div style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.light,
                  borderRadius: theme.borderRadius.sm
                }}>
                  <ImageModelSelector
                    selectedModel={selectedImageModel}
                    onModelChange={onImageModelChange}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;