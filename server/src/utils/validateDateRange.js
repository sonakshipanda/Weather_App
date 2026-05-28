import { HttpError } from '../middleware/errorHandler.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateRange(start, end) {
  if (!start || !end) {
    throw new HttpError(400, 'invalid_date_range', 'start and end dates are required (YYYY-MM-DD).');
  }
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) {
    throw new HttpError(400, 'invalid_date_range', 'Dates must be ISO format YYYY-MM-DD.');
  }
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    throw new HttpError(400, 'invalid_date_range', 'Could not parse one of the dates.');
  }
  if (s > e) {
    throw new HttpError(400, 'invalid_date_range', 'start must be on or before end.');
  }
  const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    throw new HttpError(400, 'invalid_date_range', 'Date range cannot exceed 30 days.');
  }
  return { start, end, diffDays };
}

export function classifyRange(start, end) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const s = new Date(start);
  const e = new Date(end);
  if (e < today) return 'historical';
  if (s > today) return 'forecast';
  return 'mixed';
}
