const { body, param, query } = require('express-validator');
const { Level } = require('../models');

// Exam validation rules
exports.createExamRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Exam title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  
  body('level_id')
    .notEmpty().withMessage('Level ID is required')
    .isInt().withMessage('Level ID must be an integer')
    .custom(async (levelId) => {
      const level = await Level.findByPk(levelId);
      if (!level) {
        throw new Error('Level ID does not exist');
      }
    }),
  
  body('duration_minutes')
    .trim()
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 5, max: 300 }).withMessage('Duration must be between 5 and 300 minutes'),
  
  body('passing_score')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
  
  body('max_attempts')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Max attempts must be between 1 and 10'),
  
  body('start_date')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),
  
  body('end_date')
    .optional()
    .isISO8601().withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('shuffle_questions')
    .optional()
    .isBoolean().withMessage('Shuffle questions must be a boolean'),
  
  body('show_results_immediately')
    .optional()
    .isBoolean().withMessage('Show results immediately must be a boolean')
];

exports.updateExamRules = [
  param('id')
    .isInt().withMessage('Exam ID must be an integer'),
  
  ...exports.createExamRules.map(rule => rule.optional())
];

exports.addQuestionsRules = [
  param('id')
    .isInt().withMessage('Exam ID must be an integer'),
  
  body('questions')
    .isArray({ min: 1 }).withMessage('Questions must be a non-empty array'),
  
  body('questions.*.question_id')
    .isInt().withMessage('Question ID must be an integer'),
  
  body('questions.*.order_number')
    .isInt({ min: 1 }).withMessage('Order number must be a positive integer'),
  
  body('questions.*.points_override')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Points override must be a positive number')
];

exports.removeQuestionRules = [
  param('id')
    .isInt().withMessage('Exam ID must be an integer'),
  
  param('questionId')
    .isInt().withMessage('Question ID must be an integer')
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
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];
