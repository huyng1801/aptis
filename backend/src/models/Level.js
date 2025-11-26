const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Level = sequelize.define('Level', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  order_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Order for display, lower number = higher priority'
  },
  level_value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: 'Numeric value for level comparison (1=A1, 2=A2, etc.)'
  },
  cefr_description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'levels',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Level;
