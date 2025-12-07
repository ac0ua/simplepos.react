import { createTheme, darken } from '@mui/material/styles';

function hexToRgb(hex) {
  if (!hex) return null;
  let value = hex.trim().replace('#', '');
  if (value.length === 3) {
    value = value.split('').map((ch) => ch + ch).join('');
  }
  if (value.length !== 6) return null;
  const intVal = parseInt(value, 16);
  if (Number.isNaN(intVal)) return null;
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255
  };
}

function relativeLuminance(rgb) {
  if (!rgb) return null;
  const srgb = [rgb.r, rgb.g, rgb.b].map((v) => v / 255);
  const lin = srgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(hexA, hexB) {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return null;
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const light = Math.max(lumA, lumB);
  const dark = Math.min(lumA, lumB);
  return (light + 0.05) / (dark + 0.05);
}

function ensureReadableTextColor(backgroundHex, textHex, target = 4.5) {
  const baseRatio = contrastRatio(backgroundHex, textHex);
  if (baseRatio === null || baseRatio >= target) return textHex;
  const bgRgb = hexToRgb(backgroundHex);
  if (!bgRgb) return textHex;
  const bgLum = relativeLuminance(bgRgb);
  const darkText = '#020617';
  const lightText = '#F9FAFB';
  const darkRatio = contrastRatio(backgroundHex, darkText);
  const lightRatio = contrastRatio(backgroundHex, lightText);
  if (darkRatio !== null && darkRatio >= target && (!lightRatio || darkRatio >= lightRatio)) {
    return darkText;
  }
  if (lightRatio !== null && lightRatio >= target) {
    return lightText;
  }
  if (darkRatio !== null && lightRatio !== null) {
    return darkRatio > lightRatio ? darkText : lightText;
  }
  return textHex;
}

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
    sidebarRadius: 20,
    shadowProfile: 'dramatic'
  }
};

export const createBusinessTheme = (tokens = defaultPosThemeTokens) => {
  const { mode, brand: inputBrand, typography, shape } = tokens;

  const surfaceColor = inputBrand.surface || defaultPosThemeTokens.brand.surface;
  const surfaceVariantColor = inputBrand.surfaceVariant || surfaceColor;

  const onSurfaceBase = inputBrand.onSurface || defaultPosThemeTokens.brand.onSurface;
  const onSurfaceVariantBase = inputBrand.onSurfaceVariant || onSurfaceBase;

  const safeOnSurface = ensureReadableTextColor(surfaceColor, onSurfaceBase);
  const safeOnSurfaceVariant = ensureReadableTextColor(surfaceVariantColor, onSurfaceVariantBase);

  const brand = {
    ...inputBrand,
    onSurface: safeOnSurface,
    onSurfaceVariant: safeOnSurfaceVariant
  };

  const shadowProfile = shape.shadowProfile || 'dramatic';
  const shadowLevel =
    shadowProfile === 'flat'
      ? 0
      : shadowProfile === 'subtle'
      ? 1
      : shadowProfile === 'soft'
      ? 2
      : shadowProfile === 'strong'
      ? 3
      : 4;
  const baseShadowColor = mode === 'dark' ? '0,0,0' : '15,23,42';

  const paperShadow =
    shadowLevel === 0
      ? 'none'
      : shadowLevel === 1
      ? `0 6px 14px rgba(${baseShadowColor},0.25)`
      : shadowLevel === 2
      ? `0 12px 24px rgba(${baseShadowColor},0.35)`
      : shadowLevel === 3
      ? `0 16px 32px rgba(${baseShadowColor},0.45)`
      : `0 20px 40px rgba(${baseShadowColor},0.55)`;

  const cardShadow =
    shadowLevel === 0
      ? 'none'
      : shadowLevel === 1
      ? `0 6px 14px rgba(${baseShadowColor},0.3), 0 0 0 1px rgba(${baseShadowColor},0.25)`
      : shadowLevel === 2
      ? `0 10px 20px rgba(${baseShadowColor},0.4), 0 0 0 1px rgba(${baseShadowColor},0.35)`
      : shadowLevel === 3
      ? `0 14px 28px rgba(${baseShadowColor},0.5), 0 0 0 1px rgba(${baseShadowColor},0.45)`
      : `0 18px 36px rgba(${baseShadowColor},0.55), 0 0 0 1px rgba(${baseShadowColor},0.6)`;

  const cardHoverShadow =
    shadowLevel === 0
      ? `0 4px 10px rgba(${baseShadowColor},0.25)`
      : shadowLevel === 1
      ? `0 8px 18px rgba(${baseShadowColor},0.35), 0 0 0 1px rgba(${baseShadowColor},0.3)`
      : shadowLevel === 2
      ? `0 18px 40px rgba(${baseShadowColor},0.55), 0 0 0 1px rgba(${baseShadowColor},0.5)`
      : shadowLevel === 3
      ? `0 22px 48px rgba(${baseShadowColor},0.65), 0 0 0 1px rgba(${baseShadowColor},0.6)`
      : `0 26px 52px rgba(${baseShadowColor},0.75), 0 0 0 1px rgba(${baseShadowColor},0.7)`;

  const buttonShadow =
    shadowLevel === 0
      ? 'none'
      : shadowLevel === 1
      ? `0 4px 10px rgba(${baseShadowColor},0.35)`
      : shadowLevel === 2
      ? `0 6px 14px rgba(${baseShadowColor},0.45)`
      : shadowLevel === 3
      ? `0 8px 18px rgba(${baseShadowColor},0.5)`
      : `0 10px 24px rgba(${baseShadowColor},0.6)`;

  const buttonHoverShadow =
    shadowLevel === 0
      ? `0 2px 6px rgba(${baseShadowColor},0.25)`
      : shadowLevel === 1
      ? `0 6px 14px rgba(${baseShadowColor},0.35)`
      : shadowLevel === 2
      ? `0 10px 22px rgba(${baseShadowColor},0.55)`
      : shadowLevel === 3
      ? `0 14px 30px rgba(${baseShadowColor},0.7)`
      : `0 16px 32px rgba(${baseShadowColor},0.8)`;

  const primaryHover = darken(brand.primary, mode === 'dark' ? 0.2 : 0.1);
  const primaryActive = darken(brand.primary, mode === 'dark' ? 0.3 : 0.2);

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
            transition:
              'background-color 150ms ease-out, color 150ms ease-out, box-shadow 200ms ease-out, transform 120ms ease-out',
            '&:hover': {
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)'
            }
          },
          contained: {
            color: brand.onPrimary
          },
          containedPrimary: {
            backgroundColor: brand.primary,
            color: brand.onPrimary,
            boxShadow: buttonShadow,
            '&:hover': {
              backgroundColor: primaryHover,
              boxShadow: buttonHoverShadow
            },
            '&:active': {
              backgroundColor: primaryActive,
              boxShadow: shadowProfile === 'flat' ? 'none' : buttonShadow
            }
          },
          outlined: {
            borderColor: brand.outline,
            color: brand.onSurface,
            '&:hover': {
              borderColor: brand.primary,
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }
          },
          outlinedPrimary: {
            borderColor: brand.primary,
            color: brand.primary,
            '&:hover': {
              borderColor: brand.primary,
              backgroundColor: mode === 'dark' ? 'rgba(249,115,6,0.15)' : 'rgba(249,115,6,0.1)'
            }
          },
          text: {
            color: brand.onSurface,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
            }
          },
          textPrimary: {
            color: brand.primary,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(249,115,6,0.15)' : 'rgba(249,115,6,0.1)'
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
            boxShadow: paperShadow
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: shape.cardRadius,
            backgroundColor: brand.surfaceVariant,
            border: `1px solid ${brand.outline}`,
            boxShadow: cardShadow,
            '&:hover': {
              boxShadow: cardHoverShadow,
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
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            color: brand.onSurface,
            '&.MuiChip-filled': {
              backgroundColor: brand.primary,
              color: brand.onPrimary
            },
            '&.MuiChip-outlined': {
              backgroundColor: 'transparent',
              borderColor: brand.outline,
              color: brand.onSurface
            },
            '&.MuiChip-colorPrimary': {
              backgroundColor: brand.primary,
              color: brand.onPrimary
            },
            '& .MuiChip-icon': {
              color: 'inherit'
            },
            '& .MuiChip-deleteIcon': {
              color: 'inherit',
              opacity: 0.7,
              '&:hover': {
                opacity: 1
              }
            }
          }
        }
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.baseRadius,
            borderColor: brand.outline,
            color: brand.onSurface,
            backgroundColor: 'transparent',
            textTransform: 'none',
            fontWeight: typography.bodyWeight,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
            },
            '&.Mui-selected': {
              backgroundColor: brand.primary,
              color: brand.onPrimary,
              borderColor: brand.primary,
              '&:hover': {
                backgroundColor: primaryHover
              }
            },
            '&.Mui-disabled': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
            }
          }
        }
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: shape.baseRadius,
            '& .MuiToggleButton-root': {
              border: 'none',
              '&:not(:first-of-type)': {
                borderLeft: `1px solid ${brand.outline}`
              }
            }
          },
          grouped: {
            '&:not(:first-of-type)': {
              borderRadius: shape.baseRadius,
              marginLeft: 0
            },
            '&:first-of-type': {
              borderRadius: shape.baseRadius
            }
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: brand.onSurface,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
            },
            '&.Mui-disabled': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
            }
          },
          colorPrimary: {
            color: brand.primary,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(249,115,6,0.15)' : 'rgba(249,115,6,0.1)'
            }
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            backgroundColor: brand.surface,
            border: `1px solid ${brand.outline}`,
            boxShadow: paperShadow
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
              backgroundColor: mode === 'dark' ? '#020617' : '#ffffff',
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
            color: '#f9fafb',
            fontSize: '0.75rem'
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            color: brand.onSurface,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: brand.outline
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: brand.primary
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brand.primary
            }
          },
          icon: {
            color: brand.onSurface
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: brand.surfaceVariant,
            color: brand.onSurface,
            border: `1px solid ${brand.outline}`
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: brand.onSurface,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'dark' ? 'rgba(249,115,6,0.2)' : 'rgba(249,115,6,0.15)',
              color: brand.onSurface,
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(249,115,6,0.3)' : 'rgba(249,115,6,0.25)'
              }
            }
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            color: brand.onSurface,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'dark' ? 'rgba(249,115,6,0.2)' : 'rgba(249,115,6,0.15)',
              color: brand.onSurface,
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(249,115,6,0.3)' : 'rgba(249,115,6,0.25)'
              }
            }
          }
        }
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: brand.onSurface
          },
          secondary: {
            color: brand.onSurfaceVariant
          }
        }
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: brand.onSurface
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: brand.onSurfaceVariant,
            textTransform: 'none',
            fontWeight: typography.bodyWeight,
            '&.Mui-selected': {
              color: brand.primary
            }
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: brand.primary
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: brand.onSurface
          },
          input: {
            color: brand.onSurface,
            '&::placeholder': {
              color: brand.onSurfaceVariant,
              opacity: 0.7
            }
          }
        }
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            color: brand.onSurfaceVariant,
            '&.Mui-focused': {
              color: brand.primary
            }
          }
        }
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: brand.onSurfaceVariant
          }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase': {
              color: brand.onSurfaceVariant,
              '&.Mui-checked': {
                color: brand.primary,
                '& + .MuiSwitch-track': {
                  backgroundColor: brand.primary,
                  opacity: 0.5
                }
              }
            },
            '& .MuiSwitch-track': {
              backgroundColor: brand.outline
            }
          }
        }
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: brand.onSurfaceVariant,
            '&.Mui-checked': {
              color: brand.primary
            }
          }
        }
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            color: brand.onSurfaceVariant,
            '&.Mui-checked': {
              color: brand.primary
            }
          }
        }
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: brand.primary
          },
          thumb: {
            backgroundColor: brand.primary
          },
          track: {
            backgroundColor: brand.primary
          },
          rail: {
            backgroundColor: brand.outline
          },
          valueLabel: {
            backgroundColor: brand.primary,
            color: brand.onPrimary
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: shape.baseRadius
          },
          standardSuccess: {
            backgroundColor: mode === 'dark' ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
            color: brand.success
          },
          standardError: {
            backgroundColor: mode === 'dark' ? 'rgba(249,115,115,0.15)' : 'rgba(249,115,115,0.1)',
            color: brand.error
          },
          standardWarning: {
            backgroundColor: mode === 'dark' ? 'rgba(250,204,21,0.15)' : 'rgba(250,204,21,0.1)',
            color: brand.warning
          },
          standardInfo: {
            backgroundColor: mode === 'dark' ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.1)',
            color: brand.info
          }
        }
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            backgroundColor: brand.primary,
            color: brand.onPrimary
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: brand.outline,
            color: brand.onSurface
          },
          head: {
            color: brand.onSurface,
            fontWeight: typography.headingWeight
          }
        }
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
            }
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: brand.outline
          }
        }
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        }
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: brand.surfaceVariant,
            color: brand.onSurface,
            '&:before': {
              backgroundColor: brand.outline
            }
          }
        }
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            color: brand.onSurface
          },
          expandIconWrapper: {
            color: brand.onSurface
          }
        }
      },
      MuiBreadcrumbs: {
        styleOverrides: {
          root: {
            color: brand.onSurfaceVariant
          },
          separator: {
            color: brand.onSurfaceVariant
          }
        }
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: brand.primary,
            '&:hover': {
              color: primaryHover
            }
          }
        }
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            '& .MuiPaginationItem-root': {
              color: brand.onSurface,
              borderColor: brand.outline,
              '&.Mui-selected': {
                backgroundColor: brand.primary,
                color: brand.onPrimary,
                '&:hover': {
                  backgroundColor: primaryHover
                }
              },
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
              }
            }
          }
        }
      },
      MuiStepLabel: {
        styleOverrides: {
          label: {
            color: brand.onSurfaceVariant,
            '&.Mui-active': {
              color: brand.onSurface
            },
            '&.Mui-completed': {
              color: brand.onSurface
            }
          }
        }
      },
      MuiStepIcon: {
        styleOverrides: {
          root: {
            color: brand.outline,
            '&.Mui-active': {
              color: brand.primary
            },
            '&.Mui-completed': {
              color: brand.success
            }
          },
          text: {
            fill: brand.onPrimary
          }
        }
      }
    }
  });
};

// Convenience default theme instance used by App.jsx
export const material3PosTheme = createBusinessTheme();
