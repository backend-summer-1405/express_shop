import { Router } from 'express';
import * as newsController from './news.controller';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createNewsSchema,
  updateNewsSchema,
  addCommentSchema,
  toggleLikeSchema,
  addRatingSchema,
} from './news.validation';
import { createLimiter, commentLimiter } from '../../middlewares/rateLimiter.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';

const router = Router();

// ==================== PUBLIC ROUTES (OPTIONAL AUTH) ====================

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news (supports isLiked if authenticated)
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of news
 */
router.get('/', optionalAuth, newsController.getAllNews);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get news by ID (supports isLiked if authenticated)
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: News details
 *       404:
 *         description: News not found
 */
router.get('/:id', optionalAuth, newsController.getNewsById);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Create news (Admin only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: News created
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  createLimiter,
  uploadImage.single('image'),
  validate(createNewsSchema),
  newsController.createNews
);

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: Update news (Admin only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: News updated
 */
router.put('/:id', authenticate, adminOnly, validate(updateNewsSchema), newsController.updateNews);

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Delete news (Admin only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: News deleted
 */
router.delete('/:id', authenticate, adminOnly, newsController.deleteNews);

// ==================== COMMENT ROUTES ====================

/**
 * @swagger
 * /api/news/{id}/comments:
 *   post:
 *     summary: Add comment to news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post(
  '/:id/comments',
  authenticate,
  commentLimiter,
  validate(addCommentSchema),
  newsController.addComment
);

/**
 * @swagger
 * /api/news/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.delete('/comments/:commentId', authenticate, newsController.deleteComment);

// ==================== LIKE ROUTES ====================

/**
 * @swagger
 * /api/news/{id}/like:
 *   post:
 *     summary: Toggle like/dislike on news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [LIKE, DISLIKE]
 *     responses:
 *       200:
 *         description: Like toggled
 */
router.post(
  '/:id/like',
  authenticate,
  validate(toggleLikeSchema),
  newsController.toggleLike
);

// ==================== RATING ROUTES ====================

/**
 * @swagger
 * /api/news/{id}/rate:
 *   post:
 *     summary: Add or update rating on news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Rating added
 */
router.post(
  '/:id/rate',
  authenticate,
  validate(addRatingSchema),
  newsController.addRating
);

export default router;
