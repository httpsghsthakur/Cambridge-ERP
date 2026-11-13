const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  first_name:  { type: DataTypes.STRING(60), allowNull: false },
  last_name:   { type: DataTypes.STRING(60), allowNull: false },
  date_of_birth: DataTypes.DATEONLY,
  gender:      DataTypes.ENUM('Male', 'Female', 'Other'),
  class:       { type: DataTypes.STRING(20), allowNull: false },
  section:     { type: DataTypes.STRING(5),  allowNull: false },
  roll_number: DataTypes.INTEGER,
  session_id:  DataTypes.INTEGER,

  // Parent info
  parent_name:       DataTypes.STRING(100),
  parent_email:      DataTypes.STRING(150),
  parent_phone:      DataTypes.STRING(15),
  parent_address:    DataTypes.TEXT,
  parent_occupation: DataTypes.STRING(100),

  admission_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },

  // ── Status system ─────────────────────────────────────────────────────────
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  student_status: {
    type: DataTypes.ENUM('active', 'inactive', 'alumni', 'transferred', 'suspended'),
    defaultValue: 'active'
  },
  // Source of creation
  source: {
    type: DataTypes.ENUM('admin_created', 'admission_approved'),
    defaultValue: 'admin_created'
  },
  admission_request_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approval_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved'
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
}, {
  tableName: 'students',
  getterMethods: {
    full_name() { return `${this.first_name} ${this.last_name}`; }
  }
});

module.exports = Student;
