import logger from '../config/logger.js'; // 👈 Import winston logger

// Middleware xử lý lỗi chung
export const errorHandler = (err, req, res, next) => {
  // 🪵 Ghi log lỗi chuyên nghiệp với Winston
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Không expose chi tiết lỗi trong production
  const isDev = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    error: isDev ? err.message : 'Lỗi server. Vui lòng thử lại sau.'
  };

  if (isDev) {
    response.stack = err.stack;
  }

  res.status(err.status || 500).json(response);
};

export default errorHandler;