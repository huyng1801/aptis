const { body, param, query } = require('express-validator');
const { Skill, Level } = require('../models');

// Question validation rules
exports.createQuestionRules = [
  body('skill_id')
    .notEmpty().withMessage('Skill ID is required')
    .isInt().withMessage('Skill ID must be an integer')
    .custom(async (skillId) => {
      const skill = await Skill.findByPk(skillId);
      if (!skill) {
        throw new Error('Skill ID does not exist');
      }
    }),
  
  body('level_id')
    .notEmpty().withMessage('Level ID is required')
    .isInt().withMessage('Level ID must be an integer')
    .custom(async (levelId) => {
      const level = await Level.findByPk(levelId);
      if (!level) {
        throw new Error('Level ID does not exist');
      }
    }),
  
  body('type')
    .isIn([
      // Grammar & Vocabulary types
      'multiple_choice',
      'word_formation', 
      'sentence_transformation',
      // Listening types (1 audio for multiple questions)
      'listening_multiple_choice',
      'listening_note_completion',
      'listening_form_filling',
      'listening_matching',
      // Reading types (1 passage for multiple questions) 
      'reading_multiple_choice',
      'reading_matching',
      'reading_gapped_text',
      'reading_true_false',
      // Writing types
      'short_message',
      'informal_email',
      'formal_email', 
      'essay_opinion',
      // Speaking types (may include images)
      'personal_information',
      'describing_photo',
      'comparing_situations',
      'discussion_topic'
    ])
    .withMessage('Invalid question type'),
  
  body('question_text')
    .trim()
    .notEmpty().withMessage('Question text is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Question text must be between 10 and 5000 characters'),
  
  body('media_url')
    .optional()
    .isURL().withMessage('Media URL must be a valid URL'),
  
  body('options')
    .optional()
    .isArray().withMessage('Options must be an array'),
  
  body('correct_answer')
    .optional()
    .trim(),
  
  body('points')
    .optional()
    .isFloat({ min: 0.1, max: 100 }).withMessage('Points must be between 0.1 and 100'),
  
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Explanation must not exceed 2000 characters')
];

exports.updateQuestionRules = [
  param('id')
    .isInt().withMessage('Question ID must be an integer'),
  
  ...exports.createQuestionRules.slice(0, -1).map(rule => rule.optional())
];

exports.filterQuestionsRules = [
  query('skill_id')
    .optional()
    .isInt().withMessage('Skill ID must be an integer'),
  
  query('level_id')
    .optional()
    .isInt().withMessage('Level ID must be an integer'),
  
  query('type')
    .optional()
    .isIn([
      // Grammar & Vocabulary types
      'multiple_choice',
      'word_formation', 
      'sentence_transformation',
      // Listening types (1 audio for multiple questions)
      'listening_multiple_choice',
      'listening_note_completion',
      'listening_form_filling',
      'listening_matching',
      // Reading types (1 passage for multiple questions) 
      'reading_multiple_choice',
      'reading_matching',
      'reading_gapped_text',
      'reading_true_false',
      // Writing types
      'short_message',
      'informal_email',
      'formal_email', 
      'essay_opinion',
      // Speaking types (may include images)
      'personal_information',
      'describing_photo',
      'comparing_situations',
      'discussion_topic'
    ])
    .withMessage('Invalid question type'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

exports.importQuestionsRules = [
  body('questions')
    .isArray({ min: 1 }).withMessage('Questions must be a non-empty array'),
  
  body('questions.*.skill_id')
    .isInt().withMessage('Each question must have a valid skill_id'),
  
  body('questions.*.level_id')
    .isInt().withMessage('Each question must have a valid level_id'),
  
  body('questions.*.type')
    .isIn([
      // Grammar & Vocabulary types
      'multiple_choice',
      'word_formation', 
      'sentence_transformation',
      // Listening types (1 audio for multiple questions)
      'listening_multiple_choice',
      'listening_note_completion',
      'listening_form_filling',
      'listening_matching',
      // Reading types (1 passage for multiple questions) 
      'reading_multiple_choice',
      'reading_matching',
      'reading_gapped_text',
      'reading_true_false',
      // Writing types
      'short_message',
      'informal_email',
      'formal_email', 
      'essay_opinion',
      // Speaking types (may include images)
      'personal_information',
      'describing_photo',
      'comparing_situations',
      'discussion_topic'
    ])
    .withMessage('Invalid question type'),
  
  body('questions.*.question_text')
    .trim()
    .notEmpty().withMessage('Question text is required')
];
