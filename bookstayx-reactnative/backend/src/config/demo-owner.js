const DEMO_OWNER_PROPERTY_IDS = Object.freeze({
  villa: 'BSX-V001',
  camping_cottages: 'BSX-CAMP01',
  resort: 'BSX-RESORT01',
  homestay: 'BSX-HOMESTAY01',
});

function normalizeDemoOwnerCategory(value) {
  const category = String(value || '').toLowerCase().trim();
  if (!category) return 'villa';
  if (['camping_cottages', 'campings_cottages', 'camping', 'campings', 'bsx-camp01'].includes(category)) {
    return 'camping_cottages';
  }
  if (['resort', 'hotel', 'bsx-resort01'].includes(category)) return 'resort';
  if (['homestay', 'bsx-homestay01'].includes(category)) return 'homestay';
  if (['villa', 'villas', 'bsx-v001'].includes(category)) return 'villa';
  return 'villa';
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
