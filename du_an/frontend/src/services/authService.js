
import { ENDPOINTS } from '../config/api.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
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
    const message =
      data.message ||
      data.error ||
      `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

const postJson = async (url, body, options = {}) => {
  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.auth ? getAuthHeaders() : {}),
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });
  } catch (cause) {
    const error = new Error(
      'Không thể kết nối đến server. Vui lòng kiểm tra backend và địa chỉ API.'
    );
    error.cause = cause;
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  return handleResponse(response);
};

export const authService = {
  login: async (email, password) =>
    postJson(ENDPOINTS.USERS.LOGIN, { email, password }),

  register: async (email, password, username = '') =>
    postJson(ENDPOINTS.USERS.REGISTER, {
      email,
      username,
      password,
    }),

  verifyGoogleToken: async (credential) =>
    postJson(ENDPOINTS.AUTH.GOOGLE_VERIFY, { credential }),

  getMe: async () => {
    let response;

    try {
      response = await fetch(ENDPOINTS.AUTH.ME, {
        headers: getAuthHeaders(),
      });
    } catch (cause) {
      const error = new Error(
        'Không thể kết nối đến server khi lấy thông tin tài khoản.'
      );
      error.cause = cause;
      error.code = 'NETWORK_ERROR';
      throw error;
    }

    return handleResponse(response);
  },

  logout: async () => {
    try {
      return await postJson(
        ENDPOINTS.AUTH.LOGOUT,
        {},
        { auth: true }
      );
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    }
  },

  resetPassword: async (token, newPassword) =>
    postJson(ENDPOINTS.USERS.RESET_PASSWORD, { token, newPassword }),

  requestPasswordReset: async (email, options = {}) =>
    postJson(
      ENDPOINTS.USERS.REQUEST_PASSWORD_RESET,
      { email },
      { signal: options.signal }
    ),
};
