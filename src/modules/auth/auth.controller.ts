import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

// ==================== LOGIN ====================

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGOUT ====================

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new AppError('Token not provided', 400);
    }

    const result = await authService.logout(token);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== REGISTER INITIATE CONTROLLER (STEP 1) ====================

export const registerInitiate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.registerInitiate(email, password, name);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ==================== REGISTER VERIFY CONTROLLER (STEP 2) ====================

export const registerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code } = req.body;
    const result = await authService.registerVerify(email, code);
    res.status(201).json({
      success: true,
      message: result.message,
      token: result.token
    });
  } catch (error) {
    next(error);
  }
};
