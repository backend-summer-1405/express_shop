import { Router } from 'express';
import * as walletController from './wallet.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  chargeWalletSchema,
  withdrawWalletSchema,
} from './wallet.validation';

const router = Router();

// ==================== PUBLIC ROUTES (NO AUTH) ====================

/**
 * @swagger
 * /api/wallet/charge/verify:
 *   get:
 *     summary: Verify Zarinpal payment (callback)
 *     tags: [Wallet]
 *     parameters:
 *       - in: query
 *         name: Authority
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: Status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified
 *       400:
 *         description: Payment cancelled or invalid
 */
router.get('/charge/verify', walletController.verifyCharge);

// ==================== ALL OTHER ROUTES REQUIRE AUTHENTICATION ====================

router.use(authenticate);

// ==================== GET WALLET ====================

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Get current user's wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet details with last 10 transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/', walletController.getWallet);

// ==================== GET BALANCE ====================

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Get current user's wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *       401:
 *         description: Unauthorized
 */
router.get('/balance', walletController.getBalance);

// ==================== CHARGE WALLET (DIRECT) ====================

/**
 * @swagger
 * /api/wallet/charge:
 *   post:
 *     summary: Charge wallet (direct - for testing)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 example: 50000
 *               description:
 *                 type: string
 *                 example: Direct charge
 *     responses:
 *       200:
 *         description: Wallet charged
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/charge',
  validate(chargeWalletSchema),
  walletController.chargeWallet
);

// ==================== REQUEST CHARGE (ZARINPAL) ====================

/**
 * @swagger
 * /api/wallet/charge/request:
 *   post:
 *     summary: Request wallet charge via Zarinpal
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 example: 50000
 *               description:
 *                 type: string
 *                 example: Charge via Zarinpal
 *     responses:
 *       200:
 *         description: Payment URL returned
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/charge/request',
  validate(chargeWalletSchema),
  walletController.requestCharge
);

// ==================== WITHDRAW WALLET ====================

/**
 * @swagger
 * /api/wallet/withdraw:
 *   post:
 *     summary: Withdraw from wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 example: 20000
 *               description:
 *                 type: string
 *                 example: Withdraw to bank
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient balance or invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/withdraw',
  validate(withdrawWalletSchema),
  walletController.withdrawWallet
);

// ==================== GET TRANSACTIONS ====================

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get wallet transactions (paginated)
 *     tags: [Wallet]
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
 *         description: List of transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', walletController.getTransactions);

export default router;
