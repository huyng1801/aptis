const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: AI Scoring
 *   description: AI-powered scoring endpoints
 */

/**
 * @swagger
 * /api/ai/score-answer/{id}:
 *   post:
 *     summary: Score an answer using AI
 *     tags: [AI Scoring]
 *     description: Scores a Writing (essay) or Speaking (audio response) answer using Google Gemini AI based on configured rubrics.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt answer ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Answer scored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     attempt_answer_id:
 *                       type: integer
 *                     score:
 *                       type: number
 *                       description: Total score (0-100)
 *                     feedback:
 *                       type: object
 *                       description: Detailed AI feedback with criterion-based scores, overall feedback, strengths, and improvement areas
 *       404:
 *         description: Answer not found
 *       500:
 *         description: Scoring failed
 */
router.post('/score-answer/:id', 
  authenticate, 
  authorize(['teacher', 'admin']),
  aiController.scoreAnswer
);

/**
 * @swagger
 * /api/ai/score-multiple:
 *   post:
 *     summary: Score multiple answers using AI
 *     tags: [AI Scoring]
 *     description: Batch score multiple Writing or Speaking answers in a single request.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answer_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Answers scored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       description: Array of scoring results
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         successful:
 *                           type: integer
 *                         failed:
 *                           type: integer
 */
router.post('/score-multiple',
  authenticate,
  authorize(['teacher', 'admin']),
  aiController.scoreMultipleAnswers
);

/**
 * @swagger
 * /api/ai/rescore-answer/{id}:
 *   post:
 *     summary: Re-score an answer using AI
 *     tags: [AI Scoring]
 *     description: Re-scores an already-scored answer. Useful for quality control or when rubrics change.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt answer ID
 *         example: 2
 *     responses:
 *       200:
 *         description: Answer re-scored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     attempt_answer_id:
 *                       type: integer
 *                     score:
 *                       type: number
 *                     feedback:
 *                       type: object
 *                       description: Detailed AI feedback including scores, overall_feedback, strengths, and suggestions
 *       404:
 *         description: Answer not found
 *       500:
 *         description: Scoring failed
 */
router.post('/rescore-answer/:id',
  authenticate,
  authorize(['teacher', 'admin']),
  aiController.rescoreAnswer
);

/**
 * @swagger
 * /api/ai/test-connection:
 *   get:
 *     summary: Test AI service connection
 *     tags: [AI Scoring]
 *     description: Verifies that the Google Gemini AI service is working correctly.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: AI service is working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     service:
 *                       type: string
 *       500:
 *         description: AI service connection failed
 */
router.get('/test-connection',
  authenticate,
  authorize(['teacher', 'admin']),
  aiController.testConnection
);

module.exports = router;