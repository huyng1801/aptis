const express = require('express');
const router = express.Router();
const TeacherReviewController = require('../controllers/teacherReviewController');
const { authenticate, authorize } = require('../middlewares/auth');

// All routes require teacher or admin role
const teacherAuth = [authenticate, authorize(['teacher', 'admin'])];

// Get pending reviews dashboard

/**
 * @swagger
 * /api/reviews/pending:
 *   get:
 *     tags:
 *       - Teacher - Review
 *     summary: Get pending reviews dashboard
 *     description: Retrieve list of student submissions pending teacher review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_review, completed]
 *         description: Filter by review status
 *       - in: query
 *         name: level_id
 *         schema:
 *           type: integer
 *         description: Filter by proficiency level
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [submitted_date, priority, student_name]
 *         description: Sort results by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved pending reviews
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
 *                     pending_reviews:
 *                       type: array
 *                     total_count:
 *                       type: integer
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 */
router.get('/pending', teacherAuth, TeacherReviewController.getPendingReviews);

// Get detailed review data for specific attempt

/**
 * @swagger
 * /api/reviews/attempts/{attemptId}:
 *   get:
 *     tags:
 *       - Teacher - Review
 *     summary: Get detailed review data for an attempt
 *     description: Retrieve comprehensive review information for a specific exam attempt including all submitted answers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exam attempt ID
 *     responses:
 *       200:
 *         description: Successfully retrieved review details
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
 *                     attempt:
 *                       type: object
 *                     student:
 *                       type: object
 *                     answers:
 *                       type: array
 *                     exam:
 *                       type: object
 *       404:
 *         description: Attempt not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 */
router.get('/attempts/:attemptId', teacherAuth, TeacherReviewController.getReviewDetails);

// Submit manual review for single answer

/**
 * @swagger
 * /api/reviews/answers/{answerId}/review:
 *   post:
 *     tags:
 *       - Teacher - Review
 *     summary: Submit manual review for an answer
 *     description: Provide manual score and feedback for a specific student answer
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student answer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *               - feedback
 *             properties:
 *               score:
 *                 type: number
 *                 description: Points awarded for this answer
 *               feedback:
 *                 type: string
 *                 description: Detailed feedback for student
 *               is_correct:
 *                 type: boolean
 *                 description: Whether answer is correct
 *     responses:
 *       200:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Answer not found
 *       400:
 *         description: Invalid review data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 */
router.post('/answers/:answerId/review', teacherAuth, TeacherReviewController.submitManualReview);

// Batch review multiple answers

/**
 * @swagger
 * /api/reviews/batch-review:
 *   post:
 *     tags:
 *       - Teacher - Review
 *     summary: Batch review multiple answers
 *     description: Submit reviews for multiple answers at once
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviews
 *             properties:
 *               reviews:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - answer_id
 *                     - score
 *                     - feedback
 *                   properties:
 *                     answer_id:
 *                       type: integer
 *                     score:
 *                       type: number
 *                     feedback:
 *                       type: string
 *                     is_correct:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Batch reviews submitted successfully
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
 *                     processed:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *       400:
 *         description: Invalid batch review data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 */
router.post('/batch-review', teacherAuth, TeacherReviewController.batchReview);

// Flag answer for manual review

/**
 * @swagger
 * /api/reviews/answers/{answerId}/flag:
 *   post:
 *     tags:
 *       - Teacher - Review
 *     summary: Flag answer for manual review
 *     description: Mark an answer that needs special attention or manual review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student answer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [unclear, suspicious, ambiguous, needs_discussion]
 *                 description: Reason for flagging
 *               notes:
 *                 type: string
 *                 description: Additional notes about the flag
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Priority level for review
 *     responses:
 *       200:
 *         description: Answer flagged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         description: Answer not found
 *       400:
 *         description: Invalid flag data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 */
router.post('/answers/:answerId/flag', teacherAuth, TeacherReviewController.flagForReview);

// Get review statistics

/**
 * @swagger
 * /api/reviews/stats:
 *   get:
 *     tags:
 *       - Teacher - Review
 *     summary: Get review statistics
 *     description: Retrieve comprehensive statistics about student reviews and completion rates
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Successfully retrieved review statistics
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
 *                     total_reviews:
 *                       type: integer
 *                     completed_reviews:
 *                       type: integer
 *                     pending_reviews:
 *                       type: integer
 *                     average_review_time:
 *                       type: number
 *                     completion_rate:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 */
router.get('/stats', teacherAuth, TeacherReviewController.getReviewStats);

module.exports = router;