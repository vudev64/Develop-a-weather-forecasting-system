import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import weatherRoutes from './routes/weatherRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
connectDB().catch(err => console.error('Critical error on startup:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Weather API Server is running!' });
});

app.use('/api/weather', weatherRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Start server
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Cổng ${PORT} đã bị chiếm. Hãy kill process đang dùng cổng này.`);
      console.error(`🔧 Dùng lệnh: Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    }
  });
};

startServer();
