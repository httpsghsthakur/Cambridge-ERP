const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CentralConfig = sequelize.define('CentralConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  school_id: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: true,
    comment: 'Permanent unique School ID issued by Central Platform',
  },
  school_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  connection_status: {
    type: DataTypes.ENUM(
      'not_registered',
      'registration_pending',
      'awaiting_pairing',
      'pairing_verification',
      'connected',
      'disconnected',
      'suspended',
      'revoked',
      'connection_error'
    ),
    defaultValue: 'not_registered',
  },
  central_api_url: {
    type: DataTypes.STRING(255),
    defaultValue: 'https://central.schoolplatform.net',
  },
  connector_client_id: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  connector_secret: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Secure shared secret for HMAC-SHA256 signature generation and verification',
  },
  pairing_token: {
    type: DataTypes.STRING(128),
    allowNull: true,
    comment: 'One-time secure pairing challenge token issued during registration',
  },
  pairing_token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  approved_permissions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string of automatically provisioned operational permissions',
  },
  subscription_plan: {
    type: DataTypes.STRING(64),
    defaultValue: 'Standard Commercial',
  },
  subscription_status: {
    type: DataTypes.STRING(32),
    defaultValue: 'active',
  },
  subscription_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_suspended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  suspension_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  suspended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_heartbeat_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_sync_status: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  last_error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  connector_version: {
    type: DataTypes.STRING(32),
    defaultValue: '1.0.0',
  },
  erp_version: {
    type: DataTypes.STRING(32),
    defaultValue: '2.4.0',
  },
  sync_interval_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
  },
}, {
  tableName: 'central_integration_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CentralConfig;
