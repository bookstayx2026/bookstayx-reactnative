# Phase 10 — Release readiness

## Completed checks

- TypeScript and ESLint validation
- Expo configuration resolution
- Static web production export
- Android JavaScript production bundle
- iOS JavaScript production bundle
- Authentication loading, validation, error, and disabled states
- Customer-to-owner entry path and authenticated owner sign-out
- Safe-area, keyboard avoidance, reduced-motion, and predictive Android back configuration

## Build profiles

`eas.json` provides development, internal preview, Android APK, and production store profiles.

## Required environment

Set `EXPO_PUBLIC_API_URL` to the deployed legacy API base URL. Booking integration additionally uses the values documented in `.env.example`.

## Store builds

Run `eas build --platform android --profile production` and `eas build --platform ios --profile production` from an authenticated Expo account. Apple signing requires an Apple Developer account; Play Store submission requires a Google Play developer account.

## Remaining external verification

Before store submission, test OTP delivery and backend operations against the deployed API, and complete physical-device checks on at least one supported Android phone, iPhone, and tablet. These checks require external credentials and devices and cannot be certified by a local static build.
