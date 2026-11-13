const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StaffLeave = sequelize.define('StaffLeave', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  leave_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  admin_remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_days: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: true
  },
  attachment_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  action_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'staff_leaves',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = StaffLeave;
