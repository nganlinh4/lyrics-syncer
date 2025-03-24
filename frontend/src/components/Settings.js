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
      backgroundColor: 'var(--backdrop-overlay)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)', // For Safari support
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'start',
      padding: theme.spacing.xl,
      overflowY: 'auto',
      zIndex: 1000,
      transition: theme.transitions.medium
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '800px',
        marginBottom: theme.spacing.xl,
        opacity: 1,
        transform: 'translateY(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        animation: 'settings-modal-in 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg
        }}>
          <h2 style={theme.typography.h2}>{t('settings.title')}</h2>
          <Button onClick={onClose} variant="secondary">
            {t('common.close')}
          </Button>
        </div>

        <div style={{ display: 'grid', gap: theme.spacing.xl }}>
          {/* API Keys Section */}
          <section>
            <h3 style={theme.typography.h3}>{t('settings.apiKeys')}</h3>
            <div style={{ display: 'grid', gap: theme.spacing.md }}>
              <ApiKeyInput
                type="genius"
                label={t('settings.geniusApiKey')}
                value={apiKeys.genius || ''}
                onChange={onApiKeyChange}
                onSave={onSaveApiKey}
              />
              <ApiKeyInput
                type="youtube"
                label={t('settings.youtubeApiKey')}
                value={apiKeys.youtube || ''}
                onChange={onApiKeyChange}
                onSave={onSaveApiKey}
              />
              <ApiKeyInput
                type="gemini"
                label={t('settings.geminiApiKey')}
                value={apiKeys.gemini || ''}
                onChange={onApiKeyChange}
                onSave={onSaveApiKey}
              />
            </div>
          </section>

          {/* Models Section */}
          <section>
            <h3 style={theme.typography.h3}>{t('settings.models.title')}</h3>
            <div style={{ display: 'grid', gap: theme.spacing.lg }}>
              {/* Lyrics Model */}
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

              {/* Prompt Model */}
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

              {/* Image Model */}
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
                          {result.folder}: {result.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default Settings;