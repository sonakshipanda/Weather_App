import mongoose from 'mongoose';

const dailySchema = new mongoose.Schema(
  {
    date: String,
    tempMaxC: Number,
    tempMinC: Number,
    weatherCode: Number,
    condition: String,
    precipitationMm: Number,
    uvIndexMax: Number,
    sunrise: String,
    sunset: String,
  },
  { _id: false },
);

const weatherQuerySchema = new mongoose.Schema(
  {
    locationQuery: { type: String, required: true },
    displayName: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    dateRange: {
      start: { type: String, required: true }, // ISO date YYYY-MM-DD
      end: { type: String, required: true },
    },
    current: { type: Object, default: null },
    daily: { type: [dailySchema], default: [] },
    notes: { type: String, default: '' },
    aiTip: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model('WeatherQuery', weatherQuerySchema);
