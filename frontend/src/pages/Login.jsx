import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  Login as LoginIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import useStore from '../store/useStore';
import { API_URL } from '../config/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setUser = useStore((state) => state.setUser);
  const setSessionToken = useStore((state) => state.setSessionToken);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (data.success) {
        setUser(data.user);
        setSessionToken(data.token);
        toast.success('Login successful!');
        
        // Navigate to store selection or last visited store
        if (data.user.stores && data.user.stores.length > 0) {
          const lastStore = data.user.stores[0];
          navigate(`/${lastStore.guid}/${lastStore.label}/order.html`);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <IconButton onClick={() => navigate('/')} sx={{ mb: 2 }} aria-label="Back to home">
              <ArrowBack />
            </IconButton>
            
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Welcome Back
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Login to access payment features and manage your stores
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{ mb: 2, py: 1.5 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              OR
            </Typography>
          </Divider>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ mb: 2 }}
          >
            Access Store with GUID
          </Button>
          
          <Typography variant="body2" textAlign="center">
            Don't have an account?{' '}
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}>
                Sign up
              </Typography>
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
