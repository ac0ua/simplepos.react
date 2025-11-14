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
      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
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
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            <IconButton onClick={() => navigate('/')} sx={{ mb: 2 }}>
              <ArrowBack />
            </IconButton>
            
            <Typography variant="h4" fontWeight="bold" gutterBottom>
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
            <Link to="/register" style={{ color: '#2196F3', textDecoration: 'none' }}>
              Sign up
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
