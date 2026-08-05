import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

// Transporter Nodemailer cho Gmail
export const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password: leufknnmojpnmqzo
    },
  });
};

// Response Helpers
export const buildAuthResponse = (res, { status = 200, message, user, token, extra = {} }) => {
  return res.status(status).json({
    success: true,
    message,
    token,
    data: user,
    ...extra,
  });
};

export const buildAuthError = (res, status, message, extra = {}) => {
  return res.status(status).json({
    success: false,
    error: message,
    ...extra,
  });
};

// 1. Google Auth Callback
export const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return buildAuthError(res, 401, 'Không thể xác thực');
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình trong .env');
    }
    const token = jwt.sign(
      {
        id: user._id,
        phone: user.phone || user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return buildAuthResponse(res, {
      message: 'Đăng nhập Google thành công',
      token,
      user: {
        id: user._id,
        phone: user.phone || user.username,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        picture: user.picture,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Lỗi Google Auth:', error.message);
    return buildAuthError(res, 500, error.message);
  }
};

// 2. Verify Google Token (Client-side)
export const verifyGoogleToken = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return buildAuthError(res, 400, 'Thiếu credential');
    }
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      throw new Error('Cấu hình môi trường GOOGLE_CLIENT_ID hoặc JWT_SECRET bị thiếu');
    }
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: email.split('@')[0],
        email: email,
        password: 'google_oauth_placeholder',
        googleId: sub,
        picture: picture,
        fullName: name,
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = sub;
      user.picture = picture;
      user.fullName = name;
      await user.save();
    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        phone: user.phone || user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return buildAuthResponse(res, {
      message: 'Đăng nhập Google thành công',
      token: jwtToken,
      user: {
        id: user._id,
        phone: user.phone || user.username,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        picture: user.picture,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Lỗi verify Google token:', error.message);
    if (process.env.NODE_ENV === 'development') {
      return buildAuthError(res, 401, 'Xác thực Google thất bại', { details: error.message });
    } else {
      return buildAuthError(res, 401, 'Xác thực Google thất bại');
    }
  }
};

// 3. ✅ CẬP NHẬT: Lấy thông tin user hiện tại (getCurrentUser) bao gồm searchHistory & favorites
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; // Lấy từ auth middleware
    const user = await User.findById(userId);

    if (!user) {
      return buildAuthError(res, 404, 'Không tìm thấy user');
    }

    return buildAuthResponse(res, {
      message: 'Lấy thông tin user thành công',
      user: {
        id: user._id,
        phone: user.phone,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        picture: user.picture,
        createdAt: user.createdAt,
        // ✅ ĐÃ BỔ SUNG: Trả về danh sách yêu thích và lịch sử tìm kiếm
        favorites: user.favorites || [],
        searchHistory: user.searchHistory || [],
      },
    });
  } catch (error) {
    console.error('Lỗi get user:', error.message);
    return buildAuthError(res, 500, 'Lỗi server khi lấy thông tin user');
  }
};

// 4. Logout
export const logout = async (req, res) => {
  try {
    return buildAuthResponse(res, {
      message: 'Đã đăng xuất thành công',
      user: null,
      token: null,
    });
  } catch (error) {
    return buildAuthError(res, 500, error.message);
  }
};

// ==========================================
// CÁC HÀM XỬ LÝ OTP & RESET PASSWORD
// ==========================================

// 5. Bước 1: Yêu cầu gửi mã OTP
export const requestOtp = async (req, res) => {
  try {
    const { phone, email } = req.body;

    if (!phone || !email) {
      return buildAuthError(res, 400, 'Vui lòng cung cấp đầy đủ số điện thoại và email');
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return buildAuthError(res, 404, 'Số điện thoại này chưa được đăng ký tài khoản');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Gán giá trị bắt buộc giải quyết triệt để lỗi Validation
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000; // Hiệu lực 10 phút
    user.passwordResetOtpTargetEmail = email;

    await user.save();

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Hỗ hỗ trợ Khôi phục Mật khẩu" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã xác thực OTP đặt lại mật khẩu',
      html: `
        <h3>Yêu cầu đặt lại mật khẩu</h3>
        <p>Mã OTP của bạn là: <strong style="font-size: 20px; color: #2563eb;">${otp}</strong></p>
        <p>Mã này có hiệu lực trong vòng 10 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      `,
    });

    return buildAuthResponse(res, {
      message: 'Mã OTP đã được gửi đến email của bạn.',
      user: null,
    });
  } catch (error) {
    console.error('❌ Lỗi request OTP:', error.message);
    return buildAuthError(res, 500, error.message);
  }
};

// 6. Bước 2: Xác thực mã OTP
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return buildAuthError(res, 400, 'Vui lòng nhập đầy đủ số điện thoại và mã OTP');
    }

    const user = await User.findOne({
      phone,
      passwordResetOtp: otp,
      passwordResetOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return buildAuthError(res, 400, 'Mã OTP không đúng hoặc đã hết hạn');
    }

    return buildAuthResponse(res, {
      message: 'Xác thực OTP thành công',
      user: null,
    });
  } catch (error) {
    console.error('❌ Lỗi verify OTP:', error.message);
    return buildAuthError(res, 500, error.message);
  }
};

// 7. Bước 3: Đặt lại mật khẩu mới
export const resetPassword = async (req, res) => {
  try {
    const { phone, newPassword, otp } = req.body;
    if (!phone || !newPassword || !otp) {
      return buildAuthError(res, 400, 'Thiếu thông tin để đặt lại mật khẩu');
    }

    const user = await User.findOne({
      phone,
      passwordResetOtp: otp,
      passwordResetOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return buildAuthError(res, 400, 'Mã OTP không hợp lệ hoặc phiên làm việc đã hết hạn');
    }

    // Cập nhật mật khẩu mới & Dọn dẹp OTP
    user.password = newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpTargetEmail = undefined;

    await user.save();

    return buildAuthResponse(res, {
      message: 'Đặt lại mật khẩu thành công',
      user: null,
    });
  } catch (error) {
    console.error('❌ Lỗi reset password:', error.message);
    return buildAuthError(res, 500, error.message);
  }
};