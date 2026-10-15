const DEMO_OWNER_PROPERTY_IDS = Object.freeze({
  villa: 'BSX-V001',
  camping_cottages: 'BSX-CAMP01',
  resort: 'BSX-RESORT01',
  homestay: 'BSX-HOMESTAY01',
});

function normalizeDemoOwnerCategory(value) {
  const category = String(value || '').toLowerCase().trim();
  if (['camping_cottages', 'campings_cottages', 'camping', 'campings'].includes(category)) {
    return 'camping_cottages';
  }
  if (['resort', 'hotel'].includes(category)) return 'resort';
  if (category === 'homestay') return 'homestay';
  if (['villa', 'villas'].includes(category)) return 'villa';
  return null;
}

function getDemoOwnerPropertyId(category) {
  const normalized = normalizeDemoOwnerCategory(category);
  return normalized ? DEMO_OWNER_PROPERTY_IDS[normalized] : null;
}

function isDevelopmentLoginAllowed({ enabled, nodeEnv, role }) {
  return Boolean(enabled) && (nodeEnv !== 'production' || role === 'owner');
}

module.exports = {
  DEMO_OWNER_PROPERTY_IDS,
  getDemoOwnerPropertyId,
  isDevelopmentLoginAllowed,
  normalizeDemoOwnerCategory,
};
