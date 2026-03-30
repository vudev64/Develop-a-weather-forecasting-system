import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

/**
 * Rainfall Layer - Hiển thị lượng mưa dạng animated rain particles
 * Sử dụng Canvas với animated water drops
 */
function RainfallLayer({ weather, visible = true, opacity = 0.7 }) {
  const map = useMap()
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!visible || !weather || weather.precipitation === undefined) return

    const container = map.getContainer()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvasRef.current = canvas

    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.zIndex = '102'
    canvas.style.pointerEvents = 'none'
    canvas.style.opacity = String(opacity)

    const resizeCanvas = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    resizeCanvas()
    container.appendChild(canvas)

    // Tạo rain drops dựa trên current precipitation
    const precipitationAmount = weather.precipitation || 0
    const dropCount = Math.floor(precipitationAmount * 50) // Số giọt mưa
    let raindrops = []

    for (let i = 0; i < dropCount; i++) {
      raindrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        velocity: 2 + Math.random() * 3, // Tốc độ rơi
        length: 10 + Math.random() * 10,
        opacity: 0.4 + Math.random() * 0.4,
        wobble: Math.random() * 0.5
      })
    }

    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      raindrops.forEach(drop => {
        drop.y += drop.velocity
        drop.x += Math.sin(time * 0.02 + drop.wobble) * 0.5 // Gió thổi hơi sang

        // Nếu giọt rơi ra dưới, reset lên trên
        if (drop.y > canvas.height) {
          drop.y = -drop.length
          drop.x = Math.random() * canvas.width
        }

        // Vẽ giọt mưa
        ctx.strokeStyle = `rgba(100, 200, 255, ${drop.opacity})`
        ctx.lineWidth = 1
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.moveTo(drop.x, drop.y)
        ctx.lineTo(drop.x - 1, drop.y + drop.length)
        ctx.stroke()
      })

      time++
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      resizeCanvas()
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (container.contains(canvas)) {
        container.removeChild(canvas)
      }
    }
  }, [map, weather, visible, opacity])

  return null
}

export default RainfallLayer
