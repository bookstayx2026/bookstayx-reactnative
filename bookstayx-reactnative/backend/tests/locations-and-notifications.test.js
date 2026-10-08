const assert = require('node:assert/strict');
const test = require('node:test');

test('notification service exports expected functions', () => {
  const notificationService = require('../services/notificationService');
  assert.equal(typeof notificationService.createCustomerNotification, 'function');
  assert.equal(typeof notificationService.sendExpoPushNotification, 'function');
});

test('expo push notification validator rejects malformed tokens without throwing', async () => {
  const notificationService = require('../services/notificationService');
  const result = await notificationService.sendExpoPushNotification('invalid_token', 'Test', 'Body');
  assert.equal(result.success, false);
  assert.ok(result.reason.includes('Invalid or missing'));
});

test('location controller exports expected handler functions', () => {
  const locationController = require('../controllers/locationController');
  assert.equal(typeof locationController.getLocations, 'function');
  assert.equal(typeof locationController.getPopularLocations, 'function');
  assert.equal(typeof locationController.getLocationBySlug, 'function');
  assert.equal(typeof locationController.createLocation, 'function');
  assert.equal(typeof locationController.updateLocation, 'function');
  assert.equal(typeof locationController.deleteLocation, 'function');
});

test('notification controller exports expected handler functions', () => {
  const notificationController = require('../controllers/notificationController');
  assert.equal(typeof notificationController.getCustomerNotifications, 'function');
  assert.equal(typeof notificationController.markAsRead, 'function');
  assert.equal(typeof notificationController.markAllAsRead, 'function');
  assert.equal(typeof notificationController.registerDeviceToken, 'function');
});
