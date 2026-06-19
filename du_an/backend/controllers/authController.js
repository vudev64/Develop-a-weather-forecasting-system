import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// Google OAuth Callback - xử lý sau khi Google xác thực (Passport strategy)
export const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Không thể xác thực' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình trong .env');
    }

    // Tạo JWT token bao gồm phone nếu có
    const token = jwt.sign(
      { 
        id: user._id, 
        phone: user.phone || user.username,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect về frontend với token qua cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard`);

  } catch (error) {
    console.error('Lỗi Google Auth:', error.message);
    res.redirect(`http://localhost:3000?error=${encodeURIComponent(error.message)}`);
  }
};

// Verify Google Token từ Frontend (React Google Login)
export const verifyGoogleToken = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Thiếu credential' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      throw new Error('Cấu hình môi trường GOOGLE_CLIENT_ID hoặc JWT_SECRET bị thiếu');
    }

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify token với Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    // Tìm hoặc tạo user
    let user = await User.findOne({ email });

    if (!user) {
      // Tạo user mới từ Google info
      // Lưu ý: Google login thường không có phone, ta dùng username làm tạm thời
      user = new User({
        username: email.split('@')[0],
        email: email,
        password: 'google_oauth_placeholder',
        googleId: sub,
        picture: picture,
        fullName: name
      });
      await user.save();
    } else if (!user.googleId) {
      // Link tài khoản hiện tại với Google
      user.googleId = sub;
      user.picture = picture;
      user.fullName = name;
      await user.save();
    }

    // Tạo JWT token
    const jwtToken = jwt.sign(
      { 
        id: user._id, 
        phone: user.phone || user.username, // Ưu tiên phone, fallback username
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Trả về đúng cấu trúc mà Frontend mong đợi
    res.json({
      success: true,
      token: jwtToken,
      data: { 
        id: user._id,
        phone: user.phone || user.username,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        picture: user.picture,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Lỗi verify Google token:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      res.status(401).json({ 
        error: 'Xác thực Google thất bại',
        details: error.message 
      });
    } else {
      res.status(401).json({ error: 'Xác thực Google thất bại' });
    }
  }
};

// Get current user info (API /auth/me)
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; // Lấy từ auth middleware
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    // ✅ CẬP NHẬT: Thêm phone và đổi key thành 'data'
    res.json({
      success: true,
      data: {
        id: user._id,
        phone: user.phone,       // Trường quan trọng nhất cho Avatar Menu
        username: user.username, 
        email: user.email,
        fullName: user.fullName,
        picture: user.picture,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Lỗi get user:', error.message);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin user' });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Đã đăng xuất thành công'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};