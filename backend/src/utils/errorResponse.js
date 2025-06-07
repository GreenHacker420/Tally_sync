class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ErrorResponse';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
