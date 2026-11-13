const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CentralCommandLog = sequelize.define('CentralCommandLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  command_id: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true,
    comment: 'Unique Command UUID issued by Central Platform',
  },
  command_type: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'E.g., suspend, reactivate, sync_now, health_check, diagnostics, extend_subscription, update_subscription, rotate_credentials',
  },
  issued_by: {
    type: DataTypes.STRING(128),
    allowNull: true,
    comment: 'Central administrator ID or service issuer',
  },
  status: {
    type: DataTypes.ENUM('received', 'executed', 'rejected', 'failed'),
    defaultValue: 'received',
  },
  payload: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON validated command parameters',
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON result of command execution',
  },
  executed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'central_command_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CentralCommandLog;
