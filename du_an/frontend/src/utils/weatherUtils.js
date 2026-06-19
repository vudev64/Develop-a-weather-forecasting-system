// Hàm chuyển đổi WMO weather code sang mô tả (Open-Meteo)
export const getWeatherDescription = (code) => {
  const codes = {
    0: 'Trời quang',
    1: 'Hầu như trời quang',
    2: 'Có mây',
    3: 'Mây che phủ',
    45: 'Sương mù',
    48: 'Sương mù rime',
    51: 'Mưa nhẹ',
    53: 'Mưa vừa',
    55: 'Mưa nặng',
    61: 'Mưa',
    63: 'Mưa vừa',
    65: 'Mưa nặng',
    71: 'Tuyết nhẹ',
    73: 'Tuyết vừa',
    75: 'Tuyết nặng',
    80: 'Mưa rào nhẹ',
    81: 'Mưa rào vừa',
    82: 'Mưa rào nặng',
    85: 'Tuyết rào nhẹ',
    86: 'Tuyết rào nặng',
    95: 'Giông',
    96: 'Giông với mưa đá nhẹ',
    99: 'Giông với mưa đá nặng'
  };
  return codes[code] || 'Không xác định';
};

// Hàm xác định màu sắc dựa trên nhiệt độ - giống như Windy
export const getTemperatureColor = (temp) => {
  if (temp <= -10) return '#4575b4'; // Xanh đậm - lạnh cực
  if (temp <= 0) return '#74add1';  // Xanh nhạt - lạnh
  if (temp <= 10) return '#abd9e9'; // Xanh nhạt hơn
  if (temp <= 20) return '#e0f3f8'; // Xanh rất nhạt
  if (temp <= 25) return '#ffffbf'; // Vàng - ấm
  if (temp <= 30) return '#fee090'; // Vàng cam
  if (temp <= 35) return '#fdae61'; // Cam
  if (temp <= 40) return '#f46d43'; // Đỏ cam
  return '#d73027'; // Đỏ - nóng cực
};

// Hàm lấy icon gió dựa trên hướng gió
export const getWindIcon = (direction) => {
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const index = Math.round((direction % 360) / 45) % 8;
  return arrows[index];
};

// Hàm format dữ liệu thời tiết từ API
export const formatWeatherData = (apiData) => {
  return {
    ...apiData,
    temperature: Math.round(apiData.current.temperature),
    feelsLike: Math.round(apiData.current.feelsLike),
    humidity: apiData.current.humidity,
    windSpeed: apiData.current.windSpeed,
    windDirection: apiData.current.windDirection,
    windGust: apiData.current.windGust,
    precipitation: apiData.current.precipitation,
    weatherCode: apiData.current.weatherCode,
    description: getWeatherDescription(apiData.current.weatherCode)
  };
};

// Hàm lấy dữ liệu dự báo 24h tiếp theo
export const getNext24HourForecast = (weather) => {
  if (!weather?.hourly?.time) return [];
  const forecast = [];
  for (let i = 0; i < Math.min(24, weather.hourly.time.length); i++) {
    forecast.push({
      time: weather.hourly.time[i],
      temp: weather.hourly.temperature_2m?.[i] || weather.temperature,
      precipitation: weather.hourly.precipitation?.[i] || 0,
      windSpeed: weather.hourly.wind_speed_10m?.[i] || weather.windSpeed || 0,
      visibility: weather.hourly.visibility?.[i] || 0
    });
  }
  return forecast;
};

// Hàm format time
export const formatTime = (timeString) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
