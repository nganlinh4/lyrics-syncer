// This file provides fallbacks for environment variables
window.process = {
  env: {
    NODE_ENV: '%NODE_ENV%',
    REACT_APP_API_URL: '%REACT_APP_API_URL%'
  }
};

// Ensure i18next can access process variable
if (typeof process === 'undefined') {
  var process = window.process;
}