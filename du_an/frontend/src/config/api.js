const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!rawApiBaseUrl) {
  throw new Error('Missing VITE_API_BASE_URL in frontend/.env')
}

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')

export const ENDPOINTS = {
  AUTH: {
    GOOGLE_VERIFY: `${API_BASE_URL}/auth/google/verify`,
    ME: `${API_BASE_URL}/auth/me`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
  },
  USERS: {
    LOGIN: `${API_BASE_URL}/users/login`,
    REGISTER: `${API_BASE_URL}/users/register`,
    RESET_PASSWORD: `${API_BASE_URL}/users/reset-password`,
    REQUEST_OTP: `${API_BASE_URL}/users/request-otp`,
    VERIFY_OTP: `${API_BASE_URL}/users/verify-otp`,
    SEARCH_HISTORY: `${API_BASE_URL}/users/search-history`,
  },
  WEATHER: {
    BY_CITY: (city) => `${API_BASE_URL}/weather/${encodeURIComponent(city)}`,
    BY_COORDINATES: (lat, lon) => `${API_BASE_URL}/weather/coordinates?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
    HISTORY: (city) => `${API_BASE_URL}/weather/history/${encodeURIComponent(city)}`,
  },
}

export const CONNECTION_ERROR_MESSAGE = 'Đảm bảo backend đang chạy và biến môi trường VITE_API_BASE_URL được cấu hình đúng.'
