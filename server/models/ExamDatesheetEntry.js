const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamDatesheetEntry = sequelize.define('ExamDatesheetEntry', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  datesheet_id:   { type: DataTypes.INTEGER, allowNull: false },
  subject:        { type: DataTypes.STRING(100), allowNull: false },
  exam_date:      { type: DataTypes.DATEONLY, allowNull: false },
  start_time:     { type: DataTypes.STRING(15), allowNull: false },
  end_time:       { type: DataTypes.STRING(15), allowNull: false },
  room:           { type: DataTypes.STRING(50), allowNull: true },
  syllabus_notes: { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'exam_datesheet_entries' });

module.exports = ExamDatesheetEntry;

