import mongoose from 'mongoose';

const weatherSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
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
  }
}, {
  timestamps: true
});

//  tìm kiếm nhanh
weatherSchema.index({ city: 1, createdAt: -1 });

export default mongoose.model('Weather', weatherSchema);
