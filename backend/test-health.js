const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  const startTime = Date.now();
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime
  });
});

// Detailed server information endpoint
app.get('/api/server/info', async (req, res) => {
  try {
    const os = require('os');
    const process = require('process');
    
    // Get system information
    const memoryUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };
    
    // Get network interfaces
    const networkInterfaces = os.networkInterfaces();
    let networkIP = 'localhost';
    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          networkIP = net.address;
          break;
        }
      }
      if (networkIP !== 'localhost') break;
    }
    
    res.json({
      nodeVersion: process.version,
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        system: systemMemory
      },
      database: {
        connected: false,
        error: 'Database not configured in test server'
      },
      network: {
        ip: networkIP,
        interfaces: networkInterfaces
      },
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching server info:', error);
    res.status(500).json({ error: 'Failed to fetch server information' });
  }
});

// Server logs endpoint
app.get('/api/server/logs', (req, res) => {
  try {
    // Create sample logs for testing
    const now = Date.now();
    const logs = [
      { level: 'info', message: 'Test server started successfully', timestamp: new Date(now - 3600000).toISOString() },
      { level: 'info', message: 'Health check endpoint available at /health', timestamp: new Date(now - 1800000).toISOString() },
      { level: 'warn', message: 'This is a test server - database not connected', timestamp: new Date(now - 900000).toISOString() },
      { level: 'info', message: 'Server operating normally', timestamp: new Date(now - 60000).toISOString() },
      { level: 'info', message: 'Health status page working correctly', timestamp: new Date(now).toISOString() }
    ];
    
    // Add some simulated recent activity
    for (let i = 0; i < 10; i++) {
      logs.push({
        level: Math.random() > 0.8 ? 'warn' : 'info',
        message: `Sample log entry ${i + 1} - System operating normally`,
        timestamp: new Date(now - (i * 60000)).toISOString()
      });
    }
    
    res.json(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.json([
      { level: 'error', message: 'Failed to fetch logs: ' + error.message, timestamp: new Date().toISOString() }
    ]);
  }
});

app.listen(PORT, () => {
  console.log(`Test health server running on http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
  console.log(`Server info: http://localhost:${PORT}/api/server/info`);
  console.log(`Server logs: http://localhost:${PORT}/api/server/logs`);
});
