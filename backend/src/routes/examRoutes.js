const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const {
  createExamRules,
  updateExamRules,
  addQuestionsRules,
  removeQuestionRules,
  getAvailableExamsRules
} = require('../validators/examValidator');

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: Get all exams (Teacher/Admin)
 *     tags: [Exams]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: is_published
 *         schema:
 *           type: boolean
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
 *         description: Exams retrieved successfully
 */
router.get('/', authenticate, authorize(['teacher', 'admin']), examController.getAllExams);

/**
 * @swagger
 * /api/exams/{id}:
 *   get:
 *     summary: Get exam by ID with questions
 *     tags: [Exams]
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
 *         description: Exam retrieved successfully
 *       404:
 *         description: Exam not found
 */
router.get('/:id', authenticate, authorize(['teacher', 'admin']), examController.getExamById);

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Create new exam
 *     tags: [Exams]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - level_id
 *               - duration_minutes
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               level_id:
 *                 type: integer
 *               duration_minutes:
 *                 type: integer
 *               passing_score:
 *                 type: number
 *               max_attempts:
 *                 type: integer
 *                 default: 1
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               shuffle_questions:
 *                 type: boolean
 *                 default: false
 *               show_results_immediately:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Exam created successfully
 */
router.post('/', authenticate, authorize(['teacher', 'admin']), createExamRules, validate, examController.createExam);

/**
 * @swagger
 * /api/exams/{id}:
 *   put:
 *     summary: Update exam
 *     tags: [Exams]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               level_id:
 *                 type: integer
 *               duration_minutes:
 *                 type: integer
 *               passing_score:
 *                 type: number
 *               max_attempts:
 *                 type: integer
 *               shuffle_questions:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Exam updated successfully
 */
router.put('/:id', authenticate, authorize(['teacher', 'admin']), updateExamRules, validate, examController.updateExam);

/**
 * @swagger
 * /api/exams/{id}:
 *   delete:
 *     summary: Delete exam
 *     tags: [Exams]
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
 *         description: Exam deleted successfully
 */
router.delete('/:id', authenticate, authorize(['teacher', 'admin']), examController.deleteExam);

/**
 * @swagger
 * /api/exams/{id}/questions:
 *   post:
 *     summary: Add questions to exam
 *     tags: [Exams]
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
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                     order_number:
 *                       type: integer
 *                     points_override:
 *                       type: number
 *     responses:
 *       200:
 *         description: Questions added successfully
 */
router.post('/:id/questions', authenticate, authorize(['teacher', 'admin']), addQuestionsRules, validate, examController.addQuestionsToExam);

/**
 * @swagger
 * /api/exams/{id}/questions/{questionId}:
 *   delete:
 *     summary: Remove question from exam
 *     tags: [Exams]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Question removed successfully
 */
router.delete('/:id/questions/:questionId', authenticate, authorize(['teacher', 'admin']), removeQuestionRules, validate, examController.removeQuestionFromExam);

/**
 * @swagger
 * /api/exams/{id}/publish:
 *   put:
 *     summary: Publish/Unpublish exam
 *     tags: [Exams]
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
 *         description: Exam publish status toggled
 */
router.put('/:id/publish', authenticate, authorize(['teacher', 'admin']), examController.togglePublishExam);

/**
 * @swagger
 * /api/student/exams:
 *   get:
 *     summary: Get available exams for students
 *     tags: [Student - Exams]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level_id
 *         schema:
 *           type: integer
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
 *         description: Available exams retrieved
 */
router.get('/student/exams', authenticate, authorize(['student']), getAvailableExamsRules, validate, examController.getAvailableExams);

/**
 * @swagger
 * /api/student/exams/{id}:
 *   get:
 *     summary: Get exam details for student
 *     tags: [Student - Exams]
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
 *         description: Exam details retrieved
 */
router.get('/student/exams/:id', authenticate, authorize(['student']), examController.getExamDetailsForStudent);

// Note: Student exam browsing routes duplicated above - TODO: consolidate to /student prefix
module.exports = router;
