import mongoose from 'mongoose';

const dbState = {
  connected: false,
  degraded: false,
  lastError: null,
  lastConnectedAt: null,
};

export const getDbState = () => ({
  ...dbState,
  readyState: mongoose.connection.readyState,
  connectionName: mongoose.connection.name || null,
  host: mongoose.connection.host || null,
});

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI không được cấu hình trong .env');
    }

    console.log("📊 Đang kết nối MongoDB...");

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    dbState.connected = true;
    dbState.degraded = false;
    dbState.lastError = null;
    dbState.lastConnectedAt = new Date().toISOString();

    console.log(`✅ MongoDB kết nối thành công: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    dbState.connected = false;
    dbState.lastError = error.message;
    dbState.degraded = process.env.NODE_ENV !== 'production';

    if (process.env.NODE_ENV === 'production') {
      console.error(`❌ MongoDB không kết nối ở production: ${error.message}`);
      throw error;
    }

    console.warn(`⚠️ MongoDB không kết nối: ${error.message} - App chạy degraded mode`);
    return null;
  }
};

export default connectDB;