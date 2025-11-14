import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  LinearProgress, 
  Alert,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
  IconButton,
  Container,
  Avatar,
  Stack,
  Badge
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  Router as RouterIcon,
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  Cloud as CloudIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

const HealthStatus = () => {
  const [healthData, setHealthData] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthStatus = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching health data from:', API_BASE_URL);
      
      // Fetch basic health
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Health response status:', healthResponse.status);
      if (!healthResponse.ok) throw new Error(`Health check failed: ${healthResponse.status}`);
      const health = await healthResponse.json();
      console.log('Health data:', health);
      
      // Fetch detailed server info
      const infoResponse = await fetch(`${API_BASE_URL}/api/server/info`);
      let info = null;
      if (infoResponse.ok) {
        info = await infoResponse.json();
        console.log('Server info received');
      }
      
      // Fetch recent logs
      const logsResponse = await fetch(`${API_BASE_URL}/api/server/logs`);
      let logsData = [];
      if (logsResponse.ok) {
        logsData = await logsResponse.json();
        console.log('Logs received:', logsData.length, 'entries');
      }
      
      setHealthData(health);
      setServerInfo(info);
      setLogs(logsData.slice(0, 50)); // Show last 50 logs
      setLastRefresh(Date.now());
    } catch (err) {
      const errorMsg = `${err.message} (API: ${API_BASE_URL})`;
      setError(errorMsg);
      console.error('Health status fetch error:', err);
      console.error('API Base URL:', API_BASE_URL);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthStatus, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [fetchHealthStatus, autoRefresh]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
      case 'degraded':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
      case 'offline':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'Unknown';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getLogColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'error.main';
      case 'warn': return 'warning.main';
      case 'info': return 'info.main';
      default: return 'text.primary';
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white' }}>Loading Health Dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Card sx={{ maxWidth: 600, p: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to fetch server health status: {error}
          </Alert>
          <Button 
            variant="contained" 
            fullWidth
            size="large"
            onClick={fetchHealthStatus} 
            startIcon={<RefreshIcon />}
          >
            Retry Connection
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="xl" sx={{ pb: 6 }}>
        {/* Header */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: 5,
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <Typography 
            variant="h3" 
            fontWeight="bold" 
            sx={{ 
              color: 'white',
              mb: 1,
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
          >
            🏥 Server Health Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
            Real-time system monitoring and diagnostics
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
            <Chip 
              label={`Auto-refresh: ${autoRefresh ? 'ON' : 'OFF'}`}
              color={autoRefresh ? 'success' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              clickable
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
              }}
            />
            <Chip 
              label={`Updated: ${new Date(lastRefresh).toLocaleTimeString()}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <IconButton 
              onClick={fetchHealthStatus}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Hero Status Card */}
        <Card sx={{ 
          mb: 4,
          borderRadius: 4,
          background: 'white',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            background: healthData?.status === 'healthy' 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            p: 4,
            textAlign: 'center',
            position: 'relative'
          }}>
            <Box sx={{ 
              width: 120,
              height: 120,
              margin: '0 auto 24px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.3)',
                animation: 'pulse 2s ease-out infinite'
              }
            }}>
              <Avatar sx={{ 
                width: 120,
                height: 120,
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '3rem'
              }}>
                {healthData?.status === 'healthy' ? '✓' : '✗'}
              </Avatar>
            </Box>
            <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
              {healthData?.status?.toUpperCase() || 'UNKNOWN'}
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'Unknown'}
            </Typography>
            {healthData?.responseTime && (
              <Chip 
                label={`${healthData.responseTime}ms response time`}
                sx={{ 
                  mt: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
        </Card>

        {/* System Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <ComputerIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Node.js
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {serverInfo?.nodeVersion || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  PID: {serverInfo?.pid || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <TimerIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Uptime
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatUptime(serverInfo?.uptime)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {serverInfo?.platform || 'Unknown'} ({serverInfo?.architecture || 'N/A'})
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: serverInfo?.database?.connected 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <StorageIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Database
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {serverInfo?.database?.connected ? 'Online' : 'Offline'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {serverInfo?.database?.connected 
                    ? `${serverInfo.database.host}:${serverInfo.database.port}`
                    : 'Connection failed'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <MemoryIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Memory
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatBytes(serverInfo?.memory?.used)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  of {formatBytes(serverInfo?.memory?.total)}
                </Typography>
                {serverInfo?.memory && (
                  <LinearProgress 
                    variant="determinate" 
                    value={(serverInfo.memory.used / serverInfo.memory.total) * 100}
                    sx={{ 
                      mt: 1,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': { bgcolor: 'white' }
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Information */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: 'white', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 600 }}>
                  <RouterIcon color="primary" />
                  Server Details
                </Typography>
                {serverInfo ? (
                  <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Node.js Version" 
                      secondary={serverInfo.nodeVersion || 'Unknown'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Environment" 
                      secondary={serverInfo.environment || 'Unknown'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Uptime" 
                      secondary={formatUptime(serverInfo.uptime)} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Process ID" 
                      secondary={serverInfo.pid || 'Unknown'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Memory Usage" 
                      secondary={
                        serverInfo.memory ? 
                          `${formatBytes(serverInfo.memory.used)} / ${formatBytes(serverInfo.memory.total)}` : 
                          'Unknown'
                      } 
                    />
                  </ListItem>
                  {serverInfo.memory && (
                    <ListItem>
                      <LinearProgress 
                        variant="determinate" 
                        value={(serverInfo.memory.used / serverInfo.memory.total) * 100}
                        sx={{ mt: 1 }}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Detailed server information not available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: 'white', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 600 }}>
                  <StorageIcon color="success" />
                  Database Status
                </Typography>
                {serverInfo?.database ? (
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Connection Status" 
                        secondary={
                          <Chip 
                            label={serverInfo.database.connected ? 'Connected' : 'Disconnected'}
                            color={serverInfo.database.connected ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        } 
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Database Type" 
                        secondary={serverInfo.database.type || 'MySQL'} 
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Host & Port" 
                        secondary={`${serverInfo.database.host || 'localhost'}:${serverInfo.database.port || 3306}`} 
                      />
                    </ListItem>
                    {serverInfo.database.pool && (
                      <>
                        <Divider />
                        <ListItem>
                          <ListItemText 
                            primary="Connection Pool" 
                            secondary={`${serverInfo.database.pool.active} active / ${serverInfo.database.pool.total} total`}
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                ) : (
                  <Alert severity="warning">Database information not available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* System Logs */}
        <Card sx={{ bgcolor: 'white', borderRadius: 3, mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                <TimelineIcon color="primary" />
                System Activity Logs
              </Typography>
              <Chip 
                label={`${logs.length} entries`}
                color="primary"
                variant="outlined"
              />
            </Box>
            {logs.length > 0 ? (
              <Box sx={{ 
                maxHeight: 500, 
                overflow: 'auto',
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { bgcolor: 'grey.100', borderRadius: 2 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 2 }
              }}>
                <List>
                  {logs.map((log, index) => (
                    <React.Fragment key={index}>
                      <ListItem 
                        sx={{ 
                          py: 2,
                          '&:hover': { bgcolor: 'grey.50' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                              <Chip 
                                label={log.level?.toUpperCase() || 'INFO'} 
                                size="small"
                                color={
                                  log.level === 'error' ? 'error' : 
                                  log.level === 'warn' ? 'warning' : 
                                  'info'
                                }
                                sx={{ 
                                  fontWeight: 600,
                                  minWidth: 70
                                }}
                              />
                              <Typography variant="body1" sx={{ fontFamily: 'monospace', flex: 1 }}>
                                {log.message || log}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 10 }}>
                              🕐 {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < logs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            ) : (
              <Alert severity="info">No recent logs available</Alert>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            🔄 Auto-refresh {autoRefresh ? 'enabled' : 'disabled'} • Last updated: {new Date(lastRefresh).toLocaleString()}
          </Typography>
        </Box>
      </Container>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </Box>
  );
};

export default HealthStatus;
