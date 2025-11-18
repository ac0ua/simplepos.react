import React, { useEffect, useMemo, useState } from 'react';
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
  Typography
} from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { API_URL, IS_PHP_BACKEND } from '../config/api';
import { createBusinessTheme, defaultPosThemeTokens } from '../theme';

const editorTokens = {
  ...defaultPosThemeTokens,
  mode: 'light',
  brand: {
    ...defaultPosThemeTokens.brand,
    primary: '#2563eb',
    accent: '#0f766e',
    surface: '#f3f4f6',
    surfaceVariant: '#ffffff',
    onSurface: '#111827',
    onSurfaceVariant: '#4b5563',
    sidebar: '#f3f4f6',
    sidebarActive: '#2563eb',
    sidebarOnActive: '#ffffff',
    outline: '#e5e7eb'
  }
};

const neutralTheme = createBusinessTheme(editorTokens);

const harmonyOptions = [
  { value: 'monochromatic', label: 'Monochromatic' },
  { value: 'shades', label: 'Shades' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'split', label: 'Split Complementary' },
  { value: 'triad', label: 'Triad' },
  { value: 'square', label: 'Square' },
  { value: 'compound', label: 'Compound' }
];

function clampHue(h) {
  let hue = h % 360;
  if (hue < 0) hue += 360;
  return hue;
}

function hslToHex(h, s, l) {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const to255 = (v) => Math.round((v + m) * 255);
  const rr = to255(r).toString(16).padStart(2, '0');
  const gg = to255(g).toString(16).padStart(2, '0');
  const bb = to255(b).toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}`;
}

function generateHarmony({ baseHue, saturation, lightness, harmony, rotation }) {
  const h = clampHue(baseHue + rotation);
  const s = saturation;
  const l = lightness;

  const palette = [];

  if (harmony === 'monochromatic') {
    palette.push({ label: 'Base', h, s, l });
    palette.push({ label: 'Light', h, s, l: Math.min(90, l + 20) });
    palette.push({ label: 'Dark', h, s, l: Math.max(10, l - 20) });
    palette.push({ label: 'Soft', h, s: Math.max(30, s - 30), l: Math.min(80, l + 10) });
    return palette;
  }

  if (harmony === 'shades') {
    palette.push({ label: 'Base', h, s, l });
    palette.push({ label: 'Shade 1', h, s, l: Math.max(8, l - 15) });
    palette.push({ label: 'Shade 2', h, s, l: Math.max(4, l - 25) });
    palette.push({ label: 'Shade 3', h, s, l: Math.max(2, l - 35) });
    return palette;
  }

  if (harmony === 'analogous') {
    const h1 = clampHue(h - 30);
    const h2 = h;
    const h3 = clampHue(h + 30);
    palette.push({ label: 'Analogous 1', h: h1, s, l });
    palette.push({ label: 'Base', h: h2, s, l });
    palette.push({ label: 'Analogous 2', h: h3, s, l });
    return palette;
  }

  if (harmony === 'complementary') {
    const hc = clampHue(h + 180);
    palette.push({ label: 'Base', h, s, l });
    palette.push({ label: 'Complement', h: hc, s, l });
    return palette;
  }

  if (harmony === 'split') {
    const complement = clampHue(h + 180);
    const h1 = clampHue(complement - 30);
    const h2 = clampHue(complement + 30);
    palette.push({ label: 'Base', h, s, l });
    palette.push({ label: 'Split 1', h: h1, s, l });
    palette.push({ label: 'Split 2', h: h2, s, l });
    return palette;
  }

  if (harmony === 'triad') {
    const h2 = clampHue(h + 120);
    const h3 = clampHue(h + 240);
    palette.push({ label: 'Base', h, s, l });
    palette.push({ label: 'Triad 2', h: h2, s, l });
    palette.push({ label: 'Triad 3', h: h3, s, l });
    return palette;
  }

  if (harmony === 'square') {
    const h2 = clampHue(h + 90);
    const h3 = clampHue(h + 180);
    const h4 = clampHue(h + 270);
    palette.push({ label: 'Base', h, s, l });
    palette.push({ label: 'Square 2', h: h2, s, l });
    palette.push({ label: 'Square 3', h: h3, s, l });
    palette.push({ label: 'Square 4', h: h4, s, l });
    return palette;
  }

  // compound
  const a1 = clampHue(h - 30);
  const a2 = h;
  const a3 = clampHue(h + 30);
  const comp = clampHue(h + 180);
  palette.push({ label: 'Analogous 1', h: a1, s, l });
  palette.push({ label: 'Base', h: a2, s, l });
  palette.push({ label: 'Analogous 2', h: a3, s, l });
  palette.push({ label: 'Complement', h: comp, s, l });
  return palette;
}

const ThemePreview = React.memo(function ThemePreview({ previewTheme }) {
  return (
    <MuiThemeProvider theme={previewTheme}>
      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
          position: { md: 'sticky' },
          top: { md: 80 }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Theme preview
        </Typography>
        <Box
          sx={{
            borderRadius: 3,
            p: 2,
            bgcolor: 'background.default',
            color: 'text.primary'
          }}
        >
          <Box
            sx={{
              borderRadius: 3,
              p: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Box
              sx={{
                borderRadius: 3,
                p: { xs: 2, sm: 3 },
                bgcolor: 'background.default'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'secondary.main'
                    }}
                  >
                    Live preview
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>
                    Festival Express POS
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    Demo
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Auto save
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'text.secondary'
                      }}
                    >
                      Featured categories
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75
                        }}
                      >
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: 1,
                            bgcolor: 'background.paper'
                          }}
                        />
                        <Typography variant="body2">Snack</Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Typography variant="body2">icecream</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          Frozen Treats
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Typography variant="body2">local_drink</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          Drinks
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'text.secondary'
                      }}
                    >
                      Menu spotlight
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 1 }}>
                      {[
                        { name: 'Loaded Nachos', price: '$8.50' },
                        { name: 'Rainbow Slush', price: '$4.00' },
                        { name: 'Funnel Fries', price: '$5.25' }
                      ].map((item) => (
                        <Grid item xs={12} sm={4} key={item.name}>
                          <Box
                            sx={{
                              borderRadius: 2,
                              p: 1.5,
                              bgcolor: 'background.paper',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.name}
                              </Typography>
                              <Box
                                sx={{
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 999,
                                  bgcolor: 'secondary.main',
                                  color: 'primary.contrastText',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {item.price}
                              </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Smoky brisket · jalapeño · queso drizzle
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="subtitle2">Checkout</Typography>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'background.default'
                        }}
                      />
                    </Box>
                    <Divider />
                    <Box>
                      {[
                        { name: 'Smoked Brisket Sandwich', price: '$12.50' },
                        { name: 'House Lemonade', price: '$4.25' },
                        { name: 'Kettle Corn', price: '$6.00' }
                      ].map((row) => (
                        <Box
                          key={row.name}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.5
                          }}
                        >
                          <Typography variant="body2">{row.name}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.price}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Divider />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Order Total
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        $27.75
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{
                        mt: 0.5,
                        textTransform: 'none',
                        borderRadius: 999
                      }}
                    >
                      Accept payment
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </Box>
    </MuiThemeProvider>
  );
});

function ThemeStudioPageInner() {
  const { storeGuid, label } = useParams();
  const navigate = useNavigate();
  const themeConfig = useStore((state) => state.themeConfig);
  const setThemeConfig = useStore((state) => state.setThemeConfig);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [themeName, setThemeName] = useState('Default');
  const [mode, setMode] = useState('dark');
  const [primaryColor, setPrimaryColor] = useState('#f97306');
  const [surfaceColor, setSurfaceColor] = useState('#1f140b');
  const [sidebarColor, setSidebarColor] = useState('#28180d');
  const [accentColor, setAccentColor] = useState('#ffb347');
  const [backgroundColor, setBackgroundColor] = useState('#f8f7f5');
  const [textColor, setTextColor] = useState('#111827');
  const [headingFont, setHeadingFont] = useState('Space Grotesk, sans-serif');
  const [bodyFont, setBodyFont] = useState('Inter, system-ui, sans-serif');
  const [headingScale, setHeadingScale] = useState(1.2);
  const [bodySize, setBodySize] = useState(1);
  const [backgroundMode, setBackgroundMode] = useState('solid');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [themeNotes, setThemeNotes] = useState('');

  const [baseHue, setBaseHue] = useState(30);
  const [sat, setSat] = useState(80);
  const [lig, setLig] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [harmony, setHarmony] = useState('analogous');

  const previewTokens = useMemo(
    () => ({
      ...defaultPosThemeTokens,
      mode,
      brand: {
        ...defaultPosThemeTokens.brand,
        primary: primaryColor || defaultPosThemeTokens.brand.primary,
        surface: surfaceColor || defaultPosThemeTokens.brand.surface,
        sidebar: sidebarColor || defaultPosThemeTokens.brand.sidebar,
        accent: accentColor || defaultPosThemeTokens.brand.accent,
        onSurface: textColor || defaultPosThemeTokens.brand.onSurface
      },
      typography: {
        ...defaultPosThemeTokens.typography,
        fontFamily: bodyFont || defaultPosThemeTokens.typography.fontFamily,
        headingFontFamily:
          headingFont || defaultPosThemeTokens.typography.headingFontFamily,
        headingScale:
          typeof headingScale === 'number'
            ? headingScale
            : defaultPosThemeTokens.typography.headingScale,
        bodyScale:
          typeof bodySize === 'number'
            ? bodySize
            : defaultPosThemeTokens.typography.bodyScale
      },
      shape: defaultPosThemeTokens.shape
    }),
    [
      mode,
      primaryColor,
      surfaceColor,
      sidebarColor,
      accentColor,
      textColor,
      headingFont,
      bodyFont,
      headingScale,
      bodySize
    ]
  );

  const previewTheme = useMemo(() => createBusinessTheme(previewTokens), [previewTokens]);

  const palette = useMemo(
    () => generateHarmony({ baseHue, saturation: sat, lightness: lig, harmony, rotation }),
    [baseHue, sat, lig, harmony, rotation]
  );

  useEffect(() => {
    if (!IS_PHP_BACKEND || !storeGuid || !label) {
      const base = themeConfig || {};
      const tokens = base.tokens || null;
      setThemeName(base.themeName || 'Default');
      setMode(base.mode || 'dark');
      setPrimaryColor(base.primaryColor || '#f97306');
      setSurfaceColor(base.surfaceColor || '#1f140b');
      setSidebarColor(base.sidebarColor || '#28180d');
      setAccentColor((tokens && tokens.accentColor) || '#ffb347');
      setBackgroundColor((tokens && tokens.backgroundColor) || '#f8f7f5');
      setTextColor((tokens && tokens.textColor) || '#111827');
      setHeadingFont((tokens && tokens.headingFont) || 'Space Grotesk, sans-serif');
      setBodyFont((tokens && tokens.bodyFont) || 'Inter, system-ui, sans-serif');
      setHeadingScale((tokens && typeof tokens.headingScale === 'number') ? tokens.headingScale : 1.2);
      setBodySize((tokens && typeof tokens.bodySize === 'number') ? tokens.bodySize : 1);
      setBackgroundMode((tokens && tokens.backgroundMode) || 'solid');
      setBackgroundImage((tokens && tokens.backgroundImage) || '');
      setThemeNotes((tokens && tokens.notes) || '');
      return;
    }

    const loadTheme = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/stores/theme.php?storeGuid=${encodeURIComponent(storeGuid)}&label=${encodeURIComponent(label)}`
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message = data && data.error ? data.error : 'Failed to load theme';
          throw new Error(message);
        }

        const active = data && data.theme ? data.theme : null;
        const base = active || themeConfig || {};
        const tokens = base.tokens || null;
        setThemeName(base.themeName || 'Default');
        setMode(base.mode || 'dark');
        setPrimaryColor(base.primaryColor || '#f97306');
        setSurfaceColor(base.surfaceColor || '#1f140b');
        setSidebarColor(base.sidebarColor || '#28180d');
        setAccentColor((tokens && tokens.accentColor) || '#ffb347');
        setBackgroundColor((tokens && tokens.backgroundColor) || '#f8f7f5');
        setTextColor((tokens && tokens.textColor) || '#111827');
        setHeadingFont((tokens && tokens.headingFont) || 'Space Grotesk, sans-serif');
        setBodyFont((tokens && tokens.bodyFont) || 'Inter, system-ui, sans-serif');
        setHeadingScale((tokens && typeof tokens.headingScale === 'number') ? tokens.headingScale : 1.2);
        setBodySize((tokens && typeof tokens.bodySize === 'number') ? tokens.bodySize : 1);
        setBackgroundMode((tokens && tokens.backgroundMode) || 'solid');
        setBackgroundImage((tokens && tokens.backgroundImage) || '');
        setThemeNotes((tokens && tokens.notes) || '');
      } catch (error) {
        console.error('Theme load error:', error);
        toast.error(error.message || 'Failed to load theme');
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [storeGuid, label]);

  const applyHarmonyToTheme = () => {
    if (!palette.length) return;

    const [c0, c1, c2] = palette;
    const primary = c0 ? hslToHex(c0.h, c0.s, c0.l) : primaryColor;
    const accent = c1 ? hslToHex(c1.h, c1.s, c1.l) : accentColor;
    const background = c2 ? hslToHex(c2.h, c2.s, Math.max(c2.l, 92)) : backgroundColor;

    setPrimaryColor(primary);
    setAccentColor(accent);
    setBackgroundColor(background);

    // text color: choose dark or light depending on background lightness
    const bgLightness = c2 ? Math.max(c2.l, 92) : 96;
    setTextColor(bgLightness > 60 ? '#111827' : '#f9fafb');
  };

  const handleSave = async () => {
    if (!IS_PHP_BACKEND) {
      toast.error('Theme editing is only available when using the PHP backend.');
      return;
    }
    if (!storeGuid || !label) {
      toast.error('Missing store context for theme.');
      return;
    }

    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    const baseColors = [primaryColor, surfaceColor, sidebarColor];
    if (!baseColors.every((c) => hexRegex.test(c))) {
      toast.error('Primary, surface and sidebar must be 6-digit hex values like #ff9800.');
      return;
    }

    const tokens = {
      accentColor,
      backgroundColor,
      textColor,
      headingFont,
      bodyFont,
      headingScale,
      bodySize,
      backgroundMode,
      backgroundImage,
      notes: themeNotes
    };

    setSaving(true);
    try {
      const payload = {
        storeGuid,
        label,
        themeName: themeName && themeName.trim() ? themeName.trim() : 'Default',
        mode,
        primaryColor,
        surfaceColor,
        sidebarColor,
        isActive: true,
        tokens
      };

      const response = await fetch(`${API_URL}/stores/theme.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data && data.error ? data.error : 'Failed to save theme';
        throw new Error(message);
      }

      const saved = data && data.theme ? data.theme : payload;
      const savedTokens = saved.tokens || tokens;

      setThemeConfig({
        mode: saved.mode,
        primaryColor: saved.primaryColor,
        surfaceColor: saved.surfaceColor,
        sidebarColor: saved.sidebarColor,
        tokens: savedTokens
      });

      toast.success('Theme saved');
      navigate(`/${storeGuid}/${label}/order.html`);
    } catch (error) {
      console.error('Theme save error:', error);
      toast.error(error.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/${storeGuid}/${label}/order.html`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: '0.2em', color: 'text.secondary' }}>
            Theme Lab
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Theme Studio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Design accessible color systems using HSL harmonies. This editor uses a neutral palette so
            it stays legible regardless of your POS theme.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleCancel} disabled={saving}>
            Back to POS
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save theme'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'background.paper',
              boxShadow: '0 18px 40px rgba(15,23,42,0.12)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Color wheel (HSL)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pick a base hue and adjust saturation, lightness and rotation. The generated palette uses
              the harmony rules you described.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                Base hue (0° – 360°)
              </Typography>
              <Slider
                value={baseHue}
                min={0}
                max={360}
                step={1}
                onChange={(_, value) => {
                  if (typeof value === 'number') setBaseHue(value);
                }}
                sx={{
                  '& .MuiSlider-rail': {
                    background:
                      'linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)',
                    opacity: 1,
                    height: 8,
                    borderRadius: 999
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: 'transparent',
                    height: 8,
                    borderRadius: 999
                  },
                  '& .MuiSlider-thumb': {
                    width: 18,
                    height: 18
                  }
                }}
              />
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                  Saturation
                </Typography>
                <Slider
                  value={sat}
                  min={20}
                  max={100}
                  step={1}
                  onChange={(_, value) => {
                    if (typeof value === 'number') setSat(value);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                  Lightness
                </Typography>
                <Slider
                  value={lig}
                  min={15}
                  max={80}
                  step={1}
                  onChange={(_, value) => {
                    if (typeof value === 'number') setLig(value);
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                Harmony
              </Typography>
              <TextField
                select
                size="small"
                value={harmony}
                onChange={(e) => setHarmony(e.target.value)}
                sx={{ maxWidth: 260 }}
              >
                {harmonyOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                Rotate palette
              </Typography>
              <Slider
                value={rotation}
                min={-180}
                max={180}
                step={5}
                onChange={(_, value) => {
                  if (typeof value === 'number') setRotation(value);
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                Generated palette
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {palette.map((c) => {
                  const hex = hslToHex(c.h, c.s, c.l);
                  return (
                    <Chip
                      key={`${c.label}-${c.h}`}
                      label={`${c.label}  ${hex}`}
                      sx={{
                        backgroundColor: hex,
                        color: c.l > 60 ? '#111827' : '#f9fafb',
                        fontWeight: 500
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            <Button variant="outlined" size="small" onClick={applyHarmonyToTheme} disabled={!palette.length}>
              Apply to theme fields
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={5}>
          <ThemePreview previewTheme={previewTheme} />

          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'background.paper',
              boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <TextField
              label="Theme name"
              fullWidth
              size="small"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Mode
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={mode}
              exclusive
              onChange={(_, value) => {
                if (value) setMode(value);
              }}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="light">Light</ToggleButton>
              <ToggleButton value="dark">Dark</ToggleButton>
            </ToggleButtonGroup>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Core colors
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  label="Primary"
                  size="small"
                  fullWidth
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Accent"
                  size="small"
                  fullWidth
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Surface"
                  size="small"
                  fullWidth
                  value={surfaceColor}
                  onChange={(e) => setSurfaceColor(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sidebar"
                  size="small"
                  fullWidth
                  value={sidebarColor}
                  onChange={(e) => setSidebarColor(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Background"
                  size="small"
                  fullWidth
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Text"
                  size="small"
                  fullWidth
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Typography
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <TextField
                  label="Heading font"
                  size="small"
                  fullWidth
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Body font"
                  size="small"
                  fullWidth
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  Heading scale
                </Typography>
                <Slider
                  size="small"
                  min={1}
                  max={1.6}
                  step={0.1}
                  value={headingScale}
                  onChange={(_, value) => {
                    if (typeof value === 'number') setHeadingScale(value);
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  Body size
                </Typography>
                <Slider
                  size="small"
                  min={0.9}
                  max={1.25}
                  step={0.05}
                  value={bodySize}
                  onChange={(_, value) => {
                    if (typeof value === 'number') setBodySize(value);
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Background options
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={backgroundMode}
              exclusive
              onChange={(_, value) => {
                if (value) setBackgroundMode(value);
              }}
              sx={{ mb: 2, flexWrap: 'wrap' }}
            >
              <ToggleButton value="solid">Solid</ToggleButton>
              <ToggleButton value="gradient">Gradient</ToggleButton>
              <ToggleButton value="texture">Texture</ToggleButton>
              <ToggleButton value="image">Image</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              label="Background image URL"
              size="small"
              fullWidth
              value={backgroundImage}
              onChange={(e) => setBackgroundImage(e.target.value)}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Theme notes
            </Typography>
            <TextField
              multiline
              minRows={3}
              fullWidth
              size="small"
              value={themeNotes}
              onChange={(e) => setThemeNotes(e.target.value)}
              placeholder="Describe how this theme fits your concept, season, or white-label partner."
            />
          </Box>
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
