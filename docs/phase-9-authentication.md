# Phase 9 — Authentication and role access

- Owner sign-in uses `/api/owners/send-otp` and `/api/owners/verify-otp`.
- Admin sign-in supports password plus optional authenticator verification.
- Tokens use Expo SecureStore on Android/iOS and local storage for web preview.
- `/owner` is role guarded and redirects to `/owner-login`.
- Customer discovery stays guest-first because the supplied backend has no customer authentication contract.
- `/admin-login` supplies the admin auth boundary; native admin operations are not among the approved screens built so far.
