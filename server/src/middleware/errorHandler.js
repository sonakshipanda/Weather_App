export function notFoundHandler(req, res, _next) {
  res.status(404).json({ error: 'not_found', path: req.path });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'internal_error' : 'request_error');
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    error: code,
    message: err.message || 'Something went wrong',
  });
}

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
