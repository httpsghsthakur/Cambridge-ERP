const webpush = require('web-push');
const { Op } = require('sequelize');

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@schoolerp.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[PushService] VAPID keys are missing from .env. Push notifications will fail.');
}

/**
 * Send a push notification to a specific list of users
 * @param {Array<number>} userIds - Array of User IDs to notify
 * @param {Object} payload - Notification payload { title, message }
 */
const sendPushToUsers = async (userIds, payload) => {
  if (!userIds || userIds.length === 0) return;
  
  const { PushSubscription } = require('../models');
  
  try {
    // Find all subscriptions for these users
    const subscriptions = await PushSubscription.findAll({
      where: {
        user_id: { [Op.in]: userIds }
      }
    });

    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title || 'New Notification',
      message: payload.message || 'You have a new update.'
    });

    // Send notifications in parallel
    const promises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSubscription, pushPayload)
        .catch(async (error) => {
          // If subscription is invalid/expired (HTTP 410 or 404), remove it from DB
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[PushService] Subscription expired for User ID ${sub.user_id}. Removing from DB.`);
            await sub.destroy();
          } else {
            console.error(`[PushService] Failed to send push to User ID ${sub.user_id}:`, error);
          }
        });
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error('[PushService] Error fetching subscriptions:', err);
  }
};

module.exports = {
  sendPushToUsers
};
