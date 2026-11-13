const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentAchievement = sequelize.define('StudentAchievement', {
  id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id:          { type: DataTypes.INTEGER, allowNull: false },
  class:               { type: DataTypes.STRING(20), allowNull: false },
  section:             { type: DataTypes.STRING(5), allowNull: false },
  session_id:          { type: DataTypes.INTEGER, allowNull: true },
  category:            { type: DataTypes.STRING(60), allowNull: false },
  title:               { type: DataTypes.STRING(150), allowNull: false },
  position:            { type: DataTypes.STRING(50), allowNull: false },
  event_date:          { type: DataTypes.DATEONLY, allowNull: true },
  level:               { type: DataTypes.STRING(50), allowNull: true },
  description:         { type: DataTypes.TEXT, allowNull: true },
  added_by_teacher_id: { type: DataTypes.INTEGER, allowNull: true },
  added_by_user_id:    { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'student_achievements' });

module.exports = StudentAchievement;

