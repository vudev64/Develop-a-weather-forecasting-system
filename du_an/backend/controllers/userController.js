import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetLink } from '../services/gmail.js';

// CẤU HÌNH
const PASSWORD_RESET_TTL_MINUTES = 30;
const HISTORY_LIMIT = 20;

// VALIDATION
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CITY_REGEX = /^[\p{L}\s.'-]{2,80}$/u;

const isValidEmail = (email) => EMAIL_REGEX.test(String(email || '').trim());

const isValidPassword = (pwd) => {
  if (!pwd || pwd.length < 8) return false;
  if (!/[a-z]/.test(pwd)) return false;
  if (!/[A-Z]/.test(pwd)) return false;
  if (!/[0-9]/.test(pwd)) return false;
  if (!/[^a-zA-Z0-9]/.test(pwd)) return false;
  return true;
};

const isValidCity = (city) => CITY_REGEX.test(String(city || '').trim());

// NORMALIZE HELPERS
const normalizeCity = (city) => String(city || '').trim();
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashPasswordResetToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET không được cấu hình');
  }
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(token)).digest('hex');
};

const buildSuccess = (res, { data = null, message = 'OK', status = 200, token }) => {
  return res.status(status).json({
    success: true,
    message,
    token,
    data,
  });
};

const buildError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    error: message,
  });
};

// 1. ĐĂNG KÝ
export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = String(username || '').trim();

    if (!isValidEmail(normalizedEmail) || !isValidPassword(password)) {
      return buildError(res, 400, 'Vui lòng nhập email hợp lệ và mật khẩu đủ mạnh');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return buildError(res, 409, 'Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: normalizedEmail,
      username: normalizedUsername || normalizedEmail.split('@')[0],
      password: hashedPassword,
    });
    await newUser.save();

    return buildSuccess(res, {
      status: 201,
      message: 'Đăng ký thành công',
      data: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error.message);
    if (error.code === 11000) {
      return buildError(res, 409, 'Email đã được sử dụng');
    }
    return buildError(res, 500, 'Lỗi server');
  }
};

// 2. ĐĂNG NHẬP
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail) || !password) {
      return buildError(res, 400, 'Vui lòng nhập email hợp lệ và mật khẩu');
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return buildError(res, 401, 'Email hoặc mật khẩu không đúng');
    }

    const isValidPasswordHash = await bcrypt.compare(password, user.password);
    if (!isValidPasswordHash) {
      return buildError(res, 401, 'Email hoặc mật khẩu không đúng');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình');
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return buildSuccess(res, {
      message: 'Đăng nhập thành công',
      token,
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        favorites: user.favorites || [],
        searchHistory: user.searchHistory || [],
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    return buildError(res, 500, 'Lỗi server');
  }
};

// 3. GỬI LINK ĐẶT LẠI MẬT KHẨU
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return buildError(res, 400, 'Vui lòng cung cấp email hợp lệ');
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return buildSuccess(res, {
        message: 'Nếu email đã đăng ký, bạn sẽ nhận được link đặt lại mật khẩu.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashPasswordResetToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetLink({
        email: user.email,
        resetToken,
        expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
      });

      return buildSuccess(res, {
        message: 'Nếu email đã đăng ký, bạn sẽ nhận được link đặt lại mật khẩu.',
      });
    } catch (gmailError) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      console.error('Gmail API gửi link đặt lại mật khẩu thất bại:', {
        stage: gmailError.stage || 'oauth_token',
        code: gmailError.code || 'GMAIL_SEND_FAILED',
        reason: gmailError.reason,
      });
      return buildError(res, 502, 'Không thể gửi link đặt lại mật khẩu lúc này. Vui lòng thử lại sau.');
    }
  } catch (error) {
    console.error('Lỗi yêu cầu đặt lại mật khẩu:', error.code || 'PASSWORD_RESET_REQUEST_FAILED');
    return buildError(res, 500, 'Không thể gửi link đặt lại mật khẩu lúc này.');
  }
};

// 4. ĐẶT LẠI MẬT KHẨU
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token) || !isValidPassword(newPassword)) {
      return buildError(res, 400, 'Link đặt lại mật khẩu không hợp lệ hoặc mật khẩu chưa đủ mạnh');
    }

    const tokenHash = hashPasswordResetToken(token);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await User.updateOne(
      {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      },
      {
        $set: { password: hashedPassword },
        $unset: {
          passwordResetTokenHash: '',
          passwordResetExpiresAt: '',
        },
      }
    );

    if (result.modifiedCount !== 1) {
      return buildError(res, 400, 'Link đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng');
    }

    return buildSuccess(res, {
      message: 'Đặt lại mật khẩu thành công',
    });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error.code || 'PASSWORD_RESET_FAILED');
    return buildError(res, 500, 'Lỗi server');
  }
};

// 6. LƯU LỊCH SỬ TÌM KIẾM
export const saveSearchHistory = async (req, res) => {
  try {
    const { city } = req.body;
    const normalizedCity = normalizeCity(city);

    if (!isValidCity(normalizedCity)) {
      return buildError(res, 400, 'Vui lòng nhập tên thành phố hợp lệ');
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('⚠️ Save search history: User chưa login, skip lưu');
      return buildSuccess(res, {
        message: 'Tìm kiếm thành công (không lưu lịch sử)',
        data: {
          saved: false,
          tip: 'Đăng nhập để lưu lịch sử tìm kiếm',
        },
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return buildError(res, 404, 'Không tìm thấy user');
    }

    const existingHistory = Array.isArray(user.searchHistory) ? user.searchHistory : [];
    const normalizedExisting = existingHistory
      .map((item) => ({ city: String(item.city || '').trim(), searchedAt: item.searchedAt || item.createdAt || new Date() }))
      .filter((item) => item.city);

    const dedupedHistory = [
      { city: normalizedCity, searchedAt: new Date() },
      ...normalizedExisting.filter((item) => item.city.toLowerCase() !== normalizedCity.toLowerCase()),
    ].slice(0, HISTORY_LIMIT);

    user.searchHistory = dedupedHistory;
    await user.save();

    console.log(`✅ Lưu search history: ${normalizedCity} cho user ${user.username}`);
    return buildSuccess(res, {
      message: 'Đã lưu lịch sử tìm kiếm',
      data: {
        saved: true,
        historyCount: dedupedHistory.length,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.log('⚠️ Token invalid, skip lưu search history');
      return buildSuccess(res, {
        message: 'Tìm kiếm thành công (không lưu lịch sử)',
        data: {
          saved: false,
          tip: 'Đăng nhập để lưu lịch sử tìm kiếm',
        },
      });
    }

    console.error('❌ Lỗi lưu lịch sử:', error.message);
    return buildError(res, 500, 'Lỗi server');
  }
};

// 7. FAVORITES API
export const getFavorites = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const user = await User.findById(userId).select('favorites');

    if (!user) {
      return buildError(res, 404, 'Không tìm thấy tài khoản');
    }

    return buildSuccess(res, {
      message: 'Lấy danh sách yêu thích thành công',
      data: user.favorites || [],
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách yêu thích:', error.message);
    return buildError(res, 500, 'Lỗi server khi lấy danh sách yêu thích');
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { cityName, lat, lon } = req.body;
    const normalizedCity = normalizeCity(cityName);

    if (!isValidCity(normalizedCity)) {
      return buildError(res, 400, 'Tên thành phố không hợp lệ');
    }

    const userId = req.userId || req.user?.id || req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return buildError(res, 404, 'Không tìm thấy tài khoản');
    }

    const favorites = Array.isArray(user.favorites) ? user.favorites : [];
    const isExist = favorites.some((fav) => String(fav.cityName || '').toLowerCase() === normalizedCity.toLowerCase());

    if (isExist) {
      return buildError(res, 400, 'Thành phố này đã có trong danh sách yêu thích');
    }

    const newFavorite = {
      cityName: normalizedCity,
      lat: lat ? Number(lat) : undefined,
      lon: lon ? Number(lon) : undefined,
      addedAt: new Date(),
    };

    user.favorites.push(newFavorite);
    await user.save();

    return buildSuccess(res, {
      message: 'Đã thêm vào danh sách yêu thích',
      data: user.favorites,
    });
  } catch (error) {
    console.error('❌ Lỗi thêm địa điểm yêu thích:', error.message);
    return buildError(res, 500, 'Lỗi server khi thêm địa điểm yêu thích');
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { cityName } = req.params;
    const normalizedCity = normalizeCity(cityName);

    if (!normalizedCity) {
      return buildError(res, 400, 'Vui lòng cung cấp tên thành phố cần xóa');
    }

    const userId = req.userId || req.user?.id || req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return buildError(res, 404, 'Không tìm thấy tài khoản');
    }

    const initialLength = user.favorites.length;
    user.favorites = user.favorites.filter(
      (fav) => String(fav.cityName || '').toLowerCase() !== normalizedCity.toLowerCase()
    );

    if (user.favorites.length === initialLength) {
      return buildError(res, 404, 'Không tìm thấy thành phố này trong danh sách yêu thích');
    }

    await user.save();

    return buildSuccess(res, {
      message: 'Đã xóa khỏi danh sách yêu thích',
      data: user.favorites,
    });
  } catch (error) {
    console.error('❌ Lỗi xóa địa điểm yêu thích:', error.message);
    return buildError(res, 500, 'Lỗi server khi xóa địa điểm yêu thích');
  }
};