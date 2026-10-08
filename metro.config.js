const { getDefaultConfig } = require('expo/metro-config');
const { startBackendWithExpo } = require('./scripts/start-backend-with-expo');

startBackendWithExpo();

module.exports = getDefaultConfig(__dirname);
