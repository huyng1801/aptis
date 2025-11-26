const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const {
  startPracticeRules,
  getPracticeQuestionsRules,
  submitPracticeAnswerRules,
  getPracticeHistoryRules
} = require('../validators/phase2Validator');

/**
 * @swagger
 * /api/student/practice/start:
 *   post:
 *     summary: Start a practice session
 *     tags: [Student - Practice]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skill_id
 *               - level_id
 *             properties:
 *               skill_id:
 *                 type: integer
 *               level_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Practice session started
 */
router.post('/practice/start', authenticate, authorize(['student']), startPracticeRules, validate, practiceController.startPracticeSession);

/**
 * @swagger
 * /api/student/practice/questions:
 *   get:
 *     summary: Get random practice questions
 *     tags: [Student - Practice]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skill_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: level_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [multiple_choice, true_false, fill_blanks, short_answer]
 *     responses:
 *       200:
 *         description: Practice questions retrieved
 *       404:
 *         description: No questions found
 */
router.get('/practice/questions', authenticate, authorize(['student']), getPracticeQuestionsRules, validate, practiceController.getPracticeQuestions);

/**
 * @swagger
 * /api/student/practice/answer:
 *   post:
 *     summary: Submit practice answer and get feedback
 *     tags: [Student - Practice]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question_id
 *               - answer_text
 *               - session_id
 *             properties:
 *               question_id:
 *                 type: integer
 *               answer_text:
 *                 type: string
 *               session_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Answer submitted and feedback provided
 */
router.post('/practice/answer', authenticate, authorize(['student']), submitPracticeAnswerRules, validate, practiceController.submitPracticeAnswer);

/**
 * @swagger
 * /api/student/practice/history:
 *   get:
 *     summary: Get practice history
 *     tags: [Student - Practice]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skill_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: level_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Practice history retrieved
 */
router.get('/practice/history', authenticate, authorize(['student']), getPracticeHistoryRules, validate, practiceController.getPracticeHistory);

/**
 * @swagger
 * /api/student/practice/stats:
 *   get:
 *     summary: Get practice statistics by skill
 *     tags: [Student - Practice]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Practice statistics retrieved
 */
router.get('/practice/stats', authenticate, authorize(['student']), practiceController.getPracticeStats);

/**
 * @swagger
 * /api/student/practice/recommendations:
 *   get:
 *     summary: Get recommended practice areas
 *     tags: [Student - Practice]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Practice recommendations retrieved
 */
router.get('/practice/recommendations', authenticate, authorize(['student']), practiceController.getPracticeRecommendations);

module.exports = router;
