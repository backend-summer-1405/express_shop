import { Router } from 'express';
import * as authController from './auth.controller';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  loginSchema,
  registerInitiateSchema,
  registerVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from './auth.validation';

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/register/initiate:
 *   post:
 *     summary: Initiate registration (Step 1)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent
 */
router.post(
  '/register/initiate',
  validate(registerInitiateSchema),
  authController.registerInitiate
);

/**
 * @swagger
 * /api/auth/register/verify:
 *   post:
 *     summary: Verify OTP and complete registration (Step 2)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration completed and token returned
 */
router.post(
  '/register/verify',
  validate(registerVerifySchema),
  authController.registerVerify
);

// ==================== FORGOT PASSWORD ====================
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset code (Step 1)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code sent to email
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// ==================== RESET PASSWORD ====================
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using the code (Step 2)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;
