const ErrorResponse = require('./_errorResponse');
const _HTTP_STATUS_CODES = require('./_httpStatusCodes');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Log to console for dev mode
  console.log("error handler : " , err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `ObjectID not acceptable`;
    error = new ErrorResponse(message, _HTTP_STATUS_CODES.NOT_ALLOWED);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Dublicate value entred';
    error = new ErrorResponse(message, _HTTP_STATUS_CODES.BAD_REQUEST);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, _HTTP_STATUS_CODES.BAD_REQUEST);
  }

  res.status(error.statusCode || _HTTP_STATUS_CODES.INTERNAL_SERVER).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;