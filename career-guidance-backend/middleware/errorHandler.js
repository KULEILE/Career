const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.details[0].message });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate field value entered' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Resource not found' });
  }

  res.status(500).json({ error: 'Something went wrong!' });
};

module.exports = errorHandler;