import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// ==========================================
// CẤU HÌNH
// ==========================================
const OTP_TTL_MINUTES = 10;
const HISTORY_LIMIT = 20;
const OTP_LENGTH = 6;

// ==========================================
// VALIDATION
// ==========================================
const PHONE_REGEX = /^(\+?[0-9]{9,15}|0[0-9]{9})$/;
const CITY_REGEX = /^[\p{L}\s.'-]{2,80}$/u;

const isValidPhone = (phone) => PHONE_REGEX.test(String(phone || '').trim());

const isValidPassword = (pwd) => {
  if (!pwd || pwd.length < 8) return false;
  if (!/[a-z]/.test(pwd)) return false;
  if (!/[A-Z]/.test(pwd)) return false;
  if (!/[0-9]/.test(pwd)) return false;
  if (!/[^a-zA-Z0-9]/.test(pwd)) return false;
  return true;
};

const isValidCity = (city) => CITY_REGEX.test(String(city || '').trim());

// ==========================================
// NORMALIZE HELPERS
// ==========================================
const normalizePhone = (phone) => String(phone || '').trim();
const normalizeCity = (city) => String(city || '').trim();
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// ==========================================
// OTP HELPERS - FIX QUAN TRỌNG
// ==========================================
const getOtpTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER hoặc EMAIL_PASS không được cấu hình trong .env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ✅ FIX: Sử dụng Math.random thay vì crypto.randomInt để tương thích 100%
const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const isOtpExpired = (expiresAt) => !expiresAt || new Date(expiresAt).getTime() < Date.now();

// ==========================================
// RESPONSE BUILDERS
// ==========================================
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

// ==========================================
// 1. ĐĂNG KÝ
// ==========================================
export const register = async (req, res) => {
  try {
    const { phone, username, password } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const normalizedUsername = String(username || '').trim();

    if (!isValidPhone(normalizedPhone) || !isValidPassword(password)) {
      return buildError(res, 400, 'Vui lòng nhập phone hợp lệ và mật khẩu đủ mạnh');
    }

    const existingUser = await User.findOne({ phone: normalizedPhone });
    if (existingUser) {
      return buildError(res, 400, 'Số điện thoại đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      phone: normalizedPhone,
      username: normalizedUsername || normalizedPhone,
      password: hashedPassword,
    });
    await newUser.save();

    return buildSuccess(res, {
      status: 201,
      message: 'Đăng ký thành công',
      data: {
        id: newUser._id,
        phone: newUser.phone,
        username: newUser.username,
      },
    });
  } catch (error) {
    console.error('❌ Lỗi đăng ký:', error.message);
    return buildError(res, 500, 'Lỗi server');
  }
};

// ==========================================
// 2. ĐĂNG NHẬP
// ==========================================
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!isValidPhone(normalizedPhone) || !password) {
      return buildError(res, 400, 'Vui lòng nhập phone hợp lệ và mật khẩu');
    }

    const user = await User.findOne({ phone: normalizedPhone }).select('+password');

    if (!user) {
      return buildError(res, 401, 'Số điện thoại hoặc mật khẩu không đúng');
    }

    const isValidPasswordHash = await bcrypt.compare(password, user.password);
    if (!isValidPasswordHash) {
      return buildError(res, 401, 'Số điện thoại hoặc mật khẩu không đúng');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình');
    }
    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return buildSuccess(res, {
      message: 'Đăng nhập thành công',
      token,
      data: {
        id: user._id,
        phone: user.phone,
        username: user.username,
        favorites: user.favorites || [],
        searchHistory: user.searchHistory || [],
      },
    });
  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error.message);
    return buildError(res, 500, 'Lỗi server');
  }
};

// ==========================================
// 3. GỬI OTP - FIX LOGIC VÀ ERROR HANDLING
// ==========================================
export const requestOtp = async (req, res) => {
  // Log đầu tiên để biết API đã được gọi
  console.log('📩 [requestOtp] Bắt đầu xử lý yêu cầu');

  try {
    const { phone, email } = req.body;
    console.log(`📩 Phone: ${phone}, Email: ${email}`);

    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = normalizeEmail(email);

    if (!isValidPhone(normalizedPhone) || !normalizedEmail) {
      console.log('❌ Validation thất bại: phone hoặc email không hợp lệ');
      return buildError(res, 400, 'Vui lòng nhập phone hợp lệ và email hợp lệ');
    }

    console.log('🔍 Đang tìm user với phone:', normalizedPhone);
    const user = await User.findOne({ phone: normalizedPhone }).select(
      '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpVerifiedAt +passwordResetOtpTargetEmail'
    );

    if (!user) {
      console.log('❌ Không tìm thấy user');
      return buildError(res, 404, 'Không tìm thấy tài khoản với số điện thoại này');
    }

    if (user.email && user.email.toLowerCase() !== normalizedEmail) {
      console.log('❌ Email không khớp');
      return buildError(res, 400, 'Email không khớp với tài khoản');
    }

    if (!user.email) {
      user.email = normalizedEmail;
    }

    console.log('🔢 Đang tạo OTP...');
    const otp = generateOtp();
    console.log(`🔢 OTP được tạo: ${otp}`);

    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = otpExpiresAt;
    user.passwordResetOtpVerifiedAt = null;
    user.passwordResetOtpTargetEmail = normalizedEmail;
    await user.save();
    console.log('💾 OTP đã được lưu vào database');

    console.log('📤 Đang gửi email...');
    const transporter = getOtpTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: 'OTP đặt lại mật khẩu',
      text: `Mã OTP đặt lại mật khẩu của bạn là: ${otp}. Mã này hết hạn sau ${OTP_TTL_MINUTES} phút.`,
      html: `<p>Mã OTP đặt lại mật khẩu của bạn là <b>${otp}</b>.</p><p>Mã này hết hạn sau ${OTP_TTL_MINUTES} phút.</p>`,
    });
    console.log('✅ Email đã được gửi thành công!');

    return buildSuccess(res, {
      message: 'OTP đã được gửi qua Gmail',
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        expiresInMinutes: OTP_TTL_MINUTES,
      },
    });
  } catch (error) {
    console.error('❌ LỖI requestOtp CHI TIẾT:', error);
    console.error('❌ Stack trace:', error.stack);
    return buildError(res, 500, 'Không thể gửi OTP: ' + error.message);
  }
};

// ==========================================
// 4. XÁC THỰC OTP
// ==========================================
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const sanitizedOtp = String(otp || '').trim();

    if (!isValidPhone(normalizedPhone) || !/^\d{6}$/.test(sanitizedOtp)) {
      return buildError(res, 400, 'Vui lòng nhập phone hợp lệ và OTP 6 chữ số');
    }

    const user = await User.findOne({ phone: normalizedPhone }).select(
      '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpVerifiedAt +passwordResetOtpTargetEmail'
    );

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return buildError(res, 400, 'OTP không hợp lệ hoặc chưa được yêu cầu');
    }

    if (isOtpExpired(user.passwordResetOtpExpiresAt)) {
      return buildError(res, 400, 'OTP đã hết hạn');
    }

    if (user.passwordResetOtpHash !== hashOtp(sanitizedOtp)) {
      return buildError(res, 400, 'OTP không chính xác');
    }

    user.passwordResetOtpVerifiedAt = new Date();
    await user.save();

    return buildSuccess(res, {
      message: 'OTP hợp lệ',
      data: {
        phone: normalizedPhone,
        email: user.passwordResetOtpTargetEmail || user.email,
        verifiedAt: user.passwordResetOtpVerifiedAt,
      },
    });
  } catch (error) {
    console.error('❌ Lỗi verify OTP:', error.message);
    return buildError(res, 500, 'Không thể xác thực OTP');
  }
};

// ==========================================
// 5. ĐẶT LẠI MẬT KHẨU
// ==========================================
export const resetPassword = async (req, res) => {
  try {
    const { phone, newPassword, otp } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const sanitizedOtp = String(otp || '').trim();

    if (!isValidPhone(normalizedPhone) || !isValidPassword(newPassword) || !/^\d{6}$/.test(sanitizedOtp)) {
      return buildError(res, 400, 'Vui lòng nhập phone hợp lệ, OTP hợp lệ và mật khẩu đủ mạnh');
    }

    const user = await User.findOne({ phone: normalizedPhone }).select(
      '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpVerifiedAt +passwordResetOtpTargetEmail +password'
    );
    if (!user) {
      return buildError(res, 404, 'Không tìm thấy tài khoản với số điện thoại này');
    }

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt || !user.passwordResetOtpVerifiedAt) {
      return buildError(res, 400, 'OTP chưa được xác thực');
    }

    if (isOtpExpired(user.passwordResetOtpExpiresAt)) {
      return buildError(res, 400, 'OTP đã hết hạn');
    }

    if (user.passwordResetOtpHash !== hashOtp(sanitizedOtp)) {
      return buildError(res, 400, 'OTP không chính xác');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpVerifiedAt = undefined;
    user.passwordResetOtpTargetEmail = undefined;
    await user.save();

    return buildSuccess(res, {
      message: 'Đặt lại mật khẩu thành công',
      data: {
        phone: normalizedPhone,
        resetAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Lỗi reset mật khẩu:', error.message);
    return buildError(res, 500, 'Lỗi server');
  }
};

// ==========================================
// 6. LƯU LỊCH SỬ TÌM KIẾM
// ==========================================
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

// ==========================================
// 7. FAVORITES API
// ==========================================

// 7.1 Lấy danh sách yêu thích
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

// 7.2 Thêm địa điểm yêu thích
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

// 7.3 Xóa địa điểm yêu thích
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