import rateLimit from 'express-rate-limit';

// ==================== GENERAL LIMITER ====================

// محدودیت عمومی: ۱۰۰ درخواست در ۱۵ دقیقه
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, // هدرهای RateLimit-* توی پاسخ
  legacyHeaders: false,  // غیرفعال کردن X-RateLimit-*
});

// ==================== AUTH LIMITER ====================

// محدودیت سختگیرانه برای auth: ۵ درخواست در ۱۵ دقیقه
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // درخواست‌های موفق رو نشمار
});

// ==================== CREATE LIMITER ====================

// محدودیت برای ساخت محتوا: ۲۰ درخواست در ۱ ساعت
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ساعت
  max: 20,
  message: {
    success: false,
    message: 'Too many items created, please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== COMMENT LIMITER ====================

// محدودیت برای کامنت: ۱۰ کامنت در ۱۰ دقیقه
export const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 دقیقه
  max: 10,
  message: {
    success: false,
    message: 'Too many comments, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
