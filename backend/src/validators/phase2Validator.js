const { body, param, query } = require('express-validator');

// Attempt validation rules
exports.startExamRules = [
  param('id')
    .isInt().withMessage('Exam ID must be an integer')
];

exports.saveAnswerRules = [
  param('id')
    .isInt().withMessage('Attempt ID must be an integer'),
  
  body('question_id')
    .isInt().withMessage('Question ID must be an integer')
    .notEmpty().withMessage('Question ID is required'),
  
  body('answer_text')
    .optional()
    .trim(),
  
  body('audio_url')
    .optional()
    .isURL().withMessage('Audio URL must be a valid URL')
];

exports.autoSaveRules = [
  param('id')
    .isInt().withMessage('Attempt ID must be an integer'),
  
  body('answers')
    .isArray().withMessage('Answers must be an array'),
  
  body('answers.*.question_id')
    .isInt().withMessage('Question ID must be an integer'),
  
  body('answers.*.answer_text')
    .optional()
    .trim()
];

exports.submitExamRules = [
  param('id')
    .isInt().withMessage('Attempt ID must be an integer')
];

exports.getProgressRules = [
  param('id')
    .isInt().withMessage('Attempt ID must be an integer')
];

exports.getAvailableExamsRules = [
  query('level_id')
    .optional()
    .isInt().withMessage('Level ID must be an integer'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Practice validation rules
exports.startPracticeRules = [
  body('skill_id')
    .isInt().withMessage('Skill ID must be an integer')
    .notEmpty().withMessage('Skill ID is required'),
  
  body('level_id')
    .isInt().withMessage('Level ID must be an integer')
    .notEmpty().withMessage('Level ID is required')
];

exports.getPracticeQuestionsRules = [
  query('skill_id')
    .isInt().withMessage('Skill ID must be an integer')
    .notEmpty().withMessage('Skill ID is required'),
  
  query('level_id')
    .isInt().withMessage('Level ID must be an integer')
    .notEmpty().withMessage('Level ID is required'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  
  query('type')
    .optional()
    .isIn(['multiple_choice', 'true_false', 'fill_blanks', 'note_completion', 'short_answer', 'essay', 'audio_response', 'image_description'])
    .withMessage('Invalid question type')
];

exports.submitPracticeAnswerRules = [
  body('question_id')
    .isInt().withMessage('Question ID must be an integer')
    .notEmpty().withMessage('Question ID is required'),
  
  body('answer_text')
    .trim()
    .notEmpty().withMessage('Answer text is required'),
  
  body('session_id')
    .isInt().withMessage('Session ID must be an integer')
    .notEmpty().withMessage('Session ID is required')
];

exports.getPracticeHistoryRules = [
  query('skill_id')
    .optional()
    .isInt().withMessage('Skill ID must be an integer'),
  
  query('level_id')
    .optional()
    .isInt().withMessage('Level ID must be an integer'),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
];

// Result validation rules
exports.getAllResultsRules = [
  query('exam_id')
    .optional()
    .isInt().withMessage('Exam ID must be an integer'),
  
  query('status')
    .optional()
    .isIn(['in_progress', 'submitted', 'graded', 'abandoned'])
    .withMessage('Invalid status'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

exports.getDetailedResultRules = [
  param('attemptId')
    .isInt().withMessage('Attempt ID must be an integer')
];

exports.getStatisticsRules = [
  query('skill_id')
    .optional()
    .isInt().withMessage('Skill ID must be an integer'),
  
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
];

exports.comparePerformanceRules = [
  query('exam_id')
    .optional()
    .isInt().withMessage('Exam ID must be an integer'),
  
  query('level_id')
    .optional()
    .isInt().withMessage('Level ID must be an integer')
];
