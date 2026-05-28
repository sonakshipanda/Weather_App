import { HttpError } from '../middleware/errorHandler.js';

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';

// WMO weather interpretation codes — https://open-meteo.com/en/docs
const WMO = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

export function describeWeatherCode(code) {
  return WMO[code] ?? 'Unknown';
}

export async function fetchCurrentAndForecast(lat, lon, { days = 5 } = {}) {
  const url = new URL(FORECAST_BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'wind_speed_10m',
    'weather_code',
    'is_day',
  ].join(','));
  url.searchParams.set('daily', [
    'temperature_2m_max',
    'temperature_2m_min',
    'weather_code',
    'precipitation_sum',
    'uv_index_max',
    'sunrise',
    'sunset',
  ].join(','));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', String(days));

  const res = await fetch(url);
  if (!res.ok) throw new HttpError(502, 'weather_fetch_failed', `Open-Meteo returned ${res.status}`);
  const data = await res.json();
  return normalizeForecast(data);
}

export async function fetchHistorical(lat, lon, startDate, endDate) {
  const url = new URL(ARCHIVE_BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('daily', ['temperature_2m_max', 'temperature_2m_min', 'weather_code', 'precipitation_sum'].join(','));
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url);
  if (!res.ok) throw new HttpError(502, 'history_fetch_failed', `Open-Meteo archive returned ${res.status}`);
  const data = await res.json();
  return normalizeForecast(data);
}

function normalizeForecast(data) {
  const current = data.current
    ? {
        time: data.current.time,
        temperatureC: data.current.temperature_2m,
        feelsLikeC: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windKph: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        condition: describeWeatherCode(data.current.weather_code),
        isDay: data.current.is_day === 1,
      }
    : null;

  const daily = data.daily
    ? data.daily.time.map((date, i) => ({
        date,
        tempMaxC: data.daily.temperature_2m_max?.[i] ?? null,
        tempMinC: data.daily.temperature_2m_min?.[i] ?? null,
        weatherCode: data.daily.weather_code?.[i] ?? null,
        condition: describeWeatherCode(data.daily.weather_code?.[i]),
        precipitationMm: data.daily.precipitation_sum?.[i] ?? null,
        uvIndexMax: data.daily.uv_index_max?.[i] ?? null,
        sunrise: data.daily.sunrise?.[i] ?? null,
        sunset: data.daily.sunset?.[i] ?? null,
      }))
    : [];

  return { current, daily, timezone: data.timezone, units: { temperature: 'C', wind: 'km/h' } };
}
