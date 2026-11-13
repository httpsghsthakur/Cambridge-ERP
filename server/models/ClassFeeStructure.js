const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassFeeStructure = sequelize.define('ClassFeeStructure', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  class: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true }
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  monthly_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  admission_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  annual_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  promotion_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  exam_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  monthly_due_date: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: { min: 1, max: 31 }
  },
  annual_due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  late_fee_per_day: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, { 
  tableName: 'class_fee_structures',
  indexes: [
    { unique: true, fields: ['class', 'session_id'] }
  ]
});

module.exports = ClassFeeStructure;