const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacher_id: {
    type: DataTypes.STRING(20),
    unique: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(15)
  },
  email: {
    type: DataTypes.STRING(150)
  },
  qualification: {
    type: DataTypes.STRING(100)
  },
  join_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('active', 'leave', 'inactive'),
    defaultValue: 'active'
  },
  assigned_classes: {
    type: DataTypes.TEXT
  },
  document_type: {
    type: DataTypes.STRING(50)
  },
  document_number: {
    type: DataTypes.STRING(100)
  },
  staff_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'Teacher'
  }
}, {
  tableName: 'teachers'
});

module.exports = Teacher;
