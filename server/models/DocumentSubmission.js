const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentSubmission = sequelize.define('DocumentSubmission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  custom_data: {
    type: DataTypes.JSON, // Responses to the custom fields
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'document_submissions',
});

module.exports = DocumentSubmission;
