import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// ==========================================
// RESPONSE HELPERS
// ==========================================
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

// ==========================================
// 1. GOOGLE AUTH CALLBACK
// ==========================================
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
    console.error('❌ Lỗi Google Auth:', error.message);
    return buildAuthError(res, 500, error.message);
  }
};

// ==========================================
// 2. VERIFY GOOGLE TOKEN (CLIENT-SIDE)
// ==========================================
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

// ==========================================
// 3. GET CURRENT USER (bao gồm searchHistory & favorites)
// ==========================================
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
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
        favorites: user.favorites || [],
        searchHistory: user.searchHistory || [],
      },
    });
  } catch (error) {
    console.error('❌ Lỗi get user:', error.message);
    return buildAuthError(res, 500, 'Lỗi server khi lấy thông tin user');
  }
};

// ==========================================
// 4. LOGOUT
// ==========================================
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
// ⚠️ LƯU Ý: OTP ĐÃ ĐƯỢC CHUYỂN SANG userController.js
// ==========================================
// Các hàm requestOtp, verifyOtp, resetPassword hiện nằm ở userController.js
// Không duplicate code ở đây để tránh nhầm lẫn.