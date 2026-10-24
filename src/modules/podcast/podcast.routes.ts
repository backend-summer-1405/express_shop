import { Router } from 'express';
import * as podcastController from './podcast.controller';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadPodcastFiles } from '../../middlewares/upload.middleware';
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of podcasts
 */
router.get('/', optionalAuth, podcastController.getAllPodcasts);

// ==================== STATIC ROUTES ====================

/**
 * @swagger
 * /api/podcasts/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Podcasts]
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
router.delete('/comments/:commentId', authenticate, podcastController.deleteComment);

// ==================== DYNAMIC ROUTES (/:id) ====================

/**
 * @swagger
 * /api/podcasts/{id}:
 *   get:
 *     summary: Get podcast by ID
 *     tags: [Podcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast details
 *       404:
 *         description: Podcast not found
 */
router.get('/:id', optionalAuth, podcastController.getPodcastById);

// ==================== CREATE / UPDATE / DELETE (Admin only) ====================

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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast deleted
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
  validate(addCommentSchema),
  podcastController.addComment
);

// ==================== LIKE ROUTES ====================

/**
 * @swagger
 * /api/podcasts/{id}/like:
 *   post:
 *     summary: Toggle like/dislike on podcast
 *     tags: [Podcasts]
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
  podcastController.addRating
);

// ==================== PLAY & STATS ROUTES ====================

/**
 * @swagger
 * /api/podcasts/{id}/play:
 *   post:
 *     summary: Record a play (for statistics)
 *     tags: [Podcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Play recorded
 */
router.post('/:id/play', optionalAuth, podcastController.recordPlay);

/**
 * @swagger
 * /api/podcasts/{id}/stats:
 *   get:
 *     summary: Get podcast statistics
 *     tags: [Podcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast statistics
 */
router.get('/:id/stats', podcastController.getStats);

export default router;
