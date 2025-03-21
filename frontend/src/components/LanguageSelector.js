import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  
  // Get current language
  const currentLanguage = i18n.language || 'en';
  const isKorean = currentLanguage === 'ko';
  
  const toggleLanguage = () => {
    // Simply toggle between 'en' and 'ko'
    const newLanguage = isKorean ? 'en' : 'ko';
    
    // Save to localStorage and change language
    localStorage.setItem('language', newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      aria-label={t(isKorean ? 'language.toggleToEnglish' : 'language.toggleToKorean')}
      title={t(isKorean ? 'language.toggleToEnglish' : 'language.toggleToKorean')}
      style={{
        color: theme.colors.text.secondary,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        border: `1px solid ${theme.colors.border}`,
        backgroundColor: 'transparent',
        cursor: 'pointer',
        transition: theme.transitions.fast,
      }}
    >
      <svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      <span style={{ fontSize: theme.typography.small.fontSize }}>
        {isKorean ? 'English' : '한국어'}
      </span>
    </button>
  );
};

export default LanguageSelector;