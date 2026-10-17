import { Router } from 'express';
import * as courseController from './course.controller';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  addCommentSchema,
  toggleLikeSchema,
  addRatingSchema,
  approvePurchaseSchema,
} from './course.validation';

const router = Router();

// ==================== PUBLIC ROUTES (OPTIONAL AUTH) ====================

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all published courses (supports isLiked if authenticated)
 *     tags: [Courses]
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
 *         description: List of courses
 */
router.get('/', optionalAuth, courseController.getAllCourses);

/**
 * @swagger
 * /api/courses/my-favorites:
 *   get:
 *     summary: Get current user's favorite courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite courses
 */
router.get('/my-favorites', authenticate, courseController.getMyFavorites);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID (supports isLiked if authenticated)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', optionalAuth, courseController.getCourseById);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course (Admin only)
 *     tags: [Courses]
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
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created
 *       403:
 *         description: Admin only
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  uploadImage.single('image'),
  courseController.createCourse
);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course (Admin only)
 *     tags: [Courses]
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
 *               description:
 *                 type: string
 *               price:
 *                 type: integer
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated
 */
router.put('/:id', authenticate, adminOnly, courseController.updateCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete course (Admin only)
 *     tags: [Courses]
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
 *         description: Course deleted
 */
router.delete('/:id', authenticate, adminOnly, courseController.deleteCourse);

// ==================== PURCHASE ROUTES ====================

/**
 * @swagger
 * /api/courses/{id}/buy:
 *   post:
 *     summary: Purchase a course from wallet
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Course purchased (pending admin approval)
 *       400:
 *         description: Insufficient balance or already purchased
 *       404:
 *         description: Course not found
 */
router.post('/:id/buy', authenticate, courseController.purchaseCourse);

/**
 * @swagger
 * /api/courses/my-purchases:
 *   get:
 *     summary: Get current user's purchases
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchases
 */
router.get('/my-purchases', authenticate, courseController.getMyPurchases);

/**
 * @swagger
 * /api/courses/pending-purchases:
 *   get:
 *     summary: Get all pending purchases (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending purchases
 *       403:
 *         description: Admin only
 */
router.get('/pending-purchases', authenticate, adminOnly, courseController.getPendingPurchases);

/**
 * @swagger
 * /api/courses/purchases/{purchaseId}/approve:
 *   post:
 *     summary: Approve or reject a purchase (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Purchase processed
 */
router.post(
  '/purchases/:purchaseId/approve',
  authenticate,
  adminOnly,
  validate(approvePurchaseSchema),
  courseController.approvePurchase
);

// ==================== COMMENT ROUTES ====================

/**
 * @swagger
 * /api/courses/{id}/comments:
 *   post:
 *     summary: Add comment to course
 *     tags: [Courses]
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
  courseController.addComment
);

/**
 * @swagger
 * /api/courses/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Courses]
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
router.delete('/comments/:commentId', authenticate, courseController.deleteComment);

// ==================== LIKE ROUTES ====================

/**
 * @swagger
 * /api/courses/{id}/like:
 *   post:
 *     summary: Toggle like/dislike on course
 *     tags: [Courses]
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
  courseController.toggleLike
);

// ==================== FAVORITE ROUTES ====================

/**
 * @swagger
 * /api/courses/{id}/favorite:
 *   post:
 *     summary: Toggle favorite on course
 *     tags: [Courses]
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
 *         description: Favorite toggled
 *       404:
 *         description: Course not found
 */
router.post('/:id/favorite', authenticate, courseController.toggleFavorite);

// ==================== RATING ROUTES ====================

/**
 * @swagger
 * /api/courses/{id}/rate:
 *   post:
 *     summary: Add or update rating on course
 *     tags: [Courses]
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
  courseController.addRating
);

export default router;
