import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { getWindColor } from '../../utils/weatherColors'
import { generateWindVectors } from '../../utils/weatherGridData'

/**
 * Wind Layer - Hiển thị gió dạng vector arrows hoặc animated flow
 * Sử dụng Canvas render cho performance tốt
 */
function WindLayer({ weather, visible = true, style = 'arrows', opacity = 0.7 }) {
  // style: 'arrows', 'particles', hoặc 'barbs'
  const map = useMap()
  const layerRef = useRef(null)
  const animationRef = useRef(null)
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!visible || !weather || !weather.hourly?.wind_speed_10m) return

    // Tạo wind vectors
    const vectors = generateWindVectors(weather, 0.3)

    if (style === 'arrows') {
      const result = createArrowLayer(vectors, map)
      cleanupRef.current = result.cleanup
      layerRef.current = result.svg
    } else if (style === 'particles') {
      const cleanup = createParticleLayer(vectors, weather, map, opacity)
      cleanupRef.current = cleanup
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [map, weather, visible, style, opacity])

  return null
}

/**
 * Tạo arrow layer - hiển thị arrow theo hướng gió
 */
function createArrowLayer(vectors, map) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.style.position = 'absolute'
  svg.style.width = '100%'
  svg.style.height = '100%'
  svg.style.pointerEvents = 'none'
  svg.style.zIndex = '101'

  const overlayPane = map.getPane('overlayPane')
  if (overlayPane) {
    overlayPane.appendChild(svg)
  }

  const drawArrows = () => {
    svg.innerHTML = '' // Clear

    const bounds = map.getBounds()

    vectors.forEach(vector => {
      // Check if vector is in bounds
      if (!bounds.contains([vector.lat, vector.lng])) return

      const point = map.latLngToContainerPoint([vector.lat, vector.lng])

      // Arrow size based on wind speed
      const arrowSize = Math.min(Math.max(2, vector.speed / 5), 15)
      const angle = (vector.direction * Math.PI) / 180

      // Vẽ arrow (mũi tên)
      const u = arrowSize * Math.sin(angle)
      const v = arrowSize * Math.cos(angle)

      const color = getWindColor(vector.speed)
      const opacity = Math.min(1, vector.speed / 15)

      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      arrow.setAttribute('transform', `translate(${point.x}, ${point.y})`)

      // Line thể hiện wind vector
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', '0')
      line.setAttribute('y1', '0')
      line.setAttribute('x2', String(u))
      line.setAttribute('y2', String(v))
      line.setAttribute('stroke', color)
      line.setAttribute('stroke-width', '1.5')
      line.setAttribute('opacity', String(opacity))

      // Arrow head
      const headlen = 4
      const angle1 = angle - 2.8
      const angle2 = angle + 2.8

      const headPoints = `${u},${v} ${u + headlen * Math.sin(angle1)},${v + headlen * Math.cos(angle1)} ${u + headlen * Math.sin(angle2)},${v + headlen * Math.cos(angle2)}`
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      polygon.setAttribute('points', headPoints)
      polygon.setAttribute('fill', color)
      polygon.setAttribute('opacity', String(opacity))

      arrow.appendChild(line)
      arrow.appendChild(polygon)
      svg.appendChild(arrow)
    })
  }

  // Initial draw
  drawArrows()

  // Redraw on map interaction
  map.on('moveend zoomend', drawArrows)

  // Store for cleanup
  return { svg, cleanup: () => map.off('moveend zoomend', drawArrows) }
}

/**
 * Tạo particle layer - animated particles follow wind direction
 */
function createParticleLayer(vectors, weather, map, opacity = 0.7) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const container = map.getContainer()

  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.zIndex = '101'
  canvas.style.pointerEvents = 'none'
  canvas.style.opacity = String(opacity)

  const resizeCanvas = () => {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }

  resizeCanvas()
  container.appendChild(canvas)

  const particles = vectors.map(v => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (v.u / 10) * 2, // Velocity
    vy: (v.v / 10) * 2,
    speed: v.speed,
    life: 1
  }))

  let animationId = null

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach((p, idx) => {
      // Update position
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.01

      // Reset if out of bounds or dead
      if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height || p.life <= 0) {
        particles[idx] = {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: p.vx,
          vy: p.vy,
          speed: p.speed,
          life: 1
        }
      }

      // Draw particle
      const color = getWindColor(p.speed)
      ctx.fillStyle = color
      ctx.globalAlpha = p.life * 0.8
      ctx.beginPath()
      ctx.arc(particles[idx].x, particles[idx].y, 2, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.globalAlpha = 1
  }

  const loop = () => {
    animate()
    animationId = requestAnimationFrame(loop)
  }

  loop()

  // Cleanup function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    if (container.contains(canvas)) {
      container.removeChild(canvas)
    }
  }
}

export default WindLayer
