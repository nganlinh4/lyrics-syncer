// This file provides fallbacks for environment variables
window.process = window.process || {};
window.process.env = window.process.env || {};
window.process.env.NODE_ENV = window.process.env.NODE_ENV || 'development';
window.process.env.PUBLIC_URL = window.process.env.PUBLIC_URL || '';

// Ensure i18next can access process variable
if (typeof process === 'undefined') {
  var process = window.process;
}