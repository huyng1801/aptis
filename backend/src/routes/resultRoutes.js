const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const {
  getAllResultsRules,
  getDetailedResultRules,
  getStatisticsRules,
  comparePerformanceRules
} = require('../validators/phase2Validator');

/**
 * @swagger
 * /api/student/results:
 *   get:
 *     summary: Get all exam results for student
 *     tags: [Student - Results]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_progress, submitted, graded, abandoned]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 */
router.get('/results', authenticate, authorize(['student']), getAllResultsRules, validate, resultController.getAllResults);

/**
 * @swagger
 * /api/student/results/{attemptId}:
 *   get:
 *     summary: Get detailed result for a specific attempt
 *     tags: [Student - Results]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detailed result retrieved
 *       404:
 *         description: Result not found
 */
router.get('/results/:attemptId', authenticate, authorize(['student']), getDetailedResultRules, validate, resultController.getDetailedResult);

/**
 * @swagger
 * /api/student/progress:
 *   get:
 *     summary: Get student progress dashboard
 *     tags: [Student - Progress]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Progress dashboard retrieved
 */
router.get('/progress', authenticate, authorize(['student']), resultController.getProgressDashboard);

/**
 * @swagger
 * /api/student/statistics:
 *   get:
 *     summary: Get statistics with filters
 *     tags: [Student - Statistics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skill_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *           description: Period in days
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', authenticate, authorize(['student']), getStatisticsRules, validate, resultController.getStatistics);

/**
 * @swagger
 * /api/student/compare:
 *   get:
 *     summary: Compare performance with other students
 *     tags: [Student - Statistics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: level_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Performance comparison retrieved
 */
router.get('/compare', authenticate, authorize(['student']), comparePerformanceRules, validate, resultController.comparePerformance);

module.exports = router;
