import { Request, Response, NextFunction } from 'express';

// کلاس خطای سفارشی
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

// میدل‌ور مدیریت خطا
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // اگه خطا از نوع AppError بود، از statusCode خودش استفاده کن
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

  // خطاهای Zod (اعتبارسنجی)
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

  // خطای JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // لاگ خطا در کنسول (فقط در حالت development)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      statusCode,
      stack: err.stack,
    });
  }

  // ارسال پاسخ
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
