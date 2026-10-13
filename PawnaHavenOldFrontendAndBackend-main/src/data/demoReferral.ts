export const demoReferralDashboard = {
  username: "Aarav Demo Partner",
  referral_code: "PAWNADEMO25",
  referral_type: "public",
  commission_label: "15% commission",
  linked_property_id: null,
  linked_property_slug: null,
  total_earnings: 48250,
  total_withdrawals: 27500,
  available_balance: 18250,
  pending_withdrawal_amount: 2500,
  total_referrals: 14,
  saved_upi_id: "demo.partner@upi",
};

export const demoReferralInProcess = [
  {
    booking_id: "DEMO-BK-1042",
    property_name: "Azure Lake Villa",
    guest_name: "Demo Guest One",
    checkin_datetime: "2026-10-04T14:00:00.000Z",
    checkout_datetime: "2026-10-05T11:00:00.000Z",
    referrer_commission: 2100,
  },
  {
    booking_id: "DEMO-BK-1047",
    property_name: "Moonlit Dome Retreat",
    guest_name: "Demo Guest Two",
    checkin_datetime: "2026-10-11T14:00:00.000Z",
    checkout_datetime: "2026-10-12T11:00:00.000Z",
    referrer_commission: 1350,
  },
];

export const demoReferralHistory = [
  { type: "booking_success" as const, property_name: "Lakeside Story Camp", guest_name: "Demo Guest A", amount: 1950, date: "2026-09-21T10:30:00.000Z", message: "Referral commission credited" },
  { type: "booking_success" as const, property_name: "Golden Ridge Villa", guest_name: "Demo Guest B", amount: 4200, date: "2026-09-15T09:10:00.000Z", message: "Referral commission credited" },
  { type: "withdrawal_paid" as const, amount: 5000, date: "2026-09-08T12:00:00.000Z", message: "Withdrawal paid successfully", upi_id: "demo.partner@upi" },
  { type: "booking_cancelled" as const, property_name: "Riverside Glamping", guest_name: "Demo Guest C", amount: 0, date: "2026-09-03T08:45:00.000Z", message: "Booking cancelled; no commission credited" },
  { type: "booking_success" as const, property_name: "Color Cove Villa", guest_name: "Demo Guest D", amount: 5100, date: "2026-08-28T16:20:00.000Z", message: "Referral commission credited" },
];

export const demoReferralUpiIds = [
  {
    id: -1,
    upi_id: "demo.partner@upi",
    beneficiary_name: "Aarav Demo Partner",
    is_default: true,
    created_at: "2026-08-01T10:00:00.000Z",
  },
];
