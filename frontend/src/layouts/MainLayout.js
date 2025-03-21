import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/LanguageSelector';

const MainLayout = ({ children, onSettingsClick }) => {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Set CSS variables for spacing and widths
    document.documentElement.style.setProperty('--content-width', theme.layout.contentWidth);
    document.documentElement.style.setProperty('--spacing-xl', theme.spacing.xl);
    document.documentElement.style.setProperty('--spacing-md', theme.spacing.md);
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background.light,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        backgroundColor: theme.colors.background.main,
        boxShadow: theme.shadows.sm,
        height: theme.layout.headerHeight,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: theme.layout.maxWidth,
          margin: '0 auto',
          padding: `0 ${theme.spacing.md}`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{
            ...theme.typography.h3,
            margin: 0,
            color: theme.colors.primary,
            textDecoration: 'none'
          }}>
            {t('app.title')}
          </Link>

          <nav style={{
            display: 'flex',
            gap: theme.spacing.md,
            alignItems: 'center'
          }}>
            <ThemeToggle />
            <LanguageSelector />
            
            <button
              onClick={onSettingsClick}
              style={{
                color: theme.colors.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                fontSize: theme.typography.small.fontSize,
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: theme.transitions.fast,
                ':hover': {
                  backgroundColor: theme.colors.background.light
                }
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t('nav.settings')}
            </button>
            <a
              href="https://github.com/nganlinh4/lyrics-syncer"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: theme.colors.text.secondary,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                fontSize: theme.typography.small.fontSize
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              {t('nav.github')}
            </a>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer style={{
        backgroundColor: theme.colors.background.main,
        borderTop: `1px solid ${theme.colors.border}`,
        padding: `${theme.spacing.md} 0`,
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: theme.layout.maxWidth,
          margin: '0 auto',
          padding: `0 ${theme.spacing.md}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: theme.spacing.md,
          color: theme.colors.text.secondary,
          fontSize: theme.typography.small.fontSize
        }}>
          <span>{t('footer.copyright', { year: currentYear })}</span>
          <span>•</span>
          <Link
            to="/privacy"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                color: theme.colors.primary
              }
            }}
          >
            {t('footer.privacyPolicy')}
          </Link>
          <span>•</span>
          <Link
            to="/terms"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                color: theme.colors.primary
              }
            }}
          >
            {t('footer.termsOfService')}
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;