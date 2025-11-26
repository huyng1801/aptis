const express = require('express');
const router = express.Router();
const ReportingController = require('../controllers/reportingController');
const { authenticate, authorize } = require('../middlewares/auth');

// All routes require admin role
const adminAuth = [authenticate, authorize(['admin'])];

// System overview dashboard

/**
 * @swagger
 * /api/reports/overview:
 *   get:
 *     tags:
 *       - Admin - Reporting
 *     summary: Get system overview dashboard
 *     description: Retrieve comprehensive system overview including key metrics and statistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_range
 *         schema:
 *           type: string
 *           enum: [today, week, month, year, all]
 *         description: Date range for statistics
 *     responses:
 *       200:
 *         description: Successfully retrieved system overview
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
 *                     total_users:
 *                       type: integer
 *                     active_students:
 *                       type: integer
 *                     total_exams_taken:
 *                       type: integer
 *                     average_score:
 *                       type: number
 *                     system_health:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/overview', adminAuth, ReportingController.getSystemOverview);

// User analytics report

/**
 * @swagger
 * /api/reports/users:
 *   get:
 *     tags:
 *       - Admin - Reporting
 *     summary: Get user analytics report
 *     description: Retrieve detailed analytics about user activities, registrations, and engagement
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, teacher, admin]
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: Successfully retrieved user analytics
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
 *                     total_registrations:
 *                       type: integer
 *                     active_users:
 *                       type: integer
 *                     users_by_role:
 *                       type: object
 *                     engagement_rate:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users', adminAuth, ReportingController.getUserAnalytics);

// Exam performance report

/**
 * @swagger
 * /api/reports/exams:
 *   get:
 *     tags:
 *       - Admin - Reporting
 *     summary: Get exam performance report
 *     description: Retrieve statistics about exam performance, difficulty, and student outcomes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam_id
 *         schema:
 *           type: integer
 *         description: Filter by specific exam
 *       - in: query
 *         name: level_id
 *         schema:
 *           type: integer
 *         description: Filter by proficiency level
 *       - in: query
 *         name: date_range
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *         description: Date range for report
 *     responses:
 *       200:
 *         description: Successfully retrieved exam performance report
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
 *                     total_exams:
 *                       type: integer
 *                     total_attempts:
 *                       type: integer
 *                     average_score:
 *                       type: number
 *                     pass_rate:
 *                       type: number
 *                     exams:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/exams', adminAuth, ReportingController.getExamPerformance);

// Content usage report

/**
 * @swagger
 * /api/reports/content:
 *   get:
 *     tags:
 *       - Admin - Reporting
 *     summary: Get content usage report
 *     description: Retrieve statistics about content usage, question difficulty, and engagement
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: content_type
 *         schema:
 *           type: string
 *           enum: [questions, exams, practice, all]
 *         description: Filter by content type
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [usage, difficulty, effectiveness]
 *         description: Sort results by
 *     responses:
 *       200:
 *         description: Successfully retrieved content usage report
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
 *                     total_questions:
 *                       type: integer
 *                     total_exams:
 *                       type: integer
 *                     most_used_content:
 *                       type: array
 *                     difficulty_distribution:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/content', adminAuth, ReportingController.getContentUsage);

// Export reports in various formats

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     tags:
 *       - Admin - Reporting
 *     summary: Export reports
 *     description: Export generated reports in various formats (PDF, Excel, CSV)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: report_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [overview, users, exams, content]
 *         description: Type of report to export
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, excel, csv]
 *         description: Export file format
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for report
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Report exported successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid report type or format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/export', adminAuth, ReportingController.exportReport);

module.exports = router;