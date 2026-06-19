import mongoose from 'mongoose';

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

    console.log(`✅ MongoDB kết nối thành công: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB không kết nối: ${error.message} - App sẽ chạy mà không lưu dữ liệu`);
  }
};

export default connectDB;