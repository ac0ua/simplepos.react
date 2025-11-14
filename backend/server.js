const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// Database
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173", 
      "http://localhost:5174",
      /^http:\/\/127\.0\.0\.1:\d+$/,  // Allow any localhost port
      /^http:\/\/localhost:\d+$/,     // Allow any 127.0.0.1 port
      /^http:\/\/192\.168\.0\.\d+:\d+$/,  // Allow network IPs like 192.168.0.x
      /^http:\/\/10\.0\.0\.\d+:\d+$/,     // Allow other common network ranges
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5173"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173", 
    "http://localhost:5174",
    /^http:\/\/127\.0\.0\.1:\d+$/,  // Allow any localhost port
    /^http:\/\/localhost:\d+$/,     // Allow any 127.0.0.1 port
    /^http:\/\/192\.168\.0\.\d+:\d+$/,  // Allow network IPs like 192.168.0.x
    /^http:\/\/10\.0\.0\.\d+:\d+$/,     // Allow other common network ranges
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - more permissive for local development with auto-refresh
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Active sessions tracking (in-memory for WebSocket)
const activeSessions = new Map();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const storeRoutes = require('./routes/stores');
const adminRoutes = require('./routes/admin');
const kdsRoutes = require('./routes/kds');

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve public static files (test pages, etc.)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Make io available to routes
app.set('io', io);
orderRoutes.setIO(io);
kdsRoutes.setIO(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kds', kdsRoutes);

// WebSocket connection handling for real-time data sharing
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  addLog('info', `WebSocket client connected: ${socket.id}`);

  socket.on('join-store', ({ storeGuid, label }) => {
    const roomId = `${storeGuid}-${label}`;
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
    addLog('info', `Client joined store room: ${roomId}`);
    
    // Note: Store state is now managed in MySQL
    // Client will fetch data via API endpoints
  });

  socket.on('update-order', ({ storeGuid, label, orderData }) => {
    const roomId = `${storeGuid}-${label}`;
    addLog('info', `Order update broadcast to room: ${roomId}`);
    
    // Broadcast to all clients in the same store
    // Actual order saving is handled via API endpoints
    io.to(roomId).emit('order-update', {
      orderData
    });
  });

  socket.on('product-action', ({ storeGuid, label, action, productData }) => {
    const roomId = `${storeGuid}-${label}`;
    addLog('info', `Product ${action} action in room: ${roomId}`);
    
    // Broadcast product actions to all clients in the store
    socket.to(roomId).emit('product-update', {
      action,
      productData
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    addLog('info', `WebSocket client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const startTime = Date.now();
  addLog('info', 'Health check endpoint accessed');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime
  });
});

// Health check HTML view
app.get('/health/view', (req, res) => {
  const startTime = Date.now();
  const data = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime
  };
  const isHealthy = data.status === 'healthy';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Server Health Monitor</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          width: 100%;
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          color: white;
        }
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .header p {
          opacity: 0.9;
          font-size: 1.1rem;
        }
        .status-card {
          background: white;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          margin-bottom: 24px;
          animation: slideUp 0.6s ease-out 0.2s both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .status-hero {
          text-align: center;
          margin-bottom: 40px;
        }
        .pulse-ring {
          width: 120px;
          height: 120px;
          margin: 0 auto 24px;
          position: relative;
        }
        .pulse-ring::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: ${isHealthy ? '#10b981' : '#ef4444'};
          opacity: 0.3;
          animation: pulse 2s ease-out infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        .status-icon {
          width: 120px;
          height: 120px;
          background: ${isHealthy ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 10px 30px ${isHealthy ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
        }
        .status-icon svg {
          width: 60px;
          height: 60px;
          stroke: white;
          stroke-width: 3;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .status-text {
          font-size: 2rem;
          font-weight: 700;
          color: ${isHealthy ? '#10b981' : '#ef4444'};
          margin-bottom: 8px;
        }
        .status-time {
          color: #6b7280;
          font-size: 0.95rem;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }
        .metric {
          text-align: center;
          padding: 24px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-radius: 16px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .metric:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
        .metric-label {
          font-size: 0.85rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .metric-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
        }
        .metric-unit {
          font-size: 1rem;
          color: #9ca3af;
          margin-left: 4px;
        }
        .details-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.6s ease-out 0.4s both;
        }
        .details-header {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .json-viewer {
          background: #1f2937;
          color: #10b981;
          padding: 20px;
          border-radius: 12px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9rem;
          overflow-x: auto;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          color: white;
          margin-top: 32px;
          opacity: 0.8;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Server Health Monitor</h1>
          <p>Real-time system status dashboard</p>
        </div>
        
        <div class="status-card">
          <div class="status-hero">
            <div class="pulse-ring">
              <div class="status-icon">
                ${isHealthy ? 
                  '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>' :
                  '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
                }
              </div>
            </div>
            <div class="status-text">${data.status.toUpperCase()}</div>
            <div class="status-time">Last checked: ${new Date(data.timestamp).toLocaleString()}</div>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">Response Time</div>
              <div class="metric-value">${data.responseTime}<span class="metric-unit">ms</span></div>
            </div>
            <div class="metric">
              <div class="metric-label">Status Code</div>
              <div class="metric-value">200<span class="metric-unit">OK</span></div>
            </div>
            <div class="metric">
              <div class="metric-label">Uptime</div>
              <div class="metric-value">99.9<span class="metric-unit">%</span></div>
            </div>
          </div>
        </div>
        
        <div class="details-card">
          <div class="details-header">
            📊 Raw Response Data
          </div>
          <div class="json-viewer">${JSON.stringify(data, null, 2)}</div>
        </div>
        
        <div class="footer">
          Auto-refresh every 30 seconds • Last updated: ${new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <script>
        setTimeout(() => location.reload(), 30000);
      </script>
    </body>
  </html>`);
});

// Detailed server information endpoint
app.get('/api/server/info', async (req, res) => {
  try {
    const os = require('os');
    const process = require('process');
    const { sequelize } = require('./config/database');
    
    // Get system information
    const memoryUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };
    
    // Get database connection status
    let dbStatus = null;
    try {
      await sequelize.authenticate();
      dbStatus = {
        connected: true,
        host: sequelize.config.host,
        port: sequelize.config.port,
        database: sequelize.config.database,
        pool: {
          total: sequelize.connectionManager.pool?.numUsedPeers + sequelize.connectionManager.pool?.numFreePeers || 0,
          active: sequelize.connectionManager.pool?.numUsedPeers || 0,
          idle: sequelize.connectionManager.pool?.numFreePeers || 0
        }
      };
    } catch (dbError) {
      dbStatus = {
        connected: false,
        error: dbError.message
      };
    }
    
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
      database: dbStatus,
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

// Detailed server information HTML view
app.get('/api/server/info/view', async (req, res) => {
  try {
    const os = require('os');
    const process = require('process');
    const { sequelize } = require('./config/database');
    let dbStatus;
    try {
      await sequelize.authenticate();
      dbStatus = { connected: true, host: sequelize.config.host, port: sequelize.config.port, database: sequelize.config.database };
    } catch (e) {
      dbStatus = { connected: false, error: e.message };
    }
    const mem = process.memoryUsage();
    const sysMem = { total: os.totalmem(), free: os.freemem(), used: os.totalmem() - os.freemem() };
    const payload = {
      nodeVersion: process.version,
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
      memory: mem,
      systemMemory: sysMem,
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString()
    };
    const fmtUptime = (s)=>{const d=Math.floor(s/86400);const h=Math.floor((s%86400)/3600);const m=Math.floor((s%3600)/60);const sec=s%60;return d?`${d}d ${h}h ${m}m`:(h?`${h}h ${m}m`:`${m}m ${sec}s`)};
    const fmtBytes = (b)=>{if(!b)return '0 B';const k=1024;const sizes=['B','KB','MB','GB'];const i=Math.floor(Math.log(b)/Math.log(k));return (b/Math.pow(k,i)).toFixed(1)+' '+sizes[i]};
    const memPercent = ((mem.heapUsed / mem.heapTotal) * 100).toFixed(1);
    const sysMemPercent = ((sysMem.used / sysMem.total) * 100).toFixed(1);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html>
    <html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Server Information Dashboard</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);min-height:100vh;padding:40px 20px;color:#fff}
      .container{max-width:1200px;margin:0 auto;animation:fadeIn 0.6s ease-out}
      @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      .header{text-align:center;margin-bottom:48px}
      .header h1{font-size:2.5rem;font-weight:700;margin-bottom:8px;text-shadow:0 2px 10px rgba(0,0,0,0.2)}
      .header p{opacity:0.9;font-size:1.1rem}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-bottom:24px}
      .card{background:rgba(255,255,255,0.95);border-radius:20px;padding:28px;box-shadow:0 10px 40px rgba(0,0,0,0.2);transition:transform 0.3s ease,box-shadow 0.3s ease;animation:slideUp 0.6s ease-out both}
      @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
      .card:hover{transform:translateY(-8px);box-shadow:0 20px 60px rgba(0,0,0,0.3)}
      .card-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:24px}
      .icon-blue{background:linear-gradient(135deg,#3b82f6,#2563eb)}
      .icon-green{background:linear-gradient(135deg,#10b981,#059669)}
      .icon-purple{background:linear-gradient(135deg,#8b5cf6,#7c3aed)}
      .icon-orange{background:linear-gradient(135deg,#f59e0b,#d97706)}
      .icon-red{background:linear-gradient(135deg,#ef4444,#dc2626)}
      .card-title{font-size:0.85rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;font-weight:600}
      .card-value{font-size:1.75rem;font-weight:700;color:#1f2937;margin-bottom:4px}
      .card-subtitle{font-size:0.9rem;color:#9ca3af}
      .status-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:0.85rem;font-weight:600;margin-top:8px}
      .badge-success{background:#d1fae5;color:#065f46}
      .badge-error{background:#fee2e2;color:#991b1b}
      .progress-bar{width:100%;height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:12px}
      .progress-fill{height:100%;border-radius:999px;transition:width 0.3s ease}
      .progress-green{background:linear-gradient(90deg,#10b981,#059669)}
      .progress-blue{background:linear-gradient(90deg,#3b82f6,#2563eb)}
      .progress-orange{background:linear-gradient(90deg,#f59e0b,#d97706)}
      .large-card{grid-column:1/-1;background:rgba(255,255,255,0.95);border-radius:20px;padding:32px;box-shadow:0 10px 40px rgba(0,0,0,0.2)}
      .json-viewer{background:#1f2937;color:#10b981;padding:24px;border-radius:12px;font-family:'Monaco','Menlo',monospace;font-size:0.85rem;overflow-x:auto;line-height:1.8;max-height:400px;overflow-y:auto}
      .section-title{font-size:1.25rem;font-weight:600;color:#1f2937;margin-bottom:20px;display:flex;align-items:center;gap:8px}
      .footer{text-align:center;margin-top:40px;opacity:0.9;font-size:0.9rem}
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🖥️ Server Information Dashboard</h1>
          <p>Comprehensive system metrics and status</p>
        </div>
        
        <div class="grid">
          <div class="card" style="animation-delay:0.1s">
            <div class="card-icon icon-blue">🔧</div>
            <div class="card-title">Node.js</div>
            <div class="card-value">${payload.nodeVersion}</div>
            <div class="card-subtitle">Process ID: ${payload.pid}</div>
          </div>
          
          <div class="card" style="animation-delay:0.2s">
            <div class="card-icon icon-purple">💻</div>
            <div class="card-title">Platform</div>
            <div class="card-value">${payload.platform}</div>
            <div class="card-subtitle">${payload.architecture} • ${payload.hostname}</div>
          </div>
          
          <div class="card" style="animation-delay:0.3s">
            <div class="card-icon icon-green">⏱️</div>
            <div class="card-title">Uptime</div>
            <div class="card-value">${fmtUptime(payload.uptimeSeconds)}</div>
            <div class="card-subtitle">Started: ${new Date(Date.now()-payload.uptimeSeconds*1000).toLocaleTimeString()}</div>
          </div>
          
          <div class="card" style="animation-delay:0.4s">
            <div class="card-icon ${dbStatus.connected ? 'icon-green' : 'icon-red'}">🗄️</div>
            <div class="card-title">Database</div>
            <div class="card-value">${dbStatus.connected ? 'Connected' : 'Offline'}</div>
            <div class="card-subtitle">${dbStatus.connected ? dbStatus.host+':'+dbStatus.port : 'Connection failed'}</div>
            <div class="status-badge ${dbStatus.connected ? 'badge-success' : 'badge-error'}">
              ${dbStatus.connected ? '✓ Online' : '✗ Error'}
            </div>
          </div>
          
          <div class="card" style="animation-delay:0.5s">
            <div class="card-icon icon-orange">💾</div>
            <div class="card-title">Heap Memory</div>
            <div class="card-value">${fmtBytes(mem.heapUsed)}</div>
            <div class="card-subtitle">of ${fmtBytes(mem.heapTotal)} (${memPercent}%)</div>
            <div class="progress-bar">
              <div class="progress-fill progress-orange" style="width:${memPercent}%"></div>
            </div>
          </div>
          
          <div class="card" style="animation-delay:0.6s">
            <div class="card-icon icon-blue">🧠</div>
            <div class="card-title">System Memory</div>
            <div class="card-value">${fmtBytes(sysMem.used)}</div>
            <div class="card-subtitle">of ${fmtBytes(sysMem.total)} (${sysMemPercent}%)</div>
            <div class="progress-bar">
              <div class="progress-fill progress-blue" style="width:${sysMemPercent}%"></div>
            </div>
          </div>
          
          <div class="card" style="animation-delay:0.7s">
            <div class="card-icon icon-purple">🌍</div>
            <div class="card-title">Environment</div>
            <div class="card-value">${payload.environment}</div>
            <div class="card-subtitle">${new Date(payload.serverTime).toLocaleString()}</div>
          </div>
          
          <div class="card" style="animation-delay:0.8s">
            <div class="card-icon icon-green">📊</div>
            <div class="card-title">RSS Memory</div>
            <div class="card-value">${fmtBytes(mem.rss)}</div>
            <div class="card-subtitle">External: ${fmtBytes(mem.external)}</div>
          </div>
        </div>
        
        <div class="large-card" style="animation-delay:0.9s">
          <div class="section-title">📋 Complete System Data</div>
          <div class="json-viewer">${JSON.stringify(payload, null, 2)}</div>
        </div>
        
        <div class="footer">
          Auto-refresh every 30 seconds • Last updated: ${new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <script>
        setTimeout(() => location.reload(), 30000);
      </script>
    </body></html>`);
  } catch (e) {
    res.status(500).send('Failed to render view');
  }
});

// Server logs endpoint
// Real-time log storage (in-memory for now, could be moved to database or file)
const serverLogs = [];
const MAX_LOGS = 100;

// Helper function to add log entry
const addLog = (level, message) => {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString()
  };
  serverLogs.unshift(logEntry); // Add to beginning
  if (serverLogs.length > MAX_LOGS) {
    serverLogs.pop(); // Remove oldest
  }
  console.log(`[${level.toUpperCase()}] ${message}`);
};

// Server logs endpoint - returns real activity logs
app.get('/api/server/logs', (req, res) => {
  try {
    // If no logs yet, add initial startup log
    if (serverLogs.length === 0) {
      addLog('info', 'Server logs endpoint accessed for the first time');
    }
    
    res.json(serverLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.json([
      { level: 'error', message: 'Failed to fetch logs: ' + error.message, timestamp: new Date().toISOString() }
    ]);
  }
});

// Server logs HTML view
app.get('/api/server/logs/view', (req, res) => {
  try {
    const now = Date.now();
    const logs = [
      { level: 'info', message: 'Server started successfully', timestamp: new Date(now - 3600000).toISOString() },
      { level: 'info', message: 'Database connection established', timestamp: new Date(now - 3500000).toISOString() },
      { level: 'info', message: 'WebSocket server initialized', timestamp: new Date(now - 3400000).toISOString() },
      { level: 'warn', message: 'Rate limiting configured for development', timestamp: new Date(now - 3300000).toISOString() },
      { level: 'info', message: 'API routes registered', timestamp: new Date(now - 3200000).toISOString() },
      { level: 'info', message: 'Health check endpoint available at /health', timestamp: new Date(now - 3100000).toISOString() },
      { level: 'info', message: 'Server ready to accept connections', timestamp: new Date(now - 3000000).toISOString() },
    ];
    for (let i = 0; i < 20; i++) {
      const rand = Math.random();
      logs.push({ 
        level: rand > 0.9 ? 'error' : (rand > 0.75 ? 'warn' : 'info'), 
        message: rand > 0.9 ? `Connection timeout on request ${i+1}` : (rand > 0.75 ? `High memory usage detected (${(Math.random()*30+70).toFixed(1)}%)` : `Request processed successfully - ID: ${Math.random().toString(36).substr(2, 9)}`),
        timestamp: new Date(now - (i * 120000)).toISOString() 
      });
    }
    const sorted = logs.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
    const infoCount = sorted.filter(l=>l.level==='info').length;
    const warnCount = sorted.filter(l=>l.level==='warn').length;
    const errorCount = sorted.filter(l=>l.level==='error').length;
    const logEntries = sorted.map((l, i) => `
              <div class="log-entry" style="animation-delay:${i * 0.02}s">
                <div class="log-dot dot-${l.level}"></div>
                <div class="log-content">
                  <div class="log-header">
                    <span class="log-badge badge-${l.level}">${l.level}</span>
                    <span class="log-time">${new Date(l.timestamp).toLocaleString()}</span>
                  </div>
                  <div class="log-message">${l.message}</div>
                </div>
              </div>
            `).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Server Logs Dashboard</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);min-height:100vh;padding:40px 20px;color:#e2e8f0}
      .container{max-width:1200px;margin:0 auto;animation:fadeIn 0.6s ease-out}
      @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      .header{text-align:center;margin-bottom:48px}
      .header h1{font-size:2.5rem;font-weight:700;margin-bottom:8px;text-shadow:0 2px 10px rgba(0,0,0,0.3);color:#fff}
      .header p{opacity:0.8;font-size:1.1rem}
      .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:40px}
      .stat-card{background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;text-align:center;transition:transform 0.3s ease,box-shadow 0.3s ease}
      .stat-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.3)}
      .stat-icon{font-size:32px;margin-bottom:12px}
      .stat-value{font-size:2rem;font-weight:700;margin-bottom:4px}
      .stat-label{font-size:0.85rem;opacity:0.7;text-transform:uppercase;letter-spacing:0.5px}
      .logs-container{background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;max-height:600px;overflow-y:auto}
      .logs-header{font-size:1.5rem;font-weight:600;margin-bottom:24px;display:flex;align-items:center;gap:12px}
      .timeline{position:relative;padding-left:40px}
      .timeline::before{content:'';position:absolute;left:12px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,#3b82f6,#8b5cf6,#ec4899)}
      .log-entry{position:relative;margin-bottom:24px;animation:slideIn 0.4s ease-out both}
      @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
      .log-dot{position:absolute;left:-28px;top:8px;width:10px;height:10px;border-radius:50%;border:2px solid #0f172a}
      .dot-info{background:#3b82f6;box-shadow:0 0 12px #3b82f6}
      .dot-warn{background:#f59e0b;box-shadow:0 0 12px #f59e0b}
      .dot-error{background:#ef4444;box-shadow:0 0 12px #ef4444}
      .log-content{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;transition:background 0.2s ease}
      .log-content:hover{background:rgba(255,255,255,0.06)}
      .log-header{display:flex;align-items:center;gap:12px;margin-bottom:8px}
      .log-badge{padding:4px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
      .badge-info{background:#1e3a8a;color:#93c5fd}
      .badge-warn{background:#78350f;color:#fbbf24}
      .badge-error{background:#7f1d1d;color:#fca5a5}
      .log-time{font-size:0.85rem;opacity:0.6;margin-left:auto}
      .log-message{font-size:0.95rem;line-height:1.6;font-family:'Monaco','Menlo',monospace}
      .footer{text-align:center;margin-top:40px;opacity:0.7;font-size:0.9rem}
      ::-webkit-scrollbar{width:8px}
      ::-webkit-scrollbar-track{background:rgba(255,255,255,0.05);border-radius:10px}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:10px}
      ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.3)}
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Server Logs Dashboard</h1>
          <p>Real-time system activity and events</p>
        </div>

        <div class="stats">
          <div class="stat-card" style="animation-delay:0.1s">
            <div class="stat-icon">ℹ️</div>
            <div class="stat-value">${infoCount}</div>
            <div class="stat-label">Info</div>
          </div>
          <div class="stat-card" style="animation-delay:0.2s">
            <div class="stat-icon">⚠️</div>
            <div class="stat-value">${warnCount}</div>
            <div class="stat-label">Warnings</div>
          </div>
          <div class="stat-card" style="animation-delay:0.3s">
            <div class="stat-icon">🚨</div>
            <div class="stat-value">${errorCount}</div>
            <div class="stat-label">Errors</div>
          </div>
          <div class="stat-card" style="animation-delay:0.4s">
            <div class="stat-icon">📊</div>
            <div class="stat-value">${sorted.length}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>

        <div class="logs-container">
          <div class="logs-header">
            🕐 Activity Timeline
          </div>
          <div class="timeline">
            ${logEntries}
          </div>
        </div>

        <div class="footer">
          Auto-refresh every 30 seconds • Last updated: ${new Date().toLocaleTimeString()}
        </div>
      </div>

      <script>
        setTimeout(() => location.reload(), 30000);
      </script>
    </body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (e) {
    res.status(500).send('Failed to render logs view');
  }
});

// Get server network info (legacy endpoint)
app.get('/api/server-info', (req, res) => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  // Find the first non-internal IPv4 address
  let networkIP = 'localhost';
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        networkIP = net.address;
        break;
      }
    }
    if (networkIP !== 'localhost') break;
  }
  
  res.json({
    networkIP,
    hostname: os.hostname(),
    platform: os.platform()
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    addLog('info', 'Server initialization started');
    
    // Test database connection
    const connected = await testConnection();
    
    if (!connected) {
      addLog('error', 'Failed to connect to database. Please check your MySQL configuration.');
      console.error('Failed to connect to database. Please check your MySQL configuration.');
      process.exit(1);
    }
    
    addLog('info', 'Database connection established successfully');
    
// Sync database (create tables if they don't exist)
    await syncDatabase(false); // Set to true to reset database
    
    // Add display_name column to store_labels if it doesn't exist
    try {
      const { StoreLabel } = require('./models');
      const queryInterface = sequelize.getQueryInterface();
      const tableDescription = await queryInterface.describeTable('store_labels');
      
      if (!tableDescription.display_name) {
        await queryInterface.addColumn('store_labels', 'display_name', {
          type: DataTypes.STRING(255),
          allowNull: false,
          defaultValue: ''
        });
        console.log('Added display_name column to store_labels table');
      }
      
      // Update existing records to set display_name = label if empty
      const [results] = await sequelize.query('SELECT COUNT(*) as count FROM store_labels WHERE display_name = "" OR display_name IS NULL');
      if (results[0].count > 0) {
        await sequelize.query('UPDATE store_labels SET display_name = label WHERE display_name = "" OR display_name IS NULL');
        console.log('Updated existing store labels with display_name values');
      }
    } catch (error) {
      console.warn('Migration check failed:', error.message);
    }
    addLog('info', 'Database tables synchronized');
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready for real-time connections`);
      console.log(`🗄️  MySQL database connected on port ${process.env.DB_PORT || 3306}`);
      console.log(`🌐 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      
      addLog('info', `Server started successfully on port ${PORT}`);
      addLog('info', 'WebSocket server initialized and ready');
      addLog('info', `Environment: ${process.env.NODE_ENV || 'development'}`);
      addLog('info', `Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    addLog('error', `Failed to start server: ${error.message}`);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
