const ICONS = {
  'Clear sky': '☀',
  'Mainly clear': '🌤',
  'Partly cloudy': '⛅',
  Overcast: '☁',
  Fog: '🌫',
  'Depositing rime fog': '🌫',
  'Light drizzle': '🌦',
  'Moderate drizzle': '🌦',
  'Dense drizzle': '🌧',
  'Slight rain': '🌧',
  'Moderate rain': '🌧',
  'Heavy rain': '🌧',
  'Slight snow': '🌨',
  'Moderate snow': '🌨',
  'Heavy snow': '❄',
  'Snow grains': '❄',
  'Rain showers': '🌧',
  'Heavy rain showers': '🌧',
  'Violent rain showers': '⛈',
  'Snow showers': '🌨',
  'Heavy snow showers': '❄',
  Thunderstorm: '⛈',
  'Thunderstorm with hail': '⛈',
  'Severe thunderstorm with hail': '⛈',
};

export function iconFor(condition) {
  return ICONS[condition] || '·';
}

function formatToday() {
  return new Date()
    .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export default function CurrentWeather({ location, current }) {
  if (!current) return null;
  return (
    <section className="current">
      <div className="current-top">
        <div className="current-place">{location?.displayName}</div>
        <div className="current-meta">
          {formatToday()} · {current.isDay ? 'Day' : 'Night'}
        </div>
      </div>

      <div className="current-temp">
        <span className="icon">{iconFor(current.condition)}</span>
        <span className="num">{Math.round(current.temperatureC)}°</span>
      </div>

      <div className="current-condition">{current.condition}</div>

      <div className="metrics-row">
        <Metric label="Feels" value={`${Math.round(current.feelsLikeC)}°`} />
        <Metric label="Humidity" value={`${current.humidity}%`} />
        <Metric label="Wind" value={`${Math.round(current.windKph)} km/h`} />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
