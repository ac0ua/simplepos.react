import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Slider,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  ColorLens as ColorLensIcon,
  Image as ImageIcon,
  BlurOn as BlurOnIcon,
  Texture as TextureIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { API_URL, IS_PHP_BACKEND } from '../config/api';
import { colorUtils } from '../theme';

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

function ThemeSettingsModal({ open, onClose }) {
  const { storeGuid, label } = useParams();
  const setThemeConfig = useStore((state) => state.setThemeConfig);
  const themeConfig = useStore((state) => state.themeConfig);
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
  const [sidebarTextColor, setSidebarTextColor] = useState('#ffffff');
  const [surfaceTextColor, setSurfaceTextColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#f8f7f5');
  const [headingFont, setHeadingFont] = useState('Space Grotesk, sans-serif');
  const [bodyFont, setBodyFont] = useState('Space Grotesk, sans-serif');
  const [headingScale, setHeadingScale] = useState(1.3);
  const [bodySize, setBodySize] = useState(1);
  
  // Advanced
  const [borderRadius, setBorderRadius] = useState(16);
  const [backgroundMode, setBackgroundMode] = useState('solid');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [glassOpacity, setGlassOpacity] = useState(0.8);
  const [shadowProfile, setShadowProfile] = useState('dramatic');
  const [settingsTab, setSettingsTab] = useState(0);
  
  // Gradient state
  const [gradientColor1, setGradientColor1] = useState('#1a1410');
  const [gradientColor2, setGradientColor2] = useState('#2a1f18');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientType, setGradientType] = useState('linear');

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

  const shadowSliderValue = (() => {
    const profiles = ['flat', 'minimal', 'subtle', 'light', 'soft', 'medium', 'strong', 'bold', 'dramatic', 'max'];
    const idx = profiles.indexOf(shadowProfile);
    return idx >= 0 ? idx : 4;
  })();

  // --- Load Initial Theme ---
  useEffect(() => {
    if (!open) return;
    
    if (!IS_PHP_BACKEND || !storeGuid || !label) {
      // Load from current themeConfig
      const base = themeConfig || {};
      const tokens = base.tokens || null;
      setMode(base.mode || 'dark');
      setPrimaryColor(base.primaryColor || '#f97306');
      setSurfaceColor(base.surfaceColor || '#1f140b');
      setSidebarColor(base.sidebarColor || '#28180d');
      setThemeName(base.themeName || 'Custom Theme');
      setAccentColor((tokens && tokens.accentColor) || '#ffb347');
      setBackgroundColor((tokens && tokens.backgroundColor) || '#f8f7f5');
      setTextColor((tokens && tokens.textColor) || '#1f1b16');
      setHeadingFont((tokens && tokens.headingFont) || 'Space Grotesk, sans-serif');
      setBodyFont((tokens && tokens.bodyFont) || 'Space Grotesk, sans-serif');
      setHeadingScale((tokens && typeof tokens.headingScale === 'number') ? tokens.headingScale : 1.3);
      setBodySize((tokens && typeof tokens.bodySize === 'number') ? tokens.bodySize : 1);
      setBackgroundMode((tokens && tokens.backgroundMode) || 'solid');
      setBackgroundImage((tokens && tokens.backgroundImage) || '');
      setBorderRadius((tokens && typeof tokens.borderRadius === 'number') ? tokens.borderRadius : 16);
      setGlassOpacity((tokens && typeof tokens.glassOpacity === 'number') ? tokens.glassOpacity : 0.8);
      setShadowProfile((tokens && tokens.shadowProfile) || 'dramatic');
      setAutoMode((tokens && typeof tokens.autoMode === 'boolean') ? tokens.autoMode : true);
      return;
    }

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
          if (typeof toks.borderRadius === 'number') setBorderRadius(toks.borderRadius);
          if (toks.backgroundMode) setBackgroundMode(toks.backgroundMode);
          if (toks.backgroundImage) setBackgroundImage(toks.backgroundImage);
          if (typeof toks.glassOpacity === 'number') setGlassOpacity(toks.glassOpacity);
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
  }, [open, storeGuid, label]);

  // --- Apply theme changes live with debounce ---
  const debounceRef = useRef(null);
  
  const applyThemeLive = useCallback(() => {
    const tokens = {
      accentColor,
      textColor,
      sidebarTextColor,
      surfaceTextColor,
      borderRadius,
      backgroundMode,
      backgroundImage,
      glassOpacity,
      headingFont,
      bodyFont,
      headingScale,
      bodySize,
      backgroundColor,
      autoMode,
      shadowProfile,
      gradientColor1,
      gradientColor2,
      gradientAngle,
      gradientType
    };
    
    setThemeConfig({
      mode,
      primaryColor,
      surfaceColor,
      sidebarColor,
      themeName,
      tokens
    });
  }, [mode, primaryColor, surfaceColor, sidebarColor, accentColor, textColor, sidebarTextColor, surfaceTextColor, backgroundColor, borderRadius, backgroundMode, backgroundImage, glassOpacity, headingFont, bodyFont, headingScale, bodySize, shadowProfile, autoMode, themeName, setThemeConfig, gradientColor1, gradientColor2, gradientAngle, gradientType]);

  // Apply theme changes with debounce to prevent glitching
  useEffect(() => {
    if (!open) return;
    
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the theme application (longer delay to prevent lag with color pickers)
    debounceRef.current = setTimeout(() => {
      applyThemeLive();
    }, 350);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open, applyThemeLive]);

  // AUTO-CALCULATE ALL TEXT COLORS when their respective backgrounds change
  // This ensures accessibility contrast is always maintained automatically
  // Each surface gets its own optimized text color
  const textColorAutoRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    
    // Clear any pending auto-calculation
    if (textColorAutoRef.current) {
      clearTimeout(textColorAutoRef.current);
    }
    
    // Debounce to avoid rapid updates during color picker drag
    textColorAutoRef.current = setTimeout(() => {
      // Calculate text color for main background
      const newTextColor = colorUtils.getAccessibleTextColor(backgroundColor);
      setTextColor(newTextColor);
      
      // Calculate text color for sidebar (based on sidebar background)
      const newSidebarTextColor = colorUtils.getAccessibleTextColor(sidebarColor);
      setSidebarTextColor(newSidebarTextColor);
      
      // Calculate text color for surfaces/cards (based on surface background)
      const newSurfaceTextColor = colorUtils.getAccessibleTextColor(surfaceColor);
      setSurfaceTextColor(newSurfaceTextColor);
    }, 400);
    
    return () => {
      if (textColorAutoRef.current) {
        clearTimeout(textColorAutoRef.current);
      }
    };
  }, [open, backgroundColor, sidebarColor, surfaceColor]); // Recalculate when any background changes

  // --- Handlers ---
  const handleWheel = (e) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left - rect.width / 2;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    setBaseHue(normalizeAngle(angle + 90));
  };

  // Draw color wheel - include settingsTab and open so it redraws when Colors tab becomes visible
  useEffect(() => {
    // Only draw when Colors tab is active and modal is open
    if (!open || settingsTab !== 2) return;
    
    const cvs = wheelRef.current;
    if (!cvs) return;
    
    // Small delay to ensure canvas is rendered
    const timer = setTimeout(() => {
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
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
    }, 50);
    
    return () => clearTimeout(timer);
  }, [baseHue, saturation, lightness, palette, settingsTab, open]);

  const applyPalette = () => {
    if(!palette.length) return;
    const [c0, c1, c2] = palette;
    
    // Primary color - use the first palette color directly
    const primary = hslToHex(c0.h, c0.s, c0.l);
    setPrimaryColor(primary);
    
    // Accent color - use the second palette color directly  
    const accent = hslToHex(c1.h, c1.s, c1.l);
    setAccentColor(accent);
    
    let nextMode = mode;
    if (autoMode) {
      const bgLightness = c2.l;
      nextMode = bgLightness < 55 ? 'dark' : 'light';
      setMode(nextMode);
    }

    if (nextMode === 'dark') {
      // Dark mode: create dark versions but keep more saturation to show the color
      const bgL = 12;
      const bgS = Math.min(c2.s, 25); // Keep some saturation from the third color
      const bg = hslToHex(c2.h, bgS, bgL);
      
      // Section/surface uses the second color's hue for variety
      const sectionS = Math.min(c1.s, 20);
      const section = hslToHex(c1.h, sectionS, bgL + 6);
      
      // Sidebar uses the third color's hue
      const sidebar = hslToHex(c2.h, Math.min(c2.s, 30), Math.max(6, bgL - 4));
      
      setBackgroundColor(bg);
      setSurfaceColor(section);
      setSidebarColor(sidebar);
      setTextColor(colorUtils.getAccessibleTextColor(bg));
    } else {
      // Light mode: create light tinted versions
      const bgL = 96;
      const bgS = Math.min(c2.s * 0.15, 12);
      const bg = hslToHex(c2.h, bgS, bgL);
      
      // Section uses second color's hue
      const section = hslToHex(c1.h, Math.min(c1.s * 0.12, 10), bgL - 4);
      
      // Sidebar uses third color's hue
      const sidebar = hslToHex(c2.h, Math.min(c2.s * 0.08, 8), 98);
      
      setBackgroundColor(bg);
      setSurfaceColor(section);
      setSidebarColor(sidebar);
      setTextColor(colorUtils.getAccessibleTextColor(bg));
    }
    toast.success('Palette Applied! Primary: ' + c0.label + ', Accent: ' + (c1.label || 'Color 2'));
  };

  const handleSave = async () => {
    if (!IS_PHP_BACKEND) {
      toast.success('Theme applied (local only)');
      onClose();
      return;
    }
    
    if (!storeGuid || !label) {
      toast.error('Missing store context');
      return;
    }

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
        const data = await res.json();
        if (data.theme) {
          setThemeConfig(data.theme);
        }
        toast.success('Theme Saved');
        onClose();
      } else {
        toast.error('Failed to save theme');
      }
    } catch(e) { 
      console.error(e);
      toast.error('Save Failed'); 
    }
    setSaving(false);
  };

  const handleAutoAdjustAccessibility = () => {
    // Use the accessibility algorithm to calculate optimal text color
    const newTextColor = colorUtils.getAccessibleTextColor(backgroundColor);
    
    // Check current contrast
    const fgRgb = colorUtils.hexToRgb(textColor);
    const bgRgb = colorUtils.hexToRgb(backgroundColor);
    if (fgRgb && bgRgb) {
      const currentRatio = colorUtils.getContrastRatio(fgRgb, bgRgb);
      if (currentRatio >= 4.5) {
        toast.success(`Current contrast ratio ${currentRatio.toFixed(2)}:1 already meets AA standards!`);
        return;
      }
    }
    
    setTextColor(newTextColor);
    toast.success('Text color optimized for accessibility!');
  };
  
  // Auto-calculate text color when background changes significantly
  const handleRecalculateTextColor = () => {
    const newTextColor = colorUtils.getAccessibleTextColor(backgroundColor);
    setTextColor(newTextColor);
    toast.success('Text color recalculated based on background!');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(30, 30, 30, 0.95)',
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '90vh'
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0,0,0,0.4)'
          }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ColorLensIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
            Theme Settings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Compact Light/Dark Toggle */}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v) => v && setMode(v)}
            sx={{ 
              mr: 1,
              '& .MuiToggleButton-root': {
                py: 0.5,
                px: 1.5,
                fontSize: '0.75rem',
                color: 'grey.400',
                borderColor: 'grey.700',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white'
                }
              }
            }}
          >
            <ToggleButton value="light">Light</ToggleButton>
            <ToggleButton value="dark">Dark</ToggleButton>
          </ToggleButtonGroup>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={onClose}
            sx={{ color: 'grey.400', borderColor: 'grey.700' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <IconButton size="small" onClick={onClose} sx={{ color: 'grey.400' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, overflowY: 'auto' }}>
        {/* Tabs */}
        <Tabs
          variant="scrollable"
          scrollButtons="auto"
          value={settingsTab}
          onChange={(_, v) => setSettingsTab(v)}
          sx={{ 
            mb: 2,
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              color: 'grey.500',
              minWidth: 'auto',
              px: 2,
              '&.Mui-selected': { color: 'primary.main' }
            }
          }}
        >
          <Tab label="Global" />
          <Tab label="Background" />
          <Tab label="Colors" />
          <Tab label="Typography" />
          <Tab label="Shadows" />
          <Tab label="A11y" />
        </Tabs>

        {/* Global Tab */}
        <Box sx={{ display: settingsTab === 0 ? 'block' : 'none' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Theme Name" 
                size="small" 
                value={themeName} 
                onChange={e => setThemeName(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                Corner Radius: {borderRadius}px
              </Typography>
              <Slider 
                value={borderRadius} 
                onChange={(_, v) => setBorderRadius(v)} 
                min={0} 
                max={32} 
                step={4} 
                marks 
              />
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
                sx={{ color: 'grey.300' }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Background Tab */}
        <Box sx={{ display: settingsTab === 1 ? 'block' : 'none' }}>
          <ToggleButtonGroup 
            size="small" 
            exclusive 
            value={backgroundMode} 
            onChange={(_, v) => v && setBackgroundMode(v)} 
            fullWidth 
            sx={{ mb: 2 }}
          >
            <ToggleButton value="solid"><ColorLensIcon sx={{ mr: 1 }}/> Solid</ToggleButton>
            <ToggleButton value="gradient"><TextureIcon sx={{ mr: 1 }}/> Gradient</ToggleButton>
            <ToggleButton value="image"><ImageIcon sx={{ mr: 1 }}/> Image</ToggleButton>
            <ToggleButton value="glass"><BlurOnIcon sx={{ mr: 1 }}/> Glass</ToggleButton>
          </ToggleButtonGroup>

          {/* Solid Color */}
          {backgroundMode === 'solid' && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white' }}>Background Color</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  component="input"
                  type="color"
                  value={backgroundColor}
                  onChange={e => setBackgroundColor(e.target.value)}
                  sx={{
                    width: 60,
                    height: 40,
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: 1,
                    p: 0,
                    cursor: 'pointer',
                    bgcolor: 'transparent'
                  }}
                />
                <TextField
                  size="small"
                  value={backgroundColor}
                  onChange={e => setBackgroundColor(e.target.value)}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                />
              </Box>
            </Box>
          )}

          {/* Gradient */}
          {backgroundMode === 'gradient' && (
            <Box>
              {/* Gradient Presets */}
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white' }}>Quick Gradients</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {[
                  { name: 'Sunset', c1: '#ff6b35', c2: '#f7931e', angle: 135 },
                  { name: 'Ocean', c1: '#0077b6', c2: '#00b4d8', angle: 135 },
                  { name: 'Forest', c1: '#2d6a4f', c2: '#40916c', angle: 135 },
                  { name: 'Purple', c1: '#7b2cbf', c2: '#c77dff', angle: 135 },
                  { name: 'Dark', c1: '#1a1a2e', c2: '#16213e', angle: 180 },
                  { name: 'Warm', c1: '#3d1308', c2: '#1a0a00', angle: 180 },
                  { name: 'Cool', c1: '#0f172a', c2: '#1e293b', angle: 180 },
                  { name: 'Rose', c1: '#4a1942', c2: '#831843', angle: 135 },
                  { name: 'Gold', c1: '#78350f', c2: '#451a03', angle: 180 },
                  { name: 'Mint', c1: '#064e3b', c2: '#065f46', angle: 135 },
                  { name: 'Slate', c1: '#1e293b', c2: '#334155', angle: 180 },
                  { name: 'Night', c1: '#0c0a09', c2: '#1c1917', angle: 180 },
                ].map((preset) => (
                  <Tooltip key={preset.name} title={preset.name}>
                    <Box
                      onClick={() => {
                        setGradientColor1(preset.c1);
                        setGradientColor2(preset.c2);
                        setGradientAngle(preset.angle);
                      }}
                      sx={{
                        width: 48,
                        height: 32,
                        borderRadius: 1,
                        cursor: 'pointer',
                        background: `linear-gradient(${preset.angle}deg, ${preset.c1}, ${preset.c2})`,
                        border: '2px solid rgba(255,255,255,0.1)',
                        transition: 'transform 0.15s, border-color 0.15s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          borderColor: 'rgba(255,255,255,0.4)'
                        }
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>

              {/* Gradient Builder */}
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white' }}>Build Your Gradient</Typography>
              
              {/* Gradient Type */}
              <ToggleButtonGroup
                size="small"
                exclusive
                value={gradientType}
                onChange={(_, v) => v && setGradientType(v)}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="linear">Linear</ToggleButton>
                <ToggleButton value="radial">Radial</ToggleButton>
              </ToggleButtonGroup>

              {/* Color Pickers */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'grey.400', mb: 0.5, display: 'block' }}>Color 1</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="input"
                      type="color"
                      value={gradientColor1}
                      onChange={e => setGradientColor1(e.target.value)}
                      sx={{
                        width: 40,
                        height: 32,
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: 1,
                        p: 0,
                        cursor: 'pointer',
                        bgcolor: 'transparent'
                      }}
                    />
                    <TextField
                      size="small"
                      value={gradientColor1}
                      onChange={e => setGradientColor1(e.target.value)}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'grey.400', mb: 0.5, display: 'block' }}>Color 2</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="input"
                      type="color"
                      value={gradientColor2}
                      onChange={e => setGradientColor2(e.target.value)}
                      sx={{
                        width: 40,
                        height: 32,
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: 1,
                        p: 0,
                        cursor: 'pointer',
                        bgcolor: 'transparent'
                      }}
                    />
                    <TextField
                      size="small"
                      value={gradientColor2}
                      onChange={e => setGradientColor2(e.target.value)}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                    />
                  </Box>
                </Grid>
              </Grid>

              {/* Angle Slider (only for linear) */}
              {gradientType === 'linear' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'grey.400' }}>
                    Angle: {gradientAngle}°
                  </Typography>
                  <Slider
                    size="small"
                    value={gradientAngle}
                    onChange={(_, v) => typeof v === 'number' && setGradientAngle(v)}
                    min={0}
                    max={360}
                    step={15}
                    marks={[
                      { value: 0, label: '0°' },
                      { value: 90, label: '90°' },
                      { value: 180, label: '180°' },
                      { value: 270, label: '270°' },
                      { value: 360, label: '360°' }
                    ]}
                  />
                </Box>
              )}

              {/* Gradient Preview */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: 'grey.500', mb: 1, display: 'block' }}>Preview</Typography>
                <Box
                  sx={{
                    height: 60,
                    borderRadius: 1,
                    background: gradientType === 'linear'
                      ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
                      : `radial-gradient(circle, ${gradientColor1}, ${gradientColor2})`,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                />
              </Box>

              {/* Apply Button */}
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => {
                  // Set the background color to the first gradient color for fallback
                  setBackgroundColor(gradientColor1);
                  // The gradient is applied via the tokens (gradientColor1, gradientColor2, gradientAngle, gradientType)
                  toast.success('Gradient applied!');
                }}
              >
                Apply Gradient
              </Button>
            </Box>
          )}

          {/* Image */}
          {backgroundMode === 'image' && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white' }}>Background Image</Typography>
              
              {/* Upload Button */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  sx={{ 
                    flex: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: 'grey.300',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.4)' }
                  }}
                >
                  Upload Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be less than 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setBackgroundImage(event.target?.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
                {backgroundImage && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => setBackgroundImage('')}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    Clear
                  </Button>
                )}
              </Box>

              {/* URL Input */}
              <Typography variant="caption" sx={{ color: 'grey.500', mb: 0.5, display: 'block' }}>Or enter URL</Typography>
              <TextField 
                fullWidth 
                label="Image URL" 
                size="small" 
                value={backgroundImage?.startsWith('data:') ? '' : backgroundImage} 
                onChange={e => setBackgroundImage(e.target.value)} 
                placeholder="https://example.com/image.jpg"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
              />
              
              {backgroundImage && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: 'grey.500', mb: 1, display: 'block' }}>Preview</Typography>
                  <Box
                    sx={{
                      height: 120,
                      borderRadius: 1,
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Glass */}
          {backgroundMode === 'glass' && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white' }}>Glass Effect</Typography>
              <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
                Glass mode adds a frosted glass effect to panels and cards.
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                Glass Opacity: {(glassOpacity * 100).toFixed(0)}%
              </Typography>
              <Slider 
                value={glassOpacity} 
                onChange={(_, v) => typeof v === 'number' && setGlassOpacity(v)} 
                min={0.1} 
                max={1} 
                step={0.05}
                marks={[
                  { value: 0.1, label: '10%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' }
                ]}
              />
              
              {/* Base color for glass */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: 'grey.400', mb: 0.5, display: 'block' }}>Base Color</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    sx={{
                      width: 60,
                      height: 40,
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: 1,
                      p: 0,
                      cursor: 'pointer',
                      bgcolor: 'transparent'
                    }}
                  />
                  <TextField
                    size="small"
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Colors Tab */}
        <Box sx={{ display: settingsTab === 2 ? 'block' : 'none' }}>
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
                sx={{ 
                  flex: '1 1 140px', 
                  minWidth: 120, 
                  maxWidth: 180,
                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
                InputProps={{ 
                  startAdornment: (
                    <Box 
                      component="input"
                      type="color"
                      value={color.value}
                      onChange={e => color.onChange(e.target.value)}
                      sx={{
                        width: 20,
                        height: 20,
                        border: 'none',
                        p: 0,
                        mr: 0.5,
                        bgcolor: 'transparent',
                        cursor: 'pointer'
                      }}
                    />
                  )
                }}
              />
            ))}
          </Box>

          {/* Accessibility status indicator */}
          <Box sx={{ 
            mb: 2, 
            p: 1.5, 
            borderRadius: 1, 
            bgcolor: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: 'success.main',
              animation: 'pulse 2s infinite'
            }} />
            <Typography variant="caption" sx={{ color: 'success.light' }}>
              Text color auto-adjusts for accessibility contrast
            </Typography>
          </Box>

          <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)', bgcolor: 'rgba(255,255,255,0.02)' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'white' }}>Color Harmony Generator</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <canvas
                    ref={wheelRef}
                    width={180}
                    height={180}
                    style={{ borderRadius: '50%', cursor: 'pointer' }}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseMove={(e) => isDragging && handleWheel(e)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchMove={(e) => isDragging && handleWheel(e)}
                    onTouchEnd={() => setIsDragging(false)}
                  />
                  <Typography variant="body2" sx={{ mt: 1, color: 'grey.400' }}>{Math.round(baseHue)}°</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <TextField
                  select
                  fullWidth
                  label="Harmony Rule"
                  value={harmonyMode}
                  onChange={e => setHarmonyMode(e.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                >
                  {Object.entries(HARMONIES).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </TextField>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: 'grey.400' }}>Saturation & Lightness</Typography>
                  <Slider value={saturation} onChange={(_, v) => setSaturation(v)} min={0} max={100} />
                  <Slider value={lightness} onChange={(_, v) => setLightness(v)} min={10} max={90} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
                  {palette.map((c, i) => (
                    <Tooltip key={i} title={c.label}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: hslToHex(c.h, c.s, c.l), border: '2px solid white', boxShadow: 1 }} />
                    </Tooltip>
                  ))}
                </Box>

                <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={applyPalette}>
                  Apply Generated Palette
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Typography Tab */}
        <Box sx={{ display: settingsTab === 3 ? 'block' : 'none' }}>
          {/* Font Pairings */}
          <Box sx={{ mb: 3, p: 2, borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)', bgcolor: 'rgba(255,255,255,0.02)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white' }}>Quick Font Pairings</Typography>
            <TextField
              fullWidth
              select
              label="Choose a pairing"
              size="small"
              value=""
              onChange={e => {
                const pairings = {
                  'modern': { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
                  'classic': { heading: 'Playfair Display, serif', body: 'Lora, serif' },
                  'bold': { heading: 'Oswald, sans-serif', body: 'Open Sans, sans-serif' },
                  'elegant': { heading: 'Cormorant Garamond, serif', body: 'Proza Libre, sans-serif' },
                  'friendly': { heading: 'Poppins, sans-serif', body: 'Nunito, sans-serif' },
                  'tech': { heading: 'Space Grotesk, sans-serif', body: 'IBM Plex Sans, sans-serif' },
                  'editorial': { heading: 'Libre Baskerville, serif', body: 'Source Sans Pro, sans-serif' },
                  'minimal': { heading: 'DM Sans, sans-serif', body: 'DM Sans, sans-serif' },
                  'playful': { heading: 'Fredoka One, cursive', body: 'Quicksand, sans-serif' },
                  'professional': { heading: 'Montserrat, sans-serif', body: 'Roboto, sans-serif' },
                  'luxury': { heading: 'Cinzel, serif', body: 'Raleway, sans-serif' },
                  'retro': { heading: 'Bebas Neue, cursive', body: 'Josefin Sans, sans-serif' },
                };
                const pair = pairings[e.target.value];
                if (pair) {
                  setHeadingFont(pair.heading);
                  setBodyFont(pair.body);
                }
              }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: { maxHeight: 400 }
                  }
                }
              }}
            >
              <MenuItem value="modern">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Modern</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Inter, sans-serif', color: 'grey.400' }}>Inter / Inter</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="classic">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>Classic</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Lora, serif', color: 'grey.400' }}>Playfair Display / Lora</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="bold">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600 }}>Bold</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Open Sans, sans-serif', color: 'grey.400' }}>Oswald / Open Sans</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="elegant">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600 }}>Elegant</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Proza Libre, sans-serif', color: 'grey.400' }}>Cormorant Garamond / Proza Libre</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="friendly">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>Friendly</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Nunito, sans-serif', color: 'grey.400' }}>Poppins / Nunito</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="tech">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>Tech</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'IBM Plex Sans, sans-serif', color: 'grey.400' }}>Space Grotesk / IBM Plex Sans</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="editorial">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Libre Baskerville, serif', fontWeight: 600 }}>Editorial</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Source Sans Pro, sans-serif', color: 'grey.400' }}>Libre Baskerville / Source Sans Pro</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="minimal">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Minimal</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'DM Sans, sans-serif', color: 'grey.400' }}>DM Sans / DM Sans</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="playful">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Fredoka One, cursive', fontWeight: 600 }}>Playful</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Quicksand, sans-serif', color: 'grey.400' }}>Fredoka One / Quicksand</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="professional">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Professional</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Roboto, sans-serif', color: 'grey.400' }}>Montserrat / Roboto</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="luxury">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Cinzel, serif', fontWeight: 600 }}>Luxury</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Raleway, sans-serif', color: 'grey.400' }}>Cinzel / Raleway</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="retro">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Bebas Neue, cursive', fontWeight: 600 }}>Retro</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Josefin Sans, sans-serif', color: 'grey.400' }}>Bebas Neue / Josefin Sans</Typography>
                </Box>
              </MenuItem>
            </TextField>
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Individual Font Selection */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Headline font"
                size="small"
                value={headingFont}
                onChange={e => setHeadingFont(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
              >
                <MenuItem disabled><em>Sans-Serif</em></MenuItem>
                <MenuItem value="Inter, sans-serif">Inter</MenuItem>
                <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                <MenuItem value="Open Sans, sans-serif">Open Sans</MenuItem>
                <MenuItem value="Lato, sans-serif">Lato</MenuItem>
                <MenuItem value="Montserrat, sans-serif">Montserrat</MenuItem>
                <MenuItem value="Poppins, sans-serif">Poppins</MenuItem>
                <MenuItem value="Nunito, sans-serif">Nunito</MenuItem>
                <MenuItem value="Raleway, sans-serif">Raleway</MenuItem>
                <MenuItem value="Oswald, sans-serif">Oswald</MenuItem>
                <MenuItem value="Source Sans Pro, sans-serif">Source Sans Pro</MenuItem>
                <MenuItem value="DM Sans, sans-serif">DM Sans</MenuItem>
                <MenuItem value="Space Grotesk, sans-serif">Space Grotesk</MenuItem>
                <MenuItem value="IBM Plex Sans, sans-serif">IBM Plex Sans</MenuItem>
                <MenuItem value="Quicksand, sans-serif">Quicksand</MenuItem>
                <MenuItem value="Josefin Sans, sans-serif">Josefin Sans</MenuItem>
                <MenuItem value="Proza Libre, sans-serif">Proza Libre</MenuItem>
                <MenuItem disabled><em>Serif</em></MenuItem>
                <MenuItem value="Playfair Display, serif">Playfair Display</MenuItem>
                <MenuItem value="Merriweather, serif">Merriweather</MenuItem>
                <MenuItem value="Lora, serif">Lora</MenuItem>
                <MenuItem value="Libre Baskerville, serif">Libre Baskerville</MenuItem>
                <MenuItem value="Cormorant Garamond, serif">Cormorant Garamond</MenuItem>
                <MenuItem value="Cinzel, serif">Cinzel</MenuItem>
                <MenuItem value="EB Garamond, serif">EB Garamond</MenuItem>
                <MenuItem value="Crimson Text, serif">Crimson Text</MenuItem>
                <MenuItem disabled><em>Display</em></MenuItem>
                <MenuItem value="Bebas Neue, cursive">Bebas Neue</MenuItem>
                <MenuItem value="Fredoka One, cursive">Fredoka One</MenuItem>
                <MenuItem value="Pacifico, cursive">Pacifico</MenuItem>
                <MenuItem value="Righteous, cursive">Righteous</MenuItem>
                <MenuItem value="Alfa Slab One, cursive">Alfa Slab One</MenuItem>
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
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
              >
                <MenuItem disabled><em>Sans-Serif</em></MenuItem>
                <MenuItem value="Inter, sans-serif">Inter</MenuItem>
                <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                <MenuItem value="Open Sans, sans-serif">Open Sans</MenuItem>
                <MenuItem value="Lato, sans-serif">Lato</MenuItem>
                <MenuItem value="Montserrat, sans-serif">Montserrat</MenuItem>
                <MenuItem value="Poppins, sans-serif">Poppins</MenuItem>
                <MenuItem value="Nunito, sans-serif">Nunito</MenuItem>
                <MenuItem value="Raleway, sans-serif">Raleway</MenuItem>
                <MenuItem value="Source Sans Pro, sans-serif">Source Sans Pro</MenuItem>
                <MenuItem value="DM Sans, sans-serif">DM Sans</MenuItem>
                <MenuItem value="Space Grotesk, sans-serif">Space Grotesk</MenuItem>
                <MenuItem value="IBM Plex Sans, sans-serif">IBM Plex Sans</MenuItem>
                <MenuItem value="Quicksand, sans-serif">Quicksand</MenuItem>
                <MenuItem value="Josefin Sans, sans-serif">Josefin Sans</MenuItem>
                <MenuItem value="Proza Libre, sans-serif">Proza Libre</MenuItem>
                <MenuItem disabled><em>Serif</em></MenuItem>
                <MenuItem value="Merriweather, serif">Merriweather</MenuItem>
                <MenuItem value="Lora, serif">Lora</MenuItem>
                <MenuItem value="Libre Baskerville, serif">Libre Baskerville</MenuItem>
                <MenuItem value="Crimson Text, serif">Crimson Text</MenuItem>
                <MenuItem value="EB Garamond, serif">EB Garamond</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Size Controls */}
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white' }}>Size & Scale</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                Heading scale: {headingScale.toFixed(1)}x
              </Typography>
              <Slider
                size="small"
                min={0.8}
                max={1.8}
                step={0.05}
                value={headingScale}
                onChange={(_, v) => typeof v === 'number' && setHeadingScale(v)}
                marks={[
                  { value: 0.8, label: '0.8x' },
                  { value: 1, label: '1x' },
                  { value: 1.3, label: '1.3x' },
                  { value: 1.8, label: '1.8x' }
                ]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                Body size: {bodySize.toFixed(2)}x
              </Typography>
              <Slider
                size="small"
                min={0.8}
                max={1.4}
                step={0.05}
                value={bodySize}
                onChange={(_, v) => typeof v === 'number' && setBodySize(v)}
                marks={[
                  { value: 0.8, label: '0.8x' },
                  { value: 1, label: '1x' },
                  { value: 1.2, label: '1.2x' },
                  { value: 1.4, label: '1.4x' }
                ]}
              />
            </Grid>
          </Grid>

          {/* Preview */}
          <Box sx={{ mt: 3, p: 2, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="caption" sx={{ color: 'grey.500', mb: 1, display: 'block' }}>Preview</Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: headingFont, 
                fontWeight: 700,
                fontSize: `${1.5 * headingScale}rem`,
                color: 'white',
                mb: 1
              }}
            >
              The Quick Brown Fox
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: bodyFont,
                fontSize: `${1 * bodySize}rem`,
                color: 'grey.300'
              }}
            >
              Jumps over the lazy dog. This is how your body text will appear throughout the application.
            </Typography>
          </Box>
        </Box>

        {/* Shadows Tab */}
        <Box sx={{ display: settingsTab === 4 ? 'block' : 'none' }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'grey.400' }}>
            Control how strong the shadows feel across cards and panels.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'grey.300' }}>
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

        {/* Accessibility Tab */}
        <Box sx={{ display: settingsTab === 5 ? 'block' : 'none' }}>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'info.light' }}>
              Accessibility Auto-Adjust
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'grey.400' }}>
              If your theme colors don't meet WCAG contrast requirements, use the button below to automatically adjust them.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleAutoAdjustAccessibility}
            >
              Auto-Adjust Colors for Accessibility
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

export default ThemeSettingsModal;
