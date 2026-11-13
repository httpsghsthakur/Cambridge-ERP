const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SecurityLog = sequelize.define('SecurityLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  severity: {
    type: DataTypes.ENUM('red', 'yellow', 'green'),
    allowNull: false,
    defaultValue: 'green'
  },
  threat_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  what_happened: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  what_could_happen: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'security_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = SecurityLog;
