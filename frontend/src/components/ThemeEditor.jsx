import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Divider,
  Slider,
  MenuItem
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { API_URL, IS_PHP_BACKEND } from '../config/api';
import useStore from '../store/useStore';

const ThemeEditor = ({ open, onClose }) => {
  const storeGuid = useStore((state) => state.storeGuid);
  const label = useStore((state) => state.label);
  const themeConfig = useStore((state) => state.themeConfig);
  const setThemeConfig = useStore((state) => state.setThemeConfig);

  const [mode, setMode] = useState('dark');
  const [primaryColor, setPrimaryColor] = useState('#f97306');
  const [surfaceColor, setSurfaceColor] = useState('#1f140b');
  const [sidebarColor, setSidebarColor] = useState('#28180d');
  const [themeName, setThemeName] = useState('Active');
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accentColor, setAccentColor] = useState('#ffb347');
  const [backgroundColor, setBackgroundColor] = useState('#f8f7f5');
  const [textColor, setTextColor] = useState('#1f1b16');
  const [headingFont, setHeadingFont] = useState('Space Grotesk, sans-serif');
  const [bodyFont, setBodyFont] = useState('Space Grotesk, sans-serif');
  const [headingScale, setHeadingScale] = useState(1.3);
  const [bodySize, setBodySize] = useState(1);
  const [backgroundMode, setBackgroundMode] = useState('solid');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [themeNotes, setThemeNotes] = useState('');

  useEffect(() => {
    if (!open) return;

    // For non-PHP backend or missing store context, just seed from current themeConfig once
    if (!IS_PHP_BACKEND || !storeGuid || !label) {
      const base = themeConfig || {};
      const tokens = base.tokens || null;
      setMode(base.mode || 'dark');
      setPrimaryColor(base.primaryColor || '#f97306');
      setSurfaceColor(base.surfaceColor || '#1f140b');
      setSidebarColor(base.sidebarColor || '#28180d');
      setThemeName(base.themeName || 'Active');
      setAccentColor((tokens && tokens.accentColor) || '#ffb347');
      setBackgroundColor((tokens && tokens.backgroundColor) || '#f8f7f5');
      setTextColor((tokens && tokens.textColor) || '#1f1b16');
      setHeadingFont((tokens && tokens.headingFont) || 'Space Grotesk, sans-serif');
      setBodyFont((tokens && tokens.bodyFont) || 'Space Grotesk, sans-serif');
      setHeadingScale((tokens && typeof tokens.headingScale === 'number') ? tokens.headingScale : 1.3);
      setBodySize((tokens && typeof tokens.bodySize === 'number') ? tokens.bodySize : 1);
      setBackgroundMode((tokens && tokens.backgroundMode) || 'solid');
      setBackgroundImage((tokens && tokens.backgroundImage) || '');
      setThemeNotes((tokens && tokens.notes) || '');
      setThemes([]);
      return;
    }

    const loadThemes = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/stores/theme.php?storeGuid=${encodeURIComponent(storeGuid)}&label=${encodeURIComponent(label)}`
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message = data && data.error ? data.error : 'Failed to load themes';
          throw new Error(message);
        }

        const active = data && data.theme ? data.theme : null;
        const list = data && Array.isArray(data.themes) ? data.themes : [];

        setThemes(list);

        const base = active || themeConfig || {};
        const tokens = base.tokens || null;
        setMode(base.mode || 'dark');
        setPrimaryColor(base.primaryColor || '#f97306');
        setSurfaceColor(base.surfaceColor || '#1f140b');
        setSidebarColor(base.sidebarColor || '#28180d');
        setThemeName(base.themeName || 'Active');
        setAccentColor((tokens && tokens.accentColor) || '#ffb347');
        setBackgroundColor((tokens && tokens.backgroundColor) || '#f8f7f5');
        setTextColor((tokens && tokens.textColor) || '#1f1b16');
        setHeadingFont((tokens && tokens.headingFont) || 'Space Grotesk, sans-serif');
        setBodyFont((tokens && tokens.bodyFont) || 'Space Grotesk, sans-serif');
        setHeadingScale((tokens && typeof tokens.headingScale === 'number') ? tokens.headingScale : 1.3);
        setBodySize((tokens && typeof tokens.bodySize === 'number') ? tokens.bodySize : 1);
        setBackgroundMode((tokens && tokens.backgroundMode) || 'solid');
        setBackgroundImage((tokens && tokens.backgroundImage) || '');
        setThemeNotes((tokens && tokens.notes) || '');
      } catch (error) {
        console.error('Load themes error:', error);
        toast.error(error.message || 'Failed to load themes');
      } finally {
        setLoading(false);
      }
    };

    loadThemes();
  }, [open, storeGuid, label]);

  const handleSave = async () => {
    if (!IS_PHP_BACKEND) {
      toast.error('Theme editing is only available when using the PHP backend.');
      return;
    }
    if (!storeGuid || !label) {
      toast.error('Missing store context for theme.');
      return;
    }

    const hexRegex = /^#[0-9A-Fa-f]{3,8}$/;
    if (
      !hexRegex.test(primaryColor) ||
      !hexRegex.test(surfaceColor) ||
      !hexRegex.test(sidebarColor)
    ) {
      toast.error('Colors must be valid hex values like #ff9800.');
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
        themeName: themeName && themeName.trim() ? themeName.trim() : 'Active',
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

      setThemes((prev) => {
        const name = saved.themeName || payload.themeName;
        const existingIndex = prev.findIndex((t) => t.themeName === name);
        const updated = {
          themeName: name,
          mode: saved.mode,
          primaryColor: saved.primaryColor,
          surfaceColor: saved.surfaceColor,
          sidebarColor: saved.sidebarColor,
          isActive: true,
          tokens: savedTokens
        };

        const next = existingIndex >= 0 ? [...prev] : [...prev, updated];
        if (existingIndex >= 0) {
          next[existingIndex] = updated;
        }
        return next.map((t) =>
          t.themeName === name
            ? { ...t, isActive: true }
            : { ...t, isActive: false }
        );
      });

      setThemeName(saved.themeName || payload.themeName);
      toast.success('Theme saved');
      onClose();
    } catch (error) {
      console.error('Theme save error:', error);
      toast.error(error.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="theme-editor-title"
    >
      <DialogTitle id="theme-editor-title" component="h2">
        Theme Studio
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, mb: 2 }}>
          <TextField
            label="Theme name"
            value={themeName}
            onChange={(event) => setThemeName(event.target.value)}
            size="small"
            fullWidth
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)',
                mb: 2,
                bgcolor: mode === 'dark' ? '#1f2933' : '#f8fafc'
              }}
            >
              <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
                Live preview
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: backgroundColor,
                  color: textColor,
                  fontFamily: bodyFont,
                  fontSize: `${bodySize}rem`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontFamily: headingFont,
                    transform: `scale(${headingScale})`,
                    transformOrigin: 'left center'
                  }}
                >
                  Festival Express POS
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      p: 1,
                      bgcolor: surfaceColor,
                      color: '#fff'
                    }}
                  >
                    <Typography variant="caption">Featured Category</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Frozen Treats
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 90,
                      borderRadius: 2,
                      p: 1,
                      bgcolor: sidebarColor,
                      color: '#fff'
                    }}
                  >
                    <Typography variant="caption">Checkout</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      $27.75
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: primaryColor,
                    '&:hover': { bgcolor: primaryColor }
                  }}
                >
                  Accept Payment
                </Button>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
                Mode
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(event, value) => {
                  if (value) setMode(value);
                }}
                size="small"
              >
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="dark">Dark</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
              Saved themes for this terminal
            </Typography>
            {loading ? (
              <Typography variant="body2" color="text.secondary">
                Loading themes...
              </Typography>
            ) : themes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No saved themes yet. Use Save to create one.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {themes.map((t) => (
                  <Button
                    key={t.themeName}
                    variant={t.themeName === themeName ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      const tokens = t.tokens || null;
                      setThemeName(t.themeName);
                      setMode(t.mode || 'dark');
                      setPrimaryColor(t.primaryColor || '#f97306');
                      setSurfaceColor(t.surfaceColor || '#1f140b');
                      setSidebarColor(t.sidebarColor || '#28180d');
                      setAccentColor((tokens && tokens.accentColor) || '#ffb347');
                      setBackgroundColor((tokens && tokens.backgroundColor) || '#f8f7f5');
                      setTextColor((tokens && tokens.textColor) || '#1f1b16');
                      setHeadingFont((tokens && tokens.headingFont) || 'Space Grotesk, sans-serif');
                      setBodyFont((tokens && tokens.bodyFont) || 'Space Grotesk, sans-serif');
                      setHeadingScale((tokens && typeof tokens.headingScale === 'number') ? tokens.headingScale : 1.3);
                      setBodySize((tokens && typeof tokens.bodySize === 'number') ? tokens.bodySize : 1);
                      setBackgroundMode((tokens && tokens.backgroundMode) || 'solid');
                      setBackgroundImage((tokens && tokens.backgroundImage) || '');
                      setThemeNotes((tokens && tokens.notes) || '');
                    }}
                  >
                    {t.themeName}{t.isActive ? ' (Active)' : ''}
                  </Button>
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
              Brand colors
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      border: 'none',
                      p: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <TextField
                    label="Primary"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      border: 'none',
                      p: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <TextField
                    label="Accent"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={surfaceColor}
                    onChange={(event) => setSurfaceColor(event.target.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      border: 'none',
                      p: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <TextField
                    label="Surface"
                    value={surfaceColor}
                    onChange={(event) => setSurfaceColor(event.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={sidebarColor}
                    onChange={(event) => setSidebarColor(event.target.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      border: 'none',
                      p: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <TextField
                    label="Sidebar"
                    value={sidebarColor}
                    onChange={(event) => setSidebarColor(event.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      border: 'none',
                      p: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <TextField
                    label="Background"
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      border: 'none',
                      p: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                  <TextField
                    label="Text"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
              Typography
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Headline font"
                  size="small"
                  fullWidth
                  value={headingFont}
                  onChange={(event) => setHeadingFont(event.target.value)}
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
                  select
                  label="Body font"
                  size="small"
                  fullWidth
                  value={bodyFont}
                  onChange={(event) => setBodyFont(event.target.value)}
                >
                  <MenuItem value="Space Grotesk, sans-serif">Space Grotesk</MenuItem>
                  <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                  <MenuItem value="Lato, sans-serif">Lato</MenuItem>
                  <MenuItem value="Merriweather, serif">Merriweather</MenuItem>
                  <MenuItem value="Comic Neue, cursive">Comic Neue</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
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

            <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
              Background
            </Typography>
            <ToggleButtonGroup
              value={backgroundMode}
              exclusive
              onChange={(event, value) => {
                if (value) setBackgroundMode(value);
              }}
              size="small"
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
              onChange={(event) => setBackgroundImage(event.target.value)}
              placeholder="https://example.com/concession.jpg"
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
              Theme notes
            </Typography>
            <TextField
              multiline
              minRows={3}
              fullWidth
              size="small"
              value={themeNotes}
              onChange={(event) => setThemeNotes(event.target.value)}
              placeholder="Describe how this theme fits your concept, season, or white-label partner."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThemeEditor;
