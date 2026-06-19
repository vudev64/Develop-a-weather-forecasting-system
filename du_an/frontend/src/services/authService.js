import { ENDPOINTS } from '../config/api.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return data;
};

export const authService = {
  login: async (username, password) => {
    const response = await fetch(ENDPOINTS.USERS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },

  register: async (username, password) => {
    const response = await fetch(ENDPOINTS.USERS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
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

  getCurrentUser: async () => {
    const response = await fetch(ENDPOINTS.AUTH.ME, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }
};
