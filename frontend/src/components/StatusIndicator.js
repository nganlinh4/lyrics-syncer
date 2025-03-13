import React from 'react';

const StatusIndicator = ({ status }) => (
  <span style={{
    marginLeft: '10px',
    color: status === 'saved' ? '#4CAF50' : '#666',
    fontSize: '0.8em'
  }}>
    {status === 'saved' ? '✓ Saved' : 'Not saved'}
  </span>
);

export default StatusIndicator;