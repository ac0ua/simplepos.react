/**
 * SimplePOS Theme System - Material Design 3
 * 
 * Simplified, token-based theme for easy per-store customization.
 * Each store can override these tokens via ThemeStudio.
 */

import { createTheme, darken, lighten, alpha } from '@mui/material/styles';

// ============================================
// UTILITY FUNCTIONS - Accessibility-focused color algorithm
// Based on: https://medium.com/swlh/creating-a-color-algorithm-with-accessibility-in-mind-60c5b8256e19
// Uses WCAG luminance calculations for proper contrast
// ============================================

function hexToRgb(hex) {
  if (!hex) return null;
  const value = hex.replace('#', '');
  const num = parseInt(value.length === 3 
    ? value.split('').map(c => c + c).join('') 
    : value, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to RGB
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

// ============================================
// APCA-inspired Perceptual Lightness Calculation
// Based on the APCA algorithm from WCAG 3.0 draft
// https://github.com/Myndex/SAPC-APCA
// ============================================

// Convert sRGB to Y (luminance) using APCA coefficients
function sRGBtoY(rgb) {
  if (!rgb) return 0;
  
  // Piecewise sRGB to linear
  const mainTRC = 2.4;
  const sRco = 0.2126729;
  const sGco = 0.7151522;
  const sBco = 0.0721750;
  
  function simpleExp(chan) {
    return Math.pow(chan / 255, mainTRC);
  }
  
  return sRco * simpleExp(rgb.r) + sGco * simpleExp(rgb.g) + sBco * simpleExp(rgb.b);
}

// Calculate perceptual lightness (L*) from Y
// Using the CIE L* formula with modifications for better dark range
function YtoLstar(Y) {
  if (Y <= 0.008856) {
    return Y * 903.3;
  }
  return Math.pow(Y, 1/3) * 116 - 16;
}

// Get L* (perceptual lightness 0-100) from hex color
function getLstar(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 50;
  const Y = sRGBtoY(rgb);
  return YtoLstar(Y);
}

// Calculate APCA-like contrast value
// Positive = light text on dark bg, Negative = dark text on light bg
function getAPCAcontrast(textHex, bgHex) {
  const txtY = sRGBtoY(hexToRgb(textHex));
  const bgY = sRGBtoY(hexToRgb(bgHex));
  
  // Soft clamp
  const txtYc = txtY > 0.022 ? txtY : txtY + Math.pow(0.022 - txtY, 1.414);
  const bgYc = bgY > 0.022 ? bgY : bgY + Math.pow(0.022 - bgY, 1.414);
  
  // APCA contrast calculation (simplified)
  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;
  
  if (bgYc > txtYc) {
    // Dark text on light background
    return (Math.pow(bgYc, normBG) - Math.pow(txtYc, normTXT)) * 1.14;
  } else {
    // Light text on dark background
    return (Math.pow(bgYc, revBG) - Math.pow(txtYc, revTXT)) * 1.14;
  }
}

// Calculate relative luminance per WCAG 2.1 (kept for compatibility)
function getRelativeLuminance(rgb) {
  if (!rgb) return 0;
  const srgb = [rgb.r, rgb.g, rgb.b].map(v => v / 255);
  const linear = srgb.map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

// Calculate contrast ratio between two colors (WCAG formula - kept for compatibility)
function getContrastRatio(rgb1, rgb2) {
  const L1 = getRelativeLuminance(rgb1);
  const L2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================
// MAIN FUNCTION: Get accessible text color
// Uses perceptual lightness to GUARANTEE opposite colors
// ============================================
function getAccessibleTextColor(bgHex) {
  const bgRgb = hexToRgb(bgHex);
  if (!bgRgb) return '#ffffff';
  
  // Get perceptual lightness of background (0-100)
  const bgLstar = getLstar(bgHex);
  
  // Simple rule: if background is light (L* > 50), use dark text
  // If background is dark (L* <= 50), use light text
  // This ensures text is ALWAYS on the opposite side
  
  if (bgLstar > 50) {
    // Light background -> Dark text
    // The lighter the background, the darker the text should be
    const textL = Math.max(5, 50 - bgLstar * 0.6);
    const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);
    const textS = Math.min(bgHsl.s * 0.3, 15); // Slight tint from bg
    const textRgb = hslToRgb(bgHsl.h, textS, textL);
    return rgbToHex(textRgb.r, textRgb.g, textRgb.b);
  } else {
    // Dark background -> Light text
    // The darker the background, the lighter the text should be
    const textL = Math.min(98, 50 + (100 - bgLstar) * 0.5);
    const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);
    const textS = Math.min(bgHsl.s * 0.2, 10); // Slight tint from bg
    const textRgb = hslToRgb(bgHsl.h, textS, textL);
    return rgbToHex(textRgb.r, textRgb.g, textRgb.b);
  }
}

// Generate an accent/highlight color that works with the background
function getAccentTextColor(bgHex) {
  const bgRgb = hexToRgb(bgHex);
  if (!bgRgb) return '#ffb347';
  
  const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);
  const bgLstar = getLstar(bgHex);
  
  // Create a saturated accent on the opposite lightness side
  let accentS = Math.max(bgHsl.s + 30, 60);
  let accentL = bgLstar > 50 ? 35 : 70;
  
  const accentRgb = hslToRgb(bgHsl.h, accentS, accentL);
  return rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b);
}

// Simple contrast color (uses perceptual lightness)
function getContrastColor(hex) {
  const lstar = getLstar(hex);
  // Clear threshold at L* = 50
  return lstar > 50 ? '#1a1a1a' : '#ffffff';
}

// Export color utilities for use in other components
export const colorUtils = {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getRelativeLuminance,
  getContrastRatio,
  getAccessibleTextColor,
  getAccentTextColor,
  getContrastColor,
  getLstar,
  getAPCAcontrast
};

// ============================================
// DEFAULT THEME TOKENS
// ============================================

export const defaultPosThemeTokens = {
  mode: 'dark',
  
  // Brand colors
  brand: {
    primary: '#f97306',
    accent: '#ffb347',
    onPrimary: '#1a0a00',
    
    surface: '#1a1410',
    surfaceVariant: '#2a1f18',
    onSurface: '#f9fafb',
    onSurfaceVariant: '#d4d4d4',
    
    sidebar: '#1a1410',
    outline: '#5b4633',
    
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  
  // Typography
  typography: {
    fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
    headingFontFamily: '"Inter", "Roboto", system-ui, sans-serif',
    headingScale: 1,
    bodyScale: 1,
    headingWeight: 600,
    bodyWeight: 400,
  },
  
  // Shape
  shape: {
    baseRadius: 12,
    chipRadius: 999,
    buttonRadius: 999,
    cardRadius: 16,
    shadowProfile: 'soft',
  },
};

// ============================================
// THEME FACTORY
// ============================================

export const createBusinessTheme = (tokens = defaultPosThemeTokens) => {
  const { mode, brand, typography: typo, shape } = tokens;
  const isDark = mode === 'dark';
  
  // Merge with defaults
  const colors = { ...defaultPosThemeTokens.brand, ...brand };
  const typography = { ...defaultPosThemeTokens.typography, ...typo };
  
  // Derive colors using accessibility-focused algorithm
  const primaryContrast = getContrastColor(colors.primary);
  const primaryHover = darken(colors.primary, 0.15);
  const primaryActive = darken(colors.primary, 0.25);
  
  // Calculate accessible text colors based on surface color
  // This implements the luminance-based algorithm from the article
  const surfaceColor = colors.surface || (isDark ? '#1a1410' : '#f9fafb');
  const accessibleTextPrimary = colors.onSurface || getAccessibleTextColor(surfaceColor);
  const accessibleTextSecondary = colors.onSurfaceVariant || 
    (() => {
      // Create a slightly less contrasting secondary text
      const bgRgb = hexToRgb(surfaceColor);
      if (!bgRgb) return isDark ? '#a3a3a3' : '#525252';
      const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);
      const bgLuminance = getRelativeLuminance(bgRgb);
      const textL = bgLuminance < 0.179 ? 70 : 35;
      const textS = Math.min(bgHsl.s * 0.2, 10);
      const textRgb = hslToRgb(bgHsl.h, textS, textL);
      return rgbToHex(textRgb.r, textRgb.g, textRgb.b);
    })();

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: lighten(colors.primary, 0.3),
        dark: primaryHover,
        contrastText: primaryContrast,
      },
      secondary: {
        main: colors.accent || colors.surfaceVariant,
        contrastText: getContrastColor(colors.accent || colors.surfaceVariant),
      },
      background: {
        default: colors.surface,
        paper: colors.surfaceVariant,
      },
      text: {
        primary: accessibleTextPrimary,
        secondary: accessibleTextSecondary,
      },
      success: { main: colors.success },
      error: { main: colors.error },
      warning: { main: colors.warning },
      info: { main: colors.info },
      divider: colors.outline,
    },
    
    typography: {
      fontFamily: typography.fontFamily,
      fontSize: 14 * (typography.bodyScale || 1),
      h1: { fontSize: `${2 * (typography.headingScale || 1)}rem`, fontWeight: 700, lineHeight: 1.2, fontFamily: typography.headingFontFamily || typography.fontFamily },
      h2: { fontSize: `${1.75 * (typography.headingScale || 1)}rem`, fontWeight: 700, lineHeight: 1.2, fontFamily: typography.headingFontFamily || typography.fontFamily },
      h3: { fontSize: `${1.5 * (typography.headingScale || 1)}rem`, fontWeight: 600, lineHeight: 1.3, fontFamily: typography.headingFontFamily || typography.fontFamily },
      h4: { fontSize: `${1.25 * (typography.headingScale || 1)}rem`, fontWeight: 600, lineHeight: 1.3, fontFamily: typography.headingFontFamily || typography.fontFamily },
      h5: { fontSize: `${1.125 * (typography.headingScale || 1)}rem`, fontWeight: 500, lineHeight: 1.4, fontFamily: typography.headingFontFamily || typography.fontFamily },
      h6: { fontSize: `${1 * (typography.headingScale || 1)}rem`, fontWeight: 500, lineHeight: 1.4, fontFamily: typography.headingFontFamily || typography.fontFamily },
      subtitle1: { fontSize: `${1 * (typography.bodyScale || 1)}rem`, fontWeight: 500 },
      subtitle2: { fontSize: `${0.875 * (typography.bodyScale || 1)}rem`, fontWeight: 500 },
      body1: { fontSize: `${1 * (typography.bodyScale || 1)}rem`, lineHeight: 1.5 },
      body2: { fontSize: `${0.875 * (typography.bodyScale || 1)}rem`, lineHeight: 1.5 },
      caption: { fontSize: `${0.75 * (typography.bodyScale || 1)}rem`, lineHeight: 1.4 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    
    shape: {
      borderRadius: shape.baseRadius || 12,
    },
    
    components: {
      // Button - MD3 style
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: shape.buttonRadius || 999,
            padding: '8px 20px',
            fontWeight: 500,
            transition: 'all 150ms ease',
            '&:hover': { transform: 'translateY(-1px)' },
            '&:active': { transform: 'translateY(0)' },
          },
          sizeSmall: { padding: '4px 12px', fontSize: '0.8125rem' },
          sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
        },
      },
      
      // Paper
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: shape.cardRadius || 16,
            backgroundImage: 'none',
          },
        },
      },
      
      // Card
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: shape.cardRadius || 16,
            border: `1px solid ${colors.outline}`,
            transition: 'all 150ms ease',
            '&:hover': { borderColor: colors.primary },
          },
        },
      },
      
      // Chip
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: shape.chipRadius || 999,
            fontWeight: 500,
          },
          sizeSmall: { height: 24, fontSize: '0.75rem' },
        },
      },
      
      // TextField
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: shape.baseRadius || 12,
              '& fieldset': { borderColor: colors.outline },
              '&:hover fieldset': { borderColor: colors.primary },
            },
          },
        },
      },
      
      // IconButton
      MuiIconButton: {
        styleOverrides: {
          root: { transition: 'all 150ms ease' },
          sizeSmall: { padding: 6 },
        },
      },
      
      // Dialog
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            border: `1px solid ${colors.outline}`,
          },
        },
      },
      
      // Drawer
      MuiDrawer: {
        styleOverrides: {
          paper: { borderRight: `1px solid ${colors.outline}` },
        },
      },
      
      // AppBar
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.outline}`,
          },
        },
      },
      
      // Tooltip
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: '0.75rem' },
        },
      },
      
      // List
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.baseRadius || 12,
            margin: '2px 8px',
            '&.Mui-selected': {
              backgroundColor: alpha(colors.primary, 0.15),
              '&:hover': { backgroundColor: alpha(colors.primary, 0.25) },
            },
          },
        },
      },
      
      // Tabs
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 500, minHeight: 44 },
        },
      },
      
      // Divider
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: colors.outline },
        },
      },
    },
  });
};

// ============================================
// DEFAULT THEME INSTANCE
// ============================================

export const material3PosTheme = createBusinessTheme();
