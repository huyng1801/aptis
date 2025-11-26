const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const examController = require('../controllers/examController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const {
  startExamRules,
  saveAnswerRules,
  autoSaveRules,
  submitExamRules,
  getProgressRules,
  getAvailableExamsRules
} = require('../validators/phase2Validator');

// Student exam browsing routes
/**
 * @swagger
 * /api/student/exams:
 *   get:
 *     summary: Get available exams for student
 *     tags: [Student - Exam Browsing]
 */
router.get('/exams', authenticate, authorize(['student']), getAvailableExamsRules, validate, examController.getAvailableExams);

/**
 * @swagger
 * /api/student/exams/{id}:
 *   get:
 *     summary: Get exam details for student
 *     tags: [Student - Exam Browsing]
 */
router.get('/exams/:id', authenticate, authorize(['student']), examController.getExamDetailsForStudent);

/**
 * @swagger
 * /api/student/exams/{id}/start:
 *   post:
 *     summary: Start a new exam attempt
 *     tags: [Student - Exam Taking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exam ID
 *     responses:
 *       201:
 *         description: Exam attempt started successfully
 *       400:
 *         description: Bad request (max attempts reached, exam not available, etc.)
 *       404:
 *         description: Exam not found
 */
router.post('/exams/:id/start', authenticate, authorize(['student']), startExamRules, validate, attemptController.startExam);

/**
 * @swagger
 * /api/student/attempts/{id}:
 *   get:
 *     summary: Get current attempt details
 *     tags: [Student - Exam Taking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt ID
 *     responses:
 *       200:
 *         description: Attempt details retrieved
 *       404:
 *         description: Attempt not found
 */
router.get('/attempts/:id', authenticate, authorize(['student']), attemptController.getAttempt);

/**
 * @swagger
 * /api/student/attempts/{id}/answers:
 *   post:
 *     summary: Save/Update answer for a question
 *     tags: [Student - Exam Taking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question_id
 *             properties:
 *               question_id:
 *                 type: integer
 *               answer_text:
 *                 type: string
 *               audio_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer saved successfully
 *       400:
 *         description: Time is up or exam already submitted
 *       404:
 *         description: Attempt not found
 */
router.post('/attempts/:id/answers', authenticate, authorize(['student']), saveAnswerRules, validate, attemptController.saveAnswer);

/**
 * @swagger
 * /api/student/attempts/{id}/auto-save:
 *   post:
 *     summary: Auto-save all answers
 *     tags: [Student - Exam Taking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                     answer_text:
 *                       type: string
 *                     audio_url:
 *                       type: string
 *     responses:
 *       200:
 *         description: Progress auto-saved successfully
 */
router.post('/attempts/:id/auto-save', authenticate, authorize(['student']), autoSaveRules, validate, attemptController.autoSave);

/**
 * @swagger
 * /api/student/attempts/{id}/submit:
 *   post:
 *     summary: Submit exam attempt
 *     tags: [Student - Exam Taking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt ID
 *     responses:
 *       200:
 *         description: Exam submitted successfully
 *       404:
 *         description: Attempt not found or already submitted
 */
router.post('/attempts/:id/submit', authenticate, authorize(['student']), submitExamRules, validate, attemptController.submitExam);

/**
 * @swagger
 * /api/student/attempts/{id}/progress:
 *   get:
 *     summary: Get attempt progress
 *     tags: [Student - Exam Taking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt ID
 *     responses:
 *       200:
 *         description: Progress retrieved successfully
 *       404:
 *         description: Attempt not found
 */
router.get('/attempts/:id/progress', authenticate, authorize(['student']), getProgressRules, validate, attemptController.getProgress);

module.exports = router;
