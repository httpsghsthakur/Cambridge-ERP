const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Result = sequelize.define('Result', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id:     { type: DataTypes.INTEGER, allowNull: false },
  exam_name:      { type: DataTypes.STRING(80) },
  exam_type:      { type: DataTypes.ENUM('unit_test', 'half_yearly', 'annual', 'assessment', 'class_test') },
  class:          { type: DataTypes.STRING(20) },
  section:        { type: DataTypes.STRING(5) },
  session_id:     { type: DataTypes.INTEGER },
  total_marks:    { type: DataTypes.INTEGER },
  total_obtained: { type: DataTypes.INTEGER },
  percentage:     { type: DataTypes.DECIMAL(5, 2) },
  grade:          { type: DataTypes.STRING(5) },
  rank:           { type: DataTypes.INTEGER },
  entered_by:     { type: DataTypes.INTEGER },

  // ── Workflow ──────────────────────────────────────────────────────────────
  workflow_status: {
    type: DataTypes.ENUM(
      'draft',             // teacher saved
      'submitted',         // teacher submitted for review
      'incharge_approved', // class incharge approved
      'admin2_approved',   // admin2 approved
      'published',         // admin published
      'rejected'           // rejected at any stage
    ),
    defaultValue: 'draft'
  },
  incharge_reviewed_by:  { type: DataTypes.INTEGER, allowNull: true },
  incharge_reviewed_at:  { type: DataTypes.DATE,    allowNull: true },
  admin2_approved_by:    { type: DataTypes.INTEGER, allowNull: true },
  admin2_approved_at:    { type: DataTypes.DATE,    allowNull: true },
  admin_approved_by:     { type: DataTypes.INTEGER, allowNull: true },
  admin_approved_at:     { type: DataTypes.DATE,    allowNull: true },
  rejection_reason:      { type: DataTypes.TEXT,    allowNull: true },
  workflow_notes:        { type: DataTypes.TEXT,    allowNull: true },

  is_published:   { type: DataTypes.BOOLEAN, defaultValue: false },

  // For class tests — sent directly to parents
  is_class_test:  { type: DataTypes.BOOLEAN, defaultValue: false },
  sent_to_parents:{ type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'results' });

module.exports = Result;