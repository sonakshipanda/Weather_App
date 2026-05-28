import mongoose from 'mongoose';
import WeatherQuery from '../models/WeatherQuery.js';
import { geocode } from '../utils/nominatim.js';
import { fetchCurrentAndForecast, fetchHistorical } from '../utils/openMeteo.js';
import { youtubeSearchUrl, mapsEmbed } from '../utils/embeds.js';
import { validateDateRange, classifyRange } from '../utils/validateDateRange.js';
import { generateTravelTip } from '../utils/ai.js';
import { HttpError } from '../middleware/errorHandler.js';

function dbReady() {
  return mongoose.connection.readyState === 1;
}

function requireDb() {
  if (!dbReady()) {
    throw new HttpError(503, 'db_unavailable', 'MongoDB is not connected — persistence disabled.');
  }
}

// GET /api/weather/lookup?location=...
// One-shot fetch without persistence (used by the home page for quick searches).
export async function lookup(req, res, next) {
  try {
    const location = req.query.location;
    const loc = await geocode(location);
    const forecast = await fetchCurrentAndForecast(loc.lat, loc.lon, { days: 5 });
    res.json({
      location: loc,
      forecast,
      embeds: {
        youtube: youtubeSearchUrl(loc.displayName.split(',')[0]),
        maps: mapsEmbed(loc.lat, loc.lon, loc.displayName),
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/weather
export async function create(req, res, next) {
  try {
    requireDb();
    const { location, startDate, endDate, notes } = req.body || {};
    const { start, end } = validateDateRange(startDate, endDate);
    const loc = await geocode(location);
    const kind = classifyRange(start, end);

    let forecastData;
    if (kind === 'historical') {
      forecastData = await fetchHistorical(loc.lat, loc.lon, start, end);
    } else {
      const days = Math.min(16, Math.max(1, Math.ceil((new Date(end) - new Date()) / 86400000) + 1));
      forecastData = await fetchCurrentAndForecast(loc.lat, loc.lon, { days });
    }

    const aiTip = await generateTravelTip({
      displayName: loc.displayName,
      current: forecastData.current,
      daily: forecastData.daily,
    });

    const doc = await WeatherQuery.create({
      locationQuery: location,
      displayName: loc.displayName,
      lat: loc.lat,
      lon: loc.lon,
      dateRange: { start, end },
      current: forecastData.current,
      daily: forecastData.daily,
      notes: notes || '',
      aiTip: aiTip || '',
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

// GET /api/weather
export async function list(_req, res, next) {
  try {
    requireDb();
    const docs = await WeatherQuery.find().sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

// GET /api/weather/:id
export async function readOne(req, res, next) {
  try {
    requireDb();
    const doc = await WeatherQuery.findById(req.params.id).lean();
    if (!doc) throw new HttpError(404, 'not_found', 'Weather query not found.');
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

// PUT /api/weather/:id
export async function update(req, res, next) {
  try {
    requireDb();
    const existing = await WeatherQuery.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'not_found', 'Weather query not found.');

    const { location, startDate, endDate, notes } = req.body || {};
    const patch = {};

    if (typeof notes === 'string') patch.notes = notes;

    if (startDate || endDate) {
      const start = startDate || existing.dateRange.start;
      const end = endDate || existing.dateRange.end;
      validateDateRange(start, end);
      patch.dateRange = { start, end };
    }

    if (location && location !== existing.locationQuery) {
      const loc = await geocode(location);
      patch.locationQuery = location;
      patch.displayName = loc.displayName;
      patch.lat = loc.lat;
      patch.lon = loc.lon;
    }

    // If location or dates changed, re-fetch weather and regenerate the tip.
    if (patch.dateRange || patch.lat !== undefined) {
      const lat = patch.lat ?? existing.lat;
      const lon = patch.lon ?? existing.lon;
      const range = patch.dateRange ?? existing.dateRange;
      const kind = classifyRange(range.start, range.end);
      const data =
        kind === 'historical'
          ? await fetchHistorical(lat, lon, range.start, range.end)
          : await fetchCurrentAndForecast(lat, lon, { days: 5 });
      patch.current = data.current;
      patch.daily = data.daily;

      const displayName = patch.displayName ?? existing.displayName;
      const tip = await generateTravelTip({ displayName, current: data.current, daily: data.daily });
      if (tip) patch.aiTip = tip;
    }

    Object.assign(existing, patch);
    await existing.save();
    res.json(existing);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/weather/:id
export async function remove(req, res, next) {
  try {
    requireDb();
    const doc = await WeatherQuery.findByIdAndDelete(req.params.id);
    if (!doc) throw new HttpError(404, 'not_found', 'Weather query not found.');
    res.json({ deleted: true, id: doc._id });
  } catch (err) {
    next(err);
  }
}
