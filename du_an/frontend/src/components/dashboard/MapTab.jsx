import Map from '../../Map.jsx'
import WeatherLayerControl from '../WeatherLayerControl.jsx'

function MapTab({ weather, layerConfig, onLayerChange }) {
  return (
    <div className="map-tab">
      <div className="map-tab-controls">
        <WeatherLayerControl
          layerConfig={layerConfig}
          onLayerChange={onLayerChange}
        />
      </div>
      <Map weather={weather} layerConfig={layerConfig} showForecast={false} />
    </div>
  )
}

export default MapTab
