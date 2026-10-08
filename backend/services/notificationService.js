const axios = require('axios');
const { query } = require('../db');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification via Expo Push Notification API
 */
async function sendExpoPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken || typeof pushToken !== 'string' || !pushToken.startsWith('ExponentPushToken[')) {
    return { success: false, reason: 'Invalid or missing Expo push token' };
  }

  try {
    const payload = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    const response = await axios.post(EXPO_PUSH_URL, payload, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.warn('[PushNotification] Error sending Expo push notification:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Persist an in-app notification for a customer and trigger push notification if token available
 */
async function createCustomerNotification(customerId, title, message, type = 'system', dataPayload = {}) {
  if (!customerId) return null;

  try {
    const result = await query(
      `INSERT INTO notifications (customer_id, title, message, type, data_payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customerId, title, message, type, JSON.stringify(dataPayload)]
    );

    const notification = result.rows[0];

    // Check if customer has an Expo push token for live mobile alert
    try {
      const custRes = await query('SELECT expo_push_token FROM customers WHERE id = $1', [customerId]);
      const pushToken = custRes.rows[0]?.expo_push_token;
      if (pushToken) {
        sendExpoPushNotification(pushToken, title, message, dataPayload).catch(() => undefined);
      }
    } catch (pushErr) {
      console.warn('[NotificationService] Push dispatch error:', pushErr.message);
    }

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating customer notification:', err.message);
    return null;
  }
}

module.exports = {
  createCustomerNotification,
  sendExpoPushNotification,
};
