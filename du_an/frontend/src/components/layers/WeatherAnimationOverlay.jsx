import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

const WIND_PARTICLE_COUNT = 72
const MAX_RAIN_PARTICLE_COUNT = 280
const CLOUD_COUNT = 4
const MAX_FRAME_DELTA = 0.05
const INFLUENCE_RADIUS_METERS = 50_000
const EARTH_CIRCUMFERENCE_METERS = 40_075_016.685

const randomBetween = (minimum, maximum) => (
  minimum + Math.random() * (maximum - minimum)
)

const getRainParticleCount = (precipitation) => (
  Math.min(MAX_RAIN_PARTICLE_COUNT, Math.ceil(precipitation * 24))
)

const isFiniteNumber = (value) => (
  value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
)

const getCurrentValue = (weather, ...keys) => {
  const current = weather?.current
  for (const source of [current, weather]) {
    if (!source || typeof source !== 'object') continue
    const key = keys.find((candidate) => source[candidate] != null)
    if (key) return source[key]
  }
  return undefined
}

const getWeatherCondition = (weather) => {
  const code = getCurrentValue(weather, 'weatherCode', 'weather_code')
  if (!isFiniteNumber(code)) return null

  const normalizedCode = Number(code)
  if ([0, 1].includes(normalizedCode)) return 'clear'
  if ([2, 3, 45, 48].includes(normalizedCode)) return 'cloudy'
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]
      .includes(normalizedCode)
  ) return 'rainy'
  return 'other'
}

const isValidWind = (weather) => {
  const speed = getCurrentValue(weather, 'windSpeed', 'wind_speed_10m')
  const direction = getCurrentValue(weather, 'windDirection', 'wind_direction_10m')

  return isFiniteNumber(speed)
    && Number(speed) > 0
    && isFiniteNumber(direction)
    && Number(direction) >= 0
    && Number(direction) <= 360
}

const isValidPrecipitation = (weather) => {
  const precipitation = getCurrentValue(weather, 'precipitation')
  return isFiniteNumber(precipitation) && Number(precipitation) > 0
}

const hasValidLocation = (location) => (
  Array.isArray(location)
  && location.length === 2
  && location.every(isFiniteNumber)
  && Math.abs(Number(location[0])) <= 90
  && Math.abs(Number(location[1])) <= 180
)

function WeatherAnimationOverlay({
  weather,
  location,
  windEnabled = false,
  rainEnabled = false,
  opacity = 0.7,
}) {
  const map = useMap()

  useEffect(() => {
    const condition = getWeatherCondition(weather)
    const showSun = condition === 'clear'
    const showClouds = condition === 'cloudy'
    const showWind = windEnabled && isValidWind(weather)
    const showRain = rainEnabled && isValidPrecipitation(weather)

    if (
      (!showSun && !showClouds && !showWind && !showRain)
      || !hasValidLocation(location)
    ) return undefined

    const container = map.getContainer()
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) return undefined

    const latitude = Number(location[0])
    const longitude = Number(location[1])
    const hasWindData = isValidWind(weather)
    const windSpeed = hasWindData
      ? Number(getCurrentValue(weather, 'windSpeed', 'wind_speed_10m'))
      : 0
    const windDirection = hasWindData
      ? Number(getCurrentValue(weather, 'windDirection', 'wind_direction_10m'))
      : 0
    const precipitation = Number(getCurrentValue(weather, 'precipitation'))
    const layerOpacity = Math.min(1, Math.max(0, Number(opacity) || 0))
    const directionRadians = (windDirection * Math.PI) / 180
    const windX = -Math.sin(directionRadians)
    const windY = Math.cos(directionRadians)
    const windParticles = showWind
      ? Array.from({ length: WIND_PARTICLE_COUNT }, () => ({
          x: 0,
          y: 0,
          speedFactor: randomBetween(0.65, 1.35),
        }))
      : []
    const rainParticles = showRain
      ? Array.from({ length: getRainParticleCount(precipitation) }, () => ({
          x: 0,
          y: 0,
          speed: randomBetween(360, 620),
          length: randomBetween(8, 16),
          drift: randomBetween(-12, 12),
        }))
      : []
    const cloudParticles = showClouds
      ? Array.from({ length: CLOUD_COUNT }, (_, index) => ({
          x: 0,
          y: 0,
          scale: 0.75 + (index % 3) * 0.2,
          drift: randomBetween(2, 7),
          opacity: randomBetween(0.55, 0.8),
        }))
      : []

    let width = 0
    let height = 0
    let animationFrame = 0
    let previousFrameTime = 0
    let resizeObserver
    let isDisposed = false

    canvas.className = 'weather-animation-overlay'
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.position = 'absolute'
    canvas.style.inset = '0'
    canvas.style.zIndex = '450'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'

    const getInfluenceRegion = () => {
      const center = map.latLngToContainerPoint([latitude, longitude])
      const cosineLatitude = Math.max(Math.cos((latitude * Math.PI) / 180), 0.01)
      const pixelsPerMeter = (256 * (2 ** map.getZoom()))
        / (EARTH_CIRCUMFERENCE_METERS * cosineLatitude)

      return {
        x: center.x,
        y: center.y,
        radius: INFLUENCE_RADIUS_METERS * pixelsPerMeter,
      }
    }

    const randomPointInRegion = (region) => {
      const angle = randomBetween(0, Math.PI * 2)
      const distance = Math.sqrt(Math.random()) * region.radius

      return {
        x: region.x + Math.cos(angle) * distance,
        y: region.y + Math.sin(angle) * distance,
      }
    }

    const isOutsideRegion = (particle, region) => (
      (particle.x - region.x) ** 2 + (particle.y - region.y) ** 2 > region.radius ** 2
    )

    const resizeCanvas = () => {
      const bounds = container.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const region = getInfluenceRegion()
      windParticles.forEach((particle) => Object.assign(particle, randomPointInRegion(region)))
      rainParticles.forEach((particle) => Object.assign(particle, randomPointInRegion(region)))
      cloudParticles.forEach((particle) => Object.assign(particle, randomPointInRegion(region)))
    }

    const drawCloud = (particle) => {
      const size = 12 * particle.scale
      context.beginPath()
      context.moveTo(particle.x - size, particle.y + size * 0.2)
      context.bezierCurveTo(
        particle.x - size * 1.25, particle.y + size * 0.1,
        particle.x - size * 1.05, particle.y - size * 0.55,
        particle.x - size * 0.55, particle.y - size * 0.45,
      )
      context.bezierCurveTo(
        particle.x - size * 0.4, particle.y - size * 1.1,
        particle.x + size * 0.4, particle.y - size * 1.05,
        particle.x + size * 0.55, particle.y - size * 0.45,
      )
      context.bezierCurveTo(
        particle.x + size * 1.2, particle.y - size * 0.55,
        particle.x + size * 1.25, particle.y + size * 0.15,
        particle.x + size, particle.y + size * 0.2,
      )
      context.closePath()
      context.fill()
    }

    const draw = (timestamp) => {
      if (isDisposed) return

      const delta = previousFrameTime
        ? Math.min((timestamp - previousFrameTime) / 1000, MAX_FRAME_DELTA)
        : 0
      previousFrameTime = timestamp
      context.clearRect(0, 0, width, height)

      const region = getInfluenceRegion()
      context.save()
      context.beginPath()
      context.arc(region.x, region.y, region.radius, 0, Math.PI * 2)
      context.clip()

      if (showSun) {
        const sunRadius = Math.min(13, Math.max(7, region.radius * 0.16))
        const rayInnerRadius = sunRadius + 7
        const rayOuterRadius = sunRadius + 15
        const glow = context.createRadialGradient(
          region.x,
          region.y,
          sunRadius * 0.4,
          region.x,
          region.y,
          sunRadius * 2.2,
        )
        glow.addColorStop(0, `rgba(255, 215, 102, ${0.28 * layerOpacity})`)
        glow.addColorStop(1, 'rgba(255, 215, 102, 0)')
        context.fillStyle = glow
        context.beginPath()
        context.arc(region.x, region.y, sunRadius * 2.2, 0, Math.PI * 2)
        context.fill()

        context.strokeStyle = `rgba(239, 174, 50, ${0.48 * layerOpacity})`
        context.lineWidth = 1.4
        context.lineCap = 'round'
        for (let ray = 0; ray < 8; ray += 1) {
          const angle = (Math.PI * 2 * ray) / 8
          context.beginPath()
          context.moveTo(
            region.x + Math.cos(angle) * rayInnerRadius,
            region.y + Math.sin(angle) * rayInnerRadius,
          )
          context.lineTo(
            region.x + Math.cos(angle) * rayOuterRadius,
            region.y + Math.sin(angle) * rayOuterRadius,
          )
          context.stroke()
        }

        context.fillStyle = `rgba(255, 203, 78, ${0.72 * layerOpacity})`
        context.beginPath()
        context.arc(region.x, region.y, sunRadius, 0, Math.PI * 2)
        context.fill()
      }

      if (showClouds) {
        context.fillStyle = `rgba(255, 255, 255, ${layerOpacity})`
        cloudParticles.forEach((particle) => {
          particle.x += particle.drift * delta
          if (isOutsideRegion(particle, region)) {
            Object.assign(particle, randomPointInRegion(region))
          }
          context.globalAlpha = particle.opacity
          drawCloud(particle)
        })
        context.globalAlpha = 1
      }

      if (showRain) {
        context.lineWidth = 1.2
        context.lineCap = 'round'
        context.strokeStyle = `rgba(45, 145, 220, ${0.72 * layerOpacity})`

        rainParticles.forEach((particle) => {
          particle.x += (windX * windSpeed * 1.5 + particle.drift) * delta
          particle.y += particle.speed * delta

          if (isOutsideRegion(particle, region)) {
            Object.assign(particle, randomPointInRegion(region))
          }

          context.beginPath()
          context.moveTo(particle.x, particle.y)
          context.lineTo(particle.x + windX * 2, particle.y + particle.length)
          context.stroke()
        })
      }

      if (showWind) {
        context.lineWidth = 1.7
        context.lineCap = 'round'
        context.strokeStyle = `rgba(39, 111, 174, ${0.72 * layerOpacity})`

        windParticles.forEach((particle) => {
          const particleSpeed = windSpeed * 16 * particle.speedFactor
          particle.x += windX * particleSpeed * delta
          particle.y += windY * particleSpeed * delta

          if (isOutsideRegion(particle, region)) {
            Object.assign(particle, randomPointInRegion(region))
          }

          const streakLength = Math.min(6 + windSpeed * 0.24, 22)
          context.beginPath()
          context.moveTo(particle.x, particle.y)
          context.lineTo(
            particle.x - windX * streakLength,
            particle.y - windY * streakLength,
          )
          context.stroke()
        })
      }

      context.restore()
      animationFrame = window.requestAnimationFrame(draw)
    }

    resizeCanvas()
    container.appendChild(canvas)
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(container)
    map.on('moveend zoomend', resizeCanvas)
    animationFrame = window.requestAnimationFrame(draw)

    return () => {
      isDisposed = true
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      map.off('moveend zoomend', resizeCanvas)
      canvas.remove()
    }
  }, [
    location,
    map,
    opacity,
    rainEnabled,
    weather,
    windEnabled,
  ])

  return null
}

export default WeatherAnimationOverlay
