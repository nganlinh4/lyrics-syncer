// filepath: c:\WORK_win\lyrics-syncer\frontend\src\theme\theme.js
const theme = {
  colors: {
    primary: '#2196F3',
    secondary: '#757575',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#E91E63',
    info: '#03A9F4',
    background: {
      main: '#FFFFFF',
      light: '#F5F5F5',
      dark: '#E0E0E0'
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#9E9E9E'
    },
    border: '#E0E0E0'
  },
  
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
  
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    lg: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
    xl: '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)'
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
    },
    scrollbar: {
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px'
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px'
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px',
        '&:hover': {
          background: '#666'
        }
      }
    }
  },

  components: {
    button: {
      primary: {
        backgroundColor: '#2196F3',
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#1976D2'
        },
        '&:disabled': {
          backgroundColor: '#BDBDBD'
        }
      },
      secondary: {
        backgroundColor: '#F5F5F5',
        color: '#212121',
        border: '1px solid #E0E0E0',
        '&:hover': {
          backgroundColor: '#E0E0E0'
        }
      },
      success: {
        backgroundColor: '#4CAF50',
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#388E3C'
        }
      },
      error: {
        backgroundColor: '#f44336',
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
      backgroundColor: '#FFFFFF',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '16px',
      transition: 'all 0.3s ease'
    },
    input: {
      base: {
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #E0E0E0',
        fontSize: '1rem',
        lineHeight: '1.5',
        transition: 'all 0.15s ease',
        '&:focus': {
          borderColor: '#2196F3',
          boxShadow: '0 0 0 3px rgba(33,150,243,0.1)'
        },
        '&:disabled': {
          backgroundColor: '#F5F5F5',
          cursor: 'not-allowed'
        }
      }
    }
  }
};

export default theme;