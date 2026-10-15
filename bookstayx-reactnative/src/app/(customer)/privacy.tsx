import { PolicyScreen } from "@/components/customer";

const PRIVACY_SECTIONS = [
  {
    title: "1. Introduction & Operational Scope",
    body: "BookStayX operates an online hospitality discovery and booking platform connecting guests with verified accommodations, luxury villas, campsites, and cottages in Maharashtra (including Pawna Lake, Lonavala, Alibaug, Pune, and the Konkan region). We handle personal data transparently, securely, and in full compliance with the Google Play Developer Program Policies, India's Information Technology Act 2000, and the Digital Personal Data Protection Act 2023 (DPDP Act).",
  },
  {
    title: "2. Information We Collect",
    body: "• Guest & Customer Details: Full name, 10-digit mobile number, email address, password hash (bcrypt), stay dates, guest counts (including dietary preferences like veg/non-veg counts), booking IDs, and digital e-ticket verification QR tokens.\n• Host / Owner Details: Registered phone number, WhatsApp contact, property details, amenities, photographs, and operational ledgers.\n• Referral Partners: Name, registered mobile number, unique referral code, and UPI ID for commission payouts.\n• Technical & Session Logs: Cryptographically hashed refresh tokens (SHA-256), JWT access tokens stored in hardware-backed Expo SecureStore, server request timestamps, and IP addresses for security rate limiting.\n• Push Notifications: Optional Expo push notification token (expo_push_token) stored when enabled solely for stay alerts.",
  },
  {
    title: "3. Device Permissions & Non-Tracking Policy",
    body: "• Camera & Photos (expo-image-picker): Requested only when an owner uploads property photos or a user chooses to update their profile picture. We never access your camera or gallery in the background.\n• Secure Storage (expo-secure-store): Used exclusively to store encrypted session tokens in Android Keystore / iOS Keychain.\n• No GPS Location Tracking: BookStayX does NOT request GPS location permissions (ACCESS_FINE_LOCATION or ACCESS_COARSE_LOCATION). All destination areas (Pawna, Lonavala, Alibaug, Konkan) are browseable categories. Property maps are viewed via external Google Maps directions links opened at your discretion.\n• No Third-Party Advertising: BookStayX contains no advertising SDKs (no AdMob, Facebook Audience Network, or data broker trackers).",
  },
  {
    title: "4. Purposes of Data Processing",
    body: "We process personal data for legitimate hospitality delivery:\n1. Facilitating property discovery, reservations, and generating check-in e-tickets with QR codes.\n2. User authentication via password and mobile OTP.\n3. Operational communications: Transactional booking confirmations, stay reminders, and receipts via SMS, WhatsApp, or email.\n4. Host arrival management and on-site hospitality coordination.\n5. Tracking attributed referral bookings and disbursing partner commissions.\n6. Concierge customer support and cancellation/refund processing.\n7. Complying with Indian statutory taxation (GST) and accounting requirements.",
  },
  {
    title: "5. Payment Information & Financial Processing",
    body: "• PCI-DSS Compliant Gateways: Online payments and affiliate disbursements are processed directly through certified payment gateways (Razorpay and Paytm).\n• No Storage of Cardholder Data: BookStayX never collects or stores credit/debit card numbers, CVVs, expiry dates, or net banking passwords.\n• Stored Transaction References: We store only non-sensitive tokens (Order ID, Payment Gateway Transaction ID, payment method, amount paid, and transaction status) for booking verification and statutory accounting.",
  },
  {
    title: "6. Third-Party Disclosures & Data Sharing",
    body: "We share data solely with trusted operational service providers on a need-to-know basis:\n• Booked Property Hosts: Guest name, phone, stay dates, guest counts, and meal preferences for check-in fulfillment.\n• Payment Gateways (Razorpay & Paytm): For payment collection, refunds, and UPI payouts.\n• Database & Cloud Infrastructure (Supabase / PostgreSQL): Hosted in secure AWS Asia Pacific (ap-south-1 Mumbai) cloud data centers with TLS in transit and encryption at rest.\n• Media Storage (Cloudinary): For property listing photography and user avatars.\n• Messaging Providers: MSG91 for SMS OTP delivery; Meta / WhatsApp Cloud API for automated transactional stay notifications.\n• Legal Authorities: Only when strictly mandated by Indian statutory regulations or valid court orders.\nWe never sell or trade your data to third-party marketers or advertisers.",
  },
  {
    title: "7. Security Practices & Safeguards",
    body: "• Encryption in Transit: Enforced HTTPS/TLS 1.2+ across all mobile, web, and API communication.\n• Password Hashing: Cryptographically hashed with salted bcrypt (10 rounds). Plaintext passwords are never stored or logged.\n• Token & OTP Hashing: One-time passwords and refresh tokens are cryptographically hashed using HMAC-SHA256 and SHA-256 before storage.\n• Automatic Purging: Expired OTP codes are purged automatically every 30 minutes. Single-use verification is strictly enforced.\n• Role-Based Access Control (RBAC): Strict server-side isolation prevents cross-role or cross-user data access.\n• Multi-Tier Rate Limiting: Sensitive endpoints are protected against brute-force attacks and abuse.\n• Hardware-Backed Device Storage: Mobile credentials are saved via Expo SecureStore.",
  },
  {
    title: "8. Data Retention Policy",
    body: "• Active Accounts: Personal data is retained for the active lifespan of your account.\n• Temporary Data: OTP codes expire in 5 minutes and are automatically deleted. Short-lived JWT access tokens expire in 15 minutes; refresh tokens expire in 2 days.\n• Statutory Records: Completed booking invoices, payments, and tax records are retained for the statutory period required under Indian financial and taxation laws (typically 7–8 financial years) with customer account references unlinked.",
  },
  {
    title: "9. Account Deletion & User Data Erasure",
    body: "In full compliance with Google Play Developer Program policies:\n• In-App Deletion: Available directly in My Account / Profile (/profile). Select 'Delete Account', re-enter your password to confirm ownership, and check the confirmation box. Deletion is immediate and atomic.\n• Public Web Deletion: Accessible without logging in at https://bookstayx.com/account-deletion (and locally at http://localhost:8081/account-deletion). Verify ownership via account password or phone OTP to immediately delete your account.\n• Manual Email Request: You may email support@bookstayx.com with the subject 'Account Deletion Request' from your registered contact details.\n• Data Erased Immediately: Personal profile, email, phone number, password hash, active sessions, in-app notifications, and OTP records are permanently destroyed.",
  },
  {
    title: "10. Statutory Data Retention Exceptions",
    body: "Under Indian financial, GST taxation, and consumer protection laws, completed booking invoices, financial ledgers, and transaction audit records must be retained for statutory legal compliance. When an account is deleted, the customer reference on booking records is unlinked (customer_id set to NULL), ensuring that retained financial records can never be linked to an active user profile.",
  },
  {
    title: "11. Children's Privacy",
    body: "BookStayX is intended for adult audiences interested in holiday accommodations and travel. Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has registered an account, please contact support@bookstayx.com for immediate removal.",
  },
  {
    title: "12. Your Privacy Rights",
    body: "Under applicable data protection laws, you have the right to:\n• Access and review your personal data and reservation history in the app.\n• Edit and rectify your contact information in your Profile.\n• Permanently delete your account and personal data at any time via in-app settings or the public deletion page.\n• Withdraw optional notification permissions in your device settings.\n• Submit inquiries or complaints to our Grievance Officer.",
  },
  {
    title: "13. Contact & Grievance Redressal",
    body: "Platform: BookStayX\nOperating Entity: BookStayX Hospitality Services\nSupport Email: support@bookstayx.com\nConcierge Helpline: +91 8806092609\nPublic Deletion Page: https://bookstayx.com/account-deletion\nOperational Region: Maharashtra, India\nFor privacy inquiries or grievances, contact us at support@bookstayx.com.",
  },
];

export default function PrivacyScreen() {
  return (
    <PolicyScreen
      title="Privacy Policy"
      subtitle="How BookStayX collects, safeguards, and respects your personal information."
      sections={PRIVACY_SECTIONS}
    />
  );
}
