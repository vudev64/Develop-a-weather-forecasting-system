import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { getTemperatureColor } from '../../utils/weatherColors'

/**
 * Temperature Layer - Hiển thị nhiệt độ dạng animated heatmap
 * Có pulse effect để tạo cảm giác hoạt động
 */
function TemperatureLayer({ weather, visible = true, opacity = 0.7 }) {
  const map = useMap()
  const layerRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!visible || !weather || !weather.hourly) return

    // Tạo canvas element cho heatmap
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const pixelRatio = window.devicePixelRatio || 1

    // Kích thước canvas
    const width = 256
    const height = 256
    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio
    ctx.scale(pixelRatio, pixelRatio)

    // Lấy dữ liệu nhiệt độ
    const temperatureData = weather.hourly.temperature_2m || []

    // Render heatmap trên canvas
    ctx.clearRect(0, 0, width, height)

    // Tạo gradient từ dữ liệu
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    // Sử dụng first temperature point làm tâm và spread outward
    const centerTemp = temperatureData[0] || 20
    // Giả lập gradient từ tâm đến edge
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4

        // Tính gradient dựa trên distance từ center
        const dx = j - width / 2
        const dy = i - height / 2
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
        const tempAtPoint = centerTemp - (distance / maxDistance) * 5 // Giảm dần nhiệt độ

        const color = getTemperatureColor(tempAtPoint)
        const rgb = hexToRgb(color)

        data[idx] = rgb.r
        data[idx + 1] = rgb.g
        data[idx + 2] = rgb.b
        data[idx + 3] = Math.round(180 * (1 - distance / maxDistance)) // Alpha decrease outward
      }
    }

    ctx.putImageData(imageData, 0, 0)

    // Tạo tile layer từ canvas
    const CanvasLayer = L.GridLayer.extend({
      createTile: function () {
        const tileCanvas = document.createElement('canvas')
        const tileCtx = tileCanvas.getContext('2d')
        tileCanvas.width = tileCanvas.height = 256

        // Vẽ lại cho mỗi tile
        tileCtx.drawImage(canvas, 0, 0)
        return tileCanvas
      }
    })

    // Thêm layer vào map
    const tempLayer = new CanvasLayer({ opacity: opacity, zIndex: 100 })
    tempLayer.addTo(map)
    layerRef.current = tempLayer

    // Thêm pulse animation effect
    let pulseTime = 0
    const animatePulse = setInterval(() => {
      pulseTime += 0.05
      const pulseOpacity = opacity * (0.7 + 0.3 * Math.sin(pulseTime))
      tempLayer.setOpacity(pulseOpacity)
    }, 50)
    animationRef.current = animatePulse

    // Cleanup
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
      if (map.hasLayer(tempLayer)) {
        map.removeLayer(tempLayer)
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

export default TemperatureLayer
