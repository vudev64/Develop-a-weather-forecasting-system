import { getTemperatureColor } from '../../utils/weatherColors'
import LocalizedWeatherLayer from './LocalizedWeatherLayer.jsx'

function TemperatureLayer({ weather, visible = true, opacity = 0.7 }) {
  if (!visible) return null

  const temperature = weather?.current?.temperature
    ?? weather?.hourly?.temperature_2m?.[0]
  if (temperature == null || !Number.isFinite(Number(temperature))) return null

  return (
    <LocalizedWeatherLayer
      weather={weather}
      value={temperature}
      displayValue={`${temperature}°C`}
      color={getTemperatureColor(Number(temperature))}
      label="Nhiệt độ"
      opacity={opacity}
    />
  )
}

export default TemperatureLayer
