import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url';
import connectDB, { getDbState } from './config/database.js';
import weatherRoutes from './routes/weatherRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const rawPort = process.env.PORT || process.env.BACKEND_PORT;

if (!rawPort) {
  throw new Error('Missing PORT or BACKEND_PORT in backend/.env');
}

const PORT = Number(rawPort);
const NODE_ENV = process.env.NODE_ENV || 'development';

// 1. CHUẨN HÓA CORS ORIGINS - FIX LỖI CORS
const parseOrigins = () => {
  const envOrigins = [process.env.CORS_ORIGINS, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  // 👇 THÊM LOCALHOST TỰ ĐỘNG KHI DEVELOPMENT
  if (NODE_ENV !== 'production') {
    const localOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    envOrigins.push(...localOrigins);
    console.log('🔧 Development mode: Added localhost origins');
  }

  // 👇 THÊM URL DEPLOY MẶC ĐỊNH (ĐỀ PHÒNG QUÊN SET ENV)
  if (NODE_ENV === 'production' && envOrigins.length === 0) {
    console.warn('⚠️ No CORS origins specified in production, adding default');
    envOrigins.push('https://develop-a-weather-forecasting-syste.vercel.app');
  }

  return [...new Set(envOrigins)];
};

const allowedOrigins = parseOrigins();
console.log('✅ Allowed Origins:', allowedOrigins);

// 2. MIDDLEWARE CORS BẢO MẬT
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (NODE_ENV !== 'production' && allowedOrigins.length === 0) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 3. RATE LIMITING
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.' }
});

app.use('/api', globalLimiter);

// 4. KHỞI CHẠY SERVER & ROUTES
const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Critical error on startup:', error.message);
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // Routes
  app.use('/api/weather', weatherRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/auth', authRoutes);

  // Health Check
  app.get('/api/health', (req, res) => {
    const dbState = getDbState();
    const ok = dbState.connected;

    res.status(ok ? 200 : (NODE_ENV === 'production' ? 503 : 200)).json({
      success: ok,
      status: ok ? 'ok' : 'degraded',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      db: dbState,
      allowedOrigins,
    });
  });

  // 👇 FIX LỖI SERVE STATIC FILES - ENOENT
  if (NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../frontend/dist');
    
    if (fs.existsSync(frontendDist)) {
      app.use(express.static(frontendDist));
      app.get('*', (req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
      });
      console.log('✅ Serving frontend from:', frontendDist);
    } else {
      console.log('⚠️ Frontend dist not found, running in API-only mode');
      app.get('/', (req, res) => {
        res.json({
          message: 'Weather API Server is running!',
          health: '/api/health',
          environment: NODE_ENV
        });
      });
      app.use((req, res) => {
        res.status(404).json({ 
          error: 'API endpoint not found',
          path: req.path 
        });
      });
    }
  } else {
    app.get('/', (req, res) => {
      res.json({
        message: 'Weather API Server is running!',
        health: '/api/health',
      });
    });
  }

  // Error handler middleware
  app.use(errorHandler);

  const server = app.listen(PORT, () => {
    console.log('🚀 Server started successfully!');
    console.log(`   - Environment: ${NODE_ENV}`);
    console.log(`   - API Port: ${PORT}`);
    console.log(`   - Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   - Allowed Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '(None specified)'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Cổng ${PORT} đã bị chiếm.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    }
  });
};

start();