import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Set base path via environment variable or default
// For local: VITE_BASE=/simplepos.react/ npm run build
// For server: VITE_BASE=/tools/simplepos/ npm run build
const basePath = process.env.VITE_BASE || '/simplepos.react/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Simple POS',
        short_name: 'SimplePOS',
        description: 'Modern Point of Sales System',
        theme_color: '#2196F3',
        background_color: '#ffffff',
        display: 'standalone',
        icons: []
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          utils: ['axios', 'socket.io-client', 'zustand']
        }
      }
    }
  }
});
