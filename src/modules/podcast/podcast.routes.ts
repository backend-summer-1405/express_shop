import { Router } from 'express';
import * as podcastController from './podcast.controller';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadPodcastFiles } from '../../middlewares/upload.middleware'; // ← میدل‌ور جدید
import {
  createPodcastSchema,
  updatePodcastSchema,
  addCommentSchema,
  toggleLikeSchema,
  addRatingSchema,
} from './podcast.validation';

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/podcasts:
 *   get:
 *     summary: Get all podcasts
 *     tags: [Podcasts]
 */
router.get('/', optionalAuth, podcastController.getAllPodcasts);

/**
 * @swagger
 * /api/podcasts/{id}:
 *   get:
 *     summary: Get podcast by ID
 *     tags: [Podcasts]
 */
router.get('/:id', optionalAuth, podcastController.getPodcastById);

// ==================== CREATE / UPDATE / DELETE (Admin only) ====================

// ==================== CREATE PODCAST (Admin only) ====================

/**
 * @swagger
 * /api/podcasts:
 *   post:
 *     summary: Create a new podcast (Admin only)
 *     tags: [Podcasts]
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
 *               - audioFile
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               audioFile:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Podcast created
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  uploadPodcastFiles,
  validate(createPodcastSchema),
  podcastController.createPodcast
);

/**
 * @swagger
 * /api/podcasts/{id}:
 *   put:
 *     summary: Update podcast (Admin only)
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Podcast updated
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  uploadPodcastFiles,
  validate(updatePodcastSchema),
  podcastController.updatePodcast
);

/**
 * @swagger
 * /api/podcasts/{id}:
 *   delete:
 *     summary: Delete podcast (Admin only)
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, adminOnly, podcastController.deletePodcast);

// ==================== COMMENT ROUTES ====================

/**
 * @swagger
 * /api/podcasts/{id}/comments:
 *   post:
 *     summary: Add comment to podcast
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/comments',
  authenticate,
  validate(addCommentSchema),
  podcastController.addComment
);

/**
 * @swagger
 * /api/podcasts/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/comments/:commentId', authenticate, podcastController.deleteComment);

// ==================== LIKE ROUTES ====================

/**
 * @swagger
 * /api/podcasts/{id}/like:
 *   post:
 *     summary: Toggle like/dislike on podcast
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/like',
  authenticate,
  validate(toggleLikeSchema),
  podcastController.toggleLike
);

// ==================== RATING ROUTES ====================

/**
 * @swagger
 * /api/podcasts/{id}/rate:
 *   post:
 *     summary: Add or update rating on podcast
 *     tags: [Podcasts]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/rate',
  authenticate,
  validate(addRatingSchema),
  podcastController.addRating
);

// ==================== PLAY & STATS ROUTES ====================

/**
 * @swagger
 * /api/podcasts/{id}/play:
 *   post:
 *     summary: Record a play (for statistics)
 *     tags: [Podcasts]
 */
router.post('/:id/play', optionalAuth, podcastController.recordPlay);

/**
 * @swagger
 * /api/podcasts/{id}/stats:
 *   get:
 *     summary: Get podcast statistics
 *     tags: [Podcasts]
 */
router.get('/:id/stats', podcastController.getStats);

export default router;
