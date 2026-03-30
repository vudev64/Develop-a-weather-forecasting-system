import axios from 'axios';
import Weather from '../models/Weather.js';

// Hàm lấy tọa độ từ Nominatim (OpenStreetMap Geocoder - free, không cần API key)
const getCoordinates = async (city) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: city,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'WeatherApp/1.0 (https://localhost:5000)'
      }
    });
    
    if (response.data.length === 0) throw new Error('Không tìm thấy thành phố');
    
    const location = response.data[0];
    
    return {
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
      city: location.name || city,
      country: location.address?.country || 'Unknown'
    };
  } catch (error) {
    throw error;
  }
};

// Hàm lấy dữ liệu thời tiết từ Open-Meteo API (free, không cần API key)
const getOpenMeteoWeather = async (latitude, longitude, timezone = 'Asia/Bangkok') => {
  try {
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
      params: {
        latitude: latitude,
        longitude: longitude,
        current: 'temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,apparent_temperature,weather_code,rain,wind_direction_10m',
        hourly: 'temperature_2m,precipitation,visibility,wind_speed_10m,wind_gusts_10m,soil_moisture_3_to_9cm,precipitation_probability,weather_code,dew_point_2m',
        daily: 'weather_code,uv_index_max,sunshine_duration,sunset,sunrise,precipitation_sum',
        timezone: timezone
      }
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy dữ liệu thời tiết từ tọa độ (latitude, longitude)
export const getWeatherByCoordinates = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Vui lòng cung cấp latitude và longitude' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Latitude và longitude phải là số' });
    }

    // Lấy dữ liệu thời tiết từ Open-Meteo
    const weatherData = await getOpenMeteoWeather(latitude, longitude);

    const currentWeather = weatherData.current;
    const response_data = {
      city: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
      country: 'Custom Location',
      latitude: latitude,
      longitude: longitude,
      timezone: weatherData.timezone,
      current: {
        temperature: Math.round(currentWeather.temperature_2m),
        feelsLike: Math.round(currentWeather.apparent_temperature),
        humidity: currentWeather.relative_humidity_2m,
        windSpeed: currentWeather.wind_speed_10m,
        windDirection: currentWeather.wind_direction_10m,
        windGust: currentWeather.wind_gusts_10m,
        precipitation: currentWeather.precipitation,
        rain: currentWeather.rain,
        weatherCode: currentWeather.weather_code,
        time: currentWeather.time
      },
      hourly: {
        time: weatherData.hourly.time,
        temperature_2m: weatherData.hourly.temperature_2m,
        precipitation: weatherData.hourly.precipitation,
        precipitation_probability: weatherData.hourly.precipitation_probability,
        visibility: weatherData.hourly.visibility,
        wind_speed_10m: weatherData.hourly.wind_speed_10m,
        wind_gusts_10m: weatherData.hourly.wind_gusts_10m,
        soil_moisture_3_to_9cm: weatherData.hourly.soil_moisture_3_to_9cm,
        weather_code: weatherData.hourly.weather_code,
        dew_point_2m: weatherData.hourly.dew_point_2m
      },
      daily: {
        time: weatherData.daily.time,
        weather_code: weatherData.daily.weather_code,
        uv_index_max: weatherData.daily.uv_index_max,
        sunshine_duration: weatherData.daily.sunshine_duration,
        sunset: weatherData.daily.sunset,
        sunrise: weatherData.daily.sunrise,
        precipitation_sum: weatherData.daily.precipitation_sum
      },
      timestamp: new Date(currentWeather.time),
      coords: {
        lat: latitude,
        lon: longitude
      }
    };

    res.json({
      success: true,
      data: response_data
    });

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu thời tiết từ tọa độ:', error.message);
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu thời tiết: ' + error.message });
  }
};

// Lấy dữ liệu thời tiết từ Open-Meteo API (không cần API key)
export const getWeatherByCity = async (req, res) => {
  try {
    const { city } = req.params;
    
    if (!city) {
      return res.status(400).json({ error: 'Vui lòng nhập tên thành phố' });
    }

    // Lấy tọa độ từ Nominatim
    const coords = await getCoordinates(city);
    
    // Lấy dữ liệu thời tiết từ Open-Meteo
    const weatherData = await getOpenMeteoWeather(coords.lat, coords.lon);
    
    // Map dữ liệu Open-Meteo sang format của app
    const currentWeather = weatherData.current;
    const response_data = {
      city: coords.city,
      country: coords.country,
      latitude: coords.lat,
      longitude: coords.lon,
      timezone: weatherData.timezone,
      // Dữ liệu hiện tại
      current: {
        temperature: Math.round(currentWeather.temperature_2m),
        feelsLike: Math.round(currentWeather.apparent_temperature),
        humidity: currentWeather.relative_humidity_2m,
        windSpeed: currentWeather.wind_speed_10m,
        windDirection: currentWeather.wind_direction_10m,
        windGust: currentWeather.wind_gusts_10m,
        precipitation: currentWeather.precipitation,
        rain: currentWeather.rain,
        weatherCode: currentWeather.weather_code,
        time: currentWeather.time
      },
      // Dữ liệu từng giờ
      hourly: {
        time: weatherData.hourly.time,
        temperature_2m: weatherData.hourly.temperature_2m,
        precipitation: weatherData.hourly.precipitation,
        precipitation_probability: weatherData.hourly.precipitation_probability,
        visibility: weatherData.hourly.visibility,
        wind_speed_10m: weatherData.hourly.wind_speed_10m,
        wind_gusts_10m: weatherData.hourly.wind_gusts_10m,
        soil_moisture_3_to_9cm: weatherData.hourly.soil_moisture_3_to_9cm,
        weather_code: weatherData.hourly.weather_code,
        dew_point_2m: weatherData.hourly.dew_point_2m
      },
      // Dữ liệu hằng ngày
      daily: {
        time: weatherData.daily.time,
        weather_code: weatherData.daily.weather_code,
        uv_index_max: weatherData.daily.uv_index_max,
        sunshine_duration: weatherData.daily.sunshine_duration,
        sunset: weatherData.daily.sunset,
        sunrise: weatherData.daily.sunrise,
        precipitation_sum: weatherData.daily.precipitation_sum
      },
      timestamp: new Date(currentWeather.time),
      coords: {
        lat: coords.lat,
        lon: coords.lon
      }
    };

    // Lưu vào MongoDB (optional)
    try {
      const weatherRecord = new Weather(response_data);
      await weatherRecord.save();
    } catch (dbError) {
      console.warn('⚠️ Lưu vào MongoDB thất bại:', dbError.message);
    }

    res.json({
      success: true,
      data: response_data
    });

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu thời tiết:', error.message);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ error: 'Không tìm thấy thành phố' });
    }
    
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu thời tiết: ' + error.message });
  }
};

// Lấy lịch sử thời tiết từ database
export const getWeatherHistory = async (req, res) => {
  try {
    const { city } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const history = await Weather.find({ city: new RegExp(city, 'i') })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: history,
      count: history.length
    });

  } catch (error) {
    console.error('Lỗi khi lấy lịch sử:', error.message);
    res.status(500).json({ error: 'Lỗi server khi lấy lịch sử' });
  }
};

// Lấy tất cả thành phố đã tìm kiếm
export const getAllCities = async (req, res) => {
  try {
    const cities = await Weather.distinct('city');
    
    res.json({
      success: true,
      data: cities,
      count: cities.length
    });

  } catch (error) {
    console.error('Lỗi khi lấy danh sách thành phố:', error.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Test data với mưa nhiều để demo animated rainfall
export const getTestRainfallData = async (req, res) => {
  try {
    const coords = {
      lat: 10.8231,
      lon: 106.6297,
      city: 'Ho Chi Minh City (Test Rain)',
      country: 'Vietnam'
    };

    // Lấy dữ liệu thực từ Open-Meteo rồi thêm mưa test
    const weatherData = await getOpenMeteoWeather(coords.lat, coords.lon);
    
    // Thêm dữ liệu mưa test vào hourly array
    const testHourlyData = weatherData.hourly;
    
    // Sinh dữ liệu mưa giả lập: tăng precipitation trong 12 giờ đầu
    if (testHourlyData.time && testHourlyData.precipitation) {
      for (let i = 0; i < Math.min(12, testHourlyData.time.length); i++) {
        // Tạo mưa từ 0.1 - 2.5mm/giờ trong 12 giờ đầu
        testHourlyData.precipitation[i] = 0.1 + Math.random() * 2.4;
        testHourlyData.precipitation_probability[i] = 80 + Math.random() * 20; // 80-100%
      }
    }

    const currentWeather = weatherData.current;
    const response_data = {
      city: coords.city,
      country: coords.country,
      latitude: coords.lat,
      longitude: coords.lon,
      timezone: weatherData.timezone,
      current: {
        temperature: Math.round(currentWeather.temperature_2m),
        feelsLike: Math.round(currentWeather.apparent_temperature),
        humidity: currentWeather.relative_humidity_2m,
        windSpeed: currentWeather.wind_speed_10m,
        windDirection: currentWeather.wind_direction_10m,
        windGust: currentWeather.wind_gusts_10m,
        precipitation: 1.5, // Mưa nhiều ngay lúc này
        rain: 1.5,
        weatherCode: 65, // Mưa nặng
        time: currentWeather.time
      },
      hourly: testHourlyData,
      daily: weatherData.daily,
      timestamp: new Date(currentWeather.time),
      coords: {
        lat: coords.lat,
        lon: coords.lon
      }
    };

    res.json({
      success: true,
      data: response_data,
      note: '✅ Dữ liệu TEST với mưa nhiều - dùng để demo animated rainfall'
    });

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu test mưa:', error.message);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
};

// Lâ dữ liệu dự báo chi tiết từ Open-Meteo
export const getWindyForecast = async (req, res) => {
  try {
    const { city } = req.params;
    
    if (!city) {
      return res.status(400).json({ error: 'Vui lòng nhập tên thành phố' });
    }

    // Lấy tọa độ
    const coords = await getCoordinates(city);
    
    // Lấy dữ liệu từ Open-Meteo
    const weatherData = await getOpenMeteoWeather(coords.lat, coords.lon);
    
    res.json({
      success: true,
      city: coords.city,
      country: coords.country,
      latitude: coords.lat,
      longitude: coords.lon,
      current: weatherData.current,
      hourly: weatherData.hourly,
      daily: weatherData.daily,
      timezone: weatherData.timezone
    });

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu dự báo:', error.message);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ error: 'Không tìm thấy thành phố' });
    }
    
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu dự báo' });
  }
};
