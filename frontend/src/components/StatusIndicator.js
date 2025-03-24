import React from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

const StatusIndicator = ({ status }) => {
  const { t } = useTranslation();
  
  const getStatusStyles = () => {
    const statuses = {
      saved: {
        color: theme.colors.success,
        icon: '✓',
        textKey: 'common.saved'
      },
      unsaved: {
        color: theme.colors.text.secondary,
        icon: '○',
        textKey: 'common.unsaved'
      },
      error: {
        color: theme.colors.error,
        icon: '!',
        textKey: 'errors.generic'
      }
    };
    return statuses[status] || statuses.unsaved;
  };

  const statusStyle = getStatusStyles();

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginLeft: theme.spacing.sm,
      fontSize: theme.typography.small.fontSize,
      color: statusStyle.color,
      transition: theme.transitions.fast
    }}>
      <span>{statusStyle.icon}</span>
      <span>{t(statusStyle.textKey)}</span>
    </span>
  );
};

export default StatusIndicator;