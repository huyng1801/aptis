const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttemptAnswer = sequelize.define('AttemptAnswer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  attempt_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'exam_attempts',
      key: 'id'
    }
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'questions',
      key: 'id'
    }
  },
  answer_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Text answer or selected option'
  },
  audio_url: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL for speaking answers'
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'NULL for essay/speaking until graded'
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  ai_feedback: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'AI grading feedback for essay/speaking'
  },
  needs_manual_review: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Flag for manual teacher review'
  },
  review_reason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Reason for manual review requirement'
  },
  manual_review_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Teacher who performed manual review'
  },
  manual_review_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp of manual review'
  },
  graded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Teacher who graded manually'
  },
  graded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Manual feedback from teacher'
  }
}, {
  tableName: 'attempt_answers',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['attempt_id', 'question_id']
    }
  ]
});

module.exports = AttemptAnswer;
