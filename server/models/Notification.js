const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { sendPushToUsers } = require('../utils/pushService');

const Notification = sequelize.define('Notification', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:   { type: DataTypes.STRING(150), allowNull: false },
  message: { type: DataTypes.TEXT,        allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'fee_reminder', 'attendance_alert', 'result',
      'general', 'holiday', 'admission', 'promotion',
      'exam_datesheet', 'achievement'
    ),
    defaultValue: 'general'
  },
  sent_by: DataTypes.INTEGER,

  // ── Recipient config ───────────────────────────────────────────────────────
  recipient_type: {
    type: DataTypes.ENUM('all', 'role', 'individual'),
    defaultValue: 'all'
  },
  recipient_role: {
    type: DataTypes.ENUM('all', 'students', 'parents', 'teachers', 'fee_collector', 'admin2'),
    allowNull: true
  },
  recipient_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true   // Only set when recipient_type = 'individual'
  },

  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { 
  tableName: 'notifications',
  hooks: {
    afterCreate: async (notification, options) => {
      try {
        const { User } = notification.sequelize.models;
        let targetUserIds = [];

        if (notification.recipient_type === 'individual' && notification.recipient_user_id) {
          targetUserIds = [notification.recipient_user_id];
        } else if (notification.recipient_type === 'all') {
          const users = await User.findAll({ attributes: ['id'] });
          targetUserIds = users.map(u => u.id);
        } else if (notification.recipient_type === 'role' && notification.recipient_role) {
          let rolesToQuery = [];
          if (notification.recipient_role === 'all') {
             rolesToQuery = ['admin', 'admin2', 'parent', 'teacher', 'fee_collector'];
          } else if (notification.recipient_role === 'parents') {
             rolesToQuery = ['parent'];
          } else if (notification.recipient_role === 'teachers') {
             rolesToQuery = ['teacher'];
          } else if (notification.recipient_role === 'students') {
             rolesToQuery = ['student'];
          } else {
             rolesToQuery = [notification.recipient_role];
          }
          
          const users = await User.findAll({ 
            where: { role: rolesToQuery },
            attributes: ['id'] 
          });
          targetUserIds = users.map(u => u.id);
        }

        if (targetUserIds.length > 0) {
          // Fire and forget push notification delivery
          sendPushToUsers(targetUserIds, {
            title: notification.title,
            message: notification.message
          }).catch(err => console.error('[NotificationHook] Push delivery error:', err));
        }
      } catch (error) {
        console.error('[NotificationHook] Failed to process push notifications:', error);
      }
    }
  }
});

module.exports = Notification;
