const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { 
  createQuestionRules, 
  updateQuestionRules, 
  filterQuestionsRules, 
  importQuestionsRules 
} = require('../validators/questionValidator');

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions with filters
 *     tags: [Questions]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [multiple_choice, true_false, fill_blanks, note_completion, short_answer, essay, audio_response, image_description]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 */
router.get('/', authenticate, authorize(['teacher', 'admin']), questionController.getAllQuestions);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create new question
 *     tags: [Questions]
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
 *               - type
 *               - question_text
 *             properties:
 *               skill_id:
 *                 type: integer
 *               level_id:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, true_false, fill_blanks, note_completion, short_answer, essay, audio_response, image_description]
 *               question_text:
 *                 type: string
 *               media_url:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correct_answer:
 *                 type: string
 *               points:
 *                 type: number
 *                 default: 1.0
 *               explanation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Question created successfully
 */
router.post('/', authenticate, authorize(['teacher', 'admin']), createQuestionRules, validate, questionController.createQuestion);

/**
 * @swagger
 * /api/questions/filter:
 *   get:
 *     summary: Filter questions for exam creation
 *     tags: [Questions]
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Filtered questions retrieved
 */
router.get('/filter', authenticate, authorize(['teacher', 'admin']), filterQuestionsRules, validate, questionController.filterQuestions);

/**
 * @swagger
 * /api/questions/export:
 *   get:
 *     summary: Export questions to JSON
 *     tags: [Questions]
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
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Questions exported successfully
 */
router.get('/export', authenticate, authorize(['teacher', 'admin']), questionController.exportQuestions);

/**
 * @swagger
 * /api/questions/import:
 *   post:
 *     summary: Import questions from CSV/JSON
 *     tags: [Questions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Questions imported successfully
 */
router.post('/import', authenticate, authorize(['teacher', 'admin']), importQuestionsRules, validate, questionController.importQuestions);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
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
 *         description: Question retrieved successfully
 *       404:
 *         description: Question not found
 */
router.get('/:id', authenticate, authorize(['teacher', 'admin']), questionController.getQuestionById);

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update question
 *     tags: [Questions]
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
 *               skill_id:
 *                 type: integer
 *               level_id:
 *                 type: integer
 *               type:
 *                 type: string
 *               question_text:
 *                 type: string
 *               media_url:
 *                 type: string
 *               options:
 *                 type: array
 *               correct_answer:
 *                 type: string
 *               points:
 *                 type: number
 *               explanation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Question updated successfully
 */
router.put('/:id', authenticate, authorize(['teacher', 'admin']), updateQuestionRules, validate, questionController.updateQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete question (soft delete)
 *     tags: [Questions]
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
 *         description: Question deleted successfully
 */
router.delete('/:id', authenticate, authorize(['teacher', 'admin']), questionController.deleteQuestion);

module.exports = router;
