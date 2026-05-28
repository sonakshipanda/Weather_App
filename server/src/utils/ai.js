import Anthropic from '@anthropic-ai/sdk';
import { HttpError } from '../middleware/errorHandler.js';

const MODEL = 'claude-sonnet-4-6';

let _client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function requireClient() {
  const c = getClient();
  if (!c) throw new HttpError(503, 'ai_unavailable', 'ANTHROPIC_API_KEY is not set.');
  return c;
}

function extractText(msg) {
  const block = msg?.content?.find((b) => b.type === 'text');
  return block ? block.text : '';
}

const PARSE_SYSTEM = `You extract a location and date range from a user's natural-language weather question.
Reply ONLY with strict JSON, no prose, no markdown fences. Schema:
{
  "location": string,            // city / landmark / coords / zip; "" if none found
  "startDate": "YYYY-MM-DD" | null,
  "endDate":   "YYYY-MM-DD" | null,
  "intent": "current" | "forecast" | "historical",
  "confidence": number           // 0..1
}
Resolve relative dates (today, tomorrow, "next week", "this weekend") relative to the provided current date.
If no date is mentioned, set both dates to null and intent to "current".`;

export async function parseNaturalLanguage(text, today) {
  const client = requireClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [{ type: 'text', text: PARSE_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Current date: ${today}\n\nUser query: ${text}` }],
  });
  const raw = extractText(msg);
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(502, 'ai_parse_failed', `Could not parse AI response: ${raw.slice(0, 200)}`);
  }
}

const TIP_SYSTEM =
  'You give one short, practical travel tip (under 30 words) based on the weather data the user provides. Be specific (e.g., "pack a light jacket — evenings drop to 10°C"). No greetings, no markdown, no caveats.';

/**
 * Generate a weather-aware travel tip. Never throws — returns null when AI is
 * unavailable or the call fails, so callers can include it best-effort.
 */
export async function generateTravelTip({ displayName, current, daily }) {
  const client = getClient();
  if (!client) return null;
  if (!displayName || (!current && (!daily || daily.length === 0))) return null;

  try {
    const summary = { location: displayName, current, next5Days: (daily || []).slice(0, 5) };
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: [{ type: 'text', text: TIP_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: JSON.stringify(summary) }],
    });
    return extractText(msg).trim() || null;
  } catch (err) {
    console.warn('[ai] travel tip generation failed:', err.message);
    return null;
  }
}

/** Strict variant for the `/api/ai/tip` endpoint — surfaces errors instead of swallowing them. */
export async function generateTravelTipStrict({ displayName, current, daily }) {
  const client = requireClient();
  if (!displayName || !current) {
    throw new HttpError(400, 'invalid_input', 'displayName and current weather are required.');
  }
  const summary = { location: displayName, current, next5Days: (daily || []).slice(0, 5) };
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: [{ type: 'text', text: TIP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(summary) }],
  });
  return extractText(msg).trim();
}
