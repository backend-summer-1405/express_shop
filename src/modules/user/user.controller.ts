import { Response, NextFunction } from 'express';
import * as userService from './user.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { generateToken } from '../../utils/jwt';

// ==================== REGISTER ====================

export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const user = await userService.createUser({ email, password, name });


    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGIN ====================

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;


    const user = await userService.getUserByEmail(email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }


    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }


    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });


    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET PROFILE ====================

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await userService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE PROFILE ====================

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { name, email, password } = req.body;

    const user = await userService.updateUser(req.user.id, {
      name,
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPLOAD PROFILE IMAGE ====================

export const uploadProfileImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const fileUrl = `/uploads/images/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url: fileUrl },
    });
  } catch (error) {
    next(error);
  }
};
