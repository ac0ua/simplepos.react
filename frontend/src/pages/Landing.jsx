import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  Chip,
  Tabs,
  Tab,
  Alert,
  Checkbox,
  FormControlLabel,
  Backdrop
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  AutoAwesome as AutoAwesomeIcon,
  Search as SearchIcon,
  Store as StoreIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useStoreContext } from '../contexts/StoreContext';
import useStore from '../store/useStore';
import AnimatedLoading from '../components/AnimatedLoading';

const Landing = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); // 0 = Access, 1 = Create New, 2 = Find My Store
  
  // Access existing store
  const [guid, setGuid] = useState('');
  const [label, setLabel] = useState('');
  
  // Create new store
  const [newGuid, setNewGuid] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailConsent, setEmailConsent] = useState(false);
  
  // Find my store
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [foundStores, setFoundStores] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { accessStore, generateGuid, recoverStore } = useStoreContext();
  const setStoreInfo = useStore((state) => state.setStoreInfo);
  const setSessionToken = useStore((state) => state.setSessionToken);
  
  // Auto-generate GUID when Create tab is opened
  useEffect(() => {
    if (tabValue === 1 && !newGuid) {
      handleGenerateNewGuid();
    }
  }, [tabValue]);
  
  // Generate new GUID for creating new store
  const handleGenerateNewGuid = async () => {
    try {
      if (!generateGuid) {
        // Fallback: generate GUID client-side
        const fallbackGuid = crypto.randomUUID();
        setNewGuid(fallbackGuid);
        return;
      }
      const generatedGuid = await generateGuid();
      if (generatedGuid) {
        setNewGuid(generatedGuid);
      } else {
        throw new Error('No GUID returned');
      }
    } catch (error) {
      console.error('GUID generation error:', error);
      // Fallback: generate GUID client-side
      try {
        const fallbackGuid = crypto.randomUUID();
        setNewGuid(fallbackGuid);
        // Silent fallback - GUID generated successfully
      } catch (fallbackError) {
        console.error('Fallback GUID generation failed:', fallbackError);
        toast.error('Failed to generate GUID. Please refresh the page.');
      }
    }
  };
  
  // Copy GUID to clipboard
  const handleCopyGuid = (guidToCopy) => {
    if (guidToCopy) {
      navigator.clipboard.writeText(guidToCopy);
      toast.success('GUID copied to clipboard!');
    }
  };
  
  // Access existing store
  const handleAccessStore = async () => {
    // Normalize inputs: trim and strip any leading slashes from GUID
    const cleanedGuid = guid.trim().replace(/^\/+/, '');
    const cleanedLabel = label.trim();

    if (!cleanedGuid || !cleanedLabel) {
      setError('Please enter both GUID and Store Label');
      return;
    }

    // Update fields with cleaned values so the UI matches what is sent
    setGuid(cleanedGuid);
    setLabel(cleanedLabel);

    setLoading(true);
    setError('');
    
    try {
      const response = await accessStore(cleanedGuid, cleanedLabel);
      
      if (response.success) {
        setStoreInfo(response.storeGuid, response.label);
        setSessionToken(response.sessionToken);
        navigate(`/${response.storeGuid}/${response.label}/order.html`);
      }
    } catch (error) {
      setError('Failed to access store. Please try again.');
      console.error('Store access error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Create new store
  const handleCreateNewStore = async () => {
    if (!newGuid || !newBusinessName) {
      setError('Please enter a business name');
      return;
    }

    // Validate email consent if email is provided
    if (newEmail && !emailConsent) {
      setError('Please check the box to confirm store details will be sent to your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert business name to URL-friendly label
      const urlLabel = newBusinessName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        .substring(0, 20); // Limit length

      const response = await accessStore(newGuid, urlLabel, newEmail, newBusinessName, emailConsent);

      if (response.success) {
        setStoreInfo(response.storeGuid, response.label);
        setSessionToken(response.sessionToken);

        // Show success message with recovery info
        if (newEmail) {
          toast.success(`Store "${newBusinessName}" created! Recovery email: ${newEmail}`);
        } else {
          toast.success(`Store "${newBusinessName}" created! Save your GUID and label to access later.`);
        }

        navigate(`/${response.storeGuid}/${response.label}/order.html`);
      }
    } catch (error) {
      setError('Failed to create store. Please try again.');
      console.error('Store creation error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Recover stores by email
  const handleRecoverStores = async () => {
    if (!recoveryEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setFoundStores([]);
    setSearchPerformed(false);

    try {
      const response = await recoverStore(recoveryEmail);
      
      if (response.success && response.stores) {
        setFoundStores(response.stores);
        setSearchPerformed(true);
        
        if (response.stores.length === 0) {
          toast.info('No stores found for this email address');
        } else {
          toast.success(`Found ${response.stores.length} store(s)!`);
        }
      }
    } catch (error) {
      setError('Failed to search for stores. Please try again.');
      console.error('Store recovery error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Access a recovered store
  const handleAccessRecoveredStore = async (store) => {
    setLoading(true);
    try {
      const response = await accessStore(store.guid, store.label);
      
      if (response.success) {
        setStoreInfo(response.storeGuid, response.label);
        setSessionToken(response.sessionToken);
        toast.success(`Accessing ${store.businessName}...`);
        navigate(`/${response.storeGuid}/${response.label}/order.html`);
      }
    } catch (error) {
      setError('Failed to access store. Please try again.');
      console.error('Store access error:', error);
      setLoading(false);
    }
  };
  
  // Use demo store
  const handleDemoStore = () => {
    const demoGuid = '6c24c729-3edc-4ada-be8f-96d34b4d8dd3';
    const demoLabel = 'happydays';
    setGuid(demoGuid);
    setLabel(demoLabel);
    setTabValue(0);
    toast.success('Demo credentials loaded!');
  };
  
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
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
              Access Your Store
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Enter your store GUID and label to access the POS system
            </Typography>
            
            {/* Tabs for Access vs Create New */}
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              centered
              sx={{ mb: 3 }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Access Existing" />
              <Tab label="Create New Store" />
              <Tab label="Find My Store" icon={<SearchIcon />} iconPosition="start" />
            </Tabs>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* Access Existing Store Tab */}
            {tabValue === 0 && (
              <Box>
                <TextField
                  fullWidth
                  label="Store GUID"
                  placeholder="e.g., 6c24c729-3edc-4ada-be8f-96d34b4d8dd3"
                  value={guid}
                  onChange={(e) => setGuid(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => handleCopyGuid(guid)} size="small" disabled={!guid}>
                          <CopyIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Store Label"
                  placeholder="e.g., happydays"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  sx={{ mb: 3 }}
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleAccessStore}
                  disabled={loading}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  {loading ? 'Accessing Store...' : 'Access Store'}
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleDemoStore}
                  sx={{ mb: 2 }}
                >
                  Use Demo Store
                </Button>
              </Box>
            )}
            
            {/* Create New Store Tab */}
            {tabValue === 1 && (
              <Box>
                {newGuid ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    A unique GUID has been auto-generated for your new store
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Generating GUID... If it doesn't appear, click the refresh button below.
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Store GUID (Auto-generated)"
                  value={newGuid || 'Generating...'}
                  disabled
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => handleCopyGuid(newGuid)} size="small" disabled={!newGuid}>
                          <CopyIcon />
                        </IconButton>
                        <IconButton onClick={handleGenerateNewGuid} size="small" title="Generate new GUID">
                          <RefreshIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  label="Business Name"
                  placeholder="e.g., My Coffee Shop"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                  helperText="This will be your store's display name and will generate a URL-friendly label"
                />

                <TextField
                  fullWidth
                  type="email"
                  label="Email (Optional)"
                  placeholder="your@email.com"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    // Reset consent when email changes
                    if (e.target.value !== newEmail) {
                      setEmailConsent(false);
                    }
                  }}
                  sx={{ mb: newEmail ? 1 : 3 }}
                  helperText={newEmail ? "" : "For recovery if you lose your GUID"}
                />

                {newEmail && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={emailConsent}
                        onChange={(e) => setEmailConsent(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Store details will be sent to this email address"
                    sx={{ mb: 3, alignItems: 'flex-start' }}
                  />
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCreateNewStore}
                  disabled={loading || !newBusinessName}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  {loading ? 'Creating Store...' : 'Create Store'}
                </Button>

                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    <strong>Important:</strong> Save your GUID and Business Name! You'll need them to access your store.
                    The URL will use a simplified version of your business name.
                    {newEmail && ' A copy will be sent to your email.'}
                  </Typography>
                </Alert>
              </Box>
            )}
            
            {/* Find My Store Tab */}
            {tabValue === 2 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter the email address you used when creating your store
                </Typography>
                
                <TextField
                  fullWidth
                  label="Recovery Email"
                  type="email"
                  placeholder="e.g., you@example.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleRecoverStores}
                  disabled={loading || !recoveryEmail}
                  startIcon={<SearchIcon />}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  {loading ? 'Searching...' : 'Find My Stores'}
                </Button>
                
                {/* Display found stores */}
                {searchPerformed && (
                  <Box sx={{ mt: 3 }}>
                    {foundStores.length > 0 ? (
                      <>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'success.main' }}>
                          Found {foundStores.length} store(s):
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {foundStores.map((store, index) => (
                            <Paper
                              key={index}
                              elevation={2}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  elevation: 4,
                                  bgcolor: 'action.hover',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                              onClick={() => handleAccessRecoveredStore(store)}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <StoreIcon color="primary" />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="600">
                                    {store.businessName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Label: {store.label}
                                  </Typography>
                                  {store.lastAccess && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                      <AccessTimeIcon sx={{ fontSize: 14 }} color="action" />
                                      <Typography variant="caption" color="text.secondary">
                                        Last accessed: {new Date(store.lastAccess).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                                <AutoAwesomeIcon color="action" />
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      </>
                    ) : (
                      <Alert severity="info">
                        No stores found for this email address. 
                        Make sure you entered the correct email or create a new store.
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
            )}
            
            <Divider sx={{ my: 3 }}>
              <Chip label="OR" />
            </Divider>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="text"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                fullWidth
                variant="text"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
              Sign up for an account to enable payment processing and advanced features
            </Typography>
          </Paper>
        </motion.div>
      </Container>

      {/* Animated Loading Overlay */}
      <Backdrop
        open={loading}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 1,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Paper
          elevation={12}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            minWidth: '300px'
          }}
        >
          <AnimatedLoading 
            message={tabValue === 0 ? 'Accessing Your Store...' : 'Creating Your Store...'}
          />
        </Paper>
      </Backdrop>
    </Box>
  );
};

export default Landing;
