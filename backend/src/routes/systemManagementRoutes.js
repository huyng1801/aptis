const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const SystemManagementController = require('../controllers/systemManagementController');
const { authenticate, authorize } = require('../middlewares/auth');

// All routes require admin role
const adminAuth = [authenticate, authorize(['admin'])];

// Configure multer for bulk import
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/bulk-import'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'), false);
        }
    }
});

// ===== LEVEL MANAGEMENT ROUTES =====

/**
 * @swagger
 * /api/admin/levels:
 *   get:
 *     tags:
 *       - Admin - System Management
 *     summary: Get all CEFR levels
 *     description: Retrieve all available CEFR proficiency levels
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved levels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     levels:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Level'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/levels', adminAuth, SystemManagementController.getAllLevels);

/**
 * @swagger
 * /api/admin/levels:
 *   post:
 *     tags:
 *       - Admin - System Management
 *     summary: Create a new CEFR level
 *     description: Create a new proficiency level in the system
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 enum: [A1, A2, B1, B2, C1, C2]
 *                 description: CEFR level name
 *               description:
 *                 type: string
 *                 description: Level description
 *     responses:
 *       201:
 *         description: Level created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Level'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/levels', adminAuth, SystemManagementController.createLevel);

/**
 * @swagger
 * /api/admin/levels/{id}:
 *   put:
 *     tags:
 *       - Admin - System Management
 *     summary: Update a CEFR level
 *     description: Update an existing proficiency level
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Level ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 enum: [A1, A2, B1, B2, C1, C2]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Level updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Level'
 *       404:
 *         description: Level not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/levels/:id', adminAuth, SystemManagementController.updateLevel);

/**
 * @swagger
 * /api/admin/levels/{id}:
 *   delete:
 *     tags:
 *       - Admin - System Management
 *     summary: Delete a CEFR level
 *     description: Delete a proficiency level from the system
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Level ID
 *     responses:
 *       200:
 *         description: Level deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Level not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/levels/:id', adminAuth, SystemManagementController.deleteLevel);

// ===== SYSTEM CONFIGURATION ROUTES =====

/**
 * @swagger
 * /api/admin/config:
 *   get:
 *     tags:
 *       - Admin - System Management
 *     summary: Get system configuration
 *     description: Retrieve current system configuration settings
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved system configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     config:
 *                       type: object
 *                       description: System configuration settings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/config', adminAuth, SystemManagementController.getSystemConfig);

/**
 * @swagger
 * /api/admin/config:
 *   put:
 *     tags:
 *       - Admin - System Management
 *     summary: Update system configuration
 *     description: Update system configuration settings
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               max_exam_attempts:
 *                 type: integer
 *                 description: Maximum exam attempts allowed per student
 *               exam_timeout_minutes:
 *                 type: integer
 *                 description: Default exam timeout in minutes
 *               passing_score_default:
 *                 type: integer
 *                 description: Default passing score percentage
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid configuration
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/config', adminAuth, SystemManagementController.updateSystemConfig);

// ===== BULK OPERATIONS =====

/**
 * @swagger
 * /api/admin/bulk-import:
 *   post:
 *     tags:
 *       - Admin - System Management
 *     summary: Bulk import data
 *     description: Import data in bulk (questions, exams, users, etc.)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel file containing data to import
 *               import_type:
 *                 type: string
 *                 enum: [questions, exams, users, results]
 *                 description: Type of data being imported
 *     responses:
 *       200:
 *         description: Bulk import completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported_count:
 *                       type: integer
 *                     failed_count:
 *                       type: integer
 *                     errors:
 *                       type: array
 *       400:
 *         description: Invalid file or import type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/bulk-import', adminAuth, upload.single('file'), SystemManagementController.bulkImport);

// ===== SYSTEM HEALTH =====

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     tags:
 *       - Admin - System Management
 *     summary: Get system health status
 *     description: Check system health including database, cache, and other services
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: System health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     database:
 *                       type: string
 *                       enum: [connected, disconnected]
 *                     cache:
 *                       type: string
 *                       enum: [connected, disconnected]
 *                     memory_usage:
 *                       type: string
 *                       description: Memory usage percentage
 *                     uptime_hours:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/health', adminAuth, SystemManagementController.getSystemHealth);

module.exports = router;