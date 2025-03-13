import React from 'react';
import { timeToPosition } from './utils';

const TimeIndicator = ({ currentTime, duration }) => (
  <div
    className="current-time-indicator"
    style={{
      position: 'absolute',
      top: 0,
      left: timeToPosition(currentTime, duration),
      width: '2px',
      height: '100%',
      backgroundColor: 'red',
      zIndex: 10,
      transition: 'left 0.1s linear'
    }}
  />
);

export default TimeIndicator;