const { PracticeSession, Question, Skill, Level } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Start a practice session
 * @route POST /api/student/practice/start
 * @access Student
 */
exports.startPracticeSession = async (req, res) => {
  try {
    const { skill_id, level_id } = req.body;

    // Validate skill and level exist
    const skill = await Skill.findByPk(skill_id);
    const level = await Level.findByPk(level_id);

    if (!skill || !level) {
      return res.status(404).json({ 
        success: false, 
        message: 'Skill or level not found' 
      });
    }

    // Create or get today's practice session
    const today = new Date().toISOString().split('T')[0];
    
    const [session, created] = await PracticeSession.findOrCreate({
      where: {
        user_id: req.user.id,
        skill_id,
        level_id,
        session_date: today
      },
      defaults: {
        user_id: req.user.id,
        skill_id,
        level_id,
        session_date: today
      }
    });

    res.json({ 
      success: true, 
      message: created ? 'Practice session started' : 'Continuing existing session',
      data: session 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start practice session',
      error: error.message 
    });
  }
};

/**
 * Get random practice questions
 * @route GET /api/student/practice/questions
 * @access Student
 */
exports.getPracticeQuestions = async (req, res) => {
  try {
    const { skill_id, level_id, limit = 10, type } = req.query;

    if (!skill_id || !level_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'skill_id and level_id are required' 
      });
    }

    const where = {
      skill_id,
      level_id,
      is_active: true
    };

    if (type) {
      where.type = type;
    }

    // Get random questions
    const questions = await Question.findAll({
      where,
      include: [
        { model: Skill, as: 'skill', attributes: ['id', 'name', 'icon'] },
        { model: Level, as: 'level', attributes: ['id', 'name'] }
      ],
      order: sequelize.random(),
      limit: parseInt(limit)
    });

    if (questions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No questions found for this skill and level' 
      });
    }

    // Format questions for practice (hide correct answers initially)
    const formattedQuestions = questions.map(q => {
      const question = q.toJSON();
      delete question.correct_answer;
      delete question.explanation;
      return question;
    });

    res.json({ 
      success: true, 
      data: {
        questions: formattedQuestions,
        count: questions.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch practice questions',
      error: error.message 
    });
  }
};

/**
 * Submit practice answer and get feedback
 * @route POST /api/student/practice/answer
 * @access Student
 */
exports.submitPracticeAnswer = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { question_id, answer_text, session_id } = req.body;

    // Get question with correct answer
    const question = await Question.findByPk(question_id, {
      include: [
        { model: Skill, as: 'skill' },
        { model: Level, as: 'level' }
      ]
    });

    if (!question) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    // Verify session belongs to user
    const session = await PracticeSession.findOne({
      where: {
        id: session_id,
        user_id: req.user.id
      }
    });

    if (!session) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Practice session not found' 
      });
    }

    // Check answer
    const isCorrect = checkPracticeAnswer(question, answer_text);
    const pointsEarned = isCorrect ? parseFloat(question.points) : 0;

    // Update session statistics
    await session.update({
      questions_answered: session.questions_answered + 1,
      correct_answers: session.correct_answers + (isCorrect ? 1 : 0),
      total_points_earned: parseFloat(session.total_points_earned) + pointsEarned
    }, { transaction: t });

    await t.commit();

    // Return feedback
    res.json({ 
      success: true, 
      data: {
        question_id,
        is_correct: isCorrect,
        user_answer: answer_text,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        points_earned: pointsEarned,
        session_stats: {
          total_answered: session.questions_answered + 1,
          correct: session.correct_answers + (isCorrect ? 1 : 0),
          accuracy: ((session.correct_answers + (isCorrect ? 1 : 0)) / (session.questions_answered + 1) * 100).toFixed(2)
        }
      }
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit answer',
      error: error.message 
    });
  }
};

/**
 * Get practice history
 * @route GET /api/student/practice/history
 * @access Student
 */
exports.getPracticeHistory = async (req, res) => {
  try {
    const { skill_id, level_id, days = 30 } = req.query;

    const where = {
      user_id: req.user.id
    };

    if (skill_id) where.skill_id = skill_id;
    if (level_id) where.level_id = level_id;

    // Get history for last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    where.session_date = { [Op.gte]: startDate };

    const sessions = await PracticeSession.findAll({
      where,
      include: [
        { model: Skill, as: 'skill', attributes: ['id', 'name', 'icon'] },
        { model: Level, as: 'level', attributes: ['id', 'name'] }
      ],
      order: [['session_date', 'DESC']]
    });

    // Calculate summary statistics
    const summary = {
      total_sessions: sessions.length,
      total_questions: sessions.reduce((sum, s) => sum + s.questions_answered, 0),
      total_correct: sessions.reduce((sum, s) => sum + s.correct_answers, 0),
      total_points: sessions.reduce((sum, s) => sum + parseFloat(s.total_points_earned), 0),
      average_accuracy: 0
    };

    if (summary.total_questions > 0) {
      summary.average_accuracy = (summary.total_correct / summary.total_questions * 100).toFixed(2);
    }

    res.json({ 
      success: true, 
      data: {
        sessions,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch practice history',
      error: error.message 
    });
  }
};

/**
 * Get practice statistics by skill
 * @route GET /api/student/practice/stats
 * @access Student
 */
exports.getPracticeStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sessions = await PracticeSession.findAll({
      where: {
        user_id: req.user.id,
        session_date: { [Op.gte]: startDate }
      },
      include: [
        { model: Skill, as: 'skill' },
        { model: Level, as: 'level' }
      ]
    });

    // Group by skill
    const statsBySkill = {};
    
    sessions.forEach(session => {
      const skillName = session.skill.name;
      
      if (!statsBySkill[skillName]) {
        statsBySkill[skillName] = {
          skill_id: session.skill_id,
          skill_name: skillName,
          skill_icon: session.skill.icon,
          total_sessions: 0,
          total_questions: 0,
          correct_answers: 0,
          total_points: 0,
          accuracy: 0
        };
      }

      statsBySkill[skillName].total_sessions++;
      statsBySkill[skillName].total_questions += session.questions_answered;
      statsBySkill[skillName].correct_answers += session.correct_answers;
      statsBySkill[skillName].total_points += parseFloat(session.total_points_earned);
    });

    // Calculate accuracy for each skill
    Object.keys(statsBySkill).forEach(skill => {
      const stats = statsBySkill[skill];
      if (stats.total_questions > 0) {
        stats.accuracy = (stats.correct_answers / stats.total_questions * 100).toFixed(2);
      }
    });

    res.json({ 
      success: true, 
      data: Object.values(statsBySkill)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch practice statistics',
      error: error.message 
    });
  }
};

/**
 * Get recommended practice areas (weak skills)
 * @route GET /api/student/practice/recommendations
 * @access Student
 */
exports.getPracticeRecommendations = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const sessions = await PracticeSession.findAll({
      where: {
        user_id: req.user.id,
        session_date: { [Op.gte]: startDate }
      },
      include: [
        { model: Skill, as: 'skill' },
        { model: Level, as: 'level' }
      ]
    });

    // Calculate accuracy by skill and level
    const performance = {};

    sessions.forEach(session => {
      const key = `${session.skill_id}-${session.level_id}`;
      
      if (!performance[key]) {
        performance[key] = {
          skill: session.skill,
          level: session.level,
          total_questions: 0,
          correct_answers: 0,
          accuracy: 0
        };
      }

      performance[key].total_questions += session.questions_answered;
      performance[key].correct_answers += session.correct_answers;
    });

    // Calculate accuracy and find weak areas
    const recommendations = [];

    Object.keys(performance).forEach(key => {
      const perf = performance[key];
      if (perf.total_questions > 0) {
        perf.accuracy = (perf.correct_answers / perf.total_questions * 100).toFixed(2);
        
        // Recommend if accuracy < 70% and attempted at least 5 questions
        if (perf.accuracy < 70 && perf.total_questions >= 5) {
          recommendations.push({
            skill: perf.skill,
            level: perf.level,
            accuracy: perf.accuracy,
            questions_attempted: perf.total_questions,
            reason: `Your accuracy (${perf.accuracy}%) needs improvement`
          });
        }
      }
    });

    // Sort by lowest accuracy first
    recommendations.sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

    // If no weak areas, recommend skills with least practice
    if (recommendations.length === 0) {
      const allSkills = await Skill.findAll();
      const unpracticedSkills = allSkills.filter(skill => {
        return !sessions.some(s => s.skill_id === skill.id);
      });

      if (unpracticedSkills.length > 0) {
        recommendations.push({
          skill: unpracticedSkills[0],
          level: null,
          reason: 'You haven\'t practiced this skill yet'
        });
      }
    }

    res.json({ 
      success: true, 
      data: recommendations.slice(0, 5) // Top 5 recommendations
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recommendations',
      error: error.message 
    });
  }
};

// Helper function
function checkPracticeAnswer(question, userAnswer) {
  if (!userAnswer) return false;

  const correctAnswer = question.correct_answer.toString().toLowerCase().trim();
  const answer = userAnswer.toString().toLowerCase().trim();

  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      return answer === correctAnswer;
    
    case 'fill_blanks':
    case 'short_answer':
      // Accept close matches and partial matches
      return answer === correctAnswer || 
             answer.includes(correctAnswer) || 
             correctAnswer.includes(answer) ||
             calculateSimilarity(answer, correctAnswer) > 0.8;
    
    case 'essay':
    case 'audio_response':
    case 'image_description':
      // These need AI grading, return true for now (will be graded later)
      return true;
    
    default:
      return false;
  }
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
