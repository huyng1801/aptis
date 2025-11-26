const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Exam = sequelize.define('Exam', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  level_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'levels',
      key: 'id'
    }
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Exam duration in minutes'
  },
  total_points: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 0
  },
  passing_score: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: 'Minimum score to pass'
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When exam becomes available'
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When exam is no longer available'
  },
  max_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Maximum number of attempts allowed'
  },
  shuffle_questions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  show_results_immediately: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'exams',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Exam;
