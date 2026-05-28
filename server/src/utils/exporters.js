import { Builder } from 'xml2js';
import PDFDocument from 'pdfkit';

export function toJson(docs) {
  return { contentType: 'application/json', body: JSON.stringify(docs, null, 2) };
}

export function toCsv(docs) {
  const headers = [
    'id',
    'locationQuery',
    'displayName',
    'lat',
    'lon',
    'startDate',
    'endDate',
    'currentTempC',
    'currentCondition',
    'notes',
    'createdAt',
  ];
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = docs.map((d) =>
    [
      d._id,
      d.locationQuery,
      d.displayName,
      d.lat,
      d.lon,
      d.dateRange?.start,
      d.dateRange?.end,
      d.current?.temperatureC,
      d.current?.condition,
      d.notes,
      d.createdAt,
    ]
      .map(escape)
      .join(','),
  );
  return { contentType: 'text/csv', body: [headers.join(','), ...rows].join('\n') };
}

export function toXml(docs) {
  const builder = new Builder({ rootName: 'weatherQueries' });
  const body = builder.buildObject({ query: docs.map((d) => JSON.parse(JSON.stringify(d))) });
  return { contentType: 'application/xml', body };
}

export function toMarkdown(docs) {
  const lines = ['# Weather Queries', ''];
  for (const d of docs) {
    lines.push(`## ${d.displayName}`);
    lines.push('');
    lines.push(`- **Query:** ${d.locationQuery}`);
    lines.push(`- **Coordinates:** ${d.lat}, ${d.lon}`);
    lines.push(`- **Date range:** ${d.dateRange?.start} → ${d.dateRange?.end}`);
    if (d.current) {
      lines.push(`- **Current:** ${d.current.temperatureC}°C, ${d.current.condition}`);
    }
    if (d.notes) lines.push(`- **Notes:** ${d.notes}`);
    lines.push('');
  }
  return { contentType: 'text/markdown', body: lines.join('\n') };
}

export function toPdf(docs) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve({ contentType: 'application/pdf', body: Buffer.concat(chunks) }));
    doc.on('error', reject);

    doc.fontSize(20).text('Weather Queries', { underline: true });
    doc.moveDown();

    docs.forEach((d, i) => {
      doc.fontSize(14).text(`${i + 1}. ${d.displayName}`);
      doc.fontSize(10).fillColor('#444');
      doc.text(`Query: ${d.locationQuery}`);
      doc.text(`Coordinates: ${d.lat}, ${d.lon}`);
      doc.text(`Date range: ${d.dateRange?.start} → ${d.dateRange?.end}`);
      if (d.current) doc.text(`Current: ${d.current.temperatureC}°C, ${d.current.condition}`);
      if (d.notes) doc.text(`Notes: ${d.notes}`);
      doc.fillColor('black').moveDown();
    });

    doc.end();
  });
}
