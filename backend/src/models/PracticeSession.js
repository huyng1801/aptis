const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PracticeSession = sequelize.define('PracticeSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
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
  questions_answered: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  correct_answers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_points_earned: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 0
  },
  session_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  time_spent_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'practice_sessions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PracticeSession;
