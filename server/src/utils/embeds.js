// Build URLs the frontend can use for the "About this place" section.
// Google Maps: iframed via the keyless `?q=` embed (works without billing).
// YouTube: a direct search-results link the frontend renders as a clickable
// card (the iframe form requires a YT Data API key to be reliable).

export function youtubeSearchUrl(query) {
  const q = encodeURIComponent(`${query} travel guide`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

export function mapsEmbed(lat, lon, label = '') {
  const q = label ? encodeURIComponent(label) : `${lat},${lon}`;
  return `https://www.google.com/maps?q=${q}&output=embed`;
}
