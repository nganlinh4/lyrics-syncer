import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

// Language options configuration
const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' }
];

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Get current language
  const currentLanguage = i18n.language || 'en';
  
  const getCurrentLanguageDisplay = () => {
    const language = LANGUAGES.find(lang => lang.code === currentLanguage);
    return language ? language.nativeName : 'English';
  };
  
  const changeLanguage = (code) => {
    // Save to localStorage and change language
    localStorage.setItem('language', code);
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('language.title')}
        title={t('language.title')}
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
          {getCurrentLanguageDisplay()}
        </span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          backgroundColor: theme.colors.background.paper,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.md,
          zIndex: 1000,
          minWidth: '140px',
          overflow: 'hidden'
        }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                width: '100%',
                textAlign: 'left',
                border: 'none',
                backgroundColor: currentLanguage === lang.code ? 
                  theme.colors.background.light : 'transparent',
                cursor: 'pointer',
                fontSize: theme.typography.body.fontSize,
                transition: theme.transitions.fast,
                color: theme.colors.text.primary,
                borderBottom: lang.code !== LANGUAGES[LANGUAGES.length - 1].code ?
                  `1px solid ${theme.colors.border}` : 'none',
              }}
            >
              <span>{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;