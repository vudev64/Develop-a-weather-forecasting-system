import mongoose from 'mongoose';

const weatherSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    trim: true
  },
    normalizedCity: {
    type: String,
    trim: true
  },

  country: String,
  latitude: Number,
  longitude: Number,
  temperature: Number,
  feelsLike: Number,
  humidity: Number,
  pressure: Number,
  windSpeed: Number,
  description: String,
  icon: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 12 * 60 * 60 * 1000);
    },
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

weatherSchema.pre('validate', function (next) {
  if (this.city && !this.normalizedCity) {
    this.normalizedCity = String(this.city).trim().replace(/\s+/g, ' ').toLowerCase();
  }

  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  }

  next();
});

// Tìm kiếm nhanh theo city chuẩn hóa và thời gian mới nhất
weatherSchema.index({ normalizedCity: 1, createdAt: -1 });
weatherSchema.index({ city: 1, createdAt: -1 });

// Giữ 1 “slot” theo city trong từng khoảng thời gian ngắn nếu muốn truy vấn gần nhất nhanh hơn
// (không đặt unique để tránh xung đột với nhiều bản ghi lịch sử cùng thành phố)
weatherSchema.index({ normalizedCity: 1, timestamp: -1 });

export default mongoose.model('Weather', weatherSchema);
