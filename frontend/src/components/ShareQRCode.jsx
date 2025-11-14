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
import { API_BASE_URL } from '../config/api';

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
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/api/server-info`);
      setNetworkIP(data.networkIP);
    } catch (error) {
      console.error('Failed to fetch network IP:', error);
      // Fallback to current hostname
      setNetworkIP(window.location.hostname);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate the full URL for the order page using network IP
  const hostname = networkIP || window.location.hostname;
  const port = '5173';
  const protocol = window.location.protocol;
  const orderUrl = `${protocol}//${hostname}:${port}/${storeGuid}/${encodeURIComponent(label)}/order.html`;
  
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: '#0a0a0a',
          border: '1px solid #2d2d2d'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: '#1a1a1a',
        borderBottom: '1px solid #2d2d2d',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon sx={{ color: '#ff9800' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Share Terminal Access
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#999' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4, bgcolor: '#0a0a0a' }}>
        <Box sx={{ textAlign: 'center' }}>
          {/* Store Info */}
          <Typography variant="caption" sx={{ color: '#ff9800', textTransform: 'uppercase', letterSpacing: 1 }}>
            Store Terminal
          </Typography>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
            Scan this QR code on another device to access this terminal
          </Typography>

          {/* QR Code */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              bgcolor: 'white',
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
              <CircularProgress sx={{ color: '#ff9800' }} />
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

          <Divider sx={{ my: 2, borderColor: '#2d2d2d' }} />

          {/* URL Display */}
          <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1 }}>
            Direct Link
          </Typography>
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: '#1a1a1a', 
              border: '1px solid #2d2d2d',
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
                color: '#ff9800', 
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
                sx={{ 
                  color: '#ff9800',
                  '&:hover': { bgcolor: '#2d2d2d' }
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* Instructions */}
          <Box sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1 }}>
              How to use:
            </Typography>
            <Box component="ul" sx={{ color: '#666', fontSize: '0.85rem', pl: 2, m: 0 }}>
              <li>Open camera app on another device (phone/tablet)</li>
              <li>Point camera at QR code</li>
              <li>Tap the notification to open the link</li>
              <li>Start taking orders on the new terminal!</li>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#1a1a1a', borderTop: '1px solid #2d2d2d' }}>
        <Button 
          onClick={handleDownloadQR}
          variant="outlined"
          sx={{
            borderColor: '#2d2d2d',
            color: '#ff9800',
            '&:hover': { borderColor: '#ff9800', bgcolor: 'rgba(255, 152, 0, 0.1)' }
          }}
        >
          Download QR Code
        </Button>
        <Button 
          onClick={handleCopyUrl}
          variant="contained"
          startIcon={<CopyIcon />}
          sx={{
            bgcolor: '#ff9800',
            color: 'white',
            '&:hover': { bgcolor: '#f57c00' }
          }}
        >
          Copy Link
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareQRCode;
