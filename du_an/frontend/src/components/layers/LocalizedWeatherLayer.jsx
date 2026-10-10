import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

function LocalizedWeatherLayer({
  weather,
  value,
  displayValue = value,
  color,
  label,
  opacity = 0.7,
}) {
  const map = useMap()

  useEffect(() => {
    const latitude = Number(weather?.latitude)
    const longitude = Number(weather?.longitude)
    const measurement = Number(value)

    if (
      !Number.isFinite(latitude)
      || !Number.isFinite(longitude)
      || Math.abs(latitude) > 90
      || Math.abs(longitude) > 180
      || value == null
      || value === ''
      || !Number.isFinite(measurement)
    ) return undefined

    const center = [latitude, longitude]
    const glow = L.circleMarker(center, {
      radius: 34,
      color,
      weight: 0,
      fillColor: color,
      fillOpacity: 0.2,
      interactive: false,
    })
    const marker = L.circleMarker(center, {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: color,
      fillOpacity: 0.95,
      interactive: true,
    })

    marker.bindTooltip(`${label}: ${displayValue}`, {
      direction: 'top',
      offset: [0, -8],
      opacity: 0.95,
    })

    const layer = L.layerGroup([glow, marker]).addTo(map)
    let pulsePhase = 0
    let animationFrame = 0
    let previousFrameTime = 0
    let isDisposed = false
    const baseOpacity = Math.min(1, Math.max(0, Number(opacity) || 0))

    const animate = (timestamp) => {
      if (isDisposed) return
      if (previousFrameTime === 0 || timestamp - previousFrameTime >= 50) {
        previousFrameTime = timestamp
        pulsePhase += 0.06
        const pulse = 0.75 + 0.25 * Math.sin(pulsePhase)
        glow.setStyle({ fillOpacity: 0.2 * baseOpacity * pulse })
        marker.setStyle({ fillOpacity: 0.95 * baseOpacity * pulse })
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    animationFrame = window.requestAnimationFrame(animate)

    return () => {
      isDisposed = true
      window.cancelAnimationFrame(animationFrame)
      layer.remove()
    }
  }, [color, displayValue, label, map, opacity, value, weather?.latitude, weather?.longitude])

  return null
}

export default LocalizedWeatherLayer
