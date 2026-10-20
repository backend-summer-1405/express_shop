import { Router } from 'express';
import * as sharedController from './shared.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  addCommentSchema,
  toggleLikeSchema,
  addRatingSchema,
} from './shared.validation';

const router = Router();

// ==================== ROUTES ====================

router.post(
  '/:entityType/:entityId/comments',
  authenticate,
  validate(addCommentSchema),
  sharedController.addComment
);

router.delete('/comments/:commentId', authenticate, sharedController.deleteComment);

router.post(
  '/:entityType/:entityId/like',
  authenticate,
  validate(toggleLikeSchema),
  sharedController.toggleLike
);

router.post(
  '/:entityType/:entityId/rate',
  authenticate,
  validate(addRatingSchema),
  sharedController.addRating
);

export default router;
