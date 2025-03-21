import React from 'react';
import { useTranslation } from 'react-i18next';

// This component has been simplified since we now have static translations
// No need for loading overlay during language switching
const TranslatingOverlay = ({ isVisible }) => {
  // We're keeping the component but making it always return null
  // This ensures existing code that references it won't break
  return null;
};

export default TranslatingOverlay;