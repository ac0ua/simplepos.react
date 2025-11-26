import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  QrCode2 as QrCodeIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL, IS_PHP_BACKEND } from '../config/api';

const ShareQRCode = ({ open, onClose, storeGuid, label }) => {
  const [networkIP, setNetworkIP] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch server's network IP when dialog opens
  useEffect(() => {
    if (open) {
      fetchNetworkIP();
    }
  }, [open]);
  
  const fetchNetworkIP = async () => {
    // In PHP/Apache mode we don't have the Node server-info endpoint;
    // just use the current hostname and skip the extra request.
    if (IS_PHP_BACKEND) {
      setNetworkIP(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/api/server/info`);
      const ipFromServer =
        (data && data.network && data.network.ip) ||
        data?.networkIP ||
        data?.ip ||
        null;
      setNetworkIP(ipFromServer || window.location.hostname);
    } catch (error) {
      console.error('Failed to fetch network IP:', error);
      // Fallback to current hostname
      setNetworkIP(window.location.hostname);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate the full URL for the order page using either the detected
  // LAN IP (in dev/Node mode) or the current hostname, plus the
  // React Router basename (/simplepos.react) and actual port.
  const hostname = networkIP || window.location.hostname;
  const protocol = window.location.protocol;
  const currentPort = window.location.port;
  const isDefaultPort = currentPort === '' || currentPort === '80' || currentPort === '443';
  const portSegment = isDefaultPort ? '' : `:${currentPort}`;
  const basename = '/simplepos.react';
  const isUnderSimpleposReact = window.location.pathname.startsWith(basename);
  const basePath = isUnderSimpleposReact ? basename : '';
  const orderUrl = `${protocol}//${hostname}${portSegment}${basePath}/${storeGuid}/${encodeURIComponent(label)}/order.html`;
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(orderUrl);
    toast.success('URL copied to clipboard!');
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${label}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success('QR code downloaded!');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      aria-labelledby="share-qr-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider'
        }
      }}
    >
      <DialogTitle 
        id="share-qr-title"
        component="h2"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
          color: 'text.primary'
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
            Share Terminal Access
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ color: 'text.secondary' }}
          aria-label="Close dialog"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4, bgcolor: 'background.default' }}>
        <Box sx={{ textAlign: 'center' }}>
          {/* Store Info */}
          <Typography variant="caption" component="span" sx={{ color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
            Store Terminal
          </Typography>
          <Typography variant="h5" component="h3" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Scan this QR code on another device to access this terminal
          </Typography>

          {/* QR Code */}
          <Paper 
            elevation={0}
            role="img"
            aria-label={`QR code to access ${label} terminal`}
            sx={{ 
              p: 3, 
              bgcolor: 'background.paper',
              borderRadius: 2,
              mb: 3,
              minHeight: 280,
              minWidth: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <CircularProgress sx={{ color: 'primary.main' }} />
            ) : (
              <QRCodeSVG
                id="qr-code-svg"
                value={orderUrl}
                size={256}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: '',
                  height: 0,
                  width: 0,
                  excavate: false,
                }}
              />
            )}
          </Paper>

          <Divider sx={{ my: 2, borderColor: 'divider' }} />

          {/* URL Display */}
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Direct Link
          </Typography>
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.primary', 
                wordBreak: 'break-all',
                flex: 1,
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: '0.85rem'
              }}
            >
              {orderUrl}
            </Typography>
            <Tooltip title="Copy URL">
              <IconButton 
                onClick={handleCopyUrl}
                size="small"
                aria-label="Copy URL to clipboard"
                sx={{ 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* Instructions */}
          <Box sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              How to use:
            </Typography>
            <Box component="ul" sx={{ color: 'text.secondary', fontSize: '0.85rem', pl: 2, m: 0 }}>
              <li>Open camera app on another device (phone/tablet)</li>
              <li>Point camera at QR code</li>
              <li>Tap the notification to open the link</li>
              <li>Start taking orders on the new terminal!</li>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={handleDownloadQR}
          variant="outlined"
          sx={{
            borderColor: 'divider',
            color: 'primary.main',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
          }}
        >
          Download QR Code
        </Button>
        <Button 
          onClick={handleCopyUrl}
          variant="contained"
          startIcon={<CopyIcon />}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          Copy Link
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareQRCode;
