# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

Expo React Native with TypeScript and Expo Router. The application must ship on Android and iOS and support both phones and tablets.

## Users

- Guests discovering and booking luxury stays around Pawna, Lonavala, and the Konkan coast.
- Property owners managing units, availability, bookings, and profile information.
- Referral partners generating codes, tracking earnings, and managing withdrawals.

## Product Purpose

BookStayX brings property discovery, booking, owner operations, and referral workflows into one native mobile application. Success means the new application preserves the approved web experience while making the old full-stack product capabilities usable on Android and iOS.

## Operating Context

The product is used on phones and tablets, in portrait and landscape, with touch-first interaction, safe-area insets, virtual keyboards, intermittent network conditions, and platform accessibility settings.

## Capabilities and Constraints

- `BookStayXNewFrontend-main` is the binding source of truth for UI, UX, content hierarchy, visual styling, and interaction character.
- `PawnaHavenOldFrontendAndBackend-main` is the reference for business workflows and backend API behavior.
- Authentication is explicitly excluded from the current rebuild scope.
- Android and iOS are required from the first release.
- Phone and tablet layouts are required; tablet layouts must preserve the approved visual identity without merely stretching phone screens.
- Native implementation differences are allowed only where required for platform functionality, accessibility, safe areas, keyboards, or hardware behavior.

## Brand Commitments

- Product name: BookStayX.
- Preserve the dark, cinematic luxury identity, gold accents, editorial serif display typography, compact sans-serif UI typography, premium imagery, rounded surfaces, and restrained glow effects of the approved web frontend.
- Do not redesign, simplify, recolor, or substitute generic native styling for the approved web UI.

## Evidence on Hand

- Approved visual implementation: `../BookStayXNewFrontend-main`.
- Legacy workflows and API implementation: `../PawnaHavenOldFrontendAndBackend-main`.
- Existing BookStayX logos, hero photography, property photography, icons, copy, static datasets, route implementations, and UI components are available in the approved frontend.
- No claims, prices, availability, reviews, or customer evidence should be invented beyond the supplied source material.

## Product Principles

1. Visual fidelity to the approved BookStayX frontend is a release requirement.
2. Native behavior must feel immediate, touch-first, and deliberate without changing the product's identity.
3. Shared primitives and tokens must prevent visual drift across customer, owner, and referral experiences.
4. Phone and tablet experiences must preserve hierarchy and density at every supported size.
5. Backend integration must reuse proven business rules rather than duplicating them in presentation code.

## Accessibility & Inclusion

Support platform font scaling, screen readers, reduced motion, sufficient touch targets, semantic roles, visible focus, contrast, and safe-area/keyboard behavior while retaining the approved appearance as closely as technically possible.
