import { API_BASE_URL, ENDPOINTS } from '../config/api.js'

const buildAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const readResponseJson = async (response) => {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

const getErrorMessage = (data, response) => {
  if (data?.message) return data.message
  if (data?.error) return data.error
  return `HTTP ${response.status}: ${response.statusText}`
}

const handleResponse = async (response) => {
  const data = await readResponseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response))
  }

  return data
}

const normalizeWeatherPayload = (data) => {
  const current = data?.data?.current || {}

  return {
    ...data?.data,
    city: data?.data?.city || '',
    country: data?.data?.country || '',
    latitude: data?.data?.latitude,
    longitude: data?.data?.longitude,
    temperature: Math.round(current.temperature ?? 0),
    feelsLike: Math.round(current.feelsLike ?? current.feels_like ?? 0),
    humidity: current.humidity ?? 0,
    windSpeed: current.windSpeed ?? 0,
    windDirection: current.windDirection ?? 0,
    windGust: current.windGust ?? 0,
    precipitation: current.precipitation ?? 0,
    weatherCode: current.weatherCode ?? 0,
  }
}

export const mapWeatherResponse = (response) => {
  const weatherData = normalizeWeatherPayload(response)

  return {
    ...weatherData,
  }
}

export const weatherService = {
  getWeatherByCity: async (city) => {
    const response = await fetch(ENDPOINTS.WEATHER.BY_CITY(city))
    return handleResponse(response)
  },

  getWeatherByCoordinates: async (lat, lon) => {
    const response = await fetch(ENDPOINTS.WEATHER.BY_COORDINATES(lat, lon))
    return handleResponse(response)
  },

  getWeatherHistory: async (city) => {
    const response = await fetch(ENDPOINTS.WEATHER.HISTORY(city))
    return handleResponse(response)
  },

  getHistory: async (city) => {
    return weatherService.getWeatherHistory(city)
  },

  saveSearchHistory: async (city) => {
    const normalizedCity = (city || '').trim()

    if (normalizedCity) {
      const storedHistory = JSON.parse(localStorage.getItem('weather-search-history') || '[]')
      const nextHistory = [
        { city: normalizedCity, searchedAt: new Date().toISOString() },
        ...storedHistory.filter((item) => item.city?.toLowerCase() !== normalizedCity.toLowerCase())
      ].slice(0, 10)

      localStorage.setItem('weather-search-history', JSON.stringify(nextHistory))
    }

    const response = await fetch(ENDPOINTS.USERS.SEARCH_HISTORY, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify({ city: normalizedCity })
    })
    return handleResponse(response)
  },

  getFavorites: async () => {
    const response = await fetch(`${API_BASE_URL}/users/favorites`, {
      headers: buildAuthHeaders(),
    })
    return handleResponse(response)
  },

  addFavorite: async (city) => {
    const response = await fetch(`${API_BASE_URL}/users/favorites`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify({ city })
    })
    return handleResponse(response)
  },

  removeFavorite: async (city) => {
    const response = await fetch(`${API_BASE_URL}/users/favorites/${encodeURIComponent(city)}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(),
    })
    return handleResponse(response)
  }
}
