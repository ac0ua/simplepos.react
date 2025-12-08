import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem
} from '@mui/material';
import {
  Close as CloseIcon
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
    </Box>
  );
};

export default Sidebar;
