import mongoose from 'mongoose';
import WeatherQuery from '../models/WeatherQuery.js';
import { toJson, toCsv, toXml, toMarkdown, toPdf } from '../utils/exporters.js';
import { HttpError } from '../middleware/errorHandler.js';

const FORMATTERS = {
  json: toJson,
  csv: toCsv,
  xml: toXml,
  md: toMarkdown,
  markdown: toMarkdown,
  pdf: toPdf,
};

const EXTENSIONS = { json: 'json', csv: 'csv', xml: 'xml', md: 'md', markdown: 'md', pdf: 'pdf' };

export async function exportAll(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new HttpError(503, 'db_unavailable', 'MongoDB is not connected — nothing to export.');
    }
    const format = (req.query.format || 'json').toLowerCase();
    const formatter = FORMATTERS[format];
    if (!formatter) {
      throw new HttpError(400, 'invalid_format', `Unsupported format: ${format}. Use json|csv|xml|md|pdf.`);
    }
    const docs = await WeatherQuery.find().sort({ createdAt: -1 }).lean();
    const { contentType, body } = await formatter(docs);
    const filename = `weather-queries-${Date.now()}.${EXTENSIONS[format]}`;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  } catch (err) {
    next(err);
  }
}
