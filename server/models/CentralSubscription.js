const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * CentralSubscription Model
 * Manages our business subscription revenue from schools using our ERP.
 * 
 * STRICT PRIVACY REQUIREMENT:
 * This model relates ONLY to our commercial ERP service licensing.
 * It NEVER tracks student fees, collections, or school internal finances.
 */
const CentralSubscription = sequelize.define('CentralSubscription', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  school_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  school_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'School ERP Client',
  },
  plan: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: 'standard', // standard, professional, enterprise, custom
  },
  monthly_charge: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 150.00,
  },
  custom_charge: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'USD',
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  next_due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'active', // active, past_due, suspended, cancelled, trial
  },
  grace_period_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'central_subscriptions',
  timestamps: true,
  underscored: true,
});

module.exports = CentralSubscription;
