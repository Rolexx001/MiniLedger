import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.statusCode === 404 ? 'Not Found' : err.statusCode === 409 ? 'Conflict' : err.statusCode === 429 ? 'Too Many Requests' : 'Bad Request',
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Handle unexpected internal server errors
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected internal server error occurred',
  });
};
