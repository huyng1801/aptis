const { Question, Skill, Level, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all questions with filters
 * @route GET /api/questions
 * @access Teacher, Admin
 */
exports.getAllQuestions = async (req, res) => {
  try {
    const { 
      skill_id, 
      level_id, 
      type, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const where = { is_active: true };
    
    if (skill_id) where.skill_id = skill_id;
    if (level_id) where.level_id = level_id;
    if (type) where.type = type;
    if (search) {
      where.question_text = { [Op.like]: `%${search}%` };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Question.findAndCountAll({
      where,
      include: [
        { model: Skill, as: 'skill', attributes: ['id', 'name'] },
        { model: Level, as: 'level', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        questions: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch questions',
      error: error.message 
    });
  }
};

/**
 * Get question by ID
 * @route GET /api/questions/:id
 * @access Teacher, Admin
 */
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [
        { model: Skill, as: 'skill' },
        { model: Level, as: 'level' },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
      ]
    });

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch question',
      error: error.message 
    });
  }
};

/**
 * Create new question
 * @route POST /api/questions
 * @access Teacher, Admin
 */
exports.createQuestion = async (req, res) => {
  try {
    const questionData = {
      ...req.body,
      created_by: req.user.id
    };

    const question = await Question.create(questionData);

    const newQuestion = await Question.findByPk(question.id, {
      include: [
        { model: Skill, as: 'skill' },
        { model: Level, as: 'level' }
      ]
    });

    res.status(201).json({ 
      success: true, 
      message: 'Question created successfully',
      data: newQuestion 
    });
  } catch (error) {
    // Check if it's a validation error from Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create question',
      error: error.message 
    });
  }
};

/**
 * Update question
 * @route PUT /api/questions/:id
 * @access Teacher (own questions), Admin (all)
 */
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    // Check permission: teachers can only edit their own questions
    if (req.user.role === 'teacher' && question.created_by !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own questions' 
      });
    }

    await question.update(req.body);

    const updatedQuestion = await Question.findByPk(question.id, {
      include: [
        { model: Skill, as: 'skill' },
        { model: Level, as: 'level' }
      ]
    });

    res.json({ 
      success: true, 
      message: 'Question updated successfully',
      data: updatedQuestion 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update question',
      error: error.message 
    });
  }
};

/**
 * Delete question (soft delete)
 * @route DELETE /api/questions/:id
 * @access Teacher (own questions), Admin (all)
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    // Check permission
    if (req.user.role === 'teacher' && question.created_by !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own questions' 
      });
    }

    // Soft delete
    await question.update({ is_active: false });

    res.json({ 
      success: true, 
      message: 'Question deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete question',
      error: error.message 
    });
  }
};

/**
 * Get questions by filters (for exam creation)
 * @route GET /api/questions/filter
 * @access Teacher, Admin
 */
exports.filterQuestions = async (req, res) => {
  try {
    const { skill_id, level_id, type, limit = 50 } = req.query;

    const where = { is_active: true };
    if (skill_id) where.skill_id = skill_id;
    if (level_id) where.level_id = level_id;
    if (type) where.type = type;

    const questions = await Question.findAll({
      where,
      include: [
        { model: Skill, as: 'skill', attributes: ['id', 'name'] },
        { model: Level, as: 'level', attributes: ['id', 'name'] }
      ],
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.json({ 
      success: true, 
      data: questions 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to filter questions',
      error: error.message 
    });
  }
};

/**
 * Import questions from CSV/JSON
 * @route POST /api/questions/import
 * @access Teacher, Admin
 */
exports.importQuestions = async (req, res) => {
  try {
    const { questions } = req.body; // Array of question objects

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid questions data' 
      });
    }

    const createdQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const questionData = {
          ...questions[i],
          created_by: req.user.id
        };
        const question = await Question.create(questionData);
        createdQuestions.push(question);
      } catch (error) {
        errors.push({ 
          index: i, 
          question: questions[i], 
          error: error.message 
        });
      }
    }

    res.status(201).json({ 
      success: true,
      message: `Imported ${createdQuestions.length} questions successfully`,
      data: {
        created: createdQuestions.length,
        failed: errors.length,
        errors: errors
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to import questions',
      error: error.message 
    });
  }
};

/**
 * Export questions to JSON
 * @route GET /api/questions/export
 * @access Teacher, Admin
 */
exports.exportQuestions = async (req, res) => {
  try {
    const { skill_id, level_id, type } = req.query;

    const where = { is_active: true };
    if (skill_id) where.skill_id = skill_id;
    if (level_id) where.level_id = level_id;
    if (type) where.type = type;

    const questions = await Question.findAll({
      where,
      include: [
        { model: Skill, as: 'skill' },
        { model: Level, as: 'level' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ 
      success: true, 
      data: questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export questions',
      error: error.message 
    });
  }
};
