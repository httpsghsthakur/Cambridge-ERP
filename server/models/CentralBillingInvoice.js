const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * CentralBillingInvoice Model
 * Tracks monthly subscription charges generated for each school.
 * Preserves historical billing rates so future price changes do not modify past invoices.
 */
const CentralBillingInvoice = sequelize.define('CentralBillingInvoice', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  billing_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true, // e.g. INV-2026-11-SCH001
  },
  school_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  billing_month: {
    type: DataTypes.INTEGER,
    allowNull: false, // 1-12
  },
  billing_year: {
    type: DataTypes.INTEGER,
    allowNull: false, // e.g. 2026
  },
  amount_due: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'unpaid', // unpaid, partially_paid, paid, overdue, waived
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'central_billing_invoices',
  timestamps: true,
  underscored: true,
});

module.exports = CentralBillingInvoice;
