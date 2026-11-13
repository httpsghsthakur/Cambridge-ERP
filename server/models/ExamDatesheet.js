const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamDatesheet = sequelize.define('ExamDatesheet', {
  id:                    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  exam_name:             { type: DataTypes.STRING(100), allowNull: false },
  exam_type:             { type: DataTypes.ENUM('unit_test', 'half_yearly', 'annual', 'assessment', 'pre_board', 'other'), defaultValue: 'unit_test' },
  class:                 { type: DataTypes.STRING(20), allowNull: false },
  section:               { type: DataTypes.STRING(5), allowNull: false },
  session_id:            { type: DataTypes.INTEGER, allowNull: true },
  created_by_teacher_id: { type: DataTypes.INTEGER, allowNull: true },
  created_by_user_id:    { type: DataTypes.INTEGER, allowNull: false },
  status:                { type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'declared'), defaultValue: 'draft' },
  instructions:          { type: DataTypes.TEXT, allowNull: true },
  review_notes:          { type: DataTypes.TEXT, allowNull: true },
  reviewed_by:           { type: DataTypes.INTEGER, allowNull: true },
  reviewed_at:           { type: DataTypes.DATE, allowNull: true },
  declared_by:           { type: DataTypes.INTEGER, allowNull: true },
  declared_at:           { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'exam_datesheets' });

module.exports = ExamDatesheet;

