const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentRequest = sequelize.define('DocumentRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  document_type: {
    type: DataTypes.ENUM('pdf', 'image', 'any'),
    defaultValue: 'any',
  },
  recipient_type: {
    type: DataTypes.ENUM('everyone', 'all_students', 'all_teachers', 'individual'),
    allowNull: false,
  },
  recipients: {
    type: DataTypes.JSON, // Array of user IDs if recipient_type is 'individual'
    allowNull: true,
  },
  custom_fields: {
    type: DataTypes.JSON, // Array of { name: string, type: string, required: boolean }
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'closed'),
    defaultValue: 'active',
  }
}, {
  tableName: 'document_requests',
});

module.exports = DocumentRequest;
