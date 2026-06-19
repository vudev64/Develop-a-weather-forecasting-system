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
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return data;
};

export const weatherService = {
  getWeatherByCity: async (city) => {
    const response = await fetch(ENDPOINTS.WEATHER.BY_CITY(city));
    return handleResponse(response);
  },

  getWeatherByCoordinates: async (lat, lon) => {
    const response = await fetch(ENDPOINTS.WEATHER.BY_COORDINATES(lat, lon));
    return handleResponse(response);
  },

  getWeatherHistory: async (city) => {
    const response = await fetch(ENDPOINTS.WEATHER.HISTORY(city));
    return handleResponse(response);
  },

  saveSearchHistory: async (city) => {
    const response = await fetch(ENDPOINTS.USERS.SEARCH_HISTORY, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ city })
    });
    return handleResponse(response);
  }
};
