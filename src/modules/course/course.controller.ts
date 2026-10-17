import { Response, NextFunction } from 'express';
import path from 'path';
import * as courseService from './course.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { processImage } from '../../utils/imageProcessor';

// ==================== CREATE COURSE ====================

export const createCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { title, description, price } = req.body;

    if (!title || title.length < 3) {
      throw new AppError('Title must be at least 3 characters', 400);
    }

    if (!price || price < 0) {
      throw new AppError('Price must be a positive number', 400);
    }

    let imageUrl: string | undefined;
    if (req.file) {
      const processedPath = await processImage(req.file.path, {
        width: 1200,
        height: 800,
        quality: 80,
        format: 'webp',
      });
      const filename = path.basename(processedPath);
      imageUrl = `/uploads/images/${filename}`;
    }

    const course = await courseService.createCourse({
      title,
      description,
      price: parseInt(price),
      image: imageUrl,
      authorId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET ALL COURSES ====================

export const getAllCourses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user?.id;  // ← جدید

    const result = await courseService.getAllCourses(page, limit, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET COURSE BY ID ====================

export const getCourseById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    const course = await courseService.getCourseById(id, userId);

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE COURSE ====================

export const updateCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, price, isPublished } = req.body;

    const course = await courseService.updateCourse(id, {
      title,
      description,
      price: price ? parseInt(price) : undefined,
      isPublished,
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE COURSE ====================

export const deleteCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await courseService.deleteCourse(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADD COMMENT ====================

export const addComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = req.params.id as string;
    const { content, parentId } = req.body;

    const comment = await courseService.addComment(id, req.user.id, content, parentId);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE COMMENT ====================

export const deleteComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const commentId = req.params.commentId as string;
    const result = await courseService.deleteComment(commentId, req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== TOGGLE LIKE ====================

export const toggleLike = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = req.params.id as string;
    const { type } = req.body;

    if (!type || !['LIKE', 'DISLIKE'].includes(type)) {
      throw new AppError('Type must be LIKE or DISLIKE', 400);
    }

    const result = await courseService.toggleLike(id, req.user.id, type);

    res.status(200).json({
      success: true,
      message: result.message,
      action: result.action,
      isLiked: result.isLiked,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADD RATING ====================

export const addRating = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = req.params.id as string;
    const { value } = req.body;

    if (!value || value < 1 || value > 5) {
      throw new AppError('Rating value must be between 1 and 5', 400);
    }

    const result = await courseService.addRating(id, req.user.id, value);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PURCHASE COURSE ====================

export const purchaseCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const courseId = req.params.id as string;
    const result = await courseService.purchaseCourse(courseId, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Course purchased successfully. Waiting for admin approval.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== APPROVE PURCHASE (ADMIN) ====================

export const approvePurchase = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchaseId = req.params.purchaseId as string;
    const { status } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Status must be APPROVED or REJECTED', 400);
    }

    const result = await courseService.approvePurchase(purchaseId, status);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET MY PURCHASES ====================

export const getMyPurchases = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const purchases = await courseService.getMyPurchases(req.user.id);

    res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET PENDING PURCHASES (ADMIN) ====================

export const getPendingPurchases = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchases = await courseService.getPendingPurchases();

    res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== TOGGLE FAVORITE ====================

export const toggleFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = req.params.id as string;

    const result = await courseService.toggleFavorite(id, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
      action: result.action,
      isFavorite: result.isFavorite,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET MY FAVORITES ====================

export const getMyFavorites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const favorites = await courseService.getMyFavorites(req.user.id);

    res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    next(error);
  }
};
