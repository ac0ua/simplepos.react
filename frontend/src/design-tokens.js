/**
 * SimplePOS Design Tokens - Material Design 3 Foundation
 * 
 * This file contains all design tokens for consistent theming across the app.
 * Each POS instance can override these tokens for custom branding.
 */

// Spacing scale (in pixels, converted to rem in usage)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius - MD3 uses larger, more rounded corners
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography scale - simplified
export const typography = {
  fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
  
  // Font sizes (rem)
  size: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    xxl: '1.5rem',    // 24px
    display: '2rem',  // 32px
  },
  
  // Font weights
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Shadows - MD3 style (softer, more diffuse)
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.1)',
  md: '0 2px 8px rgba(0,0,0,0.12)',
  lg: '0 4px 16px rgba(0,0,0,0.15)',
  xl: '0 8px 24px rgba(0,0,0,0.18)',
};

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  toast: 400,
};

// Transitions
export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '350ms ease',
};

// Product card sizes - compact by default
export const productCard = {
  imageHeight: {
    xs: 64,
    sm: 80,
    md: 96,
    lg: 120,
  },
  minWidth: 80,
  maxWidth: 160,
};

// Sidebar dimensions
export const sidebar = {
  width: {
    collapsed: 64,
    compact: 180,
    expanded: 240,
  },
};

// Cart panel dimensions
export const cart = {
  width: {
    compact: 240,
    normal: 280,
    expanded: 320,
  },
};

// Default color palette - MD3 inspired
export const defaultPalette = {
  // Primary brand color
  primary: {
    main: '#f97306',
    light: '#ffb347',
    dark: '#c75202',
    contrast: '#ffffff',
  },
  
  // Surface colors (backgrounds)
  surface: {
    default: '#1a1410',
    paper: '#2a1f18',
    elevated: '#3a2818',
  },
  
  // Text colors
  text: {
    primary: '#f9fafb',
    secondary: '#a8a29e',
    disabled: '#6b7280',
  },
  
  // Semantic colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Outline/border
  outline: '#5b4633',
};

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: 32,
      md: 40,
      lg: 48,
    },
    padding: {
      sm: '6px 12px',
      md: '8px 16px',
      lg: '12px 24px',
    },
  },
  
  input: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
  },
  
  chip: {
    height: {
      sm: 24,
      md: 32,
    },
  },
  
  iconButton: {
    size: {
      sm: 32,
      md: 40,
      lg: 48,
    },
  },
};

// Breakpoints (matching MUI defaults)
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

export default {
  spacing,
  radius,
  typography,
  shadows,
  zIndex,
  transitions,
  productCard,
  sidebar,
  cart,
  defaultPalette,
  components,
  breakpoints,
};
