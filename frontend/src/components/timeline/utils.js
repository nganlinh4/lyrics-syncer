// Timeline utility functions
export const timeToPosition = (time, duration) => {
  const percent = (time / duration) * 100;
  return `${percent}%`;
};

export const getSegmentColor = (index) => {
  const colors = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853',
    '#8E24AA', '#16A085', '#2980B9', '#8E44AD',
    '#F39C12', '#D35400', '#C0392B'
  ];
  return colors[index % colors.length];
};