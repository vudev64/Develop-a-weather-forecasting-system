import User from '../models/User.js';

// Đăng ký
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    // Tạo user mới
    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        id: newUser._id,
        username: newUser.username
      }
    });

  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
};

// Đăng nhập
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Tìm user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        id: user._id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
};

// Lưu lịch sử tìm kiếm
export const saveSearchHistory = async (req, res) => {
  try {
    const { username, city } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    user.searchHistory.push({ city });
    await user.save();

    res.json({
      success: true,
      message: 'Đã lưu lịch sử tìm kiếm'
    });

  } catch (error) {
    console.error('Lỗi lưu lịch sử:', error.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
