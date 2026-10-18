import { Response, NextFunction } from 'express';
import * as userService from './user.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import path from 'path';
import { processImage } from '../../utils/imageProcessor';
import { CreateUserInput, UpdateUserInput } from './user.types';

// ==================== GET ME ====================

export const getMe = async (
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

// ==================== UPDATE ME ====================

export const updateMe = async (
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

// ==================== UPLOAD PROFILE IMAGES ====================

export const uploadProfileImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const files = req.files as Express.Multer.File[];
    const images = [];

    for (const file of files) {
      const processedPath = await processImage(file.path, {
        width: 500,
        height: 500,
        quality: 80,
        format: 'webp',
      });

      const filename = path.basename(processedPath);
      const fileUrl = `/uploads/images/${filename}`;
      const image = await userService.addProfileImage(req.user.id, fileUrl);
      images.push(image);
    }

    res.status(201).json({
      success: true,
      message: 'Images uploaded successfully',
      data: { images },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET ALL USERS (ADMIN) ====================

export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await userService.getAllUsers(page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CHANGE USER ROLE (ADMIN) ====================

export const changeUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;


    const user = await userService.changeUserRole(id, role);

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
