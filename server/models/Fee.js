const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fee = sequelize.define('Fee', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  month:      { type: DataTypes.STRING(20), allowNull: false },
  year:       { type: DataTypes.INTEGER,    allowNull: false },
  fee_type: {
    type: DataTypes.ENUM(
      'monthly', 'quarterly', 'annual',
      'exam', 'admission', 'promotion', 'miscellaneous', 'session_start'
    ),
    defaultValue: 'monthly'
  },
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paid_amount:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  due_date:     DataTypes.DATEONLY,
  paid_date:    DataTypes.DATEONLY,
  status: {
    type: DataTypes.ENUM('paid', 'unpaid', 'partial', 'waived', 'not_generated', 'overdue'),
    defaultValue: 'unpaid'
  },
  late_fee_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  payment_mode: DataTypes.ENUM('cash', 'online', 'cheque', 'dd', 'upi'),
  receipt_number: { type: DataTypes.STRING(30), unique: true },
  collected_by:   DataTypes.INTEGER,
  remarks:        DataTypes.TEXT,
  session_id:     DataTypes.INTEGER,
  // Fee breakdown (stored for receipt)
  fee_breakdown: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      const raw = this.getDataValue('fee_breakdown');
      if (!raw) return {};
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
          return {};
        }
      }
      return typeof raw === 'object' ? raw : {};
    }
  }
}, {
  tableName: 'fees',
  indexes: [
    // Unique per student per month per fee_type
    { unique: true, fields: ['student_id', 'month', 'year', 'fee_type'],
      name: 'unique_student_monthly_fee' }
  ]
});

module.exports = Fee;