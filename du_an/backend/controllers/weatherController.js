import axios from 'axios';
import Weather from '../models/Weather.js';

const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
const WEATHER_DOC_TTL_MS = 12 * 60 * 60 * 1000;
const CITY_LIMIT = 50;
const LOOKUP_DOC_LIMIT = 20;
const WEATHER_CACHE = new Map();

const normalizeCity = (city) => String(city || '').trim().replace(/\s+/g, ' ');
const normalizeCityKey = (city) => normalizeCity(city).toLowerCase();
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getCacheKey = (type, value) => `${type}:${value}`;

const getCachedValue = (cacheKey) => {
  const cached = WEATHER_CACHE.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    WEATHER_CACHE.delete(cacheKey);
    return null;
  }

  return cached.value;
};

const setCachedValue = (cacheKey, value) => {
  WEATHER_CACHE.set(cacheKey, {
    value,
    expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
  });
};

const pruneMemoryCache = () => {
  const now = Date.now();

  for (const [key, cached] of WEATHER_CACHE.entries()) {
    if (cached.expiresAt <= now) {
      WEATHER_CACHE.delete(key);
    }
  }
};

setInterval(pruneMemoryCache, WEATHER_CACHE_TTL_MS).unref?.();

const getCoordinates = async (city) => {
  const normalizedCity = normalizeCity(city);

  if (!normalizedCity) {
    throw new Error('Không tìm thấy thành phố');
  }

  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: normalizedCity, format: 'json', limit: 1 },
    headers: {
      'User-Agent': process.env.WEATHER_APP_USER_AGENT || 'WeatherApp/1.0 (contact@weatherapp.local)',
      'Accept-Language': 'vi,en;q=0.8',
    }
  });

  if (response.data.length === 0) throw new Error('Không tìm thấy thành phố');

  const location = response.data[0];
  return {
    lat: parseFloat(location.lat),
    lon: parseFloat(location.lon),
    city: location.name || normalizedCity,
    country: location.address?.country || 'Unknown'
  };
};

const getOpenMeteoWeather = async (latitude, longitude, timezone = 'Asia/Bangkok') => {
  const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude,
      longitude,
      timezone,
      current: 'temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,apparent_temperature,weather_code,rain,wind_direction_10m',
      hourly: 'temperature_2m,precipitation,visibility,wind_speed_10m,wind_gusts_10m,soil_moisture_3_to_9cm,precipitation_probability,weather_code,dew_point_2m',
      daily: 'weather_code,uv_index_max,sunshine_duration,sunset,sunrise,precipitation_sum'
    }
  });

  return response.data;
};

const formatWeatherResponse = (weatherData, locationInfo) => {
  const currentWeather = weatherData.current;

  return {
    ...locationInfo,
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
    hourly: weatherData.hourly,
    daily: weatherData.daily,
    timestamp: new Date(currentWeather.time),
    coords: { lat: locationInfo.latitude, lon: locationInfo.longitude }
  };
};

const buildCityLookup = async (cityInput) => {
  const normalizedCity = normalizeCity(cityInput);

  if (!normalizedCity) {
    throw new Error('Vui lòng nhập tên thành phố');
  }

  const cacheKey = getCacheKey('city', normalizeCityKey(normalizedCity));
  const cached = getCachedValue(cacheKey);

  if (cached) {
    return { data: cached, cacheHit: true, cacheKey, normalizedCity };
  }

  const coords = await getCoordinates(normalizedCity);
  const weatherData = await getOpenMeteoWeather(coords.lat, coords.lon);
  const data = formatWeatherResponse(weatherData, {
    city: coords.city,
    country: coords.country,
    latitude: coords.lat,
    longitude: coords.lon
  });

  setCachedValue(cacheKey, data);

  return { data, cacheHit: false, cacheKey, normalizedCity };
};

const cleanupWeatherDocuments = async (normalizedCity) => {
  const cityRegex = new RegExp(`^${escapeRegex(normalizedCity)}$`, 'i');
  const staleThreshold = new Date(Date.now() - WEATHER_DOC_TTL_MS);

  await Weather.deleteMany({
    city: cityRegex,
    createdAt: { $lt: staleThreshold }
  });

  const remainingDocs = await Weather.find({ city: cityRegex })
    .sort({ createdAt: -1 })
    .select('_id createdAt')
    .lean();

  if (remainingDocs.length > LOOKUP_DOC_LIMIT) {
    const idsToDelete = remainingDocs.slice(LOOKUP_DOC_LIMIT).map((doc) => doc._id);
    await Weather.deleteMany({ _id: { $in: idsToDelete } });
  }
};

const persistWeatherDocument = async (responseData) => {
  const normalizedCity = normalizeCity(responseData.city);

  if (!normalizedCity) {
    return;
  }

  const latestDoc = await Weather.findOne({ city: new RegExp(`^${escapeRegex(normalizedCity)}$`, 'i') })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();

  const latestAge = latestDoc?.createdAt ? Date.now() - new Date(latestDoc.createdAt).getTime() : Infinity;

  if (latestAge <= WEATHER_DOC_TTL_MS) {
    return;
  }

  try {
    await new Weather(responseData).save();
    await cleanupWeatherDocuments(normalizedCity);
  } catch (dbError) {
    console.warn('⚠️ Lưu vào MongoDB thất bại:', dbError.message);
  }
};

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

    const cacheKey = getCacheKey('coords', `${latitude.toFixed(4)},${longitude.toFixed(4)}`);
    const cached = getCachedValue(cacheKey);

    if (cached) {
      return res.json({ success: true, data: cached, cache: { hit: true, ttlMs: WEATHER_CACHE_TTL_MS } });
    }

    const weatherData = await getOpenMeteoWeather(latitude, longitude);
    const responseData = formatWeatherResponse(weatherData, {
      city: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
      country: 'Custom Location',
      latitude,
      longitude
    });

    setCachedValue(cacheKey, responseData);

    return res.json({ success: true, data: responseData, cache: { hit: false, ttlMs: WEATHER_CACHE_TTL_MS } });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu thời tiết từ tọa độ:', error.message);
    return res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu thời tiết: ' + error.message });
  }
};

export const getWeatherByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const { data, cacheHit, normalizedCity } = await buildCityLookup(city);

    if (!cacheHit) {
      await persistWeatherDocument(data);
    }

    return res.json({ success: true, data, cache: { hit: cacheHit, ttlMs: WEATHER_CACHE_TTL_MS } });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu thời tiết:', error.message);

    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ error: 'Không tìm thấy thành phố' });
    }

    return res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu thời tiết: ' + error.message });
  }
};

export const getWeatherHistory = async (req, res) => {
  try {
    const { city } = req.params;
    const normalizedCity = normalizeCity(city);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!normalizedCity) {
      return res.status(400).json({ error: 'Vui lòng nhập tên thành phố' });
    }

    const history = await Weather.find({ city: new RegExp(`^${escapeRegex(normalizedCity)}$`, 'i') })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      data: history,
      count: history.length,
      limit
    });

  } catch (error) {
    console.error('Lỗi khi lấy lịch sử:', error.message);
    return res.status(500).json({ error: 'Lỗi server khi lấy lịch sử' });
  }
};

export const getAllCities = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || CITY_LIMIT, CITY_LIMIT);
    const cities = await Weather.distinct('city');
    const normalizedCities = [...new Set(cities.map((item) => normalizeCity(item)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .slice(0, limit);

    return res.json({
      success: true,
      data: normalizedCities,
      count: normalizedCities.length,
      limit
    });

  } catch (error) {
    console.error('Lỗi khi lấy danh sách thành phố:', error.message);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

export const getTestRainfallData = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Route demo chỉ khả dụng trong môi trường development' });
  }

  try {
    const coords = {
      lat: 10.8231,
      lon: 106.6297,
      city: 'Ho Chi Minh City (Test Rain)',
      country: 'Vietnam'
    };

    const weatherData = await getOpenMeteoWeather(coords.lat, coords.lon);
    const testHourlyData = weatherData.hourly;

    if (testHourlyData.time && testHourlyData.precipitation) {
      for (let i = 0; i < Math.min(12, testHourlyData.time.length); i++) {
        testHourlyData.precipitation[i] = 0.1 + Math.random() * 2.4;
        testHourlyData.precipitation_probability[i] = 80 + Math.random() * 20;
      }
    }

    const currentWeather = weatherData.current;
    const responseData = {
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
        precipitation: 1.5,
        rain: 1.5,
        weatherCode: 65,
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

    return res.json({
      success: true,
      data: responseData,
      note: '✅ Dữ liệu TEST với mưa nhiều - dùng để demo animated rainfall'
    });

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu test mưa:', error.message);
    return res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
};

export const getWindyForecast = async (req, res) => {
  try {
    const { city } = req.params;
    const normalizedCity = normalizeCity(city);

    if (!normalizedCity) {
      return res.status(400).json({ error: 'Vui lòng nhập tên thành phố' });
    }

    const coords = await getCoordinates(normalizedCity);
    const weatherData = await getOpenMeteoWeather(coords.lat, coords.lon);

    return res.json({
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

    return res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu dự báo' });
  }
};
