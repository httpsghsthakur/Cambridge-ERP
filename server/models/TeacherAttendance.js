const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherAttendance = sequelize.define('TeacherAttendance', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  date:       { type: DataTypes.DATEONLY, allowNull: false },
  status:     {
    type: DataTypes.ENUM('present', 'absent', 'half_day', 'leave', 'holiday'),
    allowNull: false
  },
  marked_by:  { type: DataTypes.INTEGER },  // admin user id
  remarks:    { type: DataTypes.STRING(200) },
}, {
  tableName: 'teacher_attendance',
  indexes: [{ unique: true, fields: ['teacher_id', 'date'] }]
});

module.exports = TeacherAttendance;