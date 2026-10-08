const { query } = require('../db');

/**
 * GET /api/notifications
 * Retrieves all notifications for the authenticated customer along with unread count.
 */
async function getCustomerNotifications(req, res, next) {
  try {
    const customerId = req.user.id;

    const [notificationsResult, unreadCountResult] = await Promise.all([
      query(
        `SELECT id, title, message, type, is_read, data_payload, created_at
           FROM notifications
          WHERE customer_id = $1
          ORDER BY created_at DESC
          LIMIT 50`,
        [customerId]
      ),
      query(
        `SELECT COUNT(*)::int AS unread_count
           FROM notifications
          WHERE customer_id = $1 AND is_read = false`,
        [customerId]
      ),
    ]);

    return res.json({
      success: true,
      notifications: notificationsResult.rows,
      unreadCount: unreadCountResult.rows[0]?.unread_count || 0,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const result = await query(
      `UPDATE notifications
          SET is_read = true
        WHERE id = $1 AND customer_id = $2
        RETURNING id, is_read`,
      [id, customerId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/notifications/read-all
 * Marks all notifications as read for the logged-in customer.
 */
async function markAllAsRead(req, res, next) {
  try {
    const customerId = req.user.id;

    await query(
      `UPDATE notifications
          SET is_read = true
        WHERE customer_id = $1 AND is_read = false`,
      [customerId]
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/notifications/device-token
 * Saves or updates customer's Expo push token.
 */
async function registerDeviceToken(req, res, next) {
  try {
    const { token } = req.body;
    const customerId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required.',
      });
    }

    await query(
      `UPDATE customers
          SET expo_push_token = $1, updated_at = NOW()
        WHERE id = $2`,
      [String(token).trim(), customerId]
    );

    return res.json({
      success: true,
      message: 'Device token registered successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCustomerNotifications,
  markAsRead,
  markAllAsRead,
  registerDeviceToken,
};
