import express from 'express';
import { getWeatherByCity, getWeatherHistory, getAllCities, getWindyForecast, getTestRainfallData, getWeatherByCoordinates } from '../controllers/weatherController.js';

const router = express.Router();

// Routes cụ thể phải đặt TRƯỚC routes chung
// GET /api/weather/cities/all - Lấy tất cả thành phố đã tìm
router.get('/cities/all', getAllCities);

// GET /api/weather/coordinates?lat=...&lon=... - Lấy thời tiết từ tọa độ
router.get('/coordinates', getWeatherByCoordinates);

// GET /api/weather/test/rain - Test data với mưa nhiều để demo
router.get('/test/rain', getTestRainfallData);

// GET /api/weather/history/:city - Lấy lịch sử thời tiết
router.get('/history/:city', getWeatherHistory);

// GET /api/weather/windy/:city - Lấy dữ liệu từ Windy (nếu cần)
router.get('/windy/:city', getWindyForecast);

// GET /api/weather/:city - Lấy thời tiết theo thành phố (chung - phải cuối cùng)
router.get('/:city', getWeatherByCity);

export default router;
