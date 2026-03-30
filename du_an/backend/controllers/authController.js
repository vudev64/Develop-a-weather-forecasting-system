import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Google OAuth Callback - xử lý sau khi Google xác thực
export const googleAuthCallback = async (req, res) => {
  try {
    // Passport đã xác thực, user info trong req.user
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Không thể xác thực' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Redirect về frontend với token
    const frontendUrl = `http://localhost:3000/dashboard?token=${token}&user=${user.username}`;
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('Lỗi Google Auth:', error.message);
    res.redirect(`http://localhost:3000?error=${encodeURIComponent(error.message)}`);
  }
};

// Verify Google Token từ Frontend
export const verifyGoogleToken = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Thiếu credential' });
    }

    // Decode token từ Google (không cần verify vì client đã verify)
    // Hoặc có thể verify server-side nếu cần
    const decoded = jwt.decode(credential);

    if (!decoded) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const { email, name, picture } = decoded;

    // Tìm hoặc tạo user
    let user = await User.findOne({ email });

    if (!user) {
      // Tạo user mới từ Google info
      user = new User({
        username: email.split('@')[0], // Dùng phần trước @ của email làm username
        email: email,
        password: 'google_oauth', // Marker cho Google login
        googleId: decoded.sub,
        picture: picture,
        fullName: name
      });
      await user.save();
    } else if (!user.googleId) {
      // Update user với Google ID nếu chưa có
      user.googleId = decoded.sub;
      user.picture = picture;
      user.fullName = name;
      await user.save();
    }

    // Tạo JWT token
    const jwtToken = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Lỗi verify token:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get current user info
export const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Không có token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Lỗi get user:', error.message);
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Đã đăng xuất'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
