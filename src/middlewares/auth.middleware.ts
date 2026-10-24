import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import redis from '../lib/redis';

// ==================== TYPES ====================

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// ==================== AUTHENTICATE (REQUIRED) ====================

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided. Please login.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as JwtPayload;

    const isRevoked = await redis.exists(`revoked:${token}`);
    if (isRevoked) {
      throw new AppError('Token has been revoked. Please login again.', 401);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
};

// ==================== OPTIONAL AUTH ====================

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as JwtPayload;

    const isRevoked = await redis.exists(`revoked:${token}`);

    if (!isRevoked) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    next();
  }
};
