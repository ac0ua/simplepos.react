# 🏗️ Simple POS - System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Browser    │  │   Browser    │      │
│  │  Terminal 1  │  │  Terminal 2  │  │  Terminal 3  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘              │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    HTTP/WebSocket
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                  APPLICATION LAYER                            │
├────────────────────────────┼──────────────────────────────────┤
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────┐         │
│  │         React Frontend (Port 5173)              │         │
│  │  ┌──────────────────────────────────────────┐   │         │
│  │  │  Material UI v6 (Material Design 3)      │   │         │
│  │  │  - Components                             │   │         │
│  │  │  - Theme System                           │   │         │
│  │  │  - Responsive Layout                      │   │         │
│  │  └──────────────────────────────────────────┘   │         │
│  │  ┌──────────────────────────────────────────┐   │         │
│  │  │  State Management                         │   │         │
│  │  │  - Zustand (Local State)                 │   │         │
│  │  │  - React Query (Server State)            │   │         │
│  │  └──────────────────────────────────────────┘   │         │
│  │  ┌──────────────────────────────────────────┐   │         │
│  │  │  Real-time Communication                  │   │         │
│  │  │  - Socket.io Client                       │   │         │
│  │  │  - Event Listeners                        │   │         │
│  │  └──────────────────────────────────────────┘   │         │
│  └─────────────────────────────────────────────────┘         │
│                            │                                  │
│                    API Calls / WebSocket                      │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────┐         │
│  │      Node.js Backend (Port 5000)                │         │
│  │  ┌──────────────────────────────────────────┐   │         │
│  │  │  Express.js Server                        │   │         │
│  │  │  - REST API Routes                        │   │         │
│  │  │  - Middleware (CORS, Helmet, etc.)       │   │         │
│  │  │  - Rate Limiting                          │   │         │
│  │  └──────────────────────────────────────────┘   │         │
│  │  ┌──────────────────────────────────────────┐   │         │
│  │  │  Socket.io Server                         │   │         │
│  │  │  - WebSocket Connections                  │   │         │
│  │  │  - Room Management                        │   │         │
│  │  │  - Event Broadcasting                     │   │         │
│  │  └──────────────────────────────────────────┘   │         │
│  │  ┌──────────────────────────────────────────┐   │         │
│  │  │  Business Logic                           │   │         │
│  │  │  - Authentication (JWT)                   │   │         │
│  │  │  - GUID Validation                        │   │         │
│  │  │  - Order Processing                       │   │         │
│  │  │  - Inventory Management                   │   │         │
│  │  └──────────────────────────────────────────┘   │         │
│  └─────────────────────────────────────────────────┘         │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                        Sequelize ORM
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                      DATA LAYER                               │
├────────────────────────────┼──────────────────────────────────┤
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────┐         │
│  │         MySQL Database (Port 3306)              │         │
│  │                                                   │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │         │
│  │  │  stores  │  │ products │  │  orders  │      │         │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘      │         │
│  │       │             │              │             │         │
│  │  ┌────┴─────┐  ┌───┴──────┐  ┌───┴──────┐     │         │
│  │  │  store_  │  │  order_  │  │  users   │     │         │
│  │  │  labels  │  │  items   │  │          │     │         │
│  │  └──────────┘  └──────────┘  └──────────┘     │         │
│  │                                                   │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

### 1. User Adds Product to Cart

```
User Clicks Product
        ↓
Frontend: addToCart() action
        ↓
Zustand: Update local cart state
        ↓
UI: Cart updates immediately (optimistic)
        ↓
Socket.io: Emit 'product-action' event
        ↓
Backend: Broadcast to all clients in room
        ↓
All Terminals: Receive update
        ↓
UI: Sync cart across all terminals
```

### 2. User Completes Order

```
User Clicks "Complete Payment"
        ↓
Frontend: Validate cart & payment
        ↓
API Call: POST /api/orders/:storeGuid
        ↓
Backend: Process order
        ├─ Create order record
        ├─ Create order items
        └─ Update product stock
        ↓
MySQL: Save to database
        ↓
Backend: Return order confirmation
        ↓
Socket.io: Emit 'order-update' event
        ↓
All Terminals: Receive notification
        ↓
Frontend: Clear cart & show success
```

### 3. Real-time Synchronization

```
Terminal 1: User action
        ↓
WebSocket: Emit event to server
        ↓
Server: Identify room (storeGuid + label)
        ↓
Server: Broadcast to all clients in room
        ↓
Terminal 2, 3, N: Receive event
        ↓
Update UI in real-time
```

## 🗂️ Database Schema

```
┌─────────────┐
│   stores    │
├─────────────┤
│ id (PK)     │
│ guid (UQ)   │◄────────┐
│ business_   │         │
│   name      │         │
│ tax_rate    │         │
└─────────────┘         │
       │                │
       │ 1:N            │
       ▼                │
┌─────────────┐         │
│store_labels │         │
├─────────────┤         │
│ id (PK)     │         │
│ store_id(FK)├─────────┘
│ label       │
│ permissions │
└─────────────┘

       │
       │ 1:N
       ▼
┌─────────────┐
│  products   │
├─────────────┤
│ id (PK)     │◄────────┐
│ store_id(FK)│         │
│ name        │         │
│ price       │         │
│ stock       │         │
└─────────────┘         │
                        │
       │                │
       │ 1:N            │
       ▼                │
┌─────────────┐         │
│   orders    │         │
├─────────────┤         │
│ id (PK)     │◄────┐   │
│ order_id(UQ)│     │   │
│ store_id(FK)│     │   │
│ total       │     │   │
│ status      │     │   │
└─────────────┘     │   │
                    │   │
       │            │   │
       │ 1:N        │   │
       ▼            │   │
┌─────────────┐    │   │
│ order_items │    │   │
├─────────────┤    │   │
│ id (PK)     │    │   │
│ order_id(FK)├────┘   │
│ product_id  ├─────────┘
│   (FK)      │
│ quantity    │
│ price       │
└─────────────┘
```

## 🔐 Authentication Flow

### GUID-based Access (No Login)

```
User Enters GUID + Label
        ↓
POST /api/auth/store/access
        ↓
Backend: Validate GUID format
        ↓
MySQL: Find or create store
        ↓
MySQL: Find or create label
        ↓
Backend: Generate JWT token
        ↓
Frontend: Store token in localStorage
        ↓
Frontend: Navigate to POS interface
        ↓
All API calls include JWT in header
```

### User Registration (Optional)

```
User Enters Email + Password
        ↓
POST /api/auth/signup
        ↓
Backend: Validate input
        ↓
Backend: Hash password (bcrypt)
        ↓
MySQL: Create user record
        ↓
Backend: Generate JWT token
        ↓
Frontend: Store token
        ↓
User has access to payment features
```

## 🌐 API Architecture

### RESTful Endpoints

```
/api/auth/*
├── POST /store/access      - Access store with GUID
├── GET  /store/generate    - Generate new GUID
├── POST /signup            - User registration
├── POST /login             - User login
└── GET  /verify            - Verify JWT token

/api/products/:storeGuid/*
├── GET    /                - Get all products
├── GET    /search          - Search products
├── POST   /                - Add product
├── PUT    /:productId      - Update product
└── PATCH  /:productId/stock - Update stock

/api/orders/:storeGuid/*
├── POST   /                - Create order
├── GET    /                - Get all orders
├── GET    /:orderId        - Get single order
├── PATCH  /:orderId/status - Update status
├── POST   /:orderId/payment - Process payment
├── DELETE /:orderId        - Cancel order
└── GET    /stats           - Get statistics

/api/stores/:storeGuid/*
├── GET  /config            - Get configuration
├── PUT  /config            - Update configuration
├── GET  /analytics         - Get analytics
└── GET  /sessions          - Get active sessions
```

### WebSocket Events

```
Client → Server:
├── join-store              - Join store room
├── update-order            - Order update
└── product-action          - Product action

Server → Client:
├── store-state             - Initial state
├── order-update            - Order changed
└── product-update          - Product changed
```

## 🔧 Technology Stack

### Frontend Stack
```
React 18.3.1
├── Vite 5.2.11 (Build Tool)
├── Material UI 6.0.0 (UI Framework)
│   ├── @emotion/react
│   └── @emotion/styled
├── React Router 6.23.1 (Routing)
├── Zustand 4.5.2 (State Management)
├── React Query 5.32.0 (Server State)
├── Socket.io Client 4.7.5 (WebSocket)
├── Axios 1.6.8 (HTTP Client)
├── Framer Motion 11.1.9 (Animations)
└── React Hot Toast 2.4.1 (Notifications)
```

### Backend Stack
```
Node.js 18+
├── Express 4.19.2 (Web Framework)
├── Socket.io 4.7.5 (WebSocket Server)
├── Sequelize 6.x (ORM)
│   └── mysql2 3.x (MySQL Driver)
├── JWT 9.0.2 (Authentication)
├── bcryptjs 2.4.3 (Password Hashing)
├── Helmet 7.1.0 (Security)
├── CORS 2.8.5 (Cross-Origin)
├── Compression 1.7.4 (Gzip)
└── Rate Limit 7.2.0 (API Protection)
```

### Database
```
MySQL 8.0+
└── Sequelize ORM
    ├── Auto-migrations
    ├── Relationships
    └── Indexes
```

## 🚀 Deployment Architecture

### Development (Current)
```
┌──────────────┐
│   Localhost  │
├──────────────┤
│ Frontend     │ :5173
│ Backend      │ :5000
│ MySQL        │ :3306
└──────────────┘
```

### Production (Scalable)
```
┌─────────────────────────────────────────┐
│              Load Balancer               │
│           (NGINX / HAProxy)              │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼───┐
│ App    │      │ App    │
│ Server │      │ Server │
│   #1   │      │   #2   │
└───┬────┘      └────┬───┘
    │                │
    └────────┬───────┘
             │
    ┌────────▼────────┐
    │                 │
┌───▼────┐      ┌────▼───┐
│ MySQL  │◄────►│ Redis  │
│ Master │      │ Cache  │
└───┬────┘      └────────┘
    │
┌───▼────┐
│ MySQL  │
│ Replica│
└────────┘
```

## 📊 Performance Optimizations

### Frontend
- Code splitting (Vite)
- Lazy loading routes
- Optimistic UI updates
- React Query caching
- Service Worker (PWA)
- Image optimization

### Backend
- Connection pooling (Sequelize)
- Rate limiting
- Gzip compression
- Efficient queries
- Indexed database columns
- WebSocket rooms

### Database
- Primary keys (auto-increment)
- Foreign keys (relationships)
- Indexes on frequently queried columns
- Optimized data types
- Query optimization

## 🔒 Security Layers

```
┌─────────────────────────────────────┐
│     Application Security             │
├─────────────────────────────────────┤
│ 1. HTTPS/SSL (Production)           │
│ 2. Helmet.js Headers                │
│ 3. CORS Protection                  │
│ 4. Rate Limiting                    │
│ 5. Input Validation                 │
│ 6. SQL Injection Protection (ORM)   │
│ 7. XSS Protection                   │
│ 8. CSRF Tokens                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     Authentication Security          │
├─────────────────────────────────────┤
│ 1. JWT Tokens (Signed)              │
│ 2. Password Hashing (bcrypt)        │
│ 3. GUID Validation                  │
│ 4. Token Expiration                 │
│ 5. Secure Session Storage           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     Database Security                │
├─────────────────────────────────────┤
│ 1. Parameterized Queries            │
│ 2. Connection Encryption            │
│ 3. User Permissions                 │
│ 4. Regular Backups                  │
│ 5. Audit Logging                    │
└─────────────────────────────────────┘
```

## 📈 Scalability Strategy

### Horizontal Scaling
- Stateless application servers
- Load balancer distribution
- Session management via JWT
- WebSocket sticky sessions

### Database Scaling
- Read replicas for queries
- Write to master only
- Connection pooling
- Query optimization
- Caching layer (Redis)

### Caching Strategy
- Redis for session data
- React Query for client cache
- CDN for static assets
- Database query cache

---

**This architecture supports millions of concurrent users with proper infrastructure!**
