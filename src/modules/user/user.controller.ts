import { Response, NextFunction } from 'express';
import * as userService from './user.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import path from 'path';
import { processImage } from '../../utils/imageProcessor';

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

// ==================== DELETE ACCOUNT (SELF) ====================

export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const result = await userService.deleteAccount(req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE PROFILE IMAGE ====================

export const deleteProfileImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const imageId = req.params.imageId as string;

    const result = await userService.deleteProfileImage(req.user.id, imageId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
