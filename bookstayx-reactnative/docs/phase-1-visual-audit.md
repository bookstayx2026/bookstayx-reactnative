# Phase 1 — Visual Audit and Design-System Extraction

## Status

Complete. This document is the acceptance record for Phase 1. The reference set was captured on 2026-09-01 from the locked approved frontend running locally at `http://127.0.0.1:8080`.

## Authority and scope

- Visual and interaction authority: `../../BookStayXNewFrontend-main`.
- Functional/API reference: `../../PawnaHavenOldFrontendAndBackend-main`.
- Target: adaptive Expo React Native application for Android and iOS, phones and tablets.
- Excluded: authentication implementation and authentication-specific integration.

## Screen inventory

| Surface | Web route | Primary source | Phase |
| --- | --- | --- | --- |
| Home | `/` | `src/routes/index.tsx` | Customer discovery |
| Locations | `/locations` | `src/routes/locations.index.tsx` | Customer discovery |
| Location detail | `/locations/:slug` | `src/routes/locations.$slug.tsx` | Customer discovery |
| Properties | `/properties` | `src/routes/properties.index.tsx` | Customer discovery |
| Property detail | `/properties/:id` | `src/routes/properties.$id.tsx` | Booking experience |
| Saved | `/saved` | `src/routes/saved.tsx` | Customer utility |
| Bookings | `/bookings` | `src/routes/bookings.tsx` | Customer utility |
| Notifications | `/notifications` | `src/components/NotificationsPage.tsx` | Customer utility |
| Profile/role entry | `/profile` | `src/routes/profile.tsx` | Customer utility; auth excluded |
| Privacy | `/privacy` | `src/components/LegalPage.tsx` | Customer utility |
| Terms | `/terms` | `src/components/LegalPage.tsx` | Customer utility |
| Refund policy | `/refund-policy` | `src/components/LegalPage.tsx` | Customer utility |
| Owner dashboard | `/owner` | `src/components/owner/OwnersDashboard.tsx` | Owner app |
| Owner units | `/owner/units` | `src/components/owner/OwnerUnitsPage.tsx` | Owner app |
| Owner bookings | `/owner/bookings` | `src/components/owner/OwnerBookingsPage.tsx` | Owner app |
| Owner profile | `/owner/profile` | `src/components/owner/OwnerProfilePage.tsx` | Owner app; auth excluded |
| Referral listing | `/referrals` | `src/components/ReferralMainListing.tsx` | Referral app |
| Referral generation | `/referrals/generate` | `src/components/GenerateNewCodePage.tsx` | Referral app |
| Referral dashboard | `/referrals/dashboard` | `src/components/ReferralDashboard.tsx` | Referral app |

## Shared component families

- Chrome: `AppTopNav`, `AppSideMenu`, `BottomNavigation`, `FixedPageHeader`.
- Brand primitives: `SectionLabel`, `SerifTitle`, logo assets, gold gradient, hairlines.
- Discovery: `LocationCard`, `PropertyCard`, `PropertyGridCard`.
- Customer operations: `BookingCard`, `SavedStayCard`, `NotificationsPage`, `CustomerProfile`.
- Owner chrome and surfaces: `OwnerHeader`, `OwnerBottomNav`, dashboard, units, bookings, profile.
- Referral surfaces: listing tiers, code generation, dashboard cards, earnings and withdrawal patterns.
- Overlays: install dialog, sheets, drawers, menus, alerts, calendars, selects, and popovers.

## Baseline viewports

| Name | Viewport | Purpose |
| --- | --- | --- |
| Compact Android phone | 360 × 800 | Narrow-width pressure and common Android density |
| Standard phone | 390 × 844 | Primary pixel-comparison baseline |
| Large phone/source cap | 480 × 900 | Matches the approved web canvas maximum |
| Portrait tablet | 768 × 1024 | Tablet composition and bounded-width behavior |
| Landscape tablet | 1024 × 768 | Responsive restructuring and navigation behavior |

## Visual acceptance method

1. Run the approved frontend with stable local data and fonts loaded.
2. Use Playwright for deterministic full-page screenshots at every baseline viewport.
3. Capture important interaction states separately: menu open, selected tabs, dialogs/sheets, scrolled chrome, carousel changes, and empty/status variants.
4. During native implementation, capture Expo Web at the same logical viewports for fast structural comparison.
5. Use image diffs as evidence, then verify Android and iOS on simulators and physical hardware because browser screenshots cannot validate native text rasterization, safe areas, gestures, keyboards, or performance.

## Known translation risks

- Cormorant Garamond and Inter font metrics differ between browser and native text engines.
- CSS `oklch`, multi-stop gradients, backdrop blur, inset shadows, and complex box shadows require calibrated native equivalents.
- The web source caps content at 480px; tablets require deliberate bounded layouts without changing hierarchy or visual identity.
- Browser sticky/fixed positioning, snap scrolling, and hover-derived primitives need touch-native behavior.
- Status bars, navigation bars, notches, home indicators, keyboards, and Dynamic Type add layout states absent from fixed web captures.
- Some source motion is longer than the preferred routine UI ceiling; implementation must preserve perceived character while keeping touch feedback immediate.

## Capture findings

- The approved web application deliberately constrains its visual canvas to 480px and centers it on larger viewports. Tablet captures therefore show a bounded cinematic column rather than a stretched layout. The native tablet baseline must retain this bounded hierarchy; any multi-column expansion requires a later screen-specific decision and must not visually rewrite the source.
- Customer navigation is a seven-item fixed bottom capsule with a prominent glowing referral action. Owner routes use a distinct five-item bottom capsule.
- The customer home combines a full-bleed 620px-minimum hero, translucent top chrome, warm image gradients, compact stats, three-column destination cards, pill tabs, and horizontally snapping property cards.
- Owner and referral surfaces are denser and more operational but reuse the same black/gold foundation, editorial headings, warm hairlines, compact sans text, and rounded panels.
- Several routes include long full-page content and fixed bottom chrome. Native lists must preserve the visible spacing while reserving safe-area space without duplicating or obscuring navigation.
- The screenshots reveal source-level duplicated fixed/navigation content in some long full-page captures. Native implementation should match the actual intended fixed viewport state, using viewport captures to distinguish fixed chrome from page content.

## Reference set

- 19 primary phone route captures at 390 × 844, including the home route.
- 4 additional responsive home captures: 360 × 800, 480 × 900, 768 × 1024, and 1024 × 768.
- 3 interaction-state captures: side menu open, Recommended tab selected, and scroll-aware chrome after scrolling.
- Total: 26 PNG reference fixtures under `../reference/web`.
- Machine-readable capture metadata: `../reference/capture-manifest.json`.

## Phase 1 completion gate

- [x] Product/platform contract recorded.
- [x] Durable visual system documented.
- [x] Platform-neutral token seed created.
- [x] Screen and shared-component inventory created.
- [x] Approved frontend installed and launched locally.
- [x] Reference screenshots captured for baseline routes and viewports.
- [x] Interaction-state reference captures completed.
- [x] Capture manifest records URLs, viewport sizes, capture date, and filenames.
- [x] Representative customer, owner, referral, and tablet captures visually inspected.
- [x] Phase 1 findings verified and ready for Expo foundation work.
