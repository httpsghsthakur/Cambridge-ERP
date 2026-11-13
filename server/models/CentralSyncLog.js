const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CentralSyncLog = sequelize.define('CentralSyncLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sync_type: {
    type: DataTypes.ENUM('heartbeat', 'scheduled_sync', 'manual_sync', 'command_sync'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'partial', 'in_progress'),
    defaultValue: 'in_progress',
  },
  payload_summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON summary of synced counts (Strictly non-financial only)',
  },
  response_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duration_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'central_sync_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CentralSyncLog;
