const webPush = require('web-push');
const { PushSubscription } = require('../models');

// Configure VAPID details
const mailto = `mailto:${process.env.EMAIL_USER || 'info@kishtwareduhub.com'}`;
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  try {
    webPush.setVapidDetails(mailto, publicKey, privateKey);
    console.log('[PushService] VAPID details set successfully.');
  } catch (err) {
    console.error('[PushService] Failed to set VAPID details:', err);
  }
} else {
  console.warn('[PushService] WARNING: VAPID keys missing in env. Web Push notifications are disabled.');
}

/**
 * Sends a push notification to all devices registered for a specific user.
 * @param {number} userId - The user ID.
 * @param {string} title - The notification title.
 * @param {string} message - The notification message content.
 */
const sendPushToUser = async (userId, title, message) => {
  try {
    const subs = await PushSubscription.findAll({ where: { user_id: userId } });
    if (subs.length === 0) return;

    const payload = JSON.stringify({ title, message });

    const promises = subs.map(async (sub) => {
      const subscriptionObj = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webPush.sendNotification(subscriptionObj, payload);
      } catch (err) {
        // If the subscription has expired or is invalid (Status 410 or 404), delete it from DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[PushService] Deleting expired push subscription: ${sub.id}`);
          await sub.destroy();
        } else {
          console.error(`[PushService] Error sending to subscription ${sub.id}:`, err.message || err);
        }
      }
    });

    await Promise.all(promises);
  } catch (err) {
    console.error('[PushService] sendPushToUser error:', err);
  }
};

/**
 * Sends a push notification to all users matching a specific role.
 * @param {string} role - The target user role (or 'all').
 * @param {string} title - Notification title.
 * @param {string} message - Notification message.
 */
const sendPushToRole = async (role, title, message) => {
  try {
    const { User } = require('../models');
    const where = { is_active: true };
    if (role !== 'all') {
      where.role = role;
    }
    const users = await User.findAll({ where, attributes: ['id'] });
    const userIds = users.map(u => u.id);

    const promises = userIds.map(id => sendPushToUser(id, title, message));
    await Promise.all(promises);
  } catch (err) {
    console.error('[PushService] sendPushToRole error:', err);
  }
};

module.exports = {
  sendPushToUser,
  sendPushToRole,
};
