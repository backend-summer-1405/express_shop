import { Response, NextFunction } from 'express';
import * as sharedService from './shared.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { EntityType } from '@prisma/client';

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

    const { entityType, entityId } = req.params;
    const { content, parentId } = req.body;

    const comment = await sharedService.addComment(
      entityType as EntityType,
      entityId,
      req.user.id,
      content,
      parentId
    );

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
    const result = await sharedService.deleteComment(commentId, req.user.id, req.user.role);

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

    const { entityType, entityId } = req.params;
    const { type } = req.body;

    if (!type || !['LIKE', 'DISLIKE'].includes(type)) {
      throw new AppError('Type must be LIKE or DISLIKE', 400);
    }

    const result = await sharedService.toggleLike(
      entityType as EntityType,
      entityId,
      req.user.id,
      type
    );

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

    const { entityType, entityId } = req.params;
    const { value } = req.body;

    if (!value || value < 1 || value > 5) {
      throw new AppError('Rating value must be between 1 and 5', 400);
    }

    const result = await sharedService.addRating(
      entityType as EntityType,
      entityId,
      req.user.id,
      value
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};
