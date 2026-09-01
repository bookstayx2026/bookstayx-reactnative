# BookStayX Design System

<!-- Visual authority: ../BookStayXNewFrontend-main -->

## Direction

BookStayX is a cinematic, dark luxury travel interface. Near-black foundations allow full-bleed destination photography to lead; warm gold identifies premium actions and selection; Cormorant Garamond gives headings an editorial hospitality character while Inter keeps operational information compact and legible. The native app inherits this world exactly rather than creating a new mobile aesthetic.

## Color roles

| Role | Reference value | Native intent |
| --- | --- | --- |
| App background | `#050709` | Full-screen foundation and status/navigation-bar backdrop |
| Elevated background | `#0B0E11` | Navigation, fixed headers, and primary raised surfaces |
| Card background | `#12161C` | Standard cards, panels, and grouped content |
| Card elevated | `#14181F` | Stronger cards, selected containers, and nested surfaces |
| Gold | `#E0B84A` | Primary accent, icons, active navigation, emphasis |
| Gold action gradient | pale gold → gold → deep gold | Primary actions and selected segmented controls |
| Primary text | `#E8ECF2` / source `ink` | Titles and high-emphasis copy |
| Secondary text | `#C9CDD4` | Supporting content |
| Muted text | `#8B93A0` / `#9AA1AB` | Metadata and inactive navigation |
| Hairline | gold at roughly 22–25% opacity | Borders and separators |
| Success accent | `#3DFF8A` / semantic greens | Referral success and confirmed states |
| Danger accent | `#EF4444` / semantic reds | Destructive, cancelled, and error states |
| Information accent | `#60A5FA` / semantic blues | Informational booking and notification states |

The source CSS `oklch` values remain canonical. Hex values above document recurring authored values and practical native roles; final native values must be visually calibrated against screenshots.

## Typography

- Display family: Cormorant Garamond, weights 400–700, with italic gold emphasis where present.
- UI family: Inter, weights 400–700.
- Display titles commonly sit between 28 and 36 logical pixels with tight leading near 1.1–1.2.
- Body and metadata are deliberately compact, commonly 9.5–14 logical pixels with generous line-height around 1.45–1.65.
- Preserve authored capitalization, tracking, line breaks, and emphasis; do not replace editorial headings with platform system fonts.
- Accessibility scaling must be bounded per role so critical layouts remain usable while body content remains readable.

## Geometry and spacing

- Approved web canvas: centered mobile surface with a maximum width of 480 CSS pixels.
- Common horizontal inset: 20 pixels (`px-5`).
- Compact card gaps: 8–12 pixels. Section separation: commonly 32–40 pixels.
- Recurring radii: 10, 12, 14, 16, 18, 20, 22, 24, and 28 pixels; pills are fully rounded.
- Preserve component-specific radii. Do not collapse the system to one generic radius.
- Hairlines are warm, subtle, and usually paired with dark elevated fills.

## Imagery

- Photography is immersive, warm, high-contrast, and destination-led.
- Hero and property media use cover cropping with deliberate focal placement.
- Text over images requires the source-equivalent bottom-heavy black gradient; avoid flat opacity overlays.
- Preserve image aspect ratios, crop behavior, carousel paging, and the relationship between media and overlaid copy.

## Elevation and effects

- Depth comes from tonal layering, hairline borders, black directional shadows, restrained blur, and selective gold glow.
- Gold glow is reserved for active indicators and high-value actions.
- Fixed navigation uses translucent near-black surfaces where native performance permits an equivalent blur.
- Never introduce generic Material elevation or bright iOS materials that change the established world.

## Motion and interaction

- Pressable elements scale subtly to approximately `0.975`, with 100–200ms feedback.
- Entrances and exits use transform and opacity, not layout-driven animation.
- Entering UI starts from a near-final scale such as `0.95–0.98`, never zero.
- Use strong ease-out timing for entrances and response, ease-in-out for on-screen movement, and spring physics for interruptible gestures.
- Keep routine UI motion under 300ms; long motion is allowed only when it communicates a deliberate gesture or rare event.
- Drawers and sheets must be interruptible, velocity-aware, safe-area-aware, and honor reduced-motion settings.
- Frequent navigation should feel immediate. Decorative movement must never delay touch response.

## Responsive contract

- Phone layouts reproduce the approved 480px-and-below composition at equivalent logical dimensions.
- Compact phone widths reduce flexible gaps and text measure without removing content.
- Tablets preserve the same visual system but use responsive structure: centered bounded columns, two-column grids, or master-detail where the source hierarchy supports it.
- Tablet layouts must not scale the 480px phone canvas uniformly or stretch cards across the full window.
- Orientation and split-screen behavior are driven by available width, never device model.

## Non-negotiable fidelity rules

1. The approved frontend is the comparison baseline for every screen.
2. Do not use default Expo, React Navigation, Material, or UIKit styling when it visibly diverges from the source.
3. Icons must match the source Lucide shapes, sizes, stroke weights, and alignment.
4. Preserve fixed chrome, scroll behavior, card proportions, and content density.
5. Every completed screen receives screenshot comparison at matching dimensions plus physical-device review.
