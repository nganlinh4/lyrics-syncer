import React, { useEffect } from 'react';
import theme from '../theme/theme';

const MainLayout = ({ children }) => {
  useEffect(() => {
    // Set CSS variables for spacing and widths
    document.documentElement.style.setProperty('--content-width', theme.layout.contentWidth);
    document.documentElement.style.setProperty('--spacing-xl', theme.spacing.xl);
    document.documentElement.style.setProperty('--spacing-md', theme.spacing.md);
  }, []);

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
          <h1 style={{
            ...theme.typography.h3,
            margin: 0,
            color: theme.colors.primary
          }}>
            Lyrics Syncer
          </h1>

          <nav>
            <a
              href="https://github.com/yourusername/lyrics-syncer"
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
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              GitHub
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
          <span>© {new Date().getFullYear()} Lyrics Syncer</span>
          <span>•</span>
          <a
            href="/privacy"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                color: theme.colors.primary
              }
            }}
          >
            Privacy Policy
          </a>
          <span>•</span>
          <a
            href="/terms"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                color: theme.colors.primary
              }
            }}
          >
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;