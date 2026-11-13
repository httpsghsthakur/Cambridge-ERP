const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassSubject = sequelize.define('ClassSubject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  class: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  session_id: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'class_subjects',
  timestamps: true
});

module.exports = ClassSubject;
