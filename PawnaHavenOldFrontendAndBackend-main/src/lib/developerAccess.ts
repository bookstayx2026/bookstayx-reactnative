const ADMIN_DEVELOPER_KEY = "adminDeveloperMode";
const OWNER_DEVELOPER_KEY = "ownerDeveloperMode";
const REFERRAL_DEVELOPER_KEY = "referralDeveloperMode";

export const isAdminDeveloperMode = () => localStorage.getItem(ADMIN_DEVELOPER_KEY) === "true";
export const isOwnerDeveloperMode = () => localStorage.getItem(OWNER_DEVELOPER_KEY) === "true";
export const isReferralDeveloperMode = () => localStorage.getItem(REFERRAL_DEVELOPER_KEY) === "true";

export const startAdminDeveloperSession = () => {
  localStorage.setItem(ADMIN_DEVELOPER_KEY, "true");
  localStorage.setItem("adminUser", JSON.stringify({ id: "developer-preview", email: "developer@preview.local", role: "developer" }));
};

export const startOwnerDeveloperSession = () => {
  localStorage.setItem(OWNER_DEVELOPER_KEY, "true");
  localStorage.setItem("ownerLoggedIn", "true");
  localStorage.setItem("ownerData", JSON.stringify({
    id: "demo-villa-1",
    property_id: "DEMO-V-1",
    propertyId: "DEMO-V-1",
    property_name: "Azure Lake Villa",
    propertyName: "Azure Lake Villa",
    property_type: "villa",
    property_category: "villa",
    owner_name: "Developer Preview",
    ownerName: "Developer Preview",
    owner_otp_number: "0000000000",
  }));
};

export const startReferralDeveloperSession = () => {
  localStorage.setItem(REFERRAL_DEVELOPER_KEY, "true");
  localStorage.setItem("referral_token", "developer-preview");
};

export const clearDeveloperSessions = () => {
  localStorage.removeItem(ADMIN_DEVELOPER_KEY);
  localStorage.removeItem(OWNER_DEVELOPER_KEY);
  localStorage.removeItem(REFERRAL_DEVELOPER_KEY);
};
