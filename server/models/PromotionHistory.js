const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromotionHistory = sequelize.define('PromotionHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  from_class: {
    type: DataTypes.STRING(20)
  },
  from_section: {
    type: DataTypes.STRING(20)
  },
  to_class: {
    type: DataTypes.STRING(20)
  },
  from_session: {
    type: DataTypes.STRING(20)
  },
  from_session_name: {
    type: DataTypes.STRING(50)
  },
  to_session: {
    type: DataTypes.STRING(20)
  },
  to_session_name: {
    type: DataTypes.STRING(50)
  },
  attendance_present: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attendance_absent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attendance_late: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attendance_holiday: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attendance_working_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attendance_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  promoted_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'promotion_history'
});

module.exports = PromotionHistory;