/**
 * Color scales cho các weather layer - tương tự Windy
 */

// Temperature color scale (Centigrade)
export const getTemperatureColor = (temp) => {
  let color
  if (temp <= -30) color = '#341560' // Very cold
  else if (temp <= -15) color = '#4575b4' // Cold
  else if (temp <= 0) color = '#74add1'  // Cool
  else if (temp <= 10) color = '#abd9e9' // Light cool
  else if (temp <= 15) color = '#dfc97f' // Mild
  else if (temp <= 20) color = '#fff200' // Warm
  else if (temp <= 25) color = '#ffb300' // Warmer
  else if (temp <= 30) color = '#ff6a00' // Hot
  else if (temp <= 35) color = '#ff0000' // Very hot
  else if (temp <= 40) color = '#b30000' // Extreme
  else color = '#8b0000'  // Ultra extreme
  
  return color
}

// Wind speed color scale (m/s)
export const getWindColor = (speed) => {
  let color
  if (speed < 2) color = '#0099ff'     // Calm
  else if (speed < 4) color = '#00ddff'  // Light
  else if (speed < 6) color = '#00ff00'  // Moderate
  else if (speed < 8) color = '#ffff00'  // Fresh
  else if (speed < 10) color = '#ffaa00' // Strong
  else if (speed < 12) color = '#ff6600' // Very strong
  else if (speed < 15) color = '#ff0000' // Gale
  else color = '#8b0000'               // Hurricane
  
  return color
}

// Precipitation color scale (mm/hour)
export const getPrecipitationColor = (mm) => {
  let color
  if (mm <= 0) color = 'transparent'
  else if (mm <= 0.1) color = '#e3f2fd'
  else if (mm <= 0.5) color = '#b3e5fc'
  else if (mm <= 1) color = '#81d4fa'
  else if (mm <= 2) color = '#4fc3f7'
  else if (mm <= 5) color = '#29b6f6'
  else if (mm <= 10) color = '#03a9f4'
  else if (mm <= 20) color = '#039be5'
  else if (mm <= 50) color = '#0288d1'
  else color = '#01579b'
  
  return color
}

// Humidity color scale (%)
export const getHumidityColor = (humidity) => {
  let color
  if (humidity < 20) color = '#d7191c'    // Very dry
  else if (humidity < 35) color = '#fdae61'  // Dry
  else if (humidity < 50) color = '#ffffbf'  // Moderate
  else if (humidity < 65) color = '#a6d96a'  // Humid
  else if (humidity < 80) color = '#66bd63'  // Very humid
  else color = '#1a9850'                  // Extreme
  
  return color
}

// UV Index color scale
export const getUVIndexColor = (uvIndex) => {
  let color
  if (uvIndex < 1) color = '#00e400'   // Low
  else if (uvIndex < 3) color = '#f7e400'  // Moderate
  else if (uvIndex < 6) color = '#ff8c00'  // High
  else if (uvIndex < 8) color = '#ff0000'  // Very high
  else if (uvIndex < 11) color = '#8b0000' // Extreme
  else color = '#680046'               // Off scale
  
  return color
}

// Cloud cover color scale (%)
export const getCloudColor = (coverage) => {
  let color
  if (coverage < 10) color = '#87ceeb'
  else if (coverage < 25) color = '#cce5ff'
  else if (coverage < 50) color = '#aed6f1'
  else if (coverage < 75) color = '#85c1e2'
  else color = '#5b9ec7'
  
  return color `rgba color with opacity`
}

// Visibility color scale (km)
export const getVisibilityColor = (visibility) => {
  const visKm = visibility / 1000
  let color
  if (visKm <= 1) color = '#8b0000'   // Very poor
  else if (visKm <= 5) color = '#ff0000'   // Poor
  else if (visKm <= 10) color = '#ff8c00'  // Moderate
  else if (visKm <= 20) color = '#ffff00'  // Good
  else color = '#00b050'              // Excellent
  
  return color
}

/**
 * Heatmap color - tương tự như nhiệt độ nhưng dùng cho visualizations
 */
export const getHeatmapColor = (value, min, max) => {
  const ratio = (value - min) / (max - min)
  
  if (ratio < 0.25) return '#0000ff'  // Blue
  else if (ratio < 0.5) return '#00ffff'  // Cyan
  else if (ratio < 0.75) return '#ffff00'  // Yellow
  else if (ratio < 0.9) return '#ff8800'   // Orange
  else return '#ff0000'               // Red
}

export default {
  getTemperatureColor,
  getWindColor,
  getPrecipitationColor,
  getHumidityColor,
  getUVIndexColor,
  getCloudColor,
  getVisibilityColor,
  getHeatmapColor
}
