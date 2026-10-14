import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

// ==================== CUSTOM ERROR ====================

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================== ERROR HANDLER ====================

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // خطاهای Prisma
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'This record already exists';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  }

  if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Foreign key constraint failed';
  }

  // خطاهای Zod
  if (err.name === 'ZodError' || err.issues) {
    statusCode = 400;
    const issues = err.issues || err.errors || [];

    if (Array.isArray(issues) && issues.length > 0) {
      message = issues
        .map((e: any) => {
          const path = e.path?.join('.') || 'field';
          return `${path}: ${e.message}`;
        })
        .join(', ');
    } else {
      message = 'Validation error';
    }
  }

  // خطاهای JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ==================== لاگ خطا ====================

  const logData = {
    message: err.message,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id || 'anonymous',
    stack: err.stack,
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client Error:', logData);
  }

  // ==================== ارسال پاسخ ====================

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
