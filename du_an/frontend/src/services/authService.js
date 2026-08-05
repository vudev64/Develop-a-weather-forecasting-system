import { API_BASE_URL, ENDPOINTS } from '../config/api.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const normalizePayload = (input, password, username) => {
  if (input && typeof input === 'object') {
    return input;
  }

  return {
    phone: input,
    password,
    username,
  };
};

const readResponseJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const handleResponse = async (response) => {
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const authService = {
  login: async (phone, password) => {
    const payload = normalizePayload(phone, password);
    const response = await fetch(ENDPOINTS.USERS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: payload.phone, password: payload.password })
    });
    return handleResponse(response);
  },

  register: async (phone, password, username = '') => {
    const payload = normalizePayload(phone, password, username);
    const response = await fetch(ENDPOINTS.USERS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: payload.phone,
        username: payload.username,
        password: payload.password,
      })
    });
    return handleResponse(response);
  },

  verifyGoogleToken: async (credential) => {
    const response = await fetch(ENDPOINTS.AUTH.GOOGLE_VERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    return handleResponse(response);
  },

  getMe: async () => {
    const response = await fetch(ENDPOINTS.AUTH.ME, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  logout: async () => {
    try {
      const response = await fetch(ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        return handleResponse(response);
      }

      return handleResponse(response);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('phone');
    }
  },

  resetPassword: async (phone, newPassword, otp) => {
    const response = await fetch(ENDPOINTS.USERS.RESET_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        newPassword,
        otp
      })
    });
    return handleResponse(response);
  },

  requestOtp: async (phone, email) => {
    const response = await fetch(ENDPOINTS.USERS.REQUEST_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email })
    });
    return handleResponse(response);
  },

  verifyOtp: async (phone, otp) => {
    const response = await fetch(ENDPOINTS.USERS.VERIFY_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    return handleResponse(response);
  }
};
