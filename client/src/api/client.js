const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const message = data?.message || data?.error || res.statusText || 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.error;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  lookup: (location) => request(`/api/weather/lookup?location=${encodeURIComponent(location)}`),
  list: () => request('/api/weather'),
  create: (payload) => request('/api/weather', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/weather/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/weather/${id}`, { method: 'DELETE' }),
  parseNL: (text) => request('/api/ai/parse', { method: 'POST', body: JSON.stringify({ text }) }),
  travelTip: (payload) => request('/api/ai/tip', { method: 'POST', body: JSON.stringify(payload) }),
  exportUrl: (format) => `${BASE}/api/export?format=${format}`,
};
