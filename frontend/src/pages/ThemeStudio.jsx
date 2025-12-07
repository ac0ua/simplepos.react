import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  MenuItem,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import {
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  ColorLens as ColorLensIcon,
  BlurOn as BlurOnIcon,
  Texture as TextureIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { API_URL, IS_PHP_BACKEND } from '../config/api';
import { createBusinessTheme, defaultPosThemeTokens } from '../theme';
import ThemeContrastTester from '../components/ThemeContrastTester';

// --- Color Logic & Constants ---

const HARMONIES = {
  analogous: { label: 'Analogous', offsets: [0, -30, 30], desc: 'Neighboring colors. Serene.' },
  monochromatic: { label: 'Monochromatic', offsets: [0, 0, 0], desc: 'Same hue, varying light/sat.' },
  triad: { label: 'Triad', offsets: [0, 120, 240], desc: 'Balanced high contrast.' },
  complementary: { label: 'Complementary', offsets: [0, 180], desc: 'Maximum contrast.' },
  splitComplementary: { label: 'Split', offsets: [0, 150, 210], desc: 'Vibrant but less harsh.' },
  square: { label: 'Square', offsets: [0, 90, 180, 270], desc: 'Dynamic multicolor.' },
  compound: { label: 'Compound', offsets: [0, 60, 180, 240], desc: 'Rich and complex.' },
  shades: { label: 'Shades', offsets: [0, 0, 0, 0, 0], desc: 'Linear gradient.' },
};

const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const normalizeAngle = (angle) => {
  let newAngle = angle % 360;
  if (newAngle < 0) newAngle += 360;
  return newAngle;
};

// Accessibility contrast helpers
const parseHexToRgb = (hex) => {
  if (!hex) return null;
  const match = hex.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  let h = match[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const int = parseInt(h, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const getLuminance = ({ r, g, b }) => {
  const srgb = [r, g, b].map(v => v / 255);
  const lin = srgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};

const getContrastRatio = (fg, bg) => {
  const L1 = getLuminance(fg);
  const L2 = getLuminance(bg);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
};

const getPalette = (baseHue, saturation, lightness, harmonyMode) => {
  const currentHarmony = HARMONIES[harmonyMode];
  
  if (harmonyMode === 'monochromatic') {
    return [
      { label: 'Base', h: baseHue, s: saturation, l: lightness },
      { label: 'Light', h: baseHue, s: Math.max(0, saturation - 30), l: Math.min(95, lightness + 35) },
      { label: 'Dark', h: baseHue, s: Math.min(100, saturation + 20), l: Math.max(10, lightness - 30) },
      { label: 'Soft', h: baseHue, s: Math.max(0, saturation - 10), l: Math.min(90, lightness + 20) },
    ];
  }

  if (harmonyMode === 'shades') {
    return [
      { label: 'Lightest', h: baseHue, s: saturation, l: 90 },
      { label: 'Light', h: baseHue, s: saturation, l: 70 },
      { label: 'Base', h: baseHue, s: saturation, l: 50 },
      { label: 'Dark', h: baseHue, s: saturation, l: 30 },
      { label: 'Darkest', h: baseHue, s: saturation, l: 10 },
    ];
  }

  return currentHarmony.offsets.map((offset, index) => ({
    label: index === 0 ? 'Base' : `Color ${index + 1}`,
    h: normalizeAngle(baseHue + offset),
    s: saturation,
    l: lightness
  }));
};

// Editor Theme - Forced Light/Neutral to avoid "Brown" background issue
const editorTokens = {
  ...defaultPosThemeTokens,
  mode: 'light',
  brand: {
    ...defaultPosThemeTokens.brand,
    primary: '#2563eb',
    surface: '#f8fafc',
    surfaceVariant: '#ffffff', // Force white papers
    onSurface: '#0f172a',
    onSurfaceVariant: '#334155',
    outline: '#e2e8f0'
  },
  shape: {
    ...defaultPosThemeTokens.shape,
    cardRadius: 16
  }
};

const neutralTheme = createBusinessTheme(editorTokens);

// --- Device Preview Selector ---
const DevicePreviewSelector = React.memo(function DevicePreviewSelector({ device, setDevice }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2, p: 0.5 }}>
      {[
        { id: 'desktop', label: 'Desktop', width: '100%' },
        { id: 'tablet', label: 'Tablet', width: 768 },
        { id: 'mobile', label: 'Mobile', width: 375 }
      ].map((d) => (
        <Box
          key={d.id}
          onClick={() => setDevice(d.id)}
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 1.5,
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            bgcolor: device === d.id ? 'primary.main' : 'transparent',
            color: device === d.id ? 'primary.contrastText' : 'text.secondary',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: device === d.id ? 'primary.main' : 'rgba(0,0,0,0.08)'
            }
          }}
        >
          {d.label}
        </Box>
      ))}
    </Box>
  );
});

// --- Theme Preview Component ---
const ThemePreview = React.memo(function ThemePreview({ previewTheme, backgroundMode, backgroundImage, glassOpacity, previewDevice = 'desktop' }) {
  // Calculate background styles for the "Live Preview" container
  const getBackgroundStyles = () => {
    const baseStyles = {
      borderRadius: 3,
      p: { xs: 1, sm: 2 },
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      minHeight: { xs: 250, sm: 300, md: 350 }
    };

    if (backgroundMode === 'image' && backgroundImage) {
      return {
        ...baseStyles,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }

    if (backgroundMode === 'gradient') {
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${previewTheme.palette.primary.main} 0%, ${previewTheme.palette.background.default} 100%)`
      };
    }

    return {
      ...baseStyles,
      bgcolor: 'background.default'
    };
  };

  const getGlassStyles = () => {
    if (backgroundMode === 'glass') {
      return {
        backdropFilter: 'blur(12px)',
        backgroundColor: `rgba(255, 255, 255, ${glassOpacity || 0.7})`,
        border: '1px solid rgba(255, 255, 255, 0.3)'
      };
    }
    if (backgroundMode === 'image') {
      return {
        backgroundColor: 'rgba(15, 23, 42, 0.06)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(15, 23, 42, 0.12)'
      };
    }
    return {
      bgcolor: 'background.paper'
    };
  };

  // Determine if we should show mobile/tablet layout
  const isMobilePreview = previewDevice === 'mobile';
  const isTabletPreview = previewDevice === 'tablet';
  const isCompact = isMobilePreview || isTabletPreview;

  // Get device frame width
  const getDeviceWidth = () => {
    if (isMobilePreview) return 375;
    if (isTabletPreview) return 768;
    return '100%';
  };

  return (
    <MuiThemeProvider theme={previewTheme}>
      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          borderRadius: 3,
          bgcolor: '#f1f5f9',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid',
          borderColor: '#e2e8f0',
          height: '100%',
          overflow: 'auto'
        }}
      >

        {/* Device Frame Container */}
        <Box
          sx={{
            width: getDeviceWidth(),
            maxWidth: '100%',
            mx: 'auto',
            transition: 'width 0.3s ease',
            ...(isCompact && {
              border: '8px solid #1f2937',
              borderRadius: 4,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            })
          }}
        >
          {/* Simulated App Container */}
          <Box sx={getBackgroundStyles()}>
            {/* Glass/Paper Layer */}
            <Box
              sx={{
                borderRadius: 3,
                p: { xs: 1, sm: 2 },
                ...getGlassStyles(),
                color: 'text.primary',
                boxShadow: 3,
                height: '100%',
                transition: 'all 0.3s'
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Box>
                  <Typography variant={isMobilePreview ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    My Business
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Order #K-2042
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 999,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  Open
                </Box>
              </Box>

              {/* Sidebar Preview (for desktop/tablet) */}
              {!isMobilePreview && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 2,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      sx={(theme) => ({
                        bgcolor: 'action.selected',
                        color: theme.palette.getContrastText(theme.palette.action.selected || '#e2e8f0'),
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'action.hover' }
                      })}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={(theme) => ({
                        bgcolor: 'background.paper',
                        color: theme.palette.getContrastText(theme.palette.background.paper),
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider'
                      })}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'success.main',
                        color: 'common.white',
                        borderRadius: 2
                      }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
                    Cashier Actions
                  </Typography>
                </Box>
              )}

              {/* Categories - Horizontal scroll on mobile */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 1, flexWrap: isMobilePreview ? 'nowrap' : 'wrap' }}>
                {['All', 'Burgers', 'Drinks', 'Sides'].map((cat, i) => (
                  <Box
                    key={cat}
                    sx={{
                      px: { xs: 1, sm: 1.5 },
                      py: 0.75,
                      borderRadius: 2,
                      bgcolor: i === 0 ? 'primary.main' : 'action.hover',
                      color: i === 0 ? 'primary.contrastText' : 'text.primary',
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {cat}
                  </Box>
                ))}
              </Box>

              <Grid container spacing={isMobilePreview ? 1 : 2}>
                {/* Products Grid */}
                <Grid item xs={12} md={isMobilePreview ? 12 : 7}>
                  <Grid container spacing={isMobilePreview ? 1 : 1.5}>
                    {[
                      { name: 'Classic Burger', price: '$12.50' },
                      { name: 'Cheese Fries', price: '$5.25' }
                    ].map((item) => (
                      <Grid item xs={6} key={item.name}>
                        <Box
                          sx={{
                            borderRadius: 2,
                            p: { xs: 1, sm: 1.5 },
                            bgcolor: backgroundMode === 'image' ? 'rgba(255, 255, 255, 0.82)' : 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            boxShadow: 1,
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 3,
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          {/* Product Image Placeholder */}
                          <Box
                            sx={{
                              width: '100%',
                              height: { xs: 40, sm: 60 },
                              bgcolor: 'action.hover',
                              borderRadius: 1,
                              mb: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">IMG</Typography>
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                            {item.name}
                          </Typography>
                          <Chip
                            label={item.price}
                            size="small"
                            sx={{
                              bgcolor: 'secondary.main',
                              color: 'secondary.contrastText',
                              fontWeight: 700,
                              height: { xs: 18, sm: 20 },
                              fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {/* Cart - Shows below on mobile, side on desktop */}
                <Grid item xs={12} md={isMobilePreview ? 12 : 5}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: { xs: 1.5, sm: 2 },
                      bgcolor: backgroundMode === 'image' ? 'rgba(255, 255, 255, 0.9)' : 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      ...(isMobilePreview && {
                        position: 'sticky',
                        bottom: 0,
                        mt: 1
                      })
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Current Order</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Burger x1</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>$12.50</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Fries x1</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>$5.25</Typography>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      size={isMobilePreview ? 'medium' : 'large'}
                      sx={{ borderRadius: 999 }}
                    >
                      Pay $17.75
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {/* Mobile Bottom Nav Preview */}
              {isMobilePreview && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    mt: 2,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {['Home', 'Cart', 'Orders', 'Menu'].map((item, i) => (
                    <Box
                      key={item}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: i === 0 ? 'primary.main' : 'text.secondary',
                        fontSize: '0.65rem'
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: i === 0 ? 'primary.main' : 'action.hover',
                          mb: 0.25
                        }}
                      />
                      {item}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </MuiThemeProvider>
  );
});

// --- Main Page Component ---
function ThemeStudioPageInner() {
  const { storeGuid, label } = useParams();
  const navigate = useNavigate();
  const setThemeConfig = useStore((state) => state.setThemeConfig);
  const [saving, setSaving] = useState(false);

  // --- Theme State ---
  const [themeName, setThemeName] = useState('Custom Theme');
  const [mode, setMode] = useState('dark');
  const [autoMode, setAutoMode] = useState(true);
  
  // Colors
  const [primaryColor, setPrimaryColor] = useState('#f97306');
  const [surfaceColor, setSurfaceColor] = useState('#1f140b');
  const [sidebarColor, setSidebarColor] = useState('#28180d');
  const [accentColor, setAccentColor] = useState('#ffb347');
  const [textColor, setTextColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#f8f7f5');
  const [headingFont, setHeadingFont] = useState('Space Grotesk, sans-serif');
  const [bodyFont, setBodyFont] = useState('Space Grotesk, sans-serif');
  const [headingScale, setHeadingScale] = useState(1.3);
  const [bodySize, setBodySize] = useState(1);
  
  // Advanced
  const [borderRadius, setBorderRadius] = useState(16);
  const [backgroundMode, setBackgroundMode] = useState('solid'); // solid, gradient, image, glass
  const [backgroundImage, setBackgroundImage] = useState('');
  const [glassOpacity, setGlassOpacity] = useState(0.8);
  const [shadowProfile, setShadowProfile] = useState('dramatic'); // flat, soft, dramatic
  const [settingsTab, setSettingsTab] = useState(0);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop, tablet, mobile

  // Harmony Studio State
  const [baseHue, setBaseHue] = useState(30);
  const [saturation, setSaturation] = useState(80);
  const [lightness, setLightness] = useState(50);
  const [harmonyMode, setHarmonyMode] = useState('shades');
  const [isDragging, setIsDragging] = useState(false);
  
  const wheelRef = useRef(null);

  const palette = useMemo(
    () => getPalette(baseHue, saturation, lightness, harmonyMode),
    [baseHue, saturation, lightness, harmonyMode]
  );

  const previewTokens = useMemo(
    () => ({
      ...defaultPosThemeTokens,
      mode,
      brand: {
        ...defaultPosThemeTokens.brand,
        primary: primaryColor,
        surface: backgroundColor,
        surfaceVariant: surfaceColor,
        sidebar: sidebarColor,
        accent: accentColor,
        onSurface: textColor
      },
      shape: {
        ...defaultPosThemeTokens.shape,
        baseRadius: borderRadius,
        cardRadius: borderRadius + 4,
        buttonRadius: borderRadius === 32 ? 999 : borderRadius,
        shadowProfile
      },
      typography: {
        ...defaultPosThemeTokens.typography,
        fontFamily: bodyFont,
        headingFontFamily: headingFont,
        headingScale,
        bodyScale: bodySize
      },
      // Pass extra tokens for saving/logic
      tokens: {
        backgroundMode,
        backgroundImage,
        glassOpacity,
        headingFont,
        bodyFont,
        headingScale,
        bodySize,
        textColor,
        backgroundColor,
        autoMode,
        shadowProfile
      }
    }),
    [mode, autoMode, primaryColor, surfaceColor, sidebarColor, accentColor, textColor, backgroundColor, borderRadius, backgroundMode, backgroundImage, glassOpacity, headingFont, bodyFont, headingScale, bodySize, shadowProfile]
  );

  const previewTheme = useMemo(() => createBusinessTheme(previewTokens), [previewTokens]);

  const shadowSliderValue = (() => {
    const profiles = ['flat', 'minimal', 'subtle', 'light', 'soft', 'medium', 'strong', 'bold', 'dramatic', 'max'];
    const idx = profiles.indexOf(shadowProfile);
    return idx >= 0 ? idx : 4; // default to 'soft' (index 4)
  })();

  // --- Load Initial Theme ---
  useEffect(() => {
    if (!IS_PHP_BACKEND) return;
    const loadTheme = async () => {
      try {
        const res = await fetch(`${API_URL}/stores/theme.php?storeGuid=${storeGuid}&label=${label}`);
        const data = await res.json();
        if (res.ok && data.theme) {
          const t = data.theme;
          const toks = t.tokens || {};
          setThemeName(t.themeName || 'Custom Theme');
          setMode(t.mode || 'dark');
          setPrimaryColor(t.primaryColor || '#f97306');
          setSurfaceColor(t.surfaceColor || '#1f140b');
          setSidebarColor(t.sidebarColor || '#28180d');
          
          if (toks.accentColor) setAccentColor(toks.accentColor);
          if (toks.textColor) setTextColor(toks.textColor);
          if (toks.backgroundColor) setBackgroundColor(toks.backgroundColor);
          else if (t.surfaceColor) setBackgroundColor(t.surfaceColor);
          if (toks.borderRadius) setBorderRadius(Number(toks.borderRadius));
          if (toks.backgroundMode) setBackgroundMode(toks.backgroundMode);
          if (toks.backgroundImage) setBackgroundImage(toks.backgroundImage);
          if (toks.glassOpacity) setGlassOpacity(Number(toks.glassOpacity));
          if (toks.headingFont) setHeadingFont(toks.headingFont);
          if (toks.bodyFont) setBodyFont(toks.bodyFont);
          if (typeof toks.headingScale === 'number') setHeadingScale(toks.headingScale);
          if (typeof toks.bodySize === 'number') setBodySize(toks.bodySize);
          if (typeof toks.autoMode === 'boolean') setAutoMode(toks.autoMode);
          if (typeof toks.shadowProfile === 'string') setShadowProfile(toks.shadowProfile);
        }
      } catch (e) { console.error(e); }
    };
    loadTheme();
  }, [storeGuid, label]);

  // --- Handlers ---
  const handleWheel = (e) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left - rect.width / 2;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    setBaseHue(normalizeAngle(angle + 90));
  };

  useEffect(() => {
    const cvs = wheelRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width, h = cvs.height, cx = w/2, cy = h/2, r = w/2 - 10;
    
    ctx.clearRect(0,0,w,h);
    for(let i=0; i<360; i++){
      ctx.beginPath();
      ctx.arc(cx, cy, r, (i-90)*Math.PI/180, (i+1.5-90)*Math.PI/180);
      ctx.lineTo(cx, cy);
      ctx.fillStyle = `hsl(${i}, ${saturation}%, ${lightness}%)`;
      ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx,cy, r*0.5, 0, 2*Math.PI); ctx.fillStyle='white'; ctx.fill();
    
    palette.forEach((c, i) => {
      const rad = (c.h-90)*Math.PI/180;
      const px = cx + Math.cos(rad)*(r*0.75), py = cy + Math.sin(rad)*(r*0.75);
      ctx.beginPath(); ctx.arc(px,py, 8, 0, 2*Math.PI);
      ctx.fillStyle = hslToHex(c.h, c.s, c.l); ctx.fill();
      ctx.lineWidth=2; ctx.strokeStyle= i===0?'#000':'#fff'; ctx.stroke();
    });
  }, [baseHue, saturation, lightness, palette]);

  const applyPalette = () => {
    if(!palette.length) return;
    const [c0, c1, c2] = palette;
    setPrimaryColor(hslToHex(c0.h, c0.s, c0.l));
    setAccentColor(hslToHex(c1.h, c1.s, c1.l));
    
    let nextMode = mode;
    if (autoMode) {
      const bgLightness = c2.l;
      nextMode = bgLightness < 55 ? 'dark' : 'light';
      setMode(nextMode);
    }

    if (nextMode === 'dark') {
      const bgL = 10;
      const bg = hslToHex(c2.h, 15, bgL);
      const section = hslToHex(c2.h, 20, Math.min(20, bgL + 8));
      setBackgroundColor(bg);
      setSurfaceColor(section);
      setSidebarColor(hslToHex(c2.h, 25, Math.max(4, bgL - 4)));
      setTextColor('#ffffff');
    } else {
      const bgL = 96;
      const bg = hslToHex(c2.h, 10, bgL);
      const section = hslToHex(c2.h, 8, bgL - 6);
      setBackgroundColor(bg);
      setSurfaceColor(section);
      setSidebarColor(hslToHex(c2.h, 5, 100));
      setTextColor('#0f172a');
    }
    toast.success('Palette Applied!');
  };

  const handleSave = async () => {
    if (!IS_PHP_BACKEND) return toast.error('PHP Backend Required');
    setSaving(true);
    try {
      const payload = {
        storeGuid, label, themeName, mode,
        primaryColor, surfaceColor, sidebarColor, isActive: true,
        tokens: {
          accentColor, textColor, borderRadius,
          backgroundMode, backgroundImage, glassOpacity,
          headingFont, bodyFont, headingScale, bodySize,
          backgroundColor, autoMode, shadowProfile
        }
      };
      const res = await fetch(`${API_URL}/stores/theme.php`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        setThemeConfig((await res.json()).theme);
        toast.success('Theme Saved');
      }
    } catch(e) { toast.error('Save Failed'); }
    setSaving(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ColorLensIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="800">Theme Studio</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate(`/${storeGuid}/${label}/order.html`)}>Exit</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Theme'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* PREVIEW SECTION - STICKY TOP */}
        <Grid item xs={12} sx={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            {/* Live Preview Header with Device Selector */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              p: { xs: 1, sm: 1.5 }, 
              bgcolor: '#f8fafc',
              borderBottom: '1px solid',
              borderColor: '#e2e8f0',
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600 }}>
                  Live Preview
                </Typography>
                <Chip label="Live" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
              </Box>
              <DevicePreviewSelector device={previewDevice} setDevice={setPreviewDevice} />
            </Box>
            <ThemePreview 
              previewTheme={previewTheme} 
              backgroundMode={backgroundMode}
              backgroundImage={backgroundImage}
              glassOpacity={glassOpacity}
              previewDevice={previewDevice}
            />
          </Paper>
        </Grid>

        {/* CONTROLS SECTION - SCROLLABLE BELOW */}
        <Grid item xs={12} container spacing={3}>
          {/* Theme Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Theme Settings</Typography>
              
              {/* Mobile Horizontal Tabs */}
              <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                <Tabs
                  variant="scrollable"
                  scrollButtons="auto"
                  value={settingsTab}
                  onChange={(_, v) => setSettingsTab(v)}
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                      minWidth: 'auto',
                      px: 1.5,
                      py: 1,
                      fontSize: '0.75rem'
                    }
                  }}
                >
                  <Tab label="Global" disableRipple />
                  <Tab label="Background" disableRipple />
                  <Tab label="Colors" disableRipple />
                  <Tab label="Typography" disableRipple />
                  <Tab label="Shadows" disableRipple />
                  <Tab label="A11y" disableRipple />
                </Tabs>
              </Box>
              
              <Grid container spacing={2}>
                {/* Desktop Vertical Tabs */}
                <Grid item xs={12} md={4} lg={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={settingsTab}
                    onChange={(_, v) => setSettingsTab(v)}
                    sx={{ borderRight: 1, borderColor: 'divider', minHeight: 200 }}
                    TabIndicatorProps={{ sx: { left: 0 } }}
                  >
                    <Tab label="Global" disableRipple />
                    <Tab label="Background" disableRipple />
                    <Tab label="Colors" disableRipple />
                    <Tab label="Typography" disableRipple />
                    <Tab label="Shadows" disableRipple />
                    <Tab label="Accessibility" disableRipple />
                  </Tabs>
                </Grid>
                <Grid item xs={12} md={8} lg={9}>
                  <Box sx={{ display: settingsTab === 0 ? 'block' : 'none' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Theme Name" size="small" value={themeName} onChange={e=>setThemeName(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_,v)=>v&&setMode(v)} fullWidth disabled={autoMode}>
                          <ToggleButton value="light">Light</ToggleButton>
                          <ToggleButton value="dark">Dark</ToggleButton>
                        </ToggleButtonGroup>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption">Corner Radius: {borderRadius}px</Typography>
                        <Slider value={borderRadius} onChange={(_,v)=>setBorderRadius(v)} min={0} max={32} step={4} marks />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={autoMode}
                              onChange={(e) => setAutoMode(e.target.checked)}
                            />
                          }
                          label="Auto choose Light/Dark from color wheel"
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ display: settingsTab === 1 ? 'block' : 'none', mt: { xs: 2, md: 0 } }}>
                    <ToggleButtonGroup size="small" exclusive value={backgroundMode} onChange={(_,v)=>v&&setBackgroundMode(v)} fullWidth sx={{ mb: 2 }}>
                      <ToggleButton value="solid"><ColorLensIcon sx={{mr:1}}/> Solid</ToggleButton>
                      <ToggleButton value="gradient"><TextureIcon sx={{mr:1}}/> Grad</ToggleButton>
                      <ToggleButton value="image"><ImageIcon sx={{mr:1}}/> Image</ToggleButton>
                      <ToggleButton value="glass"><BlurOnIcon sx={{mr:1}}/> Glass</ToggleButton>
                    </ToggleButtonGroup>
                    {backgroundMode === 'image' && (
                      <TextField fullWidth label="Image URL" size="small" value={backgroundImage} onChange={e=>setBackgroundImage(e.target.value)} placeholder="https://..." />
                    )}
                    {backgroundMode === 'glass' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption">Glass Opacity</Typography>
                        <Slider value={glassOpacity} onChange={(_,v)=>setGlassOpacity(v)} min={0.1} max={1} step={0.1} />
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: settingsTab === 2 ? 'block' : 'none', mt: { xs: 2, md: 0 } }}>
                    {/* Compact color inputs - all on one row */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {[
                        { label: 'Primary', value: primaryColor, onChange: setPrimaryColor },
                        { label: 'Section', value: surfaceColor, onChange: setSurfaceColor },
                        { label: 'Background', value: backgroundColor, onChange: setBackgroundColor },
                        { label: 'Text', value: textColor, onChange: setTextColor },
                        { label: 'Accent', value: accentColor, onChange: setAccentColor },
                        { label: 'Sidebar', value: sidebarColor, onChange: setSidebarColor }
                      ].map((color) => (
                        <TextField
                          key={color.label}
                          label={color.label}
                          size="small"
                          value={color.value}
                          onChange={e => color.onChange(e.target.value)}
                          sx={{ flex: '1 1 140px', minWidth: 120, maxWidth: 180 }}
                          InputProps={{ 
                            startAdornment: <Box sx={{width:14,height:14,bgcolor:color.value,mr:0.5,borderRadius:0.5,border:'1px solid rgba(0,0,0,0.1)'}}/> 
                          }}
                        />
                      ))}
                    </Box>

                    <Box sx={{ mt: 1, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2 }}>Color Harmony Generator</Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <canvas
                              ref={wheelRef}
                              width={220}
                              height={220}
                              style={{ borderRadius: '50%', cursor: 'pointer' }}
                              onMouseDown={() => setIsDragging(true)}
                              onMouseMove={(e) => isDragging && handleWheel(e)}
                              onMouseUp={() => setIsDragging(false)}
                              onTouchStart={() => setIsDragging(true)}
                              onTouchMove={(e) => isDragging && handleWheel(e)}
                              onTouchEnd={() => setIsDragging(false)}
                            />
                            <Typography variant="body2" sx={{ mt: 1 }}>{Math.round(baseHue)}°</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={7}>
                          <TextField
                            select
                            fullWidth
                            label="Harmony Rule"
                            value={harmonyMode}
                            onChange={e=>setHarmonyMode(e.target.value)}
                            size="small"
                          >
                            {Object.entries(HARMONIES).map(([k,v]) => (
                              <MenuItem key={k} value={k}>{v.label}</MenuItem>
                            ))}
                          </TextField>

                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption">Saturation & Lightness</Typography>
                            <Slider value={saturation} onChange={(_,v)=>setSaturation(v)} min={0} max={100} />
                            <Slider value={lightness} onChange={(_,v)=>setLightness(v)} min={10} max={90} />
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
                            {palette.map((c,i) => (
                              <Tooltip key={i} title={c.label}>
                                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: hslToHex(c.h,c.s,c.l), border: '2px solid white', boxShadow: 1 }} />
                              </Tooltip>
                            ))}
                            {/* Light/Dark Toggle */}
                            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2, p: 0.5 }}>
                              {['light', 'dark'].map((m) => (
                                <Box
                                  key={m}
                                  onClick={() => !autoMode && setMode(m)}
                                  sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1.5,
                                    cursor: autoMode ? 'not-allowed' : 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    bgcolor: mode === m ? 'primary.main' : 'transparent',
                                    color: mode === m ? 'primary.contrastText' : 'text.secondary',
                                    opacity: autoMode ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      bgcolor: autoMode ? undefined : (mode === m ? 'primary.main' : 'rgba(0,0,0,0.08)')
                                    }
                                  }}
                                >
                                  {m === 'light' ? 'L' : 'D'}
                                </Box>
                              ))}
                            </Box>
                          </Box>

                          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={applyPalette}>
                            Apply Generated Palette
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  <Box sx={{ display: settingsTab === 3 ? 'block' : 'none', mt: { xs: 2, md: 0 } }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Headline font"
                          size="small"
                          value={headingFont}
                          onChange={e => setHeadingFont(e.target.value)}
                        >
                          <MenuItem value="Space Grotesk, sans-serif">Space Grotesk</MenuItem>
                          <MenuItem value="Bebas Neue, cursive">Bebas Neue</MenuItem>
                          <MenuItem value="Playfair Display, serif">Playfair Display</MenuItem>
                          <MenuItem value="Fredoka One, cursive">Fredoka One</MenuItem>
                          <MenuItem value="Open Sans, sans-serif">Open Sans</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Body font"
                          size="small"
                          value={bodyFont}
                          onChange={e => setBodyFont(e.target.value)}
                        >
                          <MenuItem value="Space Grotesk, sans-serif">Space Grotesk</MenuItem>
                          <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                          <MenuItem value="Lato, sans-serif">Lato</MenuItem>
                          <MenuItem value="Merriweather, serif">Merriweather</MenuItem>
                          <MenuItem value="Comic Neue, cursive">Comic Neue</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption">Heading scale</Typography>
                        <Slider
                          size="small"
                          min={1}
                          max={1.6}
                          step={0.1}
                          value={headingScale}
                          onChange={(_, v) => typeof v === 'number' && setHeadingScale(v)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption">Body size</Typography>
                        <Slider
                          size="small"
                          min={0.9}
                          max={1.25}
                          step={0.05}
                          value={bodySize}
                          onChange={(_, v) => typeof v === 'number' && setBodySize(v)}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ display: settingsTab === 4 ? 'block' : 'none', mt: { xs: 2, md: 0 } }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                      Control how strong the shadows feel across cards and panels.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      Shadow intensity: {['None', 'Minimal', 'Subtle', 'Light', 'Soft', 'Medium', 'Strong', 'Bold', 'Dramatic', 'Max'][shadowSliderValue] || 'Soft'}
                    </Typography>
                    <Slider
                      size="small"
                      min={0}
                      max={9}
                      step={1}
                      value={shadowSliderValue}
                      onChange={(_, v) => {
                        if (typeof v === 'number') {
                          const profiles = ['flat', 'minimal', 'subtle', 'light', 'soft', 'medium', 'strong', 'bold', 'dramatic', 'max'];
                          setShadowProfile(profiles[v] || 'soft');
                        }
                      }}
                      marks={[
                        { value: 0, label: 'None' },
                        { value: 2, label: 'Subtle' },
                        { value: 4, label: 'Soft' },
                        { value: 6, label: 'Strong' },
                        { value: 9, label: 'Max' }
                      ]}
                    />
                  </Box>

                  <Box sx={{ display: settingsTab === 5 ? 'block' : 'none', mt: { xs: 2, md: 0 } }}>
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 2, border: '1px solid', borderColor: 'info.main' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'info.dark' }}>
                        Accessibility Auto-Adjust
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        If your theme colors don't meet WCAG contrast requirements, use the button below to automatically adjust them.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          // Calculate contrast and auto-adjust if needed
                          const fgRgb = parseHexToRgb(textColor);
                          const bgRgb = parseHexToRgb(backgroundColor);
                          if (!fgRgb || !bgRgb) {
                            toast.error('Invalid color format');
                            return;
                          }
                          const ratio = getContrastRatio(fgRgb, bgRgb);
                          if (ratio >= 4.5) {
                            toast.success(`Contrast ratio ${ratio.toFixed(2)}:1 already meets AA standards!`);
                            return;
                          }
                          // Auto-adjust: if bg is light, darken text; if bg is dark, lighten text
                          const bgLuminance = getLuminance(bgRgb);
                          if (bgLuminance > 0.5) {
                            // Light background - use dark text
                            setTextColor('#0f172a');
                            toast.success('Text color adjusted to dark for better contrast');
                          } else {
                            // Dark background - use light text
                            setTextColor('#ffffff');
                            toast.success('Text color adjusted to light for better contrast');
                          }
                        }}
                      >
                        Auto-Adjust Colors for Accessibility
                      </Button>
                    </Box>
                    <ThemeContrastTester
                      initialFg={previewTheme.palette.text.primary}
                      initialBg={previewTheme.palette.background.default}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

export default function ThemeStudioPage() {
  return (
    <MuiThemeProvider theme={neutralTheme}>
      <CssBaseline />
      <ThemeStudioPageInner />
    </MuiThemeProvider>
  );
}
