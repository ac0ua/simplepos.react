/**
 * SimplePOS Theme System v2 - Material Design 3
 * 
 * Simplified, token-based theme system for easy customization.
 * Each store can have its own theme by overriding tokens.
 */

import { createTheme, alpha, darken, lighten } from '@mui/material/styles';
import { radius, typography, shadows, transitions, defaultPalette } from './design-tokens';

// Utility: Calculate contrast color (black or white)
function getContrastColor(hexColor) {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

// Default theme tokens - can be overridden per store
export const defaultThemeTokens = {
  mode: 'dark',
  
  colors: {
    primary: defaultPalette.primary.main,
    primaryLight: defaultPalette.primary.light,
    primaryDark: defaultPalette.primary.dark,
    
    background: defaultPalette.surface.default,
    surface: defaultPalette.surface.paper,
    surfaceElevated: defaultPalette.surface.elevated,
    
    text: defaultPalette.text.primary,
    textSecondary: defaultPalette.text.secondary,
    
    success: defaultPalette.success,
    error: defaultPalette.error,
    warning: defaultPalette.warning,
    info: defaultPalette.info,
    
    outline: defaultPalette.outline,
  },
  
  shape: {
    borderRadius: radius.md,
    cardRadius: radius.lg,
    buttonRadius: radius.full,
    chipRadius: radius.full,
  },
  
  typography: {
    fontFamily: typography.fontFamily,
    scale: 1,
  },
  
  shadows: {
    profile: 'soft', // flat, soft, strong
  },
};

// Create MUI theme from tokens
export function createPosTheme(tokens = defaultThemeTokens) {
  const { mode, colors, shape, typography: typo, shadows: shadowConfig } = tokens;
  
  const isDark = mode === 'dark';
  const primaryContrast = getContrastColor(colors.primary);
  
  // Shadow intensity based on profile
  const shadowIntensity = shadowConfig.profile === 'flat' ? 0 
    : shadowConfig.profile === 'soft' ? 0.12 
    : 0.25;
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: colors.primaryLight || lighten(colors.primary, 0.3),
        dark: colors.primaryDark || darken(colors.primary, 0.3),
        contrastText: primaryContrast,
      },
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.text,
        secondary: colors.textSecondary,
      },
      success: { main: colors.success },
      error: { main: colors.error },
      warning: { main: colors.warning },
      info: { main: colors.info },
      divider: colors.outline,
    },
    
    typography: {
      fontFamily: typo.fontFamily,
      fontSize: 14 * typo.scale,
      
      h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
      h2: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 },
      h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
      h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
      h5: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.4 },
      h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.4 },
      
      body1: { fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', lineHeight: 1.4 },
      
      button: { 
        textTransform: 'none', 
        fontWeight: 500,
        letterSpacing: '0.02em',
      },
    },
    
    shape: {
      borderRadius: shape.borderRadius,
    },
    
    components: {
      // Button - simplified
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: shape.buttonRadius,
            padding: '8px 20px',
            transition: transitions.fast,
          },
          contained: {
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          sizeSmall: {
            padding: '4px 12px',
            fontSize: '0.8125rem',
          },
          sizeLarge: {
            padding: '12px 28px',
            fontSize: '1rem',
          },
        },
      },
      
      // Card - simplified
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: shape.cardRadius,
            border: `1px solid ${colors.outline}`,
            backgroundColor: colors.surface,
            transition: transitions.fast,
            '&:hover': {
              borderColor: colors.primary,
            },
          },
        },
      },
      
      // Paper
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: shape.cardRadius,
            backgroundImage: 'none',
          },
        },
      },
      
      // Chip - simplified
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: shape.chipRadius,
            fontWeight: 500,
          },
          sizeSmall: {
            height: 24,
            fontSize: '0.75rem',
          },
        },
      },
      
      // TextField - simplified
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: shape.borderRadius,
              '& fieldset': {
                borderColor: colors.outline,
              },
              '&:hover fieldset': {
                borderColor: colors.primary,
              },
            },
          },
        },
      },
      
      // IconButton
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: transitions.fast,
          },
          sizeSmall: {
            padding: 6,
          },
        },
      },
      
      // Dialog
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: radius.xl,
            border: `1px solid ${colors.outline}`,
          },
        },
      },
      
      // Drawer
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${colors.outline}`,
          },
        },
      },
      
      // List
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadius,
            margin: '2px 8px',
            '&.Mui-selected': {
              backgroundColor: alpha(colors.primary, 0.15),
              '&:hover': {
                backgroundColor: alpha(colors.primary, 0.25),
              },
            },
          },
        },
      },
      
      // Tabs
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 44,
          },
        },
      },
      
      // AppBar
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: colors.background,
            borderBottom: `1px solid ${colors.outline}`,
          },
        },
      },
      
      // Tooltip
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: radius.sm,
            fontSize: '0.75rem',
          },
        },
      },
    },
  });
}

// Convenience: default theme instance
export const posTheme = createPosTheme();

export default posTheme;
