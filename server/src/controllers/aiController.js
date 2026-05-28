import { parseNaturalLanguage, generateTravelTipStrict } from '../utils/ai.js';
import { HttpError } from '../middleware/errorHandler.js';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// POST /api/ai/parse  { text: string, today?: "YYYY-MM-DD" }
export async function parseNL(req, res, next) {
  try {
    const { text, today } = req.body || {};
    if (!text || typeof text !== 'string') {
      throw new HttpError(400, 'invalid_input', 'text is required.');
    }
    const parsed = await parseNaturalLanguage(text, today || todayIso());
    res.json(parsed);
  } catch (err) {
    next(err);
  }
}

// POST /api/ai/tip { displayName, current, daily }
export async function travelTip(req, res, next) {
  try {
    const tip = await generateTravelTipStrict(req.body || {});
    res.json({ tip });
  } catch (err) {
    next(err);
  }
}
