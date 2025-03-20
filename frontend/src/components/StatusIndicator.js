import React from 'react';
import theme from '../theme/theme';

const StatusIndicator = ({ status }) => {
  const getStatusStyles = () => {
    const statuses = {
      saved: {
        color: theme.colors.success,
        icon: '✓',
        text: 'Saved'
      },
      unsaved: {
        color: theme.colors.text.secondary,
        icon: '○',
        text: 'Not saved'
      },
      error: {
        color: theme.colors.error,
        icon: '!',
        text: 'Error'
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
      {statusStyle.text}
    </span>
  );
};

export default StatusIndicator;