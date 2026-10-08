# Phase 7 — Backend integration foundation

Phase 7 introduces a native-safe, typed adapter around the legacy Express/PostgreSQL API. Authentication remains excluded.

## Legacy endpoints mapped

| Capability | Endpoint | Authentication |
| --- | --- | --- |
| API health | `GET /api/health` | Public |
| Property catalogue | `GET /api/properties/public-list` | Public |
| Property detail | `GET /api/properties/public/:slug` | Public |
| Property calendar | `GET /api/properties/:id/calendar` | Public |
| Unit calendar | `GET /api/properties/units/:unitId/calendar` | Public |
| Initiate booking | `POST /api/bookings/initiate` | Public, rate limited |
| Get booking | `GET /api/bookings/:bookingId` | Public in the legacy implementation |

Owner, admin, image-upload, unit-management, payment, and referral-management endpoints are intentionally deferred because they require authentication or a later workflow phase.

## Delivered

- Environment-driven API configuration for web, iOS simulator, Android emulator, and physical devices.
- Fetch client with request timeout, structured failures, JSON validation, and consistent HTTP errors.
- Legacy property-response normalization into the existing React Native `Property` model.
- Catalogue repository with approved bundled-data fallback when no endpoint is configured or the service is unavailable.
- The property listing now reads through the repository without changing the approved UI.
- Typed booking initiation and booking lookup adapters matching the current Express controller contract.
- Live booking safety gate: submission stays disabled until API URL, owner phone, and admin phone are all configured.

## Configuration

Copy `.env.example` to `.env.local` and set the values for the target environment. Physical phones must use a reachable LAN or HTTPS API address; `localhost` points to the phone itself.

## Safety decisions

- The app never silently changes a failed live booking into a local booking. That could create duplicate or misleading reservations.
- Bundled property content remains available offline and preserves the approved visual source.
- Legacy authorization tokens are not copied from browser `localStorage`; secure native credential storage belongs to the authentication phase.
