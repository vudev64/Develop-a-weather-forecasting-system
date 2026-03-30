import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { getHumidityColor } from '../../utils/weatherColors'

/**
 * Humidity Layer - Hiển thị độ ẩm dạng color overlay
 * Estimate từ dew point và temperature
 */
function HumidityLayer({ weather, visible = true, opacity = 0.7 }) {
  const map = useMap()
  const layerRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!visible || !weather || !weather.hourly?.dew_point_2m) return

    const dewPointData = weather.hourly.dew_point_2m || []
    const temperatureData = weather.hourly.temperature_2m || []

    // Tạo canvas element cho heatmap
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const pixelRatio = window.devicePixelRatio || 1

    const width = 256
    const height = 256
    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio
    ctx.scale(pixelRatio, pixelRatio)

    // Render heatmap
    ctx.clearRect(0, 0, width, height)

    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    // Calculate relative humidity từ dew point
    // RH = 100 * (Es(Td) / Es(T))
    // Approximation: RH ≈ 100 - 5 * (T - Td)
    const currentTemp = temperatureData[0] || 20
    const currentDewPoint = dewPointData[0] || 10
    const centerHumidity = Math.min(100, Math.max(0, 100 - 5 * (currentTemp - currentDewPoint)))

    // Tạo gradient từ center đến edge
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4

        // Tính gradient dựa trên distance từ center
        const dx = j - width / 2
        const dy = i - height / 2
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)

        // Giảm dần độ ẩm từ tâm đến edge
        const humidityAtPoint = centerHumidity * (1 - distance / maxDistance)

        const color = getHumidityColor(humidityAtPoint)
        const rgb = hexToRgb(color)

        const intensity = Math.min(1, humidityAtPoint / 80) // Normalize
        const alpha = intensity * Math.round(150 * (1 - distance / maxDistance))

        data[idx] = rgb.r
        data[idx + 1] = rgb.g
        data[idx + 2] = rgb.b
        data[idx + 3] = Math.max(0, alpha)
      }
    }

    ctx.putImageData(imageData, 0, 0)

    // Tạo tile layer từ canvas
    const CanvasLayer = L.GridLayer.extend({
      createTile: function () {
        const tileCanvas = document.createElement('canvas')
        const tileCtx = tileCanvas.getContext('2d')
        tileCanvas.width = tileCanvas.height = 256

        tileCtx.drawImage(canvas, 0, 0)
        return tileCanvas
      }
    })

    // Thêm layer
    const humidityLayer = new CanvasLayer({ opacity: opacity, zIndex: 102 })
    humidityLayer.addTo(map)
    layerRef.current = humidityLayer

    // Thêm pulse animation effect
    let pulseTime = 0
    const animatePulse = setInterval(() => {
      pulseTime += 0.05
      const pulseOpacity = opacity * (0.7 + 0.3 * Math.sin(pulseTime))
      humidityLayer.setOpacity(pulseOpacity)
    }, 50)
    animationRef.current = animatePulse

    // Cleanup
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
      if (map.hasLayer(humidityLayer)) {
        map.removeLayer(humidityLayer)
      }
    }
  }, [map, weather, visible, opacity])

  return null
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}

export default HumidityLayer
