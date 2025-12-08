import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Divider,
  Avatar,
  InputAdornment,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Store as StoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  AccessTime as HoursIcon,
  Receipt as TaxIcon,
  CreditCard as PaymentIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { IS_PHP_BACKEND } from '../config/api';

const BusinessInfo = () => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    tagline: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    taxId: '',
    taxRate: '',
    currency: 'USD',
    receiptHeader: '',
    receiptFooter: '',
    showTaxOnReceipt: true,
    acceptCash: true,
    acceptCard: true,
    acceptMobile: false,
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '15:00', closed: false },
      sunday: { open: '', close: '', closed: true }
    }
  });

  // Load business info
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      setLoading(true);
      try {
        let response;
        if (IS_PHP_BACKEND) {
          response = await axios.get('/stores/business-info.php', {
            params: { storeGuid }
          });
        } else {
          response = await axios.get(`/stores/${storeGuid}/business-info`);
        }
        
        if (response.data.success && response.data.businessInfo) {
          setBusinessInfo(prev => ({ ...prev, ...response.data.businessInfo }));
        }
      } catch (error) {
        // If no business info exists yet, use defaults
        console.log('No existing business info, using defaults');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinessInfo();
  }, [storeGuid]);

  const handleChange = (field, value) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleHoursChange = (day, field, value) => {
    setBusinessInfo(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours[day], [field]: value }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (IS_PHP_BACKEND) {
        await axios.post('/stores/business-info.php', {
          storeGuid,
          businessInfo
        });
      } else {
        await axios.put(`/stores/${storeGuid}/business-info`, businessInfo);
      }
      toast.success('Business information saved!');
    } catch (error) {
      console.error('Failed to save business info:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(`/${storeGuid}/${label}`)}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Business Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your store details, contact info, and settings
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Basic Info */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <StoreIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Store Details</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                >
                  <StoreIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Button variant="outlined" startIcon={<CameraIcon />} size="small">
                  Upload Logo
                </Button>
              </Box>
              
              <TextField
                fullWidth
                label="Business Name"
                value={businessInfo.name}
                onChange={(e) => handleChange('name', e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Tagline / Slogan"
                value={businessInfo.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="e.g., Fresh coffee, made with love"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Currency"
                value={businessInfo.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                placeholder="USD"
              />
            </Paper>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <PhoneIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Contact Information</Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Phone Number"
                value={businessInfo.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={businessInfo.email}
                onChange={(e) => handleChange('email', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Website"
                value={businessInfo.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.example.com"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><WebsiteIcon fontSize="small" /></InputAdornment>
                }}
              />
            </Paper>
          </Grid>

          {/* Address */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LocationIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Address</Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Street Address"
                value={businessInfo.address}
                onChange={(e) => handleChange('address', e.target.value)}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={businessInfo.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={businessInfo.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="ZIP/Postal Code"
                    value={businessInfo.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={businessInfo.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Tax & Payments */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TaxIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Tax & Payments</Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Tax ID / Business Number"
                value={businessInfo.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Tax Rate (%)"
                type="number"
                value={businessInfo.taxRate}
                onChange={(e) => handleChange('taxRate', e.target.value)}
                placeholder="e.g., 8.25"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Accepted Payment Methods
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={businessInfo.acceptCash}
                    onChange={(e) => handleChange('acceptCash', e.target.checked)}
                  />
                }
                label="Cash"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={businessInfo.acceptCard}
                    onChange={(e) => handleChange('acceptCard', e.target.checked)}
                  />
                }
                label="Credit/Debit Card"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={businessInfo.acceptMobile}
                    onChange={(e) => handleChange('acceptMobile', e.target.checked)}
                  />
                }
                label="Mobile Payment (Apple Pay, Google Pay)"
              />
            </Paper>
          </Grid>

          {/* Business Hours */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <HoursIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Business Hours</Typography>
              </Box>
              
              <Grid container spacing={2}>
                {days.map((day) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={day}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                          {day}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={!businessInfo.businessHours[day]?.closed}
                              onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)}
                            />
                          }
                          label={businessInfo.businessHours[day]?.closed ? 'Closed' : 'Open'}
                          labelPlacement="start"
                          sx={{ m: 0 }}
                        />
                      </Box>
                      {!businessInfo.businessHours[day]?.closed && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            size="small"
                            type="time"
                            label="Open"
                            value={businessInfo.businessHours[day]?.open || ''}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            size="small"
                            type="time"
                            label="Close"
                            value={businessInfo.businessHours[day]?.close || ''}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                          />
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Receipt Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TaxIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Receipt Settings</Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Receipt Header"
                    value={businessInfo.receiptHeader}
                    onChange={(e) => handleChange('receiptHeader', e.target.value)}
                    placeholder="Text to appear at the top of receipts"
                    helperText="Appears at the top of printed receipts"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Receipt Footer"
                    value={businessInfo.receiptFooter}
                    onChange={(e) => handleChange('receiptFooter', e.target.value)}
                    placeholder="Thank you for your business!"
                    helperText="Appears at the bottom of printed receipts"
                  />
                </Grid>
              </Grid>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={businessInfo.showTaxOnReceipt}
                    onChange={(e) => handleChange('showTaxOnReceipt', e.target.checked)}
                  />
                }
                label="Show tax breakdown on receipts"
                sx={{ mt: 2 }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default BusinessInfo;
