# Phase 3 — Customer Application Shell

## Status

Complete on 2026-09-01.

## Implemented

- Customer route group with shared chrome and Expo Router navigation.
- Source-matched top navigation with approved BookStayX logo, Saved, Notifications, badge count, and Menu controls.
- Home overlay state and a dark frosted state after scrolling or on secondary routes.
- Source-matched seven-item bottom capsule with responsive labels, active states, custom curved center shell, and raised green referral action.
- Right-side modal menu with source ordering, active-route styling, policy links, notification entry, logout presentation, safe-area padding, scrim dismissal, Android Back dismissal, and reduced-motion handling.
- Customer chrome context for menu state and scroll-aware navigation.
- Customer route placeholders for locations, properties, referrals, bookings, saved stays, profile, notifications, terms, privacy, and refund policy.
- Adaptive 480px visual stage retained at phone and tablet widths.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- Impeccable detector: zero findings.
- Phone home shell at 390 × 844: visually inspected.
- Phone side-menu state at 390 × 844: visually inspected.
- Secondary route and active bottom-navigation state: visually inspected.
- Tablet home shell at 768 × 1024: visually inspected.
- Confirmation browser session: zero console warnings or errors.

## Evidence

- `../reference/customer-shell/phase3-phone-home-confirmed.png`
- `../reference/customer-shell/phase3-phone-menu-confirmed.png`
- `../reference/customer-shell/phase3-phone-locations-active.png`
- `../reference/customer-shell/phase3-tablet-home.png`

## Boundaries

- Authentication remains excluded. The Logout row is present for exact shell fidelity but does not clear credentials or call an authentication API.
- Route placeholders intentionally contain no final feature content.
- Customer discovery screens, cards, filters, and property content begin in the next phase.
