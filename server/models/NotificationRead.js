const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationRead = sequelize.define('NotificationRead', {
  notification_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  read_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notification_reads',
  timestamps: false
});

module.exports = NotificationRead;