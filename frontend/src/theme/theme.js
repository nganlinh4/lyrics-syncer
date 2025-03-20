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

// Light theme colors
const lightTheme = {
  colors: {
    primary: '#2196F3',
    secondary: '#757575',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#E91E63',
    info: '#03A9F4',
    background: {
      main: 'var(--background-main, #FFFFFF)',
      light: 'var(--background-light, #F5F5F5)',
      paper: 'var(--background-paper, #FFFFFF)'
    },
    text: {
      primary: 'var(--text-primary, #212121)',
      secondary: 'var(--text-secondary, #757575)',
      disabled: '#9E9E9E'
    },
    border: 'var(--border-color, #E0E0E0)'
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
        backgroundColor: 'var(--primary-color, #2196F3)',
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#1976D2'
        },
        '&:disabled': {
          backgroundColor: '#BDBDBD'
        }
      },
      secondary: {
        backgroundColor: 'var(--background-light, #F5F5F5)',
        color: 'var(--text-primary, #212121)',
        border: '1px solid var(--border-color, #E0E0E0)',
        '&:hover': {
          backgroundColor: '#E0E0E0'
        }
      },
      success: {
        backgroundColor: 'var(--success-color, #4CAF50)',
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#388E3C'
        }
      },
      error: {
        backgroundColor: 'var(--error-color, #f44336)',
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
      backgroundColor: 'var(--background-paper, #FFFFFF)',
      borderRadius: '8px',
      boxShadow: 'var(--card-shadow, 0 2px 4px rgba(0,0,0,0.1))',
      padding: '16px',
      transition: 'all 0.3s ease'
    },
    input: {
      base: {
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid var(--border-color, #E0E0E0)',
        fontSize: '1rem',
        lineHeight: '1.5',
        transition: 'all 0.15s ease',
        backgroundColor: 'var(--background-paper, #FFFFFF)',
        '&:focus': {
          borderColor: 'var(--primary-color, #2196F3)',
          boxShadow: '0 0 0 3px rgba(33,150,243,0.1)'
        },
        '&:disabled': {
          backgroundColor: 'var(--background-light, #F5F5F5)',
          cursor: 'not-allowed'
        }
      }
    }
  }
};

// Dark theme colors
const darkTheme = {
  colors: {
    primary: '#64b5f6',
    secondary: '#a0a0a0',
    success: '#66bb6a',
    warning: '#FFC107',
    error: '#ef5350',
    info: '#29b6f6',
    background: {
      main: 'var(--background-main, #121212)',
      light: 'var(--background-light, #1e1e1e)',
      paper: 'var(--background-paper, #242424)'
    },
    text: {
      primary: 'var(--text-primary, #e0e0e0)',
      secondary: 'var(--text-secondary, #a0a0a0)',
      disabled: '#777777'
    },
    border: 'var(--border-color, #333333)'
  },
  shadows: {
    sm: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.24), 0 1px 2px rgba(0,0,0,0.36))',
    md: '0 3px 6px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.22)',
    lg: '0 10px 20px rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.20)',
    xl: '0 15px 25px rgba(0,0,0,0.25), 0 5px 10px rgba(0,0,0,0.15)'
  },
  components: {
    button: {
      primary: {
        backgroundColor: 'var(--primary-color, #64b5f6)',
        color: '#121212',
        '&:hover': {
          backgroundColor: '#42a5f5'
        },
        '&:disabled': {
          backgroundColor: '#555555'
        }
      },
      secondary: {
        backgroundColor: 'var(--background-light, #1e1e1e)',
        color: 'var(--text-primary, #e0e0e0)',
        border: '1px solid var(--border-color, #333333)',
        '&:hover': {
          backgroundColor: '#333333'
        }
      },
      success: {
        backgroundColor: 'var(--success-color, #66bb6a)',
        color: '#121212',
        '&:hover': {
          backgroundColor: '#4caf50'
        }
      },
      error: {
        backgroundColor: 'var(--error-color, #ef5350)',
        color: '#121212',
        '&:hover': {
          backgroundColor: '#e53935'
        }
      },
      warning: {
        backgroundColor: '#FFC107',
        color: '#121212',
        '&:hover': {
          backgroundColor: '#FFA000'
        }
      }
    },
    card: {
      backgroundColor: 'var(--background-paper, #242424)',
      borderRadius: '8px',
      boxShadow: 'var(--card-shadow, 0 2px 4px rgba(0,0,0,0.2))',
      padding: '16px',
      transition: 'all 0.3s ease'
    },
    input: {
      base: {
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid var(--border-color, #333333)',
        fontSize: '1rem',
        lineHeight: '1.5',
        transition: 'all 0.15s ease',
        backgroundColor: 'var(--background-paper, #242424)',
        color: 'var(--text-primary, #e0e0e0)',
        '&:focus': {
          borderColor: 'var(--primary-color, #64b5f6)',
          boxShadow: '0 0 0 3px rgba(100,181,246,0.2)'
        },
        '&:disabled': {
          backgroundColor: 'var(--background-light, #1e1e1e)',
          cursor: 'not-allowed'
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