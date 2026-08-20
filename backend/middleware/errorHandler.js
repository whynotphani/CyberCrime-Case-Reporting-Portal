const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error('[Error Handler]', err.message || err);

  const isClientError = err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE' || (err.message && (err.message.includes('file') || err.message.includes('Validation')));
  const statusCode = (res.statusCode && res.statusCode !== 200) ? res.statusCode : (isClientError ? 400 : 500);

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
