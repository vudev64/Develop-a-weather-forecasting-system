import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);

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