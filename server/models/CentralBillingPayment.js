const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * CentralBillingPayment Model
 * Tracks payments received from schools for their ERP subscription.
 * Supports partial, full, and overpayments, with correction tracking.
 */
const CentralBillingPayment = sequelize.define('CentralBillingPayment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  payment_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true, // e.g. PAY-202611-SCH001-XXXX
  },
  billing_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  school_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'bank_transfer', // bank_transfer, upi, credit_card, cheque, cash, gateway
  },
  transaction_ref: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recorded_by: {
    type: DataTypes.STRING(128),
    allowNull: false,
    defaultValue: 'central_admin',
  },
  is_correction: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  correction_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'central_billing_payments',
  timestamps: true,
  underscored: true,
});

module.exports = CentralBillingPayment;
