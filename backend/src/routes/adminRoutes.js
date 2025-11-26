const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');

// All routes require authentication and admin role
router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin - User Management]
 *     summary: Get all users (Admin only)
 *     security:
 *       - BearerAuth: []
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, teacher, student]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     tags: [Admin - User Management]
 *     summary: Create new user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, student]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').trim().isLength({ min: 2, max: 255 }),
    body('role').isIn(['admin', 'teacher', 'student'])
  ],
  validate,
  adminController.createUser
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     tags: [Admin - User Management]
 *     summary: Update user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, student]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Cannot modify own account
 *       404:
 *         description: User not found
 */
router.put('/users/:id',
  [
    body('full_name').optional().trim().isLength({ min: 2, max: 255 }),
    body('role').optional().isIn(['admin', 'teacher', 'student']),
    body('is_active').optional().isBoolean()
  ],
  validate,
  adminController.updateUser
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     tags: [Admin - User Management]
 *     summary: Delete user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete own account
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
