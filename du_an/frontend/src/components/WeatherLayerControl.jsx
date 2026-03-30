import { useState } from 'react'
import './WeatherLayerControl.css'

function WeatherLayerControl({ onLayerChange, layerConfig = {} }) {
  const [isOpen, setIsOpen] = useState(true)
  const [opacity, setOpacity] = useState(0.7)
  const [windStyle, setWindStyle] = useState('arrows')

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

  const handleWindStyleChange = (style) => {
    setWindStyle(style)
    onLayerChange({
      ...layerConfig,
      windStyle: style
    })
  }

  const layers = [
    { id: 'temperature', name: 'Temperature', icon: '🌡️', color: '#ff6b35' },
    { id: 'wind', name: 'Wind', icon: '💨', color: '#4ecdc4' },
    { id: 'rainfall', name: 'Rain, thunder', icon: '⛈️', color: '#45b7d1' },
    { id: 'humidity', name: 'Humidity', icon: '💧', color: '#96ceb4' },
    // Các layer từ "More layers"
    { id: 'weather-radar', name: 'Weather radar', icon: '🌈' },
    { id: 'satellite', name: 'Satellite', icon: '🛰️' },
    { id: 'hurricane-tracker', name: 'Hurricane tracker', icon: '🌀' },
    { id: 'wind-layer', name: 'Wind', icon: '💨' },
    { id: 'wind-gusts', name: 'Wind gusts', icon: '🌪️' },
    { id: 'wind-accumulation', name: 'Wind accumulation', icon: '💨' },
    { id: 'pressure', name: 'Pressure', icon: '🔷' },
    { id: 'temp-layer', name: 'Temperature', icon: '🌡️' },
    { id: 'dew-point', name: 'Dew point', icon: '💧' },
    { id: 'humidity-layer', name: 'Humidity', icon: '💧' },
    { id: 'wet-bulb', name: 'Wet-bulb temperature', icon: '🌡️' },
    { id: 'solar-power', name: 'Solar power', icon: '☀️' },
    { id: 'uv-index', name: 'UV Index', icon: '☀️' },
    { id: 'city-heatmaps', name: 'City heatmaps', icon: '🏙️' },
    { id: 'rain-thunder', name: 'Rain, thunder', icon: '⛈️' },
    { id: 'rain-accumulation', name: 'Rain accumulation', icon: '💧' },
    { id: 'new-snow', name: 'New snow', icon: '❄️' },
    { id: 'snow-depth', name: 'Snow depth', icon: '❄️' },
    { id: 'precipitation-type', name: 'Precipitation type', icon: '💧' },
    { id: 'thunderstorms', name: 'Thunderstorms', icon: '⛈️' }
  ]

  // Show only enabled layers or main layers
  const displayedLayers = layers.filter(layer => 
    ['temperature', 'wind', 'rainfall', 'humidity'].includes(layer.id) || layerConfig[layer.id]
  )

  return (
    <div className={`weather-layer-control ${isOpen ? 'open' : 'closed'}`}>
      {/* Header */}
      <div className="layer-header">
        <button
          className="menu-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Toggle menu"
        >
          ☰
        </button>
        <h3>Menu</h3>
      </div>

      {isOpen && (
        <div className="layer-menu">
          {/* Layers List */}
          <div className="layers-list">
            {displayedLayers.map((layer) => (
              <div
                key={layer.id}
                className={`layer-item ${layerConfig[layer.id] ? 'active' : ''}`}
              >
                <div
                  className="layer-content"
                  onClick={() => toggleLayer(layer.id)}
                >
                  <div className="layer-icon">
                    <span>{layer.icon}</span>
                  </div>
                  <div className="layer-info">
                    <span className="layer-name">{layer.name}</span>
                  </div>
                </div>
                <div className="layer-checkbox">
                  <input
                    type="checkbox"
                    checked={layerConfig[layer.id] || false}
                    onChange={() => toggleLayer(layer.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Wind Style Options */}
          {layerConfig.wind && (
            <div className="wind-style-section">
              <label className="section-title">Wind Style</label>
              <div className="wind-style-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="windStyle"
                    value="arrows"
                    checked={windStyle === 'arrows'}
                    onChange={(e) => handleWindStyleChange(e.target.value)}
                  />
                  <span>Arrows</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="windStyle"
                    value="particles"
                    checked={windStyle === 'particles'}
                    onChange={(e) => handleWindStyleChange(e.target.value)}
                  />
                  <span>Particles</span>
                </label>
              </div>
            </div>
          )}

          {/* Opacity Control */}
          <div className="opacity-section">
            <label className="section-title">Opacity</label>
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
