# OzBloom Product Requirements Document

## Product Overview

OzBloom is a mobile-first digital field guide for discovering Australian native flowers. The MVP centers on a swipeable card stack: users open the app, browse curated flower cards, tap any flower for a richer profile, and return to the same place in the deck.

The product should feel calm, visual, and lightweight. Flower imagery is the primary draw; supporting facts should help users learn quickly without turning the experience into a dense botanical database.

## MVP Goals

- Help users discover a curated set of Australian flowers through a simple card-based interface.
- Make each flower visually recognizable through strong imagery and concise facts.
- Provide enough detail to satisfy casual curiosity without overwhelming first-time users.
- Keep the first release small, static, and easy to validate before adding search, favorites, maps, or identification features.

## Target Users

- Nature enthusiasts interested in Australian flora.
- Hikers and travelers who want quick context about native flowers.
- Students and casual learners looking for approachable flower facts.
- Gardeners and photographers seeking visual inspiration from Australian plants.

## MVP Scope

The MVP is a single-screen design: a card stack showing one flower at a time. Cards appear in random order on each visit. Each card displays the flower image, name, scientific name, region, and key facts. Tapping "Next" or swiping advances to the next random flower. There is no separate detail view or completed-stack state — every interaction happens on the same screen.

The MVP uses Cloudflare D1 for a seeded dataset of 30 curated Australian flowers and Cloudflare R2 for generated flower images. It does not require accounts, user-generated content, maps, search, filtering, analytics, or camera-based identification.

## Features Added Post-MVP

- **Favorites** — heart button to save flowers to a local collection (persisted in localStorage).
- **Saved view** — browse all favorited flowers, remove them from saved.
- **Share** — share flower details via Web Share API or clipboard fallback.
- **PWA** — installable on mobile, works offline with cached assets.

## Non-goals

- User login, profiles, or cloud sync.
- Camera-based flower identification.
- GPS tracking, location recommendations, or map-based discovery.
- Search, filters, or advanced sorting.
- Admin dashboard or content management system.
- User-facing image generation.
- Runtime image generation during normal browsing.
- Payments, marketplace links, or nursery purchasing.

## Core User Flow

1. User opens OzBloom.
2. A random flower card is visible immediately.
3. User swipes left or right (or taps "Next") to dismiss the current card and reveal another random flower.
4. User continues indefinitely — each card is a self-contained view with all flower info. There is no separate detail view or terminal completed state.

Left and right swipes have the same meaning in the MVP: advance to the next random flower. Swipe direction should not imply like/dislike, save/reject, or any other preference state.

## Functional Requirements

### Flower Card Stack (Single Screen)

- The single screen must display one flower card at a time, loaded from the Worker API backed by Cloudflare D1.
- The frontend should fetch a random batch of 8 flowers at a time. As the user swipes through the batch, the next batch is prefetched in the background so there is no loading delay.
- Card order must be randomized within each batch. On each new session the composition and order of batches will differ.
- Users must be able to swipe the active card left or right (or tap "Next") to advance to another random flower.
- The card itself is the complete view — it shows the image, common name, scientific name, region, bloom season, color, habitat, conservation status, and a short description. No separate detail view exists.
- Swiping never ends — since new batches are loaded as needed, there is no completed-stack state. Users can keep exploring indefinitely.
- The shuffle/pool should avoid showing the same flower twice in a row where possible.

### Flower Card Content

Each card must show:

- Flower image.
- Common name.
- Scientific name.
- Australian region, state, or territory where the flower is commonly found.
- Bloom season.
- Primary visible flower color.
- Habitat.
- Conservation status.
- Short description.

Card text must remain readable over or beside imagery on common mobile screen sizes.

### Navigation

- Opening the app must take users directly to the card stack.
- MVP navigation is limited to a single screen: swiping/tapping advances to the next random card.
- The MVP must avoid menus, tabs, onboarding flows, and settings screens unless required by the platform shell.
- No separate detail view or completed-stack state exists. The card IS the complete view.

## Data and Image Requirements

The MVP dataset includes 30 Australian native flowers seeded via `scripts/seed-local.ts`.

Each flower record must include:

- `id`: Stable unique identifier.
- `commonName`: Common flower name.
- `scientificName`: Botanical name.
- `imageUrl`: Public Cloudflare R2 image URL.
- `imageAlt`: Accessible image description.
- `region`: Australian region, state, or territory where it is commonly found.
- `bloomSeason`: Typical flowering season.
- `color`: Primary visible flower color.
- `habitat`: Typical environment, such as woodland, coastal heath, alpine meadow, or desert.
- `conservationStatus`: Basic status, such as Least Concern, Vulnerable, Endangered, or Unknown.
- `shortDescription`: One-line summary for the card.
- `description`: Longer plain-language detail text.

Flower records must be seeded into Cloudflare D1 before launch. Flower images must be generated before launch, uploaded to Cloudflare R2, and referenced from D1 by public image URL. Each image must be suitable for a full-width mobile card, avoid claims of scientific photographic accuracy, and include a fallback treatment if an asset fails to load.

## UX Requirements

- The interface must be simple, calm, and image-led.
- Flower imagery must dominate the card design.
- Cards must use rounded corners and readable text overlays or text sections.
- Swipe motion must feel smooth and responsive.
- Tapping a card must clearly transition to the detail view.
- The app must be designed mobile-first.
- The visual direction must use nature-inspired colors such as eucalyptus green, warm sand, soft cream, and restrained wattle yellow accents.
- Empty and completed states must feel intentional, not like errors.

## Accessibility Requirements

- Every flower image must have descriptive alt text from `imageAlt`.
- Text over images must meet WCAG AA contrast by using an overlay, separate text surface, or equivalent treatment.
- Interactive controls must have accessible names.
- Primary tap targets must be at least 44 x 44 CSS pixels or platform equivalent.
- Swipe-only actions must have an accessible alternative, such as a visible next action or keyboard/screen-reader compatible control.
- Motion must respect reduced-motion settings by minimizing or simplifying swipe and transition animations.

## Acceptance Criteria

- On launch, a random flower card appears without requiring onboarding or menu navigation.
- Given the card stack is visible, when the user swipes left/right or taps "Next", another random flower card appears.
- The card itself displays all flower data (image, name, scientific name, region, season, color, habitat, conservation status, description). No separate detail view is needed.
- Flowers are randomized on each visit. The same 30 flowers cycle with prefetch batching to avoid consecutive duplicates.
- All 30 flowers have complete data for every required field.
- All flower images render from public Cloudflare R2 URLs and expose accessible alt text.
- The interface remains usable on common mobile viewport widths.

## Success Metrics

- 100% of test users can identify how to advance cards without written instructions.
- At least 70% of test users swipe through 4 or more cards in a first session.
- No critical accessibility blockers are found in the MVP flow.

## Deferred Decisions

- Whether future versions should add search, filters, or maps.
- Whether future versions should distinguish left and right swipe meanings.
- Whether future versions should add a content management system.
- Whether detail pages should include external botanical reference links.
