import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper
} from '@mui/material';
import {
  Home as HomeIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 5,
              borderRadius: 3,
              bgcolor: 'background.paper',
              textAlign: 'center'
            }}
          >
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h1" fontWeight="bold" sx={{ mb: 2 }}>
              404
            </Typography>
            
            <Typography variant="h5" component="h2" gutterBottom>
              Page Not Found
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              The page you're looking for doesn't exist or has been moved.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ px: 4, py: 1.5 }}
            >
              Back to Home
            </Button>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default NotFound;
