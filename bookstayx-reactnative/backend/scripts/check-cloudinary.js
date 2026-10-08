require('dotenv').config();

const { cloudinary } = require('../utils/cloudinary');

async function checkCloudinary() {
  const requiredVariables = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing Cloudinary variables: ${missingVariables.join(', ')}`);
  }

  const result = await cloudinary.api.ping();
  if (result?.status !== 'ok') {
    throw new Error('Cloudinary returned an unexpected health response.');
  }

  console.log('Cloudinary connection check passed.');
}

checkCloudinary().catch((error) => {
  console.error(`Cloudinary connection check failed: ${error.message}`);
  process.exitCode = 1;
});
