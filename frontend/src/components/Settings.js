import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleDeleteCache = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/delete_cache`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(t('errors.cacheDelete'));
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error deleting cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return '•';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

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
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Sticky Header */}
        <div style={{
          padding: theme.spacing.md,
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.background.main,
          borderTopLeftRadius: theme.borderRadius.md,
          borderTopRightRadius: theme.borderRadius.md,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{...theme.typography.h2, margin: 0}}>{t('settings.title')}</h2>
          <Button
            onClick={onClose}
            variant="secondary"
            size="small"
          >
            {t('common.close')}
          </Button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          padding: theme.spacing.lg,
          overflow: 'auto',
          flexGrow: 1
        }}>
          <div style={{ display: 'grid', gap: theme.spacing.lg }}>
            {/* API Keys Section */}
            <section>
              <h3 style={theme.typography.h3}>{t('settings.apiKeys')}</h3>
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
              <h3 style={theme.typography.h3}>{t('settings.models')}</h3>
              <div style={{ display: 'grid', gap: theme.spacing.md }}>
                <div style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.light,
                  borderRadius: theme.borderRadius.sm
                }}>
                  <h4 style={theme.typography.h4}>{t('settings.chatModels')}</h4>
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
                  <h4 style={theme.typography.h4}>{t('settings.promptModels')}</h4>
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
                  <h4 style={theme.typography.h4}>{t('settings.imageModels')}</h4>
                  <ImageModelSelector
                    selectedModel={selectedImageModel}
                    onModelChange={onImageModelChange}
                  />
                </div>
              </div>
            </section>

            {/* Cache Management Section */}
            <section>
              <h3 style={theme.typography.h3}>{t('settings.cache.title')}</h3>
              <div style={{ 
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background.light,
                borderRadius: theme.borderRadius.sm
              }}>
                <div style={{ display: 'grid', gap: theme.spacing.md }}>
                  <div>
                    <Button
                      onClick={handleDeleteCache}
                      disabled={loading}
                      variant="error"
                      style={{ marginBottom: theme.spacing.md }}
                    >
                      {loading ? t('common.loading') : t('settings.cache.clearAll')}
                    </Button>
                    
                    <p style={{
                      ...theme.typography.small,
                      color: theme.colors.text.secondary
                    }}>
                      {t('settings.cache.description')}
                    </p>
                  </div>

                  {results && (
                    <div style={{
                      backgroundColor: theme.colors.background.main,
                      borderRadius: theme.borderRadius.sm,
                      padding: theme.spacing.md
                    }}>
                      {results.map((result, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.sm,
                            marginBottom: index < results.length - 1 ? theme.spacing.sm : 0
                          }}
                        >
                          <span style={{
                            color: getStatusColor(result.status),
                            fontSize: theme.typography.body.fontSize,
                            fontWeight: 'bold'
                          }}>
                            {getStatusIcon(result.status)}
                          </span>
                          <span style={{
                            ...theme.typography.body,
                            color: theme.colors.text.primary
                          }}>
                            {result.folder}:
                          </span>
                          <span style={{
                            ...theme.typography.small,
                            color: theme.colors.text.secondary
                          }}>
                            {result.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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