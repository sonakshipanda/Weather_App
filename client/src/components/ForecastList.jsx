import { iconFor } from './CurrentWeather.jsx';

function formatDay(iso) {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
  const day = d.getDate();
  return `${weekday} ${day}`;
}

export default function ForecastList({ daily }) {
  if (!daily || daily.length === 0) return null;
  return (
    <>
      <h2 className="eyebrow">Five-day outlook</h2>
      <div className="forecast">
        {daily.slice(0, 5).map((d) => (
          <div className="forecast-day" key={d.date}>
            <div className="day">{formatDay(d.date)}</div>
            <div className="icon">{iconFor(d.condition)}</div>
            <div className="temp">
              {Math.round(d.tempMaxC)}°<span className="low">{Math.round(d.tempMinC)}°</span>
            </div>
            <div className="detail">
              UV {d.uvIndexMax ?? '—'} · {d.precipitationMm ?? 0}mm
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
