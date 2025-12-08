/**
 * Sidebar Component - Material Design 3
 * Simplified category navigation
 * Uses CSS variables for accessible text colors
 */
import React from 'react';
import { Box, Typography, IconButton, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

function Sidebar({
  mobileDrawerOpen,
  setMobileDrawerOpen,
  selectedCategory,
  setSelectedCategory,
  categories = [],
}) {
  const handleSelect = (categoryId) => {
    setSelectedCategory(categoryId);
    if (setMobileDrawerOpen) setMobileDrawerOpen(false);
  };

  return (
    <Box
      component="nav"
      sx={{
        height: '100%',
        bgcolor: 'var(--theme-sidebar-color, background.paper)',
        color: 'var(--theme-sidebar-text-color, inherit)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Mobile Header */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} color="primary">
          Categories
        </Typography>
        <IconButton size="small" onClick={() => setMobileDrawerOpen(false)} sx={{ color: 'inherit' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Desktop Header */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          p: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'inherit' }}>
          Categories
        </Typography>
      </Box>

      {/* Category List */}
      <List sx={{ flex: 1, overflow: 'auto', py: 1, px: 0.5 }}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <ListItemButton
              key={cat.id}
              selected={isSelected}
              onClick={() => handleSelect(cat.id)}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                py: 0.75,
                minHeight: 40,
                bgcolor: isSelected ? (cat.color || 'primary.main') : 'transparent',
                color: isSelected ? 'primary.contrastText' : 'var(--theme-sidebar-text-color, inherit)',
                '&:hover': {
                  bgcolor: isSelected ? (cat.color || 'primary.main') : 'rgba(255,255,255,0.08)',
                },
                '&.Mui-selected': {
                  bgcolor: cat.color || 'primary.main',
                  '&:hover': {
                    bgcolor: cat.color || 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: 'inherit',
                  '& svg': { fontSize: 20 },
                }}
              >
                {cat.icon}
              </ListItemIcon>
              <ListItemText
                primary={cat.name}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '0.8rem',
                  color: 'inherit',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export default Sidebar;
