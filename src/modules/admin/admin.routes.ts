import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { changeRoleSchema, getUsersQuerySchema } from './admin.validation';

const router = Router();

router.use(authenticate, adminOnly);

// ==================== GET ALL USERS ====================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Returns a paginated list of all users with search, filter, and sort options. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email and name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, TEACHER, ADMIN]
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "dad452db-ca56-446c-95ca-ab29d92fb6ad"
 *                           email:
 *                             type: string
 *                             example: "user@example.com"
 *                           name:
 *                             type: string
 *                             example: "دنیا الوندی"
 *                           role:
 *                             type: string
 *                             example: "USER"
 *                           isVerified:
 *                             type: boolean
 *                             example: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-07-04T19:33:13.603Z"
 *                           stats:
 *                             type: object
 *                             properties:
 *                               enrollments:
 *                                 type: integer
 *                                 example: 2
 *                               comments:
 *                                 type: integer
 *                                 example: 66
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *       400:
 *         description: "Invalid request - Validation rules:\n- page: Optional. Must be a numeric string.\n- limit: Optional. Must be a numeric string.\n- search: Optional. Must be a string. Max length: 100.\n- role: Optional. Must be one of: USER, TEACHER, ADMIN.\n- isVerified: Optional. Must be one of: true, false.\n- sortBy: Optional. Must be one of: createdAt, name, email.\n- order: Optional. Must be one of: asc, desc."
 *       401:
 *         description: "Unauthorized: Invalid or expired token."
 *       403:
 *         description: "Forbidden: Admin access required."
 */
router.get('/users', validate(getUsersQuerySchema), adminController.getAllUsers);

// ==================== CHANGE USER ROLE ====================

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
 *                 enum: [USER, TEACHER, ADMIN]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User role updated successfully"
 *       400:
 *         description: "Invalid request - Role must be either USER, TEACHER, or ADMIN."
 *       401:
 *         description: "Unauthorized: Invalid or expired token."
 *       403:
 *         description: "Forbidden: You cannot change the role of an admin or you don't have admin access."
 *       404:
 *         description: "Not Found: User not found."
 */
router.patch('/users/:id/role', validate(changeRoleSchema), adminController.changeUserRole);


// ==================== DELETE USER ====================

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
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       401:
 *         description: "Unauthorized: Invalid or expired token."
 *       403:
 *         description: "Forbidden: You cannot delete another admin user."
 *       404:
 *         description: "Not Found: User not found."
 */
router.delete('/users/:id', adminController.deleteUser);

// ==================== GET RECENT USERS ====================

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     days:
 *                       type: integer
 *                       example: 7
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: "Unauthorized: Invalid or expired token."
 *       403:
 *         description: "Forbidden: Admin access required."
 */
router.get('/recent-users', adminController.getRecentUsers);

export default router;
