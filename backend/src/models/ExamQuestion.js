const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExamQuestion = sequelize.define('ExamQuestion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  exam_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'exams',
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
  order_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Question order in exam'
  },
  points_override: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Override default question points'
  }
}, {
  tableName: 'exam_questions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['exam_id', 'question_id']
    }
  ]
});

module.exports = ExamQuestion;
