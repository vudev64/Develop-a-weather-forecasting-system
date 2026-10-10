import { useState } from 'react'
import './WeatherLayerControl.css'

function WeatherLayerControl({ onLayerChange, layerConfig = {} }) {
  const [isOpen, setIsOpen] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(min-width: 821px)').matches
  ))
  const [opacity, setOpacity] = useState(0.7)

  const toggleLayer = (layerName) => {
    onLayerChange({
      ...layerConfig,
      [layerName]: !layerConfig[layerName]
    })
  }

  const handleOpacityChange = (e) => {
    const opacityValue = parseFloat(e.target.value)
    setOpacity(opacityValue)
    // Send opacity to parent component
    onLayerChange({
      ...layerConfig,
      opacity: opacityValue
    })
  }

  const layers = [
    { id: 'temperature', name: 'Nhiệt độ', icon: '🌡️' },
    { id: 'wind', name: 'Gió', icon: '💨' },
    { id: 'rainfall', name: 'Lượng mưa', icon: '⛈️' },
    { id: 'humidity', name: 'Độ ẩm', icon: '💧' },
  ]

  return (
    <div className={`weather-layer-control ${isOpen ? 'open' : 'closed'}`}>
      <div className="layer-header">
        <button
          className="menu-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Ẩn lớp bản đồ' : 'Hiện lớp bản đồ'}
          aria-expanded={isOpen}
        >
          {isOpen ? '−' : '+'}
        </button>
        <h3>Lớp bản đồ</h3>
      </div>

      {isOpen && (
        <div className="layer-menu">
          <div className="layers-list">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`layer-item ${layerConfig[layer.id] ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="layer-content"
                  onClick={() => toggleLayer(layer.id)}
                  aria-pressed={Boolean(layerConfig[layer.id])}
                >
                  <span className="layer-icon">
                    <span>{layer.icon}</span>
                  </span>
                  <div className="layer-info">
                    <span className="layer-name">{layer.name}</span>
                  </div>
                  <span className="layer-switch" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="opacity-section">
            <label className="section-title">Độ trong suốt</label>
            <div className="opacity-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={handleOpacityChange}
              />
              <span className="opacity-value">{(opacity * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherLayerControl
