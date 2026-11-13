const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassIncharge = sequelize.define('ClassIncharge', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  class:      { type: DataTypes.STRING(20), allowNull: false },
  section:    { type: DataTypes.STRING(5),  allowNull: false },
  session_id: { type: DataTypes.INTEGER },
  assigned_by:{ type: DataTypes.INTEGER },  // admin2 or admin
  is_active:  { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'class_incharges',
  indexes: [{ unique: true, fields: ['class', 'section', 'session_id'] }]
});

module.exports = ClassIncharge;