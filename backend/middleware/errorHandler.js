const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const payload = {
    message: err.message || "Server Error",
  };

  if (err.details) {
    payload.details = err.details;
  }

  res.status(statusCode).json(payload);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFoundHandler };
