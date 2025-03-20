// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\DeleteCacheButton.js
import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import theme from '../theme/theme';

const DeleteCacheButton = () => {
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
        throw new Error('Failed to delete cache');
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

  return (
    <Card title="Cache Management">
      <div style={{ display: 'grid', gap: theme.spacing.md }}>
        <div>
          <Button
            onClick={handleDeleteCache}
            disabled={loading}
            variant="error"
            style={{ marginBottom: theme.spacing.md }}
          >
            {loading ? 'Cleaning...' : 'Clear All Cache'}
          </Button>
          
          <p style={{
            ...theme.typography.small,
            color: theme.colors.text.secondary
          }}>
            This will delete all cached audio files, lyrics, and debug information.
          </p>
        </div>

        {results && (
          <div style={{
            backgroundColor: theme.colors.background.light,
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
    </Card>
  );
};

export default DeleteCacheButton;