import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Hàm kiểm tra độ mạnh mật khẩu
const isPasswordStrong = (pwd) => {
  if (pwd.length < 8) return false;
  if (!/[a-z]/.test(pwd)) return false; // Chữ thường
  if (!/[A-Z]/.test(pwd)) return false; // Chữ hoa
  if (!/[0-9]/.test(pwd)) return false; // Số
  if (!/[^a-zA-Z0-9]/.test(pwd)) return false; // Ký tự đặc biệt
  return true;
};

// Đăng ký
export const register = async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: 'Mật khẩu phải đủ mạnh: ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt' });
    }

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = new User({ 
      phone, 
      username: username || phone, 
      password: hashedPassword 
    });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        id: newUser._id,
        phone: newUser.phone,
        username: newUser.username
      }
    });

  } catch (error) {
    console.error('Lỗi đăng ký:', error.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Đăng nhập
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Tìm user
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Số điện thoại hoặc mật khẩu không đúng' });
    }

    // So sánh password với hash
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Số điện thoại hoặc mật khẩu không đúng' });
    }

    // Tạo JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình');
    }
    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      data: {
        id: user._id,
        phone: user.phone,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lưu lịch sử tìm kiếm (optional - chỉ save nếu user login)
export const saveSearchHistory = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'Vui lòng nhập tên thành phố' });
    }

    // Lấy token từ header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    // Nếu không có token, return success nhưng không lưu
    if (!token) {
      console.log('⚠️ Save search history: User chưa login, skip lưu');
      return res.json({
        success: true,
        message: 'Tìm kiếm thành công (không lưu lịch sử)',
        saved: false,
        tip: 'Đăng nhập để lưu lịch sử tìm kiếm'
      });
    }

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Lưu lịch sử cho user login
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    user.searchHistory.push({ city });
    await user.save();

    console.log(`✅ Lưu search history: ${city} cho user ${user.username}`);
    res.json({
      success: true,
      message: 'Đã lưu lịch sử tìm kiếm',
      saved: true
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      // Token invalid, skip lưu nhưng return success
      console.log('⚠️ Token invalid, skip lưu search history');
      return res.json({
        success: true,
        message: 'Tìm kiếm thành công (không lưu lịch sử)',
        saved: false,
        tip: 'Đăng nhập để lưu lịch sử tìm kiếm'
      });
    }
    
    console.error('Lỗi lưu lịch sử:', error.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Reset mật khẩu
export const resetPassword = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ error: 'Mật khẩu phải đủ mạnh: ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt' });
    }

    // Tìm user theo số điện thoại
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với số điện thoại này' });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });

  } catch (error) {
    console.error('Lỗi reset mật khẩu:', error.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
