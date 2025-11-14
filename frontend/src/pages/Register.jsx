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
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Chip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import useStore from '../store/useStore';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const storeGuid = useStore((state) => state.storeGuid);
  const label = useStore((state) => state.label);
  const setUser = useStore((state) => state.setUser);
  const setSessionToken = useStore((state) => state.setSessionToken);
  
  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    
    if (!agreeTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }
    
    return true;
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/signup', {
        email,
        password,
        storeGuid,
        label
      });
      
      if (data.success) {
        setUser(data.user);
        setSessionToken(data.token);
        toast.success('Account created successfully!');
        
        // Navigate to store or landing
        if (storeGuid && label) {
          navigate(`/${storeGuid}/${label}/order.html`);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const benefits = [
    'Process payments securely',
    'Access analytics dashboard',
    'Multi-store management',
    'Cloud backup & sync',
    'Priority support'
  ];
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="md">
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
              Create Your Account
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Unlock premium features for your POS system
            </Typography>
          </Box>
          
          {/* Benefits */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Account Benefits:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {benefits.map((benefit, index) => (
                <Chip
                  key={index}
                  icon={<CheckCircleIcon />}
                  label={benefit}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSignup}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
              helperText="We'll use this for account recovery and receipts"
            />
            
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              required
              helperText="Minimum 8 characters"
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
            
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            
            {storeGuid && label && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This account will be linked to store: <strong>{label}</strong>
              </Alert>
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the Terms of Service and Privacy Policy
                </Typography>
              }
              sx={{ mb: 3 }}
            />
            
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !agreeTerms}
              startIcon={<PersonAddIcon />}
              sx={{ mb: 2, py: 1.5 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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
            Continue with GUID Only
          </Button>
          
          <Typography variant="body2" textAlign="center">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2196F3', textDecoration: 'none' }}>
              Login
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
