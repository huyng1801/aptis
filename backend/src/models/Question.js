const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  skill_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'skills',
      key: 'id'
    }
  },
  level_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'levels',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
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
    ),
    allowNull: false
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  media_url: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL for audio/image files'
  },
  passage_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Groups questions that share same audio/reading passage'
  },
  part_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'APTIS part number (1-4 for each skill)'
  },
  passage_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reading passage or listening transcript for reference'
  },
  time_limit_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Individual question time limit for speaking tasks'
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of options for multiple choice questions'
  },
  correct_answer: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Correct answer or answer key'
  },
  points: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 1.0
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Explanation for the correct answer'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'questions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Question;
