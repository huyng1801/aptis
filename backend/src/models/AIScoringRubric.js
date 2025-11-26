const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AIScoringRubric = sequelize.define('AIScoringRubric', {
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
  criteria_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  max_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 10.00
  },
  weight_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ai_prompt_template: {
    type: DataTypes.TEXT,
    allowNull: false
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
  tableName: 'ai_scoring_rubrics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AIScoringRubric;