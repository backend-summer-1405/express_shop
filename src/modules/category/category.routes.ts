import { Router } from 'express';
import * as categoryController from './category.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCategorySchema, updateCategorySchema } from './category.validation';

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all public categories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: List of active categories
 */
router.get('/', categoryController.getPublicCategories);

// ==================== ADMIN ROUTES ====================

router.use(authenticate, adminOnly);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create new category (Admin)
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nameFa
 *               - nameEn
 *             properties:
 *               nameFa:
 *                 type: string
 *               nameEn:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/', validate(createCategorySchema), categoryController.createCategory);

/**
 * @swagger
 * /api/categories/admin:
 *   get:
 *     summary: Get all categories with pagination (Admin)
 *     tags: [Category]
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
 *         description: List of all categories
 */
router.get('/admin', categoryController.getAllCategoriesAdmin);

/**
 * @swagger
 * /api/categories/admin/{id}:
 *   get:
 *     summary: Get single category details for (Admin)
 *     tags: [Category]
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
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/admin/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category (Admin)
 *     tags: [Category]
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
 *               nameFa:
 *                 type: string
 *               nameEn:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put('/:id', validate(updateCategorySchema), categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category (Admin)
 *     tags: [Category]
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
 *         description: Category deleted
 */
router.delete('/:id', categoryController.deleteCategory);

/**
 * @swagger
 * /api/categories/{id}/visibility:
 *   patch:
 *     summary: Toggle category visibility (Admin)
 *     tags: [Category]
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
 *         description: Visibility toggled
 */
router.patch('/:id/visibility', categoryController.toggleVisibility);

export default router;
