import { HttpError } from '../middleware/errorHandler.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'weather-app/0.1 (sonakshi.panda@sjsu.edu)';

const COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export async function geocode(query) {
  if (!query || typeof query !== 'string') {
    throw new HttpError(400, 'invalid_query', 'Location query must be a non-empty string.');
  }

  const trimmed = query.trim();
  const coordMatch = trimmed.match(COORD_RE);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw new HttpError(400, 'invalid_coords', 'Coordinates out of range.');
    }
    return reverseGeocode(lat, lon).catch(() => ({
      lat,
      lon,
      displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      raw: null,
    }));
  }

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new HttpError(502, 'geocode_failed', `Nominatim returned ${res.status}`);
  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) {
    throw new HttpError(404, 'location_not_found', `Could not find location: "${trimmed}"`);
  }
  const first = results[0];
  return {
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    displayName: first.display_name,
    raw: first,
  };
}

export async function reverseGeocode(lat, lon) {
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'json');

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new HttpError(502, 'reverse_geocode_failed', `Nominatim returned ${res.status}`);
  const data = await res.json();
  return {
    lat,
    lon,
    displayName: data.display_name || `${lat}, ${lon}`,
    raw: data,
  };
}
