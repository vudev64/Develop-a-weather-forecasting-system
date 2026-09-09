import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
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
  forgotPasswordToken: {
    type: String,
    unique: true,
    nullable: true
  },
  forgotPasswordExpiresAt: {
    type: Date,
    nullable: true
  }
});

export default mongoose.model('User', UserSchema);