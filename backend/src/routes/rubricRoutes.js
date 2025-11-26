const express = require('express');
const router = express.Router();
const rubricController = require('../controllers/rubricController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Rubrics
 *   description: AI scoring rubrics management
 */

/**
 * @swagger
 * /api/rubrics/skill/{skillId}:
 *   get:
 *     summary: Get rubrics by skill ID
 *     tags: [Rubrics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rubrics retrieved successfully
 */
router.get('/skill/:skillId',
  authenticate,
  authorize(['teacher', 'admin']),
  rubricController.getRubricsBySkill
);

/**
 * @swagger
 * /api/rubrics:
 *   post:
 *     summary: Create new rubric
 *     tags: [Rubrics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skill_id:
 *                 type: integer
 *               criteria_name:
 *                 type: string
 *               max_score:
 *                 type: number
 *               weight_percentage:
 *                 type: number
 *               description:
 *                 type: string
 *               ai_prompt_template:
 *                 type: string
 */
router.post('/',
  authenticate,
  authorize(['teacher', 'admin']),
  rubricController.createRubric
);

/**
 * @swagger
 * /api/rubrics/{id}:
 *   put:
 *     summary: Update rubric
 *     tags: [Rubrics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.put('/:id',
  authenticate,
  authorize(['teacher', 'admin']),
  rubricController.updateRubric
);

/**
 * @swagger
 * /api/rubrics/{id}:
 *   delete:
 *     summary: Delete rubric
 *     tags: [Rubrics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  rubricController.deleteRubric
);

module.exports = router;