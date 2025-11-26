const { ExamAttempt, Exam, AttemptAnswer, Question, Level, User, PracticeSession } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get all exam results for a student
 * @route GET /api/student/results
 * @access Student
 */
exports.getAllResults = async (req, res) => {
  try {
    const { 
      exam_id, 
      status, 
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const where = {
      user_id: req.user.id
    };

    if (exam_id) where.exam_id = exam_id;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await ExamAttempt.findAndCountAll({
      where,
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [{ model: Level, as: 'level' }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order.toUpperCase()]]
    });

    res.json({
      success: true,
      data: {
        results: rows,
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
      message: 'Failed to fetch results',
      error: error.message 
    });
  }
};

/**
 * Get detailed result for a specific attempt
 * @route GET /api/student/results/:attemptId
 * @access Student (own attempts only)
 */
exports.getDetailedResult = async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({
      where: { 
        id: req.params.attemptId,
        user_id: req.user.id
      },
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [
            { model: Level, as: 'level' },
            { model: User, as: 'creator', attributes: ['full_name', 'email'] }
          ]
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
            },
            {
              model: User,
              as: 'grader',
              attributes: ['full_name', 'email']
            }
          ]
        }
      ]
    });

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Result not found' 
      });
    }

    // Only show results if exam allows or if graded/submitted
    if (attempt.status === 'in_progress') {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam is still in progress' 
      });
    }

    // Calculate statistics by skill
    const skillStats = {};
    
    attempt.answers.forEach(answer => {
      const skillName = answer.question.skill.name;
      
      if (!skillStats[skillName]) {
        skillStats[skillName] = {
          total_questions: 0,
          correct_answers: 0,
          total_points: 0,
          earned_points: 0,
          accuracy: 0
        };
      }

      skillStats[skillName].total_questions++;
      skillStats[skillName].total_points += parseFloat(answer.question.points);
      
      if (answer.is_correct) {
        skillStats[skillName].correct_answers++;
      }
      
      if (answer.score !== null) {
        skillStats[skillName].earned_points += parseFloat(answer.score);
      }
    });

    // Calculate accuracy for each skill
    Object.keys(skillStats).forEach(skill => {
      const stats = skillStats[skill];
      if (stats.total_questions > 0) {
        stats.accuracy = (stats.correct_answers / stats.total_questions * 100).toFixed(2);
      }
    });

    // Calculate overall statistics
    const totalQuestions = attempt.answers.length;
    const gradedQuestions = attempt.answers.filter(a => a.is_correct !== null).length;
    const correctAnswers = attempt.answers.filter(a => a.is_correct === true).length;
    const pendingGrading = attempt.answers.filter(a => a.is_correct === null).length;

    res.json({ 
      success: true, 
      data: {
        attempt,
        statistics: {
          total_questions: totalQuestions,
          graded_questions: gradedQuestions,
          correct_answers: correctAnswers,
          pending_grading: pendingGrading,
          accuracy: gradedQuestions > 0 ? (correctAnswers / gradedQuestions * 100).toFixed(2) : 0,
          by_skill: skillStats
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch detailed result',
      error: error.message 
    });
  }
};

/**
 * Get student progress dashboard
 * @route GET /api/student/progress
 * @access Student
 */
exports.getProgressDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all completed exam attempts
    const examAttempts = await ExamAttempt.findAll({
      where: {
        user_id: userId,
        status: { [Op.in]: ['graded', 'submitted'] }
      },
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [{ model: Level, as: 'level' }]
        }
      ]
    });

    // Get practice sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const practiceSessions = await PracticeSession.findAll({
      where: {
        user_id: userId,
        session_date: { [Op.gte]: thirtyDaysAgo }
      },
      include: [
        { model: require('../models').Skill, as: 'skill' },
        { model: Level, as: 'level' }
      ]
    });

    // Calculate exam statistics
    const examStats = {
      total_exams_taken: examAttempts.length,
      total_exams_passed: examAttempts.filter(a => {
        const exam = a.exam;
        return exam.passing_score && a.total_score >= exam.passing_score;
      }).length,
      average_score: 0,
      average_percentage: 0,
      best_score: 0,
      total_time_spent: examAttempts.reduce((sum, a) => sum + (a.time_spent_minutes || 0), 0)
    };

    if (examAttempts.length > 0) {
      const totalScore = examAttempts.reduce((sum, a) => sum + (parseFloat(a.total_score) || 0), 0);
      const totalPercentage = examAttempts.reduce((sum, a) => sum + (parseFloat(a.percentage) || 0), 0);
      
      examStats.average_score = (totalScore / examAttempts.length).toFixed(2);
      examStats.average_percentage = (totalPercentage / examAttempts.length).toFixed(2);
      examStats.best_score = Math.max(...examAttempts.map(a => parseFloat(a.percentage) || 0)).toFixed(2);
    }

    // Calculate practice statistics
    const practiceStats = {
      total_sessions: practiceSessions.length,
      total_questions_practiced: practiceSessions.reduce((sum, s) => sum + s.questions_answered, 0),
      total_correct_answers: practiceSessions.reduce((sum, s) => sum + s.correct_answers, 0),
      overall_accuracy: 0,
      total_points_earned: practiceSessions.reduce((sum, s) => sum + parseFloat(s.total_points_earned), 0)
    };

    if (practiceStats.total_questions_practiced > 0) {
      practiceStats.overall_accuracy = (
        practiceStats.total_correct_answers / practiceStats.total_questions_practiced * 100
      ).toFixed(2);
    }

    // Performance by skill (combining exam and practice data)
    const skillPerformance = {};

    // From practice sessions
    practiceSessions.forEach(session => {
      const skillName = session.skill.name;
      
      if (!skillPerformance[skillName]) {
        skillPerformance[skillName] = {
          skill_id: session.skill_id,
          skill_name: skillName,
          skill_icon: session.skill.icon,
          practice_questions: 0,
          practice_correct: 0,
          practice_accuracy: 0,
          exams_taken: 0,
          exam_average_score: 0
        };
      }

      skillPerformance[skillName].practice_questions += session.questions_answered;
      skillPerformance[skillName].practice_correct += session.correct_answers;
    });

    // Calculate practice accuracy
    Object.keys(skillPerformance).forEach(skill => {
      const perf = skillPerformance[skill];
      if (perf.practice_questions > 0) {
        perf.practice_accuracy = (perf.practice_correct / perf.practice_questions * 100).toFixed(2);
      }
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentExams = await ExamAttempt.count({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: sevenDaysAgo }
      }
    });

    const recentPractice = await PracticeSession.count({
      where: {
        user_id: userId,
        session_date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] }
      }
    });

    // Learning streak (consecutive days with activity)
    const learningStreak = await calculateLearningStreak(userId);

    res.json({ 
      success: true, 
      data: {
        exam_statistics: examStats,
        practice_statistics: practiceStats,
        performance_by_skill: Object.values(skillPerformance),
        recent_activity: {
          last_7_days_exams: recentExams,
          last_7_days_practice_sessions: recentPractice,
          learning_streak_days: learningStreak
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch progress dashboard',
      error: error.message 
    });
  }
};

/**
 * Get statistics with filters
 * @route GET /api/student/statistics
 * @access Student
 */
exports.getStatistics = async (req, res) => {
  try {
    const { skill_id, period = '30' } = req.query; // period in days
    const userId = req.user.id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Build where clause
    const where = {
      user_id: userId,
      created_at: { [Op.gte]: startDate }
    };

    // Get exam attempts
    const examWhere = { ...where };
    const examAttempts = await ExamAttempt.findAll({
      where: examWhere,
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
            where: skill_id ? { skill_id } : {},
            include: [{ model: require('../models').Skill, as: 'skill' }]
          }]
        }
      ]
    });

    // Get practice sessions
    const practiceWhere = {
      user_id: userId,
      session_date: { [Op.gte]: startDate.toISOString().split('T')[0] }
    };
    if (skill_id) practiceWhere.skill_id = skill_id;

    const practiceSessions = await PracticeSession.findAll({
      where: practiceWhere,
      include: [
        { model: require('../models').Skill, as: 'skill' },
        { model: Level, as: 'level' }
      ],
      order: [['session_date', 'ASC']]
    });

    // Aggregate data by date
    const dailyStats = {};

    // Process practice sessions
    practiceSessions.forEach(session => {
      const date = session.session_date;
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          practice_questions: 0,
          practice_correct: 0,
          exams_taken: 0,
          exam_questions_answered: 0,
          exam_questions_correct: 0
        };
      }

      dailyStats[date].practice_questions += session.questions_answered;
      dailyStats[date].practice_correct += session.correct_answers;
    });

    // Process exam attempts
    examAttempts.forEach(attempt => {
      const date = attempt.created_at.toISOString().split('T')[0];
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          practice_questions: 0,
          practice_correct: 0,
          exams_taken: 0,
          exam_questions_answered: 0,
          exam_questions_correct: 0
        };
      }

      dailyStats[date].exams_taken++;
      
      attempt.answers.forEach(answer => {
        if (answer.question) { // Filter by skill if needed
          dailyStats[date].exam_questions_answered++;
          if (answer.is_correct) {
            dailyStats[date].exam_questions_correct++;
          }
        }
      });
    });

    // Calculate totals
    const totals = {
      total_practice_questions: 0,
      total_practice_correct: 0,
      total_exams: 0,
      total_exam_questions: 0,
      total_exam_correct: 0,
      overall_practice_accuracy: 0,
      overall_exam_accuracy: 0
    };

    Object.values(dailyStats).forEach(day => {
      totals.total_practice_questions += day.practice_questions;
      totals.total_practice_correct += day.practice_correct;
      totals.total_exams += day.exams_taken;
      totals.total_exam_questions += day.exam_questions_answered;
      totals.total_exam_correct += day.exam_questions_correct;
    });

    if (totals.total_practice_questions > 0) {
      totals.overall_practice_accuracy = (
        totals.total_practice_correct / totals.total_practice_questions * 100
      ).toFixed(2);
    }

    if (totals.total_exam_questions > 0) {
      totals.overall_exam_accuracy = (
        totals.total_exam_correct / totals.total_exam_questions * 100
      ).toFixed(2);
    }

    res.json({ 
      success: true, 
      data: {
        period_days: parseInt(period),
        daily_statistics: Object.values(dailyStats).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        ),
        totals
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics',
      error: error.message 
    });
  }
};

/**
 * Compare performance with other students (anonymized)
 * @route GET /api/student/compare
 * @access Student
 */
exports.comparePerformance = async (req, res) => {
  try {
    const { exam_id, level_id } = req.query;

    if (!exam_id && !level_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'exam_id or level_id is required' 
      });
    }

    const where = {
      status: { [Op.in]: ['graded', 'submitted'] }
    };

    if (exam_id) {
      where.exam_id = exam_id;
    } else if (level_id) {
      where['$exam.level_id$'] = level_id;
    }

    // Get all attempts
    const allAttempts = await ExamAttempt.findAll({
      where,
      include: [{ model: Exam, as: 'exam' }],
      attributes: ['user_id', 'percentage', 'total_score']
    });

    if (allAttempts.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No data available for comparison' 
      });
    }

    // Calculate statistics
    const percentages = allAttempts
      .filter(a => a.percentage !== null)
      .map(a => parseFloat(a.percentage));

    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const sorted = percentages.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);

    // Get user's performance
    const userAttempts = allAttempts.filter(a => a.user_id === req.user.id);
    const userAverage = userAttempts.length > 0
      ? userAttempts.reduce((sum, a) => sum + parseFloat(a.percentage || 0), 0) / userAttempts.length
      : 0;

    // Calculate percentile
    const betterThan = percentages.filter(p => userAverage > p).length;
    const percentile = (betterThan / percentages.length * 100).toFixed(2);

    res.json({ 
      success: true, 
      data: {
        your_average: userAverage.toFixed(2),
        class_average: average.toFixed(2),
        class_median: median.toFixed(2),
        highest_score: highest.toFixed(2),
        lowest_score: lowest.toFixed(2),
        your_percentile: percentile,
        total_students: new Set(allAttempts.map(a => a.user_id)).size,
        your_rank: Math.ceil((1 - percentile / 100) * new Set(allAttempts.map(a => a.user_id)).size)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to compare performance',
      error: error.message 
    });
  }
};

// Helper function to calculate learning streak
async function calculateLearningStreak(userId) {
  const activities = await sequelize.query(
    `SELECT DISTINCT DATE(session_date) as activity_date 
     FROM practice_sessions 
     WHERE user_id = :userId
     UNION
     SELECT DISTINCT DATE(created_at) as activity_date
     FROM exam_attempts
     WHERE user_id = :userId
     ORDER BY activity_date DESC`,
    {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    }
  );

  if (activities.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = new Date(today);

  for (const activity of activities) {
    const activityDate = new Date(activity.activity_date).toISOString().split('T')[0];
    const expectedDate = currentDate.toISOString().split('T')[0];

    if (activityDate === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
