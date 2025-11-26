const { Exam, ExamQuestion, Question, Level, User, ExamAttempt } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get all exams
 * @route GET /api/exams
 * @access Teacher, Admin
 */
exports.getAllExams = async (req, res) => {
  try {
    const { 
      level_id, 
      is_published, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const where = {};
    if (level_id) where.level_id = level_id;
    if (is_published !== undefined) where.is_published = is_published === 'true';
    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }

    // Teachers can only see their own exams, admins see all
    if (req.user.role === 'teacher') {
      where.created_by = req.user.id;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Exam.findAndCountAll({
      where,
      include: [
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
        exams: rows,
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
      message: 'Failed to fetch exams',
      error: error.message 
    });
  }
};

/**
 * Get exam by ID with questions
 * @route GET /api/exams/:id
 * @access Teacher, Admin
 */
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id, {
      include: [
        { model: Level, as: 'level' },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] },
        {
          model: ExamQuestion,
          as: 'examQuestions',
          include: [
            {
              model: Question,
              as: 'question',
              include: [
                { model: Level, as: 'level', attributes: ['id', 'name'] },
                { model: require('../models').Skill, as: 'skill', attributes: ['id', 'name'] }
              ]
            }
          ],
          order: [['order_number', 'ASC']]
        }
      ]
    });

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    // Check permission for teachers
    if (req.user.role === 'teacher' && exam.created_by !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view your own exams' 
      });
    }

    res.json({ success: true, data: { exam } });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch exam',
      error: error.message 
    });
  }
};

/**
 * Create new exam
 * @route POST /api/exams
 * @access Teacher, Admin
 */
exports.createExam = async (req, res) => {
  try {
    const examData = {
      ...req.body,
      created_by: req.user.id
    };

    const exam = await Exam.create(examData);

    const newExam = await Exam.findByPk(exam.id, {
      include: [
        { model: Level, as: 'level' },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
      ]
    });

    res.status(201).json({ 
      success: true, 
      message: 'Exam created successfully',
      data: { exam: newExam }
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
      message: 'Failed to create exam',
      error: error.message 
    });
  }
};

/**
 * Update exam
 * @route PUT /api/exams/:id
 * @access Teacher (own exams), Admin (all)
 */
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    // Check permission
    if (req.user.role === 'teacher' && exam.created_by !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own exams' 
      });
    }

    await exam.update(req.body);

    const updatedExam = await Exam.findByPk(exam.id, {
      include: [
        { model: Level, as: 'level' },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
      ]
    });

    res.json({ 
      success: true, 
      message: 'Exam updated successfully',
      data: { exam: updatedExam }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update exam',
      error: error.message 
    });
  }
};

/**
 * Delete exam
 * @route DELETE /api/exams/:id
 * @access Teacher (own exams), Admin (all)
 */
exports.deleteExam = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const exam = await Exam.findByPk(req.params.id);

    if (!exam) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    // Check permission
    if (req.user.role === 'teacher' && exam.created_by !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own exams' 
      });
    }

    // Check if exam has attempts
    const attemptsCount = await ExamAttempt.count({ 
      where: { exam_id: req.params.id } 
    });

    if (attemptsCount > 0) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete exam with existing attempts' 
      });
    }

    // Delete exam questions first
    await ExamQuestion.destroy({ 
      where: { exam_id: req.params.id },
      transaction: t
    });

    // Delete exam
    await exam.destroy({ transaction: t });

    await t.commit();

    res.json({ 
      success: true, 
      message: 'Exam deleted successfully' 
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete exam',
      error: error.message 
    });
  }
};

/**
 * Add questions to exam
 * @route POST /api/exams/:id/questions
 * @access Teacher (own exams), Admin (all)
 */
exports.addQuestionsToExam = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { questions } = req.body; // Array of { question_id, order_number, points_override }

    const exam = await Exam.findByPk(req.params.id);

    if (!exam) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    // Check permission
    if (req.user.role === 'teacher' && exam.created_by !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own exams' 
      });
    }

    // Validate questions exist
    const questionIds = questions.map(q => q.question_id);
    const existingQuestions = await Question.findAll({
      where: { id: questionIds, is_active: true }
    });

    if (existingQuestions.length !== questionIds.length) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Some questions not found or inactive' 
      });
    }

    // Create exam questions
    const examQuestions = questions.map(q => ({
      exam_id: req.params.id,
      question_id: q.question_id,
      order_number: q.order_number,
      points_override: q.points_override || null
    }));

    await ExamQuestion.bulkCreate(examQuestions, { 
      transaction: t,
      updateOnDuplicate: ['order_number', 'points_override']
    });

    // Update total points
    const totalPoints = await calculateExamTotalPoints(req.params.id);
    await exam.update({ total_points: totalPoints }, { transaction: t });

    await t.commit();

    const updatedExam = await Exam.findByPk(req.params.id, {
      include: [
        {
          model: ExamQuestion,
          as: 'examQuestions',
          include: [{ model: Question, as: 'question' }]
        }
      ],
      order: [[{ model: ExamQuestion, as: 'examQuestions' }, 'order_number', 'ASC']]
    });

    res.json({ 
      success: true, 
      message: 'Questions added to exam successfully',
      data: { questions: updatedExam.examQuestions }
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add questions to exam',
      error: error.message 
    });
  }
};

/**
 * Remove question from exam
 * @route DELETE /api/exams/:id/questions/:questionId
 * @access Teacher (own exams), Admin (all)
 */
exports.removeQuestionFromExam = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const exam = await Exam.findByPk(req.params.id);

    if (!exam) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    // Check permission
    if (req.user.role === 'teacher' && exam.created_by !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own exams' 
      });
    }

    const deletedCount = await ExamQuestion.destroy({
      where: {
        exam_id: req.params.id,
        question_id: req.params.questionId
      },
      transaction: t
    });

    if (deletedCount === 0) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found in this exam' 
      });
    }

    // Update total points
    const totalPoints = await calculateExamTotalPoints(req.params.id);
    await exam.update({ total_points: totalPoints }, { transaction: t });

    await t.commit();

    res.json({ 
      success: true, 
      message: 'Question removed from exam successfully' 
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove question from exam',
      error: error.message 
    });
  }
};

/**
 * Publish/Unpublish exam
 * @route PUT /api/exams/:id/publish
 * @access Teacher (own exams), Admin (all)
 */
exports.togglePublishExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    // Check permission
    if (req.user.role === 'teacher' && exam.created_by !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only publish your own exams' 
      });
    }

    // Check if exam has questions
    const questionsCount = await ExamQuestion.count({ 
      where: { exam_id: req.params.id } 
    });

    if (questionsCount === 0 && !exam.is_published) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot publish exam without questions' 
      });
    }

    await exam.update({ is_published: !exam.is_published });

    res.json({ 
      success: true, 
      message: `Exam ${exam.is_published ? 'published' : 'unpublished'} successfully`,
      data: { exam } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to publish exam',
      error: error.message 
    });
  }
};

/**
 * Get available exams for students
 * @route GET /api/student/exams
 * @access Student
 */
exports.getAvailableExams = async (req, res) => {
  try {
    const { level_id, page = 1, limit = 20 } = req.query;

    const where = { 
      is_published: true,
      [Op.or]: [
        { start_date: null },
        { start_date: { [Op.lte]: new Date() } }
      ],
      [Op.or]: [
        { end_date: null },
        { end_date: { [Op.gte]: new Date() } }
      ]
    };

    if (level_id) where.level_id = level_id;

    const offset = (page - 1) * limit;

    const { count, rows } = await Exam.findAndCountAll({
      where,
      include: [
        { model: Level, as: 'level', attributes: ['id', 'name'] }
      ],
      attributes: ['id', 'title', 'description', 'level_id', 'duration_minutes', 'total_points', 'max_attempts'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        exams: rows,
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
      message: 'Failed to fetch available exams',
      error: error.message 
    });
  }
};

/**
 * Get exam details for student (before starting)
 * @route GET /api/student/exams/:id
 * @access Student
 */
exports.getExamDetailsForStudent = async (req, res) => {
  try {
    const exam = await Exam.findOne({
      where: { 
        id: req.params.id, 
        is_published: true 
      },
      include: [
        { model: Level, as: 'level', attributes: ['id', 'name'] }
      ],
      attributes: ['id', 'title', 'description', 'level_id', 'duration_minutes', 'total_points', 'max_attempts', 'passing_score']
    });

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found or not available' 
      });
    }

    // Check attempts count
    const attemptsCount = await ExamAttempt.count({
      where: { 
        exam_id: req.params.id,
        user_id: req.user.id
      }
    });

    // Check if user can take exam
    const canTakeExam = attemptsCount < exam.max_attempts;

    res.json({ 
      success: true, 
      data: {
        exam,
        attemptsUsed: attemptsCount,
        canTakeExam
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch exam details',
      error: error.message 
    });
  }
};

// Helper function to calculate total points
async function calculateExamTotalPoints(examId) {
  const examQuestions = await ExamQuestion.findAll({
    where: { exam_id: examId },
    include: [{ model: Question, as: 'question', attributes: ['points'] }]
  });

  let total = 0;
  examQuestions.forEach(eq => {
    total += parseFloat(eq.points_override || eq.question.points);
  });

  return total;
}
