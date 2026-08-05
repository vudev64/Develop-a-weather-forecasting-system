import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
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
const rawPort = process.env.PORT || process.env.BACKEND_PORT;

if (!rawPort) {
  throw new Error('Missing PORT or BACKEND_PORT in backend/.env');
}

const PORT = Number(rawPort);
const NODE_ENV = process.env.NODE_ENV || 'development';

// 1. CHUẨN HÓA CORS ORIGINS
const parseOrigins = () => {
  const envOrigins = [process.env.CORS_ORIGINS, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  // Mặc định luôn có FRONTEND_URL nếu khai báo
  return [...new Set(envOrigins)];
};

const allowedOrigins = parseOrigins();

// 2. MIDDLEWARE CORS BẢO MẬT
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (Server-to-Server, Postman, Mobile App)
    if (!origin) {
      return callback(null, true);
    }

    // Nếu môi trường Dev mà không set origin -> cho phép pass
    if (NODE_ENV !== 'production' && allowedOrigins.length === 0) {
      return callback(null, true);
    }

    // Kiểm tra origin có nằm trong whitelist không
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

// 3. RATE LIMITING CHUNG CHO API (100 req / 15 phút)
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
  app.use('/api/auth', authRoutes); // Bỏ authLimiter ở cấp router chung để tránh chặn /me khi F5

  // Health Check Endpoint
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

  // Serve static files in production (Nếu deploy Monolith)
  if (NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res.json({
        message: 'Weather API Server is running!',
        health: '/api/health',
      });
    });
  }

  // Error handler middleware (Phải ở cuối cùng)
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