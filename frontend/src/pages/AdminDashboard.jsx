import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AdminDashboard = () => {
  const [maxInstances, setMaxInstances] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStores: 0,
    totalStoreLabels: 0,
    uniqueEmails: 0
  });

  // Load current settings and stats
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load admin settings
      const settingsResponse = await axios.get('/api/admin/settings');
      if (settingsResponse.data.max_instances_per_email) {
        setMaxInstances(parseInt(settingsResponse.data.max_instances_per_email, 10));
      }

      // Load statistics
      const statsResponse = await axios.get('/api/admin/stats');
      setStats(statsResponse.data);

    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update max instances setting
  const updateMaxInstances = async () => {
    if (maxInstances < 1) {
      setError('Maximum instances must be at least 1');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await axios.post('/api/admin/settings', {
        setting_key: 'max_instances_per_email',
        setting_value: maxInstances.toString(),
        description: 'Maximum number of store instances allowed per email address'
      });

      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const incrementMaxInstances = () => {
    setMaxInstances(prev => prev + 1);
  };

  const decrementMaxInstances = () => {
    if (maxInstances > 1) {
      setMaxInstances(prev => prev - 1);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center" color="white">
            <AdminIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Admin Dashboard
          </Typography>

          <Typography variant="body1" color="white" textAlign="center" sx={{ mb: 4, opacity: 0.8 }}>
            Manage system settings and view statistics
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Total Stores
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.totalStores}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Store Labels
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.totalStoreLabels}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Unique Emails
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.uniqueEmails}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Settings Panel */}
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              System Settings
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Maximum Store Instances Per Email
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Controls how many store instances each email address can create. Default is 3.
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton
                  onClick={decrementMaxInstances}
                  disabled={maxInstances <= 1 || loading}
                  color="primary"
                >
                  <RemoveIcon />
                </IconButton>

                <TextField
                  type="number"
                  value={maxInstances}
                  onChange={(e) => setMaxInstances(parseInt(e.target.value, 10) || 1)}
                  inputProps={{ min: 1 }}
                  sx={{ width: 100 }}
                  disabled={loading}
                />

                <IconButton
                  onClick={incrementMaxInstances}
                  disabled={loading}
                  color="primary"
                >
                  <AddIcon />
                </IconButton>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={updateMaxInstances}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Setting'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
