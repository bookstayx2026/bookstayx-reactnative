# Phase 2 — Expo Foundation

## Status

Complete on 2026-09-01.

## Implemented

- Expo SDK 57 application with Expo Router and strict TypeScript.
- Android, iOS, and web targets from one project.
- iPad/tablet support and adaptive orientation.
- Android predictive Back enabled.
- Dark system background, native status bar handling, safe-area provider, gesture root, and splash-screen lifecycle.
- Bundled Inter and Cormorant Garamond font families with the approved BookStayX weights and italic display face.
- Typed brand tokens for colors, spacing, radii, typography, motion, layout, and platform-aware shadows.
- Responsive window-class hook and a 480px bounded content frame matching the approved web authority.
- Reduced-motion hook using platform accessibility settings.
- Shared foundation primitives: `AppScreen`, `BrandText`, `Surface`, `PressableScale`, and `GoldButton`.
- Approved BookStayX logo, hero photography, app icon, adaptive icon, favicon, and splash artwork.
- A temporary branded foundation route used only to verify the shared system before customer-screen implementation.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- Expo configuration resolution: passed.
- Expo Doctor: 21/21 checks passed.
- Impeccable detector over the changed UI targets: zero findings.
- Expo Web render at 390 × 844: passed with no console warnings or errors.
- Expo Web render at 768 × 1024: passed with no console warnings or errors.
- Render evidence:
  - `../reference/native-foundation/phase2-phone-390x844.png`
  - `../reference/native-foundation/phase2-tablet-768x1024.png`

## Deliberate boundaries

- No authentication implementation.
- No backend/API integration.
- No customer, owner, or referral feature routes yet.
- The foundation screen is validation scaffolding and will be replaced by the approved customer home experience in the next UI phase.

## Phase 3 handoff

The next phase should build the shared customer application shell: top navigation, side menu, fixed bottom navigation, scroll-aware behavior, notifications affordance, and route placeholders. Each shell state must be compared against the Phase 1 Playwright references before feature screens are added.
