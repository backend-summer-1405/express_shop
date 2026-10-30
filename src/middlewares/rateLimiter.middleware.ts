
import rateLimit from 'express-rate-limit';

// ==================== GENERAL LIMITER ====================
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== AUTH LIMITER ====================


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// ==================== CREATE LIMITER ====================


export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many items created, please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== COMMENT LIMITER ====================


export const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many comments, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
