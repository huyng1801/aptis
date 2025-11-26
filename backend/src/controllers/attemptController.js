const { ExamAttempt, Exam, Question, ExamQuestion, AttemptAnswer, Level } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Start a new exam attempt
 * @route POST /api/student/exams/:id/start
 * @access Student
 */
exports.startExam = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const examId = req.params.id;
    const userId = req.user.id;

    // Check if exam exists and is published
    const exam = await Exam.findOne({
      where: { id: examId, is_published: true }
    });

    if (!exam) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found or not available' 
      });
    }

    // Check if exam is within date range
    const now = new Date();
    if (exam.start_date && new Date(exam.start_date) > now) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Exam has not started yet' 
      });
    }
    if (exam.end_date && new Date(exam.end_date) < now) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Exam has ended' 
      });
    }

    // Check attempts count
    const attemptsCount = await ExamAttempt.count({
      where: { exam_id: examId, user_id: userId }
    });

    if (attemptsCount >= exam.max_attempts) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: `Maximum attempts (${exam.max_attempts}) reached` 
      });
    }

    // Check if user has an in-progress attempt
    const inProgressAttempt = await ExamAttempt.findOne({
      where: { 
        exam_id: examId, 
        user_id: userId,
        status: 'in_progress'
      }
    });

    if (inProgressAttempt) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an in-progress attempt for this exam',
        data: { attemptId: inProgressAttempt.id }
      });
    }

    // Create new attempt
    const attempt = await ExamAttempt.create({
      exam_id: examId,
      user_id: userId,
      start_time: new Date(),
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }, { transaction: t });

    // Get exam questions
    const examQuestions = await ExamQuestion.findAll({
      where: { exam_id: examId },
      include: [
        {
          model: Question,
          as: 'question',
          include: [
            { model: require('../models').Skill, as: 'skill', attributes: ['id', 'name'] },
            { model: Level, as: 'level', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: exam.shuffle_questions ? sequelize.random() : [['order_number', 'ASC']],
      transaction: t
    });

    // Format questions for student (hide correct answers)
    const questions = examQuestions.map(eq => {
      const question = eq.question.toJSON();
      delete question.correct_answer; // Hide correct answer
      delete question.explanation;
      return {
        ...question,
        exam_question_id: eq.id,
        order_number: eq.order_number,
        points: eq.points_override || question.points
      };
    });

    await t.commit();

    res.status(201).json({ 
      success: true, 
      message: 'Exam attempt started successfully',
      data: {
        attempt: {
          id: attempt.id,
          exam_id: examId,
          start_time: attempt.start_time,
          duration_minutes: exam.duration_minutes
        },
        questions
      }
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start exam',
      error: error.message 
    });
  }
};

/**
 * Get current attempt details
 * @route GET /api/student/attempts/:id
 * @access Student (own attempts only)
 */
exports.getAttempt = async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id
      },
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [{ model: Level, as: 'level' }]
        },
        {
          model: AttemptAnswer,
          as: 'answers',
          include: [
            {
              model: Question,
              as: 'question',
              include: [
                { model: require('../models').Skill, as: 'skill' },
                { model: Level, as: 'level' }
              ]
            }
          ]
        }
      ]
    });

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attempt not found' 
      });
    }

    // If in progress, hide correct answers
    if (attempt.status === 'in_progress') {
      attempt.answers = attempt.answers.map(answer => {
        const answerData = answer.toJSON();
        delete answerData.question.correct_answer;
        delete answerData.question.explanation;
        delete answerData.is_correct;
        delete answerData.score;
        return answerData;
      });
    }

    res.json({ 
      success: true, 
      data: attempt 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch attempt',
      error: error.message 
    });
  }
};

/**
 * Save/Update answer for a question
 * @route POST /api/student/attempts/:id/answers
 * @access Student (own attempts only)
 */
exports.saveAnswer = async (req, res) => {
  try {
    const { question_id, answer_text, audio_url } = req.body;

    // Verify attempt belongs to user and is in progress
    const attempt = await ExamAttempt.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id,
        status: 'in_progress'
      }
    });

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attempt not found or already submitted' 
      });
    }

    // Check if time is up
    const exam = await Exam.findByPk(attempt.exam_id);
    const timeElapsed = (new Date() - new Date(attempt.start_time)) / 1000 / 60; // minutes
    if (timeElapsed > exam.duration_minutes) {
      return res.status(400).json({ 
        success: false, 
        message: 'Time is up. Please submit your exam.' 
      });
    }

    // Create or update answer
    const [attemptAnswer, created] = await AttemptAnswer.findOrCreate({
      where: {
        attempt_id: req.params.id,
        question_id
      },
      defaults: {
        answer_text,
        audio_url
      }
    });

    if (!created) {
      await attemptAnswer.update({ answer_text, audio_url });
    }

    res.json({ 
      success: true, 
      message: 'Answer saved successfully',
      data: attemptAnswer 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save answer',
      error: error.message 
    });
  }
};

/**
 * Auto-save progress (saves all answers at once)
 * @route POST /api/student/attempts/:id/auto-save
 * @access Student (own attempts only)
 */
exports.autoSave = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { answers } = req.body; // Array of { question_id, answer_text, audio_url }

    const attempt = await ExamAttempt.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id,
        status: 'in_progress'
      }
    });

    if (!attempt) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Attempt not found or already submitted' 
      });
    }

    // Bulk upsert answers
    for (const answer of answers) {
      await AttemptAnswer.upsert({
        attempt_id: req.params.id,
        question_id: answer.question_id,
        answer_text: answer.answer_text,
        audio_url: answer.audio_url
      }, { transaction: t });
    }

    await t.commit();

    res.json({ 
      success: true, 
      message: 'Progress auto-saved successfully' 
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to auto-save progress',
      error: error.message 
    });
  }
};

/**
 * Submit exam attempt
 * @route POST /api/student/attempts/:id/submit
 * @access Student (own attempts only)
 */
exports.submitExam = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const attempt = await ExamAttempt.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id,
        status: 'in_progress'
      },
      include: [{ model: Exam, as: 'exam' }]
    });

    if (!attempt) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Attempt not found or already submitted' 
      });
    }

    const endTime = new Date();
    const timeSpentMinutes = Math.round((endTime - new Date(attempt.start_time)) / 1000 / 60);

    // Get all answers for this attempt
    const answers = await AttemptAnswer.findAll({
      where: { attempt_id: req.params.id },
      include: [{ model: Question, as: 'question' }]
    });

    // Grade automatic questions (multiple_choice, true_false, fill_blanks)
    let totalScore = 0;
    let gradedCount = 0;

    for (const answer of answers) {
      const question = answer.question;
      const questionPoints = await getQuestionPoints(attempt.exam_id, question.id);

      if (['multiple_choice', 'true_false', 'fill_blanks'].includes(question.type)) {
        // Auto-grade
        const isCorrect = checkAnswer(question, answer.answer_text);
        const score = isCorrect ? questionPoints : 0;

        await answer.update({
          is_correct: isCorrect,
          score: score
        }, { transaction: t });

        totalScore += score;
        gradedCount++;
      } else {
        // Essay, speaking - needs manual grading or AI
        await answer.update({
          is_correct: null,
          score: null
        }, { transaction: t });
      }
    }

    // Calculate percentage (only for graded questions)
    const totalPossiblePoints = await getAttemptTotalPoints(attempt.exam_id, gradedCount);
    const percentage = totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0;

    // Update attempt
    await attempt.update({
      end_time: endTime,
      time_spent_minutes: timeSpentMinutes,
      total_score: totalScore,
      percentage: percentage,
      status: gradedCount === answers.length ? 'graded' : 'submitted'
    }, { transaction: t });

    await t.commit();

    // Get updated attempt with results
    const result = await ExamAttempt.findByPk(req.params.id, {
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [{ model: Level, as: 'level' }]
        },
        {
          model: AttemptAnswer,
          as: 'answers',
          include: [{
            model: Question,
            as: 'question',
            include: [
              { model: require('../models').Skill, as: 'skill' },
              { model: Level, as: 'level' }
            ]
          }]
        }
      ]
    });

    res.json({ 
      success: true, 
      message: 'Exam submitted successfully',
      data: result
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit exam',
      error: error.message 
    });
  }
};

/**
 * Get attempt progress
 * @route GET /api/student/attempts/:id/progress
 * @access Student (own attempts only)
 */
exports.getProgress = async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attempt not found' 
      });
    }

    // Get total questions count
    const totalQuestions = await ExamQuestion.count({
      where: { exam_id: attempt.exam_id }
    });

    // Get answered questions count
    const answeredQuestions = await AttemptAnswer.count({
      where: { 
        attempt_id: req.params.id,
        answer_text: { [Op.ne]: null }
      }
    });

    // Calculate time remaining
    const exam = await Exam.findByPk(attempt.exam_id);
    const timeElapsed = (new Date() - new Date(attempt.start_time)) / 1000 / 60; // minutes
    const timeRemaining = Math.max(0, exam.duration_minutes - timeElapsed);

    res.json({ 
      success: true, 
      data: {
        totalQuestions,
        answeredQuestions,
        unansweredQuestions: totalQuestions - answeredQuestions,
        timeElapsedMinutes: Math.round(timeElapsed),
        timeRemainingMinutes: Math.round(timeRemaining),
        isTimeUp: timeRemaining <= 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch progress',
      error: error.message 
    });
  }
};

// Helper functions

function checkAnswer(question, userAnswer) {
  if (!userAnswer) return false;

  const correctAnswer = question.correct_answer.toString().toLowerCase().trim();
  const answer = userAnswer.toString().toLowerCase().trim();

  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      return answer === correctAnswer;
    
    case 'fill_blanks':
      // For fill in the blanks, accept close matches
      return answer === correctAnswer || 
             answer.includes(correctAnswer) || 
             correctAnswer.includes(answer);
    
    default:
      return false;
  }
}

async function getQuestionPoints(examId, questionId) {
  const examQuestion = await ExamQuestion.findOne({
    where: { exam_id: examId, question_id: questionId },
    include: [{ model: Question, as: 'question' }]
  });

  return examQuestion.points_override || examQuestion.question.points;
}

async function getAttemptTotalPoints(examId, questionCount) {
  const examQuestions = await ExamQuestion.findAll({
    where: { exam_id: examId },
    include: [{ model: Question, as: 'question' }],
    limit: questionCount
  });

  let total = 0;
  examQuestions.forEach(eq => {
    total += parseFloat(eq.points_override || eq.question.points);
  });

  return total;
}
