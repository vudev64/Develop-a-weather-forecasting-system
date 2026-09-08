import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // ===== CORE FIELDS =====
  phone: {
    type: String,
    sparse: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  searchHistory: [
    {
      city: { type: String, required: true },
      searchedAt: { type: Date, required: true }
    }
  ],

  // ===== OTP FIELDS =====
  passwordResetOtpHash: {
    type: String
  },
  passwordResetOtpExpiresAt: {
    type: Date
  },
  passwordResetOtpVerifiedAt: {
    type: Date
  },
  passwordResetOtpTargetEmail: {
    type: String,
  },

  // ===== FORGOT PASSWORD TOKEN =====
  forgotPasswordToken: {
    type: String,
    unique: true,
    nullable: true
  },
  forgotPasswordExpiresAt: {
    type: Date,
    nullable: true
  },

  // ===== 👇 THÊM CÁC FIELD MỚI (ĐỂ ĐỒNG BỘ VỚI CODE) =====
  email: {
    type: String,
    lowercase: true,
    sparse: true,
    trim: true
  },
  googleId: {
    type: String,
    sparse: true
  },
  fullName: {
    type: String,
    default: ''
  },
  picture: {
    type: String,
    default: ''
  },
  favorites: {
    type: [{
      cityName: { type: String, required: true },
      lat: { type: Number },
      lon: { type: Number },
      addedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware: Cập nhật updatedAt
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('User', UserSchema);