const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResultSubject = sequelize.define('ResultSubject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  result_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  max_marks: {
    type: DataTypes.INTEGER
  },
  obtained_marks: {
    type: DataTypes.INTEGER
  },
  grade: {
    type: DataTypes.STRING(5)
  }
}, {
  tableName: 'result_subjects'
});

module.exports = ResultSubject;