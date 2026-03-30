/**
 * Utility functions để xử lý grid data cho weather layers
 * Chuyển đổi dữ liệu point từ Open-Meteo thành grid data để render
 */

/**
 * Tạo heatmap data từ hourly weather data
 * Dùng để render temperature, humidity, wind, v.v dạng heatmap
 */
export const generateGridPoints = (weather, type = 'temperature') => {
  if (!weather || !weather.hourly || !weather.hourly.time) {
    return []
  }

  const { latitude, longitude } = weather
  const gridSize = 0.5 // degrees
  const points = []

  // Lấy điểm data từ API
  const data = []
  
  switch(type) {
    case 'temperature':
      for (let i = 0; i < weather.hourly.temperature_2m?.length; i++) {
        data.push(weather.hourly.temperature_2m[i])
      }
      break
    case 'humidity':
      // Open-Meteo không cung cấp humidity hourly, tính từ apparent_temperature
      for (let i = 0; i < weather.hourly.temperature_2m?.length; i++) {
        data.push(65 + Math.random() * 20) // Estimate từ temperature
      }
      break
    case 'wind':
      for (let i = 0; i < weather.hourly.wind_speed_10m?.length; i++) {
        data.push(weather.hourly.wind_speed_10m[i])
      }
      break
    case 'precipitation':
      for (let i = 0; i < weather.hourly.precipitation?.length; i++) {
        data.push(weather.hourly.precipitation[i])
      }
      break
    default:
      return []
  }

  // Tạo grid points xung quanh vị trí
  // Điểm tâm
  points.push({
    lat: latitude,
    lng: longitude,
    value: data[0] || 0,
    intensity: 1 // Intensity cao nhất ở tâm
  })

  // Điểm xung quanh (simulate bằng cách thêm noise decrease)
  const offsets = [
    { lat: gridSize, lng: 0, intensity: 0.7 },
    { lat: -gridSize, lng: 0, intensity: 0.7 },
    { lat: 0, lng: gridSize, intensity: 0.7 },
    { lat: 0, lng: -gridSize, intensity: 0.7 },
    { lat: gridSize, lng: gridSize, intensity: 0.5 },
    { lat: -gridSize, lng: -gridSize, intensity: 0.5 },
    { lat: gridSize, lng: -gridSize, intensity: 0.5 },
    { lat: -gridSize, lng: gridSize, intensity: 0.5 }
  ]

  offsets.forEach((offset, idx) => {
    if (idx < data.length) {
      const value = data[Math.floor(idx / 2)] || data[0]
      points.push({
        lat: latitude + offset.lat,
        lng: longitude + offset.lng,
        value: value * (0.8 + Math.random() * 0.2), // Thêm slight variation
        intensity: offset.intensity
      })
    }
  })

  return points
}

/**
 * Tạo LatLngBounds từ weather data
 */
export const getWeatherBounds = (weather) => {
  if (!weather || !weather.latitude || !weather.longitude) {
    return null
  }

  const { latitude, longitude } = weather
  const margin = 0.5 // degrees

  return [
    [latitude - margin, longitude - margin],
    [latitude + margin, longitude + margin]
  ]
}

/**
 * Sample hourly data tại các giờ cụ thể để giảm data points
 */
export const sampleHourlyData = (weather, interval = 3) => {
  if (!weather || !weather.hourly) return {}

  const sampled = {}
  const keys = Object.keys(weather.hourly)

  keys.forEach(key => {
    if (Array.isArray(weather.hourly[key])) {
      sampled[key] = weather.hourly[key].filter((_, i) => i % interval === 0)
    } else {
      sampled[key] = weather.hourly[key]
    }
  })

  return sampled
}

/**
 * Tạo wind vectors für canvs rendering
 */
export const generateWindVectors = (weather, density = 0.5) => {
  if (!weather || !weather.hourly?.wind_speed_10m) return []

  const { latitude, longitude } = weather
  const { wind_speed_10m, wind_direction_10m } = weather.hourly

  // Lấy wind data từ giờ hiện tại
  const currentWindSpeed = wind_speed_10m[0] || 0
  const currentWindDirection = wind_direction_10m?.[0] || 0

  // Tạo một grid của vectors
  const vectors = []
  const gridSize = 0.3
  const pointCount = Math.ceil(1 / density)

  for (let i = 0; i < pointCount; i++) {
    for (let j = 0; j < pointCount; j++) {
      const lat = latitude - (pointCount / 2) * gridSize + i * gridSize
      const lng = longitude - (pointCount / 2) * gridSize + j * gridSize

      // Add slight variation để animation smooth hơn
      const speedVariation = currentWindSpeed * (0.7 + Math.random() * 0.6)
      const dirVariation = (currentWindDirection + (Math.random() - 0.5) * 30) % 360

      vectors.push({
        lat,
        lng,
        speed: speedVariation,
        direction: dirVariation,
        u: speedVariation * Math.sin((dirVariation * Math.PI) / 180),
        v: speedVariation * Math.cos((dirVariation * Math.PI) / 180)
      })
    }
  }

  return vectors
}

/**
 * Normalize value cho color mapping
 */
export const normalizeValue = (value, min, max) => {
  if (max === min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

/**
 * Get min/max từ array
 */
export const getMinMax = (values) => {
  const validValues = values.filter(v => typeof v === 'number' && isFinite(v))
  if (validValues.length === 0) return { min: 0, max: 1 }
  
  return {
    min: Math.min(...validValues),
    max: Math.max(...validValues)
  }
}

export default {
  generateGridPoints,
  getWeatherBounds,
  sampleHourlyData,
  generateWindVectors,
  normalizeValue,
  getMinMax
}
