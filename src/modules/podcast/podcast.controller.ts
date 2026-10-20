import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as podcastService from './podcast.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { processImage } from '../../utils/imageProcessor';

// ==================== CREATE PODCAST ====================

export const createPodcast = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { title, description } = req.body;

    if (!title || title.length < 3) {
      throw new AppError('Title must be at least 3 characters', 400);
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const audioFile = files?.['audioFile']?.[0];
    const coverImageFile = files?.['coverImage']?.[0];

    if (!audioFile) {
      throw new AppError('Audio file is required', 400);
    }

    const audioFileUrl = `/uploads/audio/${audioFile.filename}`;

    let coverImageUrl: string | undefined;
    if (coverImageFile) {
      const processedPath = await processImage(coverImageFile.path, {
        width: 800,
        height: 800,
        quality: 80,
        format: 'webp',
      });
      coverImageUrl = `/uploads/images/${path.basename(processedPath)}`;
    }

    const podcast = await podcastService.createPodcast({
      title,
      description,
      audioFile: audioFileUrl,
      coverImage: coverImageUrl,
      authorId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Podcast created successfully',
      data: podcast,
    });
  } catch (error) {
    next(error);
  }
};
// ==================== GET ALL PODCASTS ====================

export const getAllPodcasts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user?.id;

    const result = await podcastService.getAllPodcasts(page, limit, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET PODCAST BY ID ====================

export const getPodcastById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    const podcast = await podcastService.getPodcastById(id, userId);

    res.status(200).json({
      success: true,
      data: podcast,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE PODCAST ====================

export const updatePodcast = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = req.params.id as string;
    const { title, description } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const coverImageFile = files?.['coverImage']?.[0];

    let coverImageUrl: string | undefined;
    if (coverImageFile) {
      const processedPath = await processImage(coverImageFile.path, {
        width: 800,
        height: 800,
        quality: 80,
        format: 'webp',
      });
      coverImageUrl = `/uploads/images/${path.basename(processedPath)}`;
    }

    const podcast = await podcastService.updatePodcast(id, {
      title,
      description,
      coverImage: coverImageUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Podcast updated successfully',
      data: podcast,
    });
  } catch (error) {
    next(error);
  }
};
// ==================== DELETE PODCAST ====================

export const deletePodcast = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await podcastService.deletePodcast(id);

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

    const comment = await podcastService.addComment(id, req.user.id, content, parentId);

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
    const result = await podcastService.deleteComment(commentId, req.user.id, req.user.role);

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

    const result = await podcastService.toggleLike(id, req.user.id, type);

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

    const result = await podcastService.addRating(id, req.user.id, value);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RECORD PLAY ====================

export const recordPlay = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const ipAddress = req.ip;

    const result = await podcastService.recordPlay(id, userId, ipAddress);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET STATS ====================

export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const stats = await podcastService.getPodcastStats(id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
