import { createTheme } from '@mui/material/styles';

// Core business theme tokens (Material Design 3 inspired)
// This is the only place you should need to tweak colors / radii
// when re-branding for a different business.
export const defaultPosThemeTokens = {
  mode: 'dark',
  // Brand colors ("Happy Days" brown + orange)
  brand: {
    primary: '#f97306', // main accent (buttons, highlights)
    accent: '#ffb347',
    onPrimary: '#120a04',
    primaryContainer: '#ffb869',
    onPrimaryContainer: '#1f1407',

    surface: '#1f140b', // overall app background
    onSurface: '#f9fafb',
    surfaceVariant: '#3a2818',
    onSurfaceVariant: '#f5e9dc',

    sidebar: '#28180d',
    sidebarActive: '#f97306',
    sidebarOnActive: '#140b06',

    outline: '#5b4633',
    success: '#22c55e',
    error: '#f97373',
    warning: '#facc15',
    info: '#38bdf8'
  },
  // Typography
  typography: {
    fontFamily: '"Inter", "Roboto", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    headingFontFamily: '"Inter", "Roboto", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    headingScale: 1,
    bodyScale: 1,
    headingWeight: 700,
    bodyWeight: 500
  },
  // Shape and elevation
  shape: {
    baseRadius: 16,
    chipRadius: 999,
    buttonRadius: 999,
    cardRadius: 20,
    sidebarRadius: 20
  }
};

export const createBusinessTheme = (tokens = defaultPosThemeTokens) => {
  const { mode, brand, typography, shape } = tokens;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brand.primary,
        light: brand.primaryContainer,
        dark: '#c75202',
        contrastText: brand.onPrimary
      },
      secondary: {
        main: brand.accent || brand.surfaceVariant,
        contrastText: brand.onSurfaceVariant
      },
      background: {
        default: brand.surface,
        paper: brand.surfaceVariant
      },
      text: {
        primary: brand.onSurface,
        secondary: brand.onSurfaceVariant
      },
      success: {
        main: brand.success
      },
      error: {
        main: brand.error
      },
      warning: {
        main: brand.warning
      },
      info: {
        main: brand.info
      },
      divider: brand.outline
    },
    typography: {
      fontFamily: typography.fontFamily,
      fontSize: 14 * (typography.bodyScale || 1),
      h1: {
        fontSize: `${2.4 * (typography.headingScale || 1)}rem`,
        fontWeight: typography.headingWeight,
        letterSpacing: '0.02em',
        fontFamily: typography.headingFontFamily || typography.fontFamily
      },
      h2: {
        fontSize: `${2 * (typography.headingScale || 1)}rem`,
        fontWeight: typography.headingWeight,
        letterSpacing: '0.02em',
        fontFamily: typography.headingFontFamily || typography.fontFamily
      },
      h3: {
        fontSize: `${1.8 * (typography.headingScale || 1)}rem`,
        fontWeight: typography.headingWeight,
        letterSpacing: '0.01em',
        fontFamily: typography.headingFontFamily || typography.fontFamily
      },
      h4: {
        fontSize: `${1.4 * (typography.headingScale || 1)}rem`,
        fontWeight: typography.headingWeight,
        letterSpacing: '0.01em',
        fontFamily: typography.headingFontFamily || typography.fontFamily
      },
      h5: {
        fontSize: `${1.1 * (typography.headingScale || 1)}rem`,
        fontWeight: typography.bodyWeight,
        letterSpacing: '0.01em',
        fontFamily: typography.headingFontFamily || typography.fontFamily
      },
      h6: {
        fontSize: `${1 * (typography.headingScale || 1)}rem`,
        fontWeight: typography.bodyWeight,
        letterSpacing: '0.01em',
        fontFamily: typography.headingFontFamily || typography.fontFamily
      },
      button: {
        textTransform: 'none',
        fontWeight: typography.bodyWeight,
        letterSpacing: '0.04em'
      }
    },
    shape: {
      borderRadius: shape.baseRadius
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.buttonRadius,
            paddingInline: 20,
            paddingBlock: 10,
            fontSize: '0.95rem',
            fontWeight: typography.bodyWeight,
            boxShadow: 'none'
          },
          containedPrimary: {
            backgroundColor: brand.primary,
            color: brand.onPrimary,
            '&:hover': {
              backgroundColor: '#ea6a05',
              boxShadow: '0 10px 24px rgba(249, 115, 6, 0.3)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: shape.cardRadius,
            backgroundImage: 'none',
            backgroundColor: brand.surfaceVariant,
            color: brand.onSurface,
            boxShadow: '0 24px 40px rgba(0,0,0,0.6)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: shape.cardRadius,
            backgroundColor: brand.surfaceVariant,
            border: `1px solid ${brand.outline}`,
            boxShadow:
              '0 18px 36px rgba(0,0,0,0.55), 0 0 0 1px rgba(15, 23, 42, 0.6)',
            '&:hover': {
              boxShadow:
                '0 24px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(249, 115, 6, 0.4)',
              borderColor: brand.primary
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: shape.chipRadius,
            fontWeight: typography.bodyWeight,
            backgroundColor: '#111827',
            color: brand.onSurfaceVariant
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            backgroundColor: brand.surface,
            border: `1px solid ${brand.outline}`
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
            backgroundColor: brand.sidebar,
            color: brand.onSurface,
            borderRight: `1px solid ${brand.outline}`
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: brand.surface,
            color: brand.onSurface,
            boxShadow: '0 1px 0 rgba(15,23,42,0.7)'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: shape.baseRadius,
              backgroundColor: '#020617',
              '& fieldset': {
                borderColor: brand.outline
              },
              '&:hover fieldset': {
                borderColor: brand.primary
              },
              '&.Mui-focused fieldset': {
                borderColor: brand.primary
              }
            },
            '& .MuiInputLabel-root': {
              color: brand.onSurfaceVariant
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: brand.primary
            }
          }
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 999,
            backgroundColor: '#020617',
            color: brand.onSurface,
            fontSize: '0.75rem'
          }
        }
      }
    }
  });
};

// Convenience default theme instance used by App.jsx
export const material3PosTheme = createBusinessTheme();
