export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  const payload = {
    status: 'error',
    error: status >= 500 && isProd ? 'Internal server error' : (err.message || 'Unexpected error')
  };
  if (!isProd) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}
