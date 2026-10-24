import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { changeRoleSchema } from './admin.validation';

const router = Router();

router.use(authenticate, adminOnly);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         description: List of users
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Change user role (Admin only)
 *     tags: [Admin]
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
 *               role:
 *                 type: string
 *                 enum: [USER, TEACHER]
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/users/:id/role', validate(changeRoleSchema), adminController.changeUserRole);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
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
 *         description: User deleted
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /api/admin/recent-users:
 *   get:
 *     summary: Get users who joined in the last N days (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of past days to look back (e.g. 7)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of users to return
 *     responses:
 *       200:
 *         description: List of recently joined users
 */
router.get('/recent-users', adminController.getRecentUsers);

export default router;
