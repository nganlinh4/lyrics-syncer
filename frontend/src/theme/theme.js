// filepath: c:\WORK_win\lyrics-syncer\frontend\src\theme\theme.js
import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

// Base theme that doesn't change between light/dark modes
const baseTheme = {
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: '700',
      lineHeight: 1.2
    },
    h2: {
      fontSize: '2rem',
      fontWeight: '600',
      lineHeight: 1.3
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: 1.4
    },
    body: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: 1.5
    },
    small: {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: 1.4
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: 1.75,
      textTransform: 'uppercase'
    }
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    pill: '9999px'
  },
  
  transitions: {
    fast: 'all 0.15s ease',
    medium: 'all 0.3s ease',
    slow: 'all 0.5s ease'
  },
  
  breakpoints: {
    xs: '320px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px'
  },
  
  layout: {
    maxWidth: '1200px',
    contentWidth: '800px',
    sidebarWidth: '250px',
    headerHeight: '64px',
    footerHeight: '48px'
  },

  mixins: {
    flexCenter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    absoluteFill: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    ellipsis: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }
};

// Light theme colors and component styles
const lightTheme = {
  colors: {
    primary: 'var(--primary-color)',
    secondary: 'var(--text-secondary)',
    success: 'var(--success-color)',
    warning: 'var(--warning-color)',
    error: 'var(--error-color)',
    info: 'var(--info-color)',
    background: {
      main: 'var(--background-main)',
      light: 'var(--background-light)',
      paper: 'var(--background-paper)'
    },
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)'
    },
    border: 'var(--border-color)'
  },
  shadows: {
    sm: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24))',
    md: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    lg: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
    xl: '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)'
  },
  components: {
    button: {
      primary: {
        backgroundColor: 'var(--primary-color)',
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: 'var(--primary-color)',
          filter: 'brightness(110%)'
        },
        '&:disabled': {
          backgroundColor: 'var(--text-secondary)',
          opacity: 0.6
        }
      },
      secondary: {
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        '&:hover': {
          backgroundColor: 'var(--hover-overlay)'
        }
      },
      success: {
        backgroundColor: 'var(--success-color)',
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#388E3C'
        }
      },
      error: {
        backgroundColor: 'var(--error-color)',
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#d32f2f'
        }
      },
      warning: {
        backgroundColor: '#FFC107',
        color: '#212121',
        '&:hover': {
          backgroundColor: '#FFA000'
        }
      }
    },
    card: {
      backgroundColor: 'var(--background-paper)',
      borderRadius: '8px',
      boxShadow: 'var(--card-shadow)',
      border: '1px solid var(--border-color)',
      transition: 'all 0.3s ease'
    },
    input: {
      base: {
        backgroundColor: 'var(--background-paper)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '8px 12px',
        '&:hover': {
          borderColor: 'var(--primary-color)',
          backgroundColor: 'var(--hover-overlay)'
        },
        '&:focus': {
          borderColor: 'var(--primary-color)',
          boxShadow: '0 0 0 2px var(--primary-color-light)'
        },
        '&:disabled': {
          backgroundColor: 'var(--background-light)',
          cursor: 'not-allowed',
          opacity: 0.7
        }
      }
    },
    dropdown: {
      backgroundColor: 'var(--background-paper)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--card-shadow)',
      '& option': {
        padding: '8px 12px',
        '&:hover': {
          backgroundColor: 'var(--hover-overlay)'
        }
      }
    }
  }
};

// Dark theme overrides
const darkTheme = {
  colors: {
    ...lightTheme.colors
  },
  components: {
    ...lightTheme.components,
    button: {
      ...lightTheme.components.button,
      secondary: {
        ...lightTheme.components.button.secondary,
        '&:hover': {
          backgroundColor: 'var(--hover-overlay)'
        }
      }
    },
    card: {
      ...lightTheme.components.card,
      boxShadow: 'var(--card-shadow)'
    },
    input: {
      base: {
        ...lightTheme.components.input.base,
        '&:hover': {
          borderColor: 'var(--primary-color)',
          backgroundColor: 'var(--hover-overlay)'
        },
        '&:focus': {
          borderColor: 'var(--primary-color)',
          boxShadow: '0 0 0 2px var(--primary-color-light)'
        }
      }
    }
  }
};

// Export a theme object based on the current theme mode
const useTheme = () => {
  const { darkMode } = useContext(ThemeContext);
  return {
    ...baseTheme,
    ...(darkMode ? darkTheme : lightTheme)
  };
};

// For compatibility with current code that imports theme directly
const theme = {
  ...baseTheme,
  ...lightTheme
};

export default theme;
export { useTheme };