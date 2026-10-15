# Privacy Policy for BookStayX

**Effective Date:** October 15, 2026  
**Last Updated:** October 15, 2026  
**Application Name:** BookStayX  
**Package Name:** com.bookstayx.app  
**Official Support Email:** support@bookstayx.com  
**Concierge & Support Line:** +91 8806092609  
**Public Account Deletion URL:** https://bookstayx.com/account-deletion  
**Operational Region:** Maharashtra, India (Pawna Lake, Lonavala, Alibaug, Pune, and Konkan regions)

---

## 1. Introduction and Scope

Welcome to **BookStayX** ("we", "our", "us", or "the Platform"). BookStayX operates an online hospitality discovery and reservation platform connecting guests with verified accommodations, luxury villas, campsites, and cottages across Maharashtra.

We respect your personal privacy and are committed to handling your data transparently, securely, and in strict adherence to:
* **Google Play Developer Program Policies** (including the User Data Policy, Permissions Policy, and Account Deletion Requirement).
* The **Information Technology Act, 2000** (India) and the **Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011**.
* The **Digital Personal Data Protection Act, 2023** (DPDP Act, India).

This Privacy Policy explains what information we collect when you use the BookStayX mobile application, website, and related services, the legal and operational reasons for collecting it, how it is stored and safeguarded, third parties with whom data may be shared, and your rights to manage or permanently delete your personal information.

---

## 2. Information We Collect

We only collect personal information that is necessary to facilitate property discovery, manage reservations, verify user identity, process payments, and provide customer support.

### A. Information Provided by Guests / Customers
* **Contact & Profile Details:** Full name, mobile phone number, email address, optional home city/region, and optional profile avatar picture (if voluntarily uploaded).
* **Account Credentials:** Securely salted and hashed password (`bcrypt`), or phone verification tokens used to authenticate your session. Plaintext passwords are never collected, logged, or stored.
* **Reservation & Stay Information:** Selected property title, category (villa, campsite, cottage), check-in and check-out dates, guest counts (including dietary preferences such as vegetarian and non-vegetarian counts for meal preparation), booking reference numbers, and digital check-in e-ticket QR verification codes.
* **Support Inquiries:** Information provided when contacting our concierge or customer assistance teams via phone, email, or messaging.

### B. Information Provided by Property Owners / Hosts
* **Host Identity & Contact:** Owner full name, business or property title, registered mobile phone number, WhatsApp contact number, and optional emergency contact numbers.
* **Property Listings:** Property titles, geographical destination slugs, descriptions, amenities, activities, unit configurations, pricing structures (weekday/weekend rates), rules, and uploaded photographs.
* **Operational Records:** Reservation ledger entries, offline booking requests, housekeeping staff contact information, and property maintenance logs maintained for on-site operations.

### C. Information Provided by Referral Partners / Affiliates
* **Affiliate Details:** Name, registered mobile number, unique referral code, and referral click/booking attribution statistics.
* **Payout Information:** Unified Payments Interface (UPI) ID / Virtual Payment Address (VPA) provided by the partner to receive affiliate commission disbursements.

### D. Information Collected Automatically
* **Authentication Credentials:** Cryptographically signed JSON Web Tokens (JWTs) and rotating refresh tokens stored locally on your device using hardware-backed secure storage (`Expo SecureStore`).
* **Technical & Diagnostic Information:** Request timestamps, HTTP methods, route paths, IP addresses, and user-agent strings recorded in server logs for security auditing, rate limiting, and brute-force protection.
* **In-App Notifications:** System notification identifiers used to deliver in-app booking status changes and stay alerts.
* **Push Notification Token:** Optional Expo push notification token (`expo_push_token`) stored only when you grant notification permissions, used solely for sending reservation updates and stay reminders.

---

## 3. Device Permissions We Request

BookStayX requests only permissions strictly necessary for user-initiated app functionality. We adhere to the principle of least privilege:

| Permission | Category | Purpose | Actual Usage |
| :--- | :--- | :--- | :--- |
| **Camera / Photo Library** | Media & Files (`expo-image-picker`) | Profile avatar updates & property image uploads | Requested **only** when an owner uploads listing photos or a user chooses to change their profile picture. We never access your camera or gallery in the background. |
| **Secure Device Storage** | Storage (`expo-secure-store`) | Encrypted session persistence | Used exclusively to save authentication session tokens locally in Android Keystore / iOS Keychain so you stay logged in securely. |
| **Internet Access** | Network (`INTERNET`, `ACCESS_NETWORK_STATE`) | Network communication | Required to communicate with the BookStayX backend API, fetch property listings, and process reservations. |
| **Push Notifications** | Notifications (`POST_NOTIFICATIONS`) | Reservation alerts | Optional permission used solely to deliver real-time stay updates and booking status changes. |

### Clear Statement on Location and Background Tracking
* BookStayX **does not** request GPS location permissions (`ACCESS_FINE_LOCATION` or `ACCESS_COARSE_LOCATION`).
* BookStayX **does not** track your real-time location or collect background location data.
* Property destination areas (such as Pawna Lake, Lonavala, Alibaug, and Konkan) are browseable geographic categories. Physical property locations are provided via external Google Maps directions links opened in your browser or Google Maps app at your discretion.

### Clear Statement on Advertising and Tracking SDKs
* BookStayX **does not** integrate third-party advertising networks (no Google AdMob, Unity, Facebook Audience Network, or similar SDKs).
* BookStayX **does not** sell, rent, or monetize your personal data with third-party data brokers.
* BookStayX **does not** perform cross-app behavioral tracking.

---

## 4. How We Use Your Information

We process personal data for legitimate hospitality, contractual, and legal purposes:

1. **Reservation & Service Delivery:** Facilitating accommodation discovery, managing reservation dates, generating digital e-tickets with QR codes for guest verification at check-in, and providing property details.
2. **Account Authentication & Security:** Providing secure password login, passwordless mobile OTP verification, session management, and protecting against brute-force attacks and unauthorized account access.
3. **Transactional Communications:** Sending reservation confirmations, stay reminders, digital tickets, check-in instructions, and payment receipts via SMS, WhatsApp, or email.
4. **Host & Property Management:** Enabling property owners to view incoming guest arrivals, maintain reservation calendars, verify valid guest counts, and coordinate on-site hospitality.
5. **Referral Program & Commission Settlements:** Tracking attributed bookings, computing earned commissions, and disbursing affiliate payouts to verified UPI accounts.
6. **Customer Support:** Assisting with booking inquiries, handling cancellation or refund requests in accordance with our cancellation policy, and resolving technical issues.
7. **Statutory & Legal Compliance:** Complying with applicable Indian taxation (Goods and Services Tax / GST), accounting standards, and consumer protection regulations.

---

## 5. Payment Information and Financial Records

BookStayX facilitates advance payments for property reservations and affiliate commission disbursements:

* **PCI-DSS Compliant Payment Processors:** Online payments (credit cards, debit cards, net banking, and UPI) are processed directly by certified third-party payment gateways (**Razorpay** and **Paytm**).
* **No Storage of Cardholder Data:** BookStayX **never** collects, processes, or stores credit or debit card numbers, CVVs, card expiration dates, or net banking passwords. All sensitive payment details are securely entered directly on the payment gateway's encrypted interface.
* **Retained Transaction References:** For accounting reconciliation and booking verification, we store only non-sensitive transaction tokens: Payment Gateway Order ID, Payment Transaction ID, amount paid, payment method type, and transaction status (e.g. `SUCCESS`, `INITIATED`, `REFUNDED`).

---

## 6. Data Sharing and Third-Party Disclosures

We share personal information strictly on a need-to-know basis with trusted service providers necessary for delivering our services:

1. **Property Owners / Hosts:** When you reserve an accommodation, we share the guest's name, phone number, check-in/out dates, guest count, and dietary preferences with the booked property owner to enable check-in verification and meal preparation.
2. **Payment Gateways (Razorpay & Paytm):** To securely process reservation payments, issue refunds, and execute affiliate commission payouts.
3. **Database & Cloud Infrastructure (Supabase / PostgreSQL):** Our PostgreSQL database is hosted on Supabase managed cloud infrastructure located in AWS Asia Pacific (ap-south-1 Mumbai) data centers, protected with encryption in transit (TLS) and encryption at rest.
4. **Media Storage (Cloudinary):** Cloud-hosted media storage for property listing imagery and user avatars.
5. **Transactional Messaging Providers:**
   * **MSG91:** Used for delivering transactional One-Time Passwords (OTPs) via SMS.
   * **Meta / WhatsApp Cloud API:** Used for dispatching automated transactional booking confirmations, check-in e-tickets, and customer support messages.
6. **Legal & Regulatory Authorities:** When strictly required by law, valid court order, governmental inquiry, or to protect the safety, rights, or property of BookStayX, its guests, or the public.

We do not sell, rent, or trade your personal data to any third party for marketing or advertising purposes.

---

## 7. Security Practices and Data Safeguards

We implement comprehensive technical, operational, and physical security measures to protect your personal data:

* **Encryption in Transit:** All network communication between the BookStayX mobile app, web application, backend API, and external service providers is enforced over Transport Layer Security (HTTPS/TLS 1.2+).
* **Password Hashing:** Passwords are cryptographically hashed using salted `bcrypt` (10 rounds). Plaintext passwords are never stored in databases, caches, or logs.
* **Cryptographic Token & OTP Hashing:** OTP codes and refresh tokens are hashed using HMAC-SHA256 and SHA-256 before storage in the database.
* **Automatic Expiration & Purging:** OTP codes expire after 5 minutes and are automatically deleted from the database by recurring cleanup jobs running every 30 minutes. Single-use OTP verification is strictly enforced.
* **Role-Based Access Control (RBAC):** Strict server-side authorization separates Customer, Property Owner, Referral Partner, and Admin roles. Customers can only access their own reservations and profile data.
* **Rate Limiting & Abuse Prevention:** Sensitive endpoints (login, OTP dispatch, registration, and deletion) are protected by rate limiters to defend against brute-force attacks and abuse.
* **Secure Client Storage:** Client-side authentication tokens are stored using `Expo SecureStore` (Android Keystore / iOS Keychain) rather than unencrypted local storage.

---

## 8. Data Retention Policy

We retain personal data only for as long as necessary to fulfill the purposes described in this policy:

* **Active Accounts:** Profile information, credentials, and preferences are maintained for the active duration of your account.
* **Temporary Data:** OTP verification codes expire within 5 minutes and are automatically purged from database tables. Short-lived JWT access tokens expire in 15 minutes; refresh tokens expire in 2 days.
* **Statutory Financial & Tax Records:** Completed booking records, invoices, payment transaction IDs, and tax breakdowns are retained for the statutory period required under Indian financial and taxation laws (typically up to 7–8 financial years) for accounting, audit, and tax compliance. When an account is deleted, these records are decoupled from your personal profile.

---

## 9. Account Deletion and User Data Erasure

In strict compliance with Google Play Store policies and global privacy regulations, BookStayX provides clear, accessible methods for customers to permanently delete their account and associated personal data:

### A. In-App Account Deletion
1. Open the BookStayX app and navigate to **My Account / Profile** (`/profile`).
2. Scroll to the settings menu and select the **Delete Account** option (styled in red).
3. A confirmation modal will appear detailing the permanent consequences of deletion and explaining statutory retention exceptions.
4. Enter your account password to verify ownership, check the explicit confirmation box, and tap **Permanently Delete**.
5. Deletion is **immediate and atomic**: your personal profile, credentials, notifications, and active sessions are erased immediately, and you are logged out.

### B. Public Web Account Deletion Page (No Login Required)
* If you cannot access the mobile application, or wish to delete your account externally, you can visit our public account deletion page:  
  **https://bookstayx.com/account-deletion**  
  *(Locally accessible during development at `http://localhost:8081/account-deletion`)*
* You can verify account ownership via:
  1. **Password Verification:** By entering your registered 10-digit mobile number, registered email address, and account password; OR
  2. **Phone OTP Verification:** By entering your registered mobile number and completing an SMS OTP verification.
* Once verified and confirmed, your account and associated personal data are permanently deleted immediately.

### C. Manual Deletion Requests via Email
* You may also email our privacy team at **support@bookstayx.com** with the subject line *"Account Deletion Request"*, specifying your registered mobile number and email address.
* We will verify your identity and process your deletion request promptly, without undue delay, and in any event within 30 days.

### D. Data Erased vs. Data Retained Upon Deletion
* **Data Permanently Erased Immediately:**
  * Customer profile record (full name, email, mobile phone number, avatar URL).
  * Authentication credentials (`password_hash`).
  * All active sessions and refresh tokens on all devices.
  * In-app notifications and notification history.
  * Phone OTP verification records.
* **Data Retained Under Statutory Exceptions:**
  * Completed booking invoices, transaction references, payment amounts, and stay dates are retained to comply with mandatory statutory accounting, taxation (GST), and audit regulations under Indian law.
  * **Anonymization:** All personal references on retained booking records are unlinked (`customer_id` is set to `NULL`), ensuring that retained financial records can no longer be linked to an active user account.

---

## 10. Children’s Privacy

BookStayX is intended for general adult audiences interested in leisure travel and holiday accommodations. Our services are **not directed to children under the age of 18** (the legal age of majority in India). 

We do not knowingly collect or solicit personal information from minors. Accommodations must be booked by adults aged 18 or older. If we discover that personal information of a child under 18 has been submitted without verified parental consent, we will take immediate steps to permanently delete that information. Parents or guardians who believe their child has provided personal information may contact us at **support@bookstayx.com**.

---

## 11. Your Privacy Rights

Under applicable data protection laws (including the DPDP Act 2023), you have the following rights regarding your personal information:

* **Right to Access & Review:** You can view your personal profile, contact information, and active/past bookings directly within the app.
* **Right to Correction & Rectification:** You can update or edit your name, email, and personal preferences in the **Profile** screen at any time.
* **Right to Erasure / Deletion:** You can permanently delete your account and associated personal data at any time via the in-app deletion flow, the public deletion web page, or by emailing support.
* **Right to Withdraw Consent:** You may withdraw consent for optional push notifications through your device settings or discontinue use of the platform at any time.
* **Right to Grievance Redressal:** You have the right to lodge a complaint or inquiry regarding how your personal information is handled.

---

## 12. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect operational enhancements, new app features, technical adjustments, or changes in legal regulations. 

When updates are published:
* The **"Last Updated"** date at the top of this policy will be revised.
* Continued use of the BookStayX application or website after the updated policy takes effect constitutes your acknowledgment and agreement to the revised terms.
* For material changes, we will provide additional notice through in-app alerts, push notifications, or direct communications where feasible.

---

## 13. Contact Information and Grievance Officer

In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the details for contacting BookStayX and our designated Grievance Officer are:

* **Platform Name:** BookStayX
* **Operating Entity:** BookStayX Hospitality Services
* **Privacy & Support Email:** support@bookstayx.com
* **Concierge & Helpline:** +91 8806092609
* **Operational Region:** Maharashtra, India
* **Web Portal:** https://bookstayx.com
* **Public Deletion Portal:** https://bookstayx.com/account-deletion

For privacy inquiries, data correction requests, or grievances, please reach out to us at **support@bookstayx.com**. We are committed to responding to all legitimate inquiries promptly and resolving grievances within statutory timeframes.