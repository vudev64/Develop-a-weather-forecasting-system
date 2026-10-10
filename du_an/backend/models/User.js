import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    latitude: Number,
    longitude: Number,
  },
  {
    _id: false,
  }
);

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Tránh trả về password khi query User
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    picture: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    favorites: {
      type: [FavoriteSchema],
      default: [],
    },
    searchHistory: [
      {
        city: { type: String, required: true },
        searchedAt: { type: Date, required: true },
      },
    ],
    passwordResetOtpHash: String,
    passwordResetOtpExpiresAt: Date,
    passwordResetOtpVerifiedAt: Date,
    forgotPasswordToken: {
      type: String,
      sparse: true,
    },
    forgotPasswordExpiresAt: Date,
  },
  {
    timestamps: true, 
  }
);

export default mongoose.model('User', UserSchema);