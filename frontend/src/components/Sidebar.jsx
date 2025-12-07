import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  Grid,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Category as CategoryIcon,
  Insights as InsightsIcon,
  Settings as SettingsIcon,
  Inventory as InventoryIcon,
  Palette as PaletteIcon,
  Restaurant as RestaurantIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';

const Sidebar = ({
  mobileDrawerOpen,
  setMobileDrawerOpen,
  selectedCategory,
  setSelectedCategory,
  categories,
  setCategoriesEditorOpen,
  setMenuManagerOpen
}) => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();

  return (
    <Box
      component="nav"
      sx={{
        height: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        color: 'text.primary'
      }}
    >
      {/* Mobile Close Button */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' }, 
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2, 
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>Menu</Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)} sx={{ color: 'text.primary' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: { xs: 2, md: 1.5, lg: 2 }, borderBottom: 1, borderColor: 'divider' }}>
        <Typography 
          variant="h6" 
          component="h2" 
          fontWeight="bold" 
          sx={{ 
            color: 'text.primary',
            fontSize: { md: '1rem', lg: '1.25rem' }
          }}
        >
          Categories
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, p: { xs: 2, md: 1.5, lg: 2 }, overflowY: 'auto' }}>
        {categories.map((category) => {
          const baseColor = category.color || 'primary.main';
          const selected = selectedCategory === category.id;
          return (
          <ListItem
            key={category.id}
            component="button"
            // selected={selected} // MUI ListItem selected prop adds background color which we are handling manually
            onClick={() => {
              setSelectedCategory(category.id);
              if (setMobileDrawerOpen) setMobileDrawerOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: { xs: 1, md: 0.5, lg: 1 },
              py: { xs: 1, md: 0.75, lg: 1 },
              px: { xs: 2, md: 1.5, lg: 2 },
              bgcolor: selected ? baseColor : 'transparent',
              color: selected ? 'common.white' : 'text.primary',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: { md: 40, lg: 48 },
              '&:hover': {
                bgcolor: selected
                  ? baseColor
                  : 'action.hover' // low-opacity tint when not selected
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 1, lg: 1.5 }, width: '100%' }}>
              <Box sx={{ fontSize: { md: '1.1rem', lg: '1.25rem' }, display: 'flex', alignItems: 'center' }}>
                {category.icon}
              </Box>
              <Typography 
                variant="body2" 
                fontWeight={selected ? 'bold' : 'normal'}
                sx={{ fontSize: { md: '0.8rem', lg: '0.875rem' } }}
              >
                {category.name}
              </Typography>
            </Box>
          </ListItem>
        );
        })}
      </List>
      
      {/* Cashier Actions */}
      <Box sx={{ p: { xs: 2, md: 1.5, lg: 2 }, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2, md: 1.5, lg: 2 } }}>
          <Typography 
            variant="subtitle2" 
            component="h3" 
            fontWeight="bold" 
            sx={{ color: 'text.primary', fontSize: { md: '0.75rem', lg: '0.875rem' } }}
          >
            Cashier Actions
          </Typography>
          <Box sx={{  
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            bgcolor: 'success.main',
            boxShadow: '0 0 8px #4caf50'
          }} />
        </Box>
        <Grid container spacing={{ xs: 1.5, md: 1, lg: 1.5 }}>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <InsightsIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Insights</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <SettingsIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Settings</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate(`/${storeGuid}/${label}/inventory`)}
            >
              <InventoryIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Inventory</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate(`/${storeGuid}/${label}/theme`)}
            >
              <PaletteIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Theme</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => setCategoriesEditorOpen(true)}
            >
              <CategoryIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Category</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate(`/${storeGuid}/${label}/menu-builder`)}
            >
              <RestaurantIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Menu</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate(`/${storeGuid}/${label}/active-orders`)}
            >
              <AssignmentIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Active</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate(`/${storeGuid}/${label}/order-history`)}
            >
              <ReceiptIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Order</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 1.5, lg: 2 },
                bgcolor: 'action.selected',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ExportIcon
                sx={(theme) => ({
                  color: theme.palette.getContrastText(theme.palette.action.selected),
                  fontSize: { xs: 28, md: 22, lg: 28 },
                  mb: 0.5
                })}
              />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: { xs: '0.7rem', md: '0.6rem', lg: '0.7rem' } }}>Export</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <Button
        variant="contained"
        startIcon={<RestaurantIcon sx={{ fontSize: { md: 18, lg: 20 } }} />}
        onClick={() => setMenuManagerOpen(true)}
        sx={{ 
          m: { xs: 2, md: 1.5, lg: 2 }, 
          py: { md: 1, lg: 1.25 },
          bgcolor: 'action.selected',
          color: 'text.primary',
          fontWeight: 'bold',
          fontSize: { md: '0.8rem', lg: '0.875rem' },
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        Manage Menu
      </Button>
    </Box>
  );
};

export default Sidebar;
