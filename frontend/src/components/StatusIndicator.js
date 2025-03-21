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
        textKey: 'common.error'
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
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: `2px solid ${statusStyle.color}`,
        fontSize: '12px',
        lineHeight: 1
      }}>
        {statusStyle.icon}
      </span>
      {t(statusStyle.textKey)}
    </span>
  );
};

export default StatusIndicator;