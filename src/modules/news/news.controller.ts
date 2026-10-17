import { Response, NextFunction } from 'express';
import * as newsService from './news.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import path from 'path';
import { processImage } from '../../utils/imageProcessor';

// ==================== CREATE NEWS ====================

export const createNews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { title, content } = req.body;

    if (!title || title.length < 3) {
      throw new AppError('Title must be at least 3 characters', 400);
    }
    if (title.length > 200) {
      throw new AppError('Title must be at most 200 characters', 400);
    }
    if (!content || content.length < 10) {
      throw new AppError('Content must be at least 10 characters', 400);
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
      imageUrl = `/uploads/news/${filename}`;
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    const news = await newsService.createNews({
      title,
      content,
      image: imageUrl,
      authorId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET ALL NEWS ====================

export const getAllNews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const userId = req.user?.id;

    const result = await newsService.getAllNews(page, limit, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET NEWS BY ID ====================

export const getNewsById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    const news = await newsService.getNewsById(id, userId);

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE NEWS ====================

export const updateNews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, content, image } = req.body;

    const news = await newsService.updateNews(id, { title, content, image });

    res.status(200).json({
      success: true,
      message: 'News updated successfully',
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE NEWS ====================

export const deleteNews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await newsService.deleteNews(id);

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

    const comment = await newsService.addComment(id, req.user.id, content, parentId);

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
    const result = await newsService.deleteComment(commentId, req.user.id, req.user.role);

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

    const result = await newsService.toggleLike(id, req.user.id, type);

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

    const result = await newsService.addRating(id, req.user.id, value);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};
