const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * CentralBillingAuditLog Model
 * Audits every action performed by central administrators:
 * - Setting/updating subscription charges
 * - Generating monthly billing records
 * - Recording or correcting payments
 * - Remote suspension and reactivation commands
 */
const CentralBillingAuditLog = sequelize.define('CentralBillingAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING(64),
    allowNull: false, // create_subscription, update_charges, record_payment, correct_payment, suspend_school, reactivate_school, extend_subscription
  },
  school_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  target_entity: {
    type: DataTypes.STRING(64),
    allowNull: true, // subscription, invoice, payment, remote_command
  },
  target_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  changes: {
    type: DataTypes.TEXT,
    allowNull: true, // JSON string of before / after changes
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  performed_by: {
    type: DataTypes.STRING(128),
    allowNull: false,
    defaultValue: 'central_admin',
  },
  ip_address: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
}, {
  tableName: 'central_billing_audit_logs',
  timestamps: true,
  underscored: true,
});

module.exports = CentralBillingAuditLog;
