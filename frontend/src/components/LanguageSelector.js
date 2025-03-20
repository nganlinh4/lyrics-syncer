import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

// Available languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'th', name: 'Thai (ไทย)' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' }
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize language on first render
  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLang);
    
    // Set up click outside listener to close dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    try {
      setIsTranslating(true);
      
      // Save to localStorage
      localStorage.setItem('language', languageCode);
      
      // Change language in i18next
      await i18n.changeLanguage(languageCode);
      
      setCurrentLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Filter languages based on search
  const filteredLanguages = LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current language name
  const currentLanguageName = LANGUAGES.find(lang => lang.code === currentLanguage)?.name || 'English';

  return (
    <div 
      style={{ 
        position: 'relative',
        display: 'inline-block'
      }}
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          color: theme.colors.text.secondary,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.sm,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: 'transparent',
          cursor: isTranslating ? 'not-allowed' : 'pointer',
          transition: theme.transitions.fast,
          opacity: isTranslating ? 0.7 : 1,
        }}
      >
        {isTranslating ? (
          <div className="loading-spinner" style={{ 
            width: '18px', 
            height: '18px',
            borderTopColor: theme.colors.text.secondary 
          }} />
        ) : (
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
        )}
        <span style={{ fontSize: theme.typography.small.fontSize }}>
          {currentLanguageName}
        </span>
        {!isTranslating && (
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ marginLeft: '2px' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            right: 0,
            width: '220px',
            backgroundColor: theme.colors.background.paper,
            boxShadow: theme.shadows.md,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border}`,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '350px',
          }}
        >
          <div style={{ padding: '8px' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.small.fontSize,
              }}
            />
          </div>
          
          <div style={{ 
            overflowY: 'auto',
            maxHeight: '300px',
            paddingBottom: '8px'
          }}>
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 16px',
                    fontSize: theme.typography.small.fontSize,
                    backgroundColor: language.code === currentLanguage 
                      ? theme.colors.primary + '20' 
                      : 'transparent',
                    color: language.code === currentLanguage 
                      ? theme.colors.primary 
                      : theme.colors.text.primary,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = language.code === currentLanguage
                      ? theme.colors.primary + '30'
                      : theme.colors.background.light;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = language.code === currentLanguage
                      ? theme.colors.primary + '20'
                      : 'transparent';
                  }}
                >
                  {language.name}
                </button>
              ))
            ) : (
              <div style={{ 
                padding: '12px 16px', 
                color: theme.colors.text.secondary,
                textAlign: 'center',
                fontSize: theme.typography.small.fontSize,
              }}>
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;