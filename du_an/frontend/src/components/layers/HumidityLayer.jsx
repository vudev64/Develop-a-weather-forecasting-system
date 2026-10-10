import { getHumidityColor } from '../../utils/weatherColors'
import LocalizedWeatherLayer from './LocalizedWeatherLayer.jsx'

function HumidityLayer({ weather, visible = true, opacity = 0.7 }) {
  if (!visible) return null

  const humidity = weather?.current?.humidity
  const numericHumidity = Number(humidity)

  if (
    humidity == null
    || humidity === ''
    || !Number.isFinite(numericHumidity)
    || numericHumidity < 0
    || numericHumidity > 100
  ) return null

  return (
    <LocalizedWeatherLayer
      weather={weather}
      value={numericHumidity}
      displayValue={`${numericHumidity}%`}
      color={getHumidityColor(numericHumidity)}
      label="Độ ẩm"
      opacity={opacity}
    />
  )
}

export default HumidityLayer
