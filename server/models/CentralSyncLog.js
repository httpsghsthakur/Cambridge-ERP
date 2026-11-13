const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CentralSyncLog = sequelize.define('CentralSyncLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sync_type: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: 'scheduled_sync',
  },
  status: {
    type: DataTypes.STRING(32),
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
  started_at: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('created_at');
    },
  },
  records_synced: {
    type: DataTypes.VIRTUAL,
    get() {
      if (!this.payload_summary) return 0;
      try {
        const p = JSON.parse(this.payload_summary);
        return (p.students_total || 0) + (p.teachers_total || 0) + (p.classes_count || 0);
      } catch (e) {
        return 0;
      }
    },
  },
}, {
  tableName: 'central_sync_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CentralSyncLog;
