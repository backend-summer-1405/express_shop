import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { uploadMultipleImages } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updateProfileSchema, changeRoleSchema } from './user.validation';

const router = Router();

// ==================== PROTECTED ROUTES ====================

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, userController.getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.put('/me', authenticate, validate(updateProfileSchema), userController.updateMe);

/**
 * @swagger
 * /api/users/me/images:
 *   post:
 *     summary: Upload profile images (multiple)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded
 *       400:
 *         description: No files uploaded
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/me/images',
  authenticate,
  uploadMultipleImages,
  userController.uploadProfileImages
);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (Admin only)
 */
router.get('/', authenticate, adminOnly, userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Change user role (Admin only)
 *     tags: [Users]
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, TEACHER]
 *     responses:
 *       200:
 *         description: User role updated
 *       403:
 *         description: Admin only
 */
router.patch(
  '/:id/role',
  authenticate,
  adminOnly,
  validate(changeRoleSchema),
  userController.changeUserRole
);

export default router;
