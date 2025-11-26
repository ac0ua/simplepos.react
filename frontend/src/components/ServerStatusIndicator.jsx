import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { API_BASE_URL, API_URL, IS_PHP_BACKEND } from '../config/api';

const DEFAULT_POLL_INTERVAL = 10000; // 10 seconds
const REQUEST_TIMEOUT_MS = 5000;

const ServerStatusIndicator = ({ pollInterval = DEFAULT_POLL_INTERVAL }) => {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const checkStatus = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // In Node.js/dev mode, use the /health endpoint.
      // In PHP production mode, call a lightweight PHP health endpoint instead of generating GUIDs.
      const healthUrl = IS_PHP_BACKEND
        ? `${API_URL}/health.php`
        : `${API_BASE_URL}/health`;

      const response = await fetch(healthUrl, {
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);

        if (!IS_PHP_BACKEND) {
          // Node backend: expect { status: 'healthy' }
          if (data?.status === 'healthy') {
            setStatus('running');
          } else {
            setStatus('down');
          }
        } else {
          // PHP backend: health.php returns { success: true, status: 'healthy' }
          if (data && data.success === true && data.status === 'healthy') {
            setStatus('running');
          } else {
            setStatus('down');
          }
        }
      } else {
        setStatus('down');
      }
    } catch (error) {
      setStatus('down');
    } finally {
      clearTimeout(timeoutId);
      setLastChecked(Date.now());
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const intervalId = setInterval(() => {
      checkStatus();
    }, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkStatus, pollInterval]);

  const statusMeta = useMemo(() => {
    switch (status) {
      case 'running':
        return { label: 'Server: Online', color: 'success.main' };
      case 'down':
        return { label: 'Server: Offline', color: 'error.main' };
      default:
        return { label: 'Server: Checking…', color: 'warning.main' };
    }
  }, [status]);

  const tooltip = useMemo(() => {
    if (!lastChecked) {
      return 'Checking server status…';
    }
    const formattedTime = new Date(lastChecked).toLocaleTimeString();
    return `Last checked at ${formattedTime}`;
  }, [lastChecked]);

  return (
    <Tooltip title={tooltip} arrow>
      <Box 
        role="status" 
        aria-live="polite" 
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <FiberManualRecordIcon 
          aria-hidden="true"
          sx={{ color: statusMeta.color, fontSize: 14 }} 
        />
        <Typography variant="body2" color="text.secondary">
          {statusMeta.label}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default ServerStatusIndicator;
