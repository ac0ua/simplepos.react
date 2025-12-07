import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CropLandscape as CropLandscapeIcon,
  CropPortrait as CropPortraitIcon,
  Image as ImageIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DragIndicator as DragHandleIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useStoreContext } from '../contexts/StoreContext';
import useStore from '../store/useStore';

const SAMPLE_BACKGROUNDS = [
  { id: 'none', label: 'No background', url: null },
  {
    id: 'wood',
    label: 'Woodgrain',
    url: 'https://images.unsplash.com/photo-1516684669134-de6cec06c602?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'marble',
    label: 'Marble',
    url: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1200&q=80'
  }
];

const PALETTE_ITEMS = [
  { type: 'category-grid', label: 'Category Grid', description: 'Two-column layout' },
  { type: 'featured', label: 'Featured Banner', description: 'Big title + subtitle' },
  { type: 'menu-column', label: 'Menu Column', description: 'Single column layout' },
  { type: 'headline', label: 'Headline', description: 'Large text block' },
  { type: 'body', label: 'Body Copy', description: 'Paragraph text' },
  { type: 'divider', label: 'Divider Line', description: 'Visual separator' }
];

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const number = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isNaN(number)) {
    return String(value);
  }
  return `$${number.toFixed(2)}`;
}

function buildCategoryGroups(categories, products) {
  const normalizedCategories = (categories || [])
    .filter((cat) => cat && cat.id && cat.id !== 'all' && cat.visible !== false);

  const byId = new Map();
  normalizedCategories.forEach((cat) => {
    byId.set(String(cat.id).toLowerCase(), { category: cat, items: [] });
  });

  const byName = new Map();
  normalizedCategories.forEach((cat) => {
    if (cat.name) {
      byName.set(String(cat.name).toLowerCase(), cat);
    }
  });

  (products || []).forEach((product) => {
    if (!product) {
      return;
    }
    const rawCategory = String(product.category || '').toLowerCase();
    if (!rawCategory) {
      return;
    }
    let targetGroup = byId.get(rawCategory);
    if (!targetGroup) {
      const nameMatch = byName.get(rawCategory);
      if (nameMatch) {
        targetGroup = byId.get(String(nameMatch.id).toLowerCase()) || null;
      }
    }
    if (!targetGroup) {
      return;
    }
    targetGroup.items.push(product);
  });

  const groups = Array.from(byId.values());
  groups.sort((a, b) => {
    const aOrder = typeof a.category.sortOrder === 'number' ? a.category.sortOrder : 0;
    const bOrder = typeof b.category.sortOrder === 'number' ? b.category.sortOrder : 0;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    const aName = String(a.category.name || '').toLowerCase();
    const bName = String(b.category.name || '').toLowerCase();
    return aName.localeCompare(bName);
  });

  return groups;
}

function buildMenuThemes(theme) {
  const primary = theme.palette.primary.main;
  const surface = theme.palette.background.paper;
  const onSurface = theme.palette.text.primary;
  const isDark = theme.palette.mode === 'dark';

  return [
    {
      id: 'match-theme',
      label: 'Match store theme',
      surface,
      text: onSurface,
      headline: primary,
      overlay: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.96)'
    },
    {
      id: 'dark-neon',
      label: 'Dark Neon',
      surface: 'rgba(15, 23, 42, 0.96)',
      text: '#f9fafb',
      headline: '#f97306',
      overlay: 'rgba(15, 23, 42, 0.94)'
    },
    {
      id: 'light-paper',
      label: 'Light Paper',
      surface: '#ffffff',
      text: '#111827',
      headline: '#ea580c',
      overlay: 'rgba(249, 250, 251, 0.96)'
    }
  ];
}

function MenuCanvas({
  blocks,
  groups,
  orientation,
  backgroundUrl,
  menuTheme,
  highlight,
  readonly,
  onDuplicateBlock,
  onRemoveBlock,
  onMoveBlock,
  onReorderBlocks
}) {
  const aspectRatioValue = orientation === 'landscape' ? '11 / 8.5' : '8.5 / 11';
  const headingColor = menuTheme.headline;
  const surfaceColor = menuTheme.surface;
  const textColor = menuTheme.text;
  const overlayColor = menuTheme.overlay;

  const hasBlocks = blocks && blocks.length > 0;

  const renderBlockContent = (block) => {
    switch (block.type) {
      case 'featured':
        return (
          <Paper
            elevation={8}
            sx={{
              borderRadius: 2.5,
              px: { xs: 2, md: 3 },
              py: 2,
              mb: 1,
              textAlign: 'center',
              bgcolor: surfaceColor,
              color: textColor
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                letterSpacing: '.3em',
                fontWeight: 800,
                textTransform: 'uppercase',
                fontSize: { xs: '1.4rem', md: '1.75rem' }
              }}
              contentEditable={!readonly}
              suppressContentEditableWarning
            >
              CONCESSION MENU
            </Typography>
            <Typography
              variant="caption"
              component="p"
              sx={{
                mt: 1,
                textTransform: 'uppercase',
                letterSpacing: '.25em',
                opacity: 0.85
              }}
              contentEditable={!readonly}
              suppressContentEditableWarning
            >
              Game night specials • Served fresh
            </Typography>
          </Paper>
        );
      case 'category-grid': {
        if (!groups || groups.length === 0) {
          return (
            <Paper
              elevation={2}
              sx={{
                borderRadius: 2,
                p: 2,
                bgcolor: 'background.paper',
                color: 'text.secondary',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2">
                No categories or products yet. Add items to your menu to see them here.
              </Typography>
            </Paper>
          );
        }

        return (
          <Grid container spacing={2.5}>
            {groups.map((group) => (
              <Grid key={group.category.id} item xs={12} md={6}>
                <Paper
                  elevation={8}
                  sx={{
                    borderRadius: 2,
                    p: 2.25,
                    bgcolor: overlayColor,
                    color: textColor,
                    border: '1px solid',
                    borderColor: headingColor,
                    height: '100%'
                  }}
                >
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      mb: 1.75,
                      pb: 0.75,
                      borderBottom: '1px solid',
                      borderColor: headingColor,
                      color: headingColor,
                      letterSpacing: '.18em',
                      textTransform: 'uppercase',
                      fontSize: { xs: '0.9rem', md: '1rem' }
                    }}
                    contentEditable={!readonly}
                    suppressContentEditableWarning
                  >
                    {group.category.name}
                  </Typography>

                  {group.items.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'rgba(156, 163, 184, 0.9)' }}>
                      No items in this category.
                    </Typography>
                  ) : (
                    <Stack spacing={0.5}>
                      {group.items.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            fontSize: '0.95rem'
                          }}
                        >
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{
                              pr: 2,
                              flex: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            contentEditable={!readonly}
                            suppressContentEditableWarning
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ fontWeight: 700 }}
                            contentEditable={!readonly}
                            suppressContentEditableWarning
                          >
                            {formatPrice(item.price)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        );
      }
      case 'menu-column': {
        if (!groups || groups.length === 0) {
          return (
            <Paper
              elevation={2}
              sx={{
                borderRadius: 2,
                p: 2,
                bgcolor: 'background.paper',
                color: 'text.secondary',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2">
                No categories or products yet. Add items to your menu to see them here.
              </Typography>
            </Paper>
          );
        }

        return (
          <Paper
            elevation={8}
            sx={{
              borderRadius: 2,
              p: 2.25,
              bgcolor: overlayColor,
              color: textColor,
              border: '1px solid',
              borderColor: headingColor
            }}
          >
            <Stack spacing={2}>
              {groups.map((group) => (
                <Box key={group.category.id}>
                  <Typography
                    variant="subtitle1"
                    component="h2"
                    sx={{
                      mb: 0.75,
                      pb: 0.5,
                      borderBottom: '1px solid',
                      borderColor: headingColor,
                      color: headingColor,
                      letterSpacing: '.18em',
                      textTransform: 'uppercase',
                      fontSize: { xs: '0.9rem', md: '1rem' }
                    }}
                    contentEditable={!readonly}
                    suppressContentEditableWarning
                  >
                    {group.category.name}
                  </Typography>

                  {group.items.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'rgba(156, 163, 184, 0.9)' }}>
                      No items in this category.
                    </Typography>
                  ) : (
                    <Stack spacing={0.5}>
                      {group.items.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            fontSize: '0.95rem'
                          }}
                        >
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{
                              pr: 2,
                              flex: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            contentEditable={!readonly}
                            suppressContentEditableWarning
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ fontWeight: 700 }}
                            contentEditable={!readonly}
                            suppressContentEditableWarning
                          >
                            {formatPrice(item.price)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>
        );
      }
      case 'headline':
        return (
          <Paper
            elevation={4}
            sx={{
              borderRadius: 2,
              p: 2,
              bgcolor: surfaceColor,
              color: textColor
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700 }}
              contentEditable={!readonly}
              suppressContentEditableWarning
            >
              Editable headline text goes here
            </Typography>
          </Paper>
        );
      case 'body':
        return (
          <Paper
            elevation={2}
            sx={{
              borderRadius: 2,
              p: 2,
              bgcolor: surfaceColor,
              color: textColor
            }}
          >
            <Typography
              variant="body2"
              sx={{ lineHeight: 1.5 }}
              contentEditable={!readonly}
              suppressContentEditableWarning
            >
              Use this block for notes, disclaimers, or event details. All text is fully editable.
            </Typography>
          </Paper>
        );
      case 'divider':
        return (
          <Box sx={{ py: 1 }}>
            <Divider
              sx={{
                borderColor: 'rgba(148, 163, 184, 0.6)',
                borderStyle: 'dashed'
              }}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      className="print-canvas-wrapper"
      sx={{
        borderRadius: 3,
        border: '1px dashed',
        borderColor: highlight ? 'primary.main' : 'divider',
        p: 2,
        bgcolor: 'background.default',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        minHeight: 420,
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
        boxShadow: highlight ? 6 : 1
      }}
    >
      <Box
        className="print-menu-canvas"
        sx={{
          width: '100%',
          maxWidth: 1000,
          aspectRatio: aspectRatioValue,
          borderRadius: 2.5,
          overflow: 'hidden',
          position: 'relative',
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2.5, md: 3.5 },
          bgcolor: backgroundUrl ? 'transparent' : 'background.paper',
          boxShadow: 6
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: backgroundUrl ? overlayColor : 'transparent'
          }}
        />
        <Box
          className="print-content"
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflow: 'auto',
            pb: 4
          }}
        >
          {hasBlocks ? (
            <>
              {blocks.map((block, index) => (
                <Box
                  key={block.id}
                  sx={{ position: 'relative' }}
                  onDragOver={(event) => {
                    if (!onReorderBlocks) {
                      return;
                    }
                    const sourceId = event.dataTransfer
                      ? event.dataTransfer.getData('application/x-menu-block-id')
                      : '';
                    if (!sourceId) {
                      return;
                    }
                    event.preventDefault();
                    if (event.dataTransfer) {
                      event.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(event) => {
                    if (!onReorderBlocks) {
                      return;
                    }
                    const sourceId = event.dataTransfer
                      ? event.dataTransfer.getData('application/x-menu-block-id')
                      : '';
                    if (!sourceId || sourceId === block.id) {
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    onReorderBlocks(sourceId, block.id);
                  }}
                >
                  {!readonly && (
                    <Box
                      className="print-hide"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5,
                        bgcolor: 'rgba(15, 23, 42, 0.75)',
                        borderRadius: 999,
                        p: 0.5
                      }}
                      draggable={!!onReorderBlocks}
                      onDragStart={(event) => {
                        if (!onReorderBlocks) {
                          return;
                        }
                        event.stopPropagation();
                        if (event.dataTransfer) {
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('application/x-menu-block-id', block.id);
                        }
                      }}
                    >
                    <IconButton
                      size="small"
                      sx={{ color: 'rgba(249, 250, 251, 0.9)' }}
                      aria-label="Move block up"
                      onClick={() => onMoveBlock && onMoveBlock(block.id, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUpwardIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: 'rgba(249, 250, 251, 0.9)' }}
                      aria-label="Move block down"
                      onClick={() => onMoveBlock && onMoveBlock(block.id, 1)}
                      disabled={index === blocks.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: 'rgba(249, 250, 251, 0.9)' }}
                      aria-label="Duplicate block"
                      onClick={() => onDuplicateBlock && onDuplicateBlock(block.id)}
                    >
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: 'rgba(248, 113, 113, 0.9)' }}
                      aria-label="Remove block"
                      onClick={() => onRemoveBlock && onRemoveBlock(block.id)}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                    <DragHandleIcon
                      fontSize="small"
                      sx={{
                        color: 'rgba(209, 213, 219, 0.9)',
                        ml: 0.5,
                        cursor: onReorderBlocks ? 'grab' : 'default'
                      }}
                    />
                  </Box>
                )}

                {renderBlockContent(block)}
              </Box>
              ))}

              {!readonly && (
                <Box
                  className="print-hide"
                  sx={{
                    mt: 1.5,
                    borderRadius: 2,
                    border: '2px dashed rgba(148, 163, 184, 0.7)',
                    px: 3,
                    py: 2,
                    textAlign: 'center',
                    color: 'rgba(148, 163, 184, 0.95)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.2em'
                  }}
                >
                  Drop new items here
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                borderRadius: 2,
                border: '2px dashed rgba(148, 163, 184, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                textAlign: 'center',
                color: 'rgba(148, 163, 184, 0.95)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.2em'
              }}
            >
              Drag elements from the left to start your menu
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

const PrintableMenuEditor = () => {
  const { products, categories } = useStoreContext();
  const theme = useTheme();
  const { storeGuid, label: routeLabel } = useParams();
  const navigate = useNavigate();
  const storeLabel = useStore((state) => state.label) || routeLabel;

  const [orientation, setOrientation] = useState('portrait');
  const [backgroundId, setBackgroundId] = useState('none');
  const [uploadedBackground, setUploadedBackground] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false);
  const [menuThemeId, setMenuThemeId] = useState('match-theme');

  const initialBlocks = useMemo(
    () => [
      { id: 'featured-1', type: 'featured' },
      { id: 'category-grid-1', type: 'category-grid' }
    ],
    []
  );

  const [blocks, setBlocks] = useState(initialBlocks);

  const groups = useMemo(
    () => buildCategoryGroups(categories, products),
    [categories, products]
  );

  const menuThemes = useMemo(
    () => buildMenuThemes(theme),
    [theme]
  );

  const activeMenuTheme =
    menuThemes.find((entry) => entry.id === menuThemeId) || menuThemes[0];

  const resolvedBackgroundUrl = uploadedBackground
    ? uploadedBackground
    : (SAMPLE_BACKGROUNDS.find((bg) => bg.id === backgroundId) || {}).url || null;

  const handleBackgroundUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : null;
      setUploadedBackground(value);
      setBackgroundId('upload');
    };
    reader.readAsDataURL(file);
  };

  const handleAddBlock = (type) => {
    const isKnownType = PALETTE_ITEMS.some((item) => item.type === type);
    if (!isKnownType) {
      return;
    }
    const id = `${type}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
    setBlocks((current) => [...current, { id, type }]);
  };

  const handleDuplicateBlock = (blockId) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      if (index === -1) {
        return current;
      }
      const original = current[index];
      const copy = { ...original, id: `${original.type}-${Date.now()}-${index}` };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const handleClearMenu = () => {
    setBlocks(initialBlocks);
    setOrientation('portrait');
    setBackgroundId('none');
    setUploadedBackground(null);
    setMenuThemeId('match-theme');
  };

  const handleRemoveBlock = (blockId) => {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
  };

  const handleMoveBlock = (blockId, direction) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      if (index === -1) {
        return current;
      }
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleReorderBlocks = (sourceId, targetId) => {
    setBlocks((current) => {
      if (!sourceId || !targetId || sourceId === targetId) {
        return current;
      }

      const sourceIndex = current.findIndex((block) => block.id === sourceId);
      const targetIndex = current.findIndex((block) => block.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(insertIndex, 0, moved);
      return next;
    });
  };

  const handleCanvasDragOver = (event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    setIsDraggingOverCanvas(true);
  };

  const handleCanvasDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsDraggingOverCanvas(false);
  };

  const handleCanvasDrop = (event) => {
    event.preventDefault();
    setIsDraggingOverCanvas(false);
    const type =
      (event.dataTransfer &&
        (event.dataTransfer.getData('application/x-menu-block') ||
          event.dataTransfer.getData('text/plain')))
      || '';
    if (!type) {
      return;
    }
    handleAddBlock(type);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (storeGuid && storeLabel) {
      navigate(`/${storeGuid}/${encodeURIComponent(storeLabel)}/order.html`);
    } else {
      navigate('/');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box
        className="no-print"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBack} aria-label="Back to POS">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: '.3em' }}>
              Print Suite
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Printable Menu Editor
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Build a branded menu from your live categories and products. Adjust orientation,
              background, menu theme and print directly or save as PDF.
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Menu
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4} className="no-print">
          <Paper
            elevation={4}
            sx={{
              p: 2.5,
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Menu Elements
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Drag to place on canvas
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={handleClearMenu}
              >
                Clear
              </Button>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Layout
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Choose page orientation and background styling.
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  Orientation
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={orientation}
                  onChange={(_, value) => {
                    if (value) {
                      setOrientation(value);
                    }
                  }}
                  aria-label="Menu orientation"
                >
                  <ToggleButton value="portrait" aria-label="Portrait">
                    <CropPortraitIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="landscape" aria-label="Landscape">
                    <CropLandscapeIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  Background image
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {SAMPLE_BACKGROUNDS.map((bg) => (
                    <Chip
                      key={bg.id}
                      label={bg.label}
                      size="small"
                      icon={<ImageIcon fontSize="small" />}
                      variant={backgroundId === bg.id ? 'filled' : 'outlined'}
                      color={backgroundId === bg.id ? 'primary' : 'default'}
                      onClick={() => {
                        setBackgroundId(bg.id);
                        if (bg.id !== 'upload') {
                          setUploadedBackground(null);
                        }
                      }}
                    />
                  ))}
                </Stack>
                <Box sx={{ mt: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ImageIcon />}
                    component="label"
                  >
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleBackgroundUpload}
                    />
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Menu Theme
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Choose a visual style for the printed menu that is independent from the POS theme.
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ mt: 1.5 }}
              >
                {menuThemes.map((entry) => (
                  <Chip
                    key={entry.id}
                    label={entry.label}
                    size="small"
                    icon={<PaletteIcon fontSize="small" />}
                    variant={menuThemeId === entry.id ? 'filled' : 'outlined'}
                    color={menuThemeId === entry.id ? 'primary' : 'default'}
                    onClick={() => setMenuThemeId(entry.id)}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Menu Items
                </Typography>
                <Chip
                  size="small"
                  label="Dynamic list"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Drag items onto the canvas or click to add them.
              </Typography>
              <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                {PALETTE_ITEMS.map((item) => (
                  <Grid key={item.type} item xs={12}>
                    <Box
                      component="button"
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        if (event.dataTransfer) {
                          event.dataTransfer.effectAllowed = 'copy';
                          event.dataTransfer.setData('application/x-menu-block', item.type);
                          event.dataTransfer.setData('text/plain', item.type);
                        }
                      }}
                      onClick={() => handleAddBlock(item.type)}
                      sx={{
                        width: '100%',
                        textAlign: 'left',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        px: 1.5,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        cursor: 'grab',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DragHandleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', display: 'block' }}
                          >
                            {item.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onDragLeave={handleCanvasDragLeave}
          >
            <MenuCanvas
              blocks={blocks}
              groups={groups}
              orientation={orientation}
              backgroundUrl={resolvedBackgroundUrl}
              menuTheme={activeMenuTheme}
              highlight={isDraggingOverCanvas}
              readonly={false}
              onDuplicateBlock={handleDuplicateBlock}
              onRemoveBlock={handleRemoveBlock}
              onMoveBlock={handleMoveBlock}
              onReorderBlocks={handleReorderBlocks}
            />
          </Box>
        </Grid>
      </Grid>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth="lg"
        className="no-print"
      >
        <DialogTitle>Print Preview</DialogTitle>
        <DialogContent>
          <MenuCanvas
            blocks={blocks}
            groups={groups}
            orientation={orientation}
            backgroundUrl={resolvedBackgroundUrl}
            menuTheme={activeMenuTheme}
            highlight={false}
            readonly
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PrintableMenuEditor;
