# OzBloom UI/UX Design Brief

## 1. Visual Direction & Atmosphere
OzBloom is a mobile-first digital field guide, not a flashy marketing portfolio. The design must be calm, lightweight, and image-led. It serves to help users discover Australian native flowers through a simple, focused interface.
- **Vibe:** Calm field guide, botanical, restrained.
- **Format:** Mobile web app (optimized for touch).
- **Core Loop:** Swipe through randomly ordered flower cards. Each card shows all info — no separate detail view or completed state.

## 2. Design Tokens

### Color Palette
The palette is inspired by Australian nature, avoiding harsh whites or stark blacks.
- **Background (Soft Cream):** `#F9F6F0` - Main app background.
- **Surface (Warm Sand):** `#EBE4D8` - Card backgrounds and secondary surfaces.
- **Primary (Eucalyptus Green):** `#5B7B61` - Primary text and strong UI elements.
- **Accent (Restrained Wattle):** `#D4B85C` - Subtle highlights, active states, or key buttons.
- **Text (Deep Forest):** `#2C3D30` - High-contrast readable text.
- **Muted Text:** `#68766B` - Secondary labels and captions.

### Typography
Use an elegant, highly readable sans-serif to keep the interface clean and modern (e.g., `Outfit`, `Geist`, or a clean system sans).
- **Heading 1 (Cards/Detail Titles):** 24px (1.5rem), Medium/Semi-bold, tight tracking.
- **Heading 2 (Section Headers):** 18px (1.125rem), Medium.
- **Body Text:** 16px (1rem), relaxed leading (1.5) for readability.
- **Caption/Metadata:** 14px (0.875rem), Regular.

### Spacing & Geometry
- **Base Grid:** 4px/8px increments.
- **Padding:** Screen edge padding of `16px` (1rem).
- **Border Radius:** Soft and organic. Cards use `16px` (`rounded-2xl`), smaller buttons use `8px` (`rounded-lg`).
- **Shadows:** Diffused, natural shadows. Use `shadow-sm` or `shadow-md` tinted with the primary green (e.g., `rgba(44, 61, 48, 0.08)`) instead of pure black.

## 3. Component Specifications

### App Shell
- **Layout:** Immediate engagement. No onboarding, tabs, or heavy navigation bars. Single-screen design.
- **Background:** Soft Cream (`#F9F6F0`) fills the viewport.
- **Chrome:** Minimal to none. Just the content stack centered in the viewport.

### Flower Card (Single-Screen View)

- **Structure:** Takes up the majority of the screen. The card IS the complete view — no separate detail page.
- **Image:** Generated soft watercolor botanical images serve as artistic representations (not strict scientific photo proof). The image should cover the top 60-70% of the card or be edge-to-edge with the info panel overlaid at the bottom.
- **Interaction:** Swipeable (left/right both mean "next"). A visible "Next" button provides an accessible alternative.
- **Content:** All flower data on the card: image, common name, scientific name, region, bloom season, color, habitat, conservation status, and short description.
- **Randomization:** Cards appear in random order on each visit. Consecutive duplicates avoided.

### Bottom Info Panel
- **Placement:** Positioned at the bottom of the card, either over the image or directly below it.
- **Readability:** If overlaid on the image, use a solid or heavily blurred Surface (`#EBE4D8`) background to ensure WCAG AA contrast.
- **Content:** Common name (H1), Scientific name (italicized caption), and the one-line short description.

### Next Button
- A visible "Next" button below or alongside the card stack to provide a clear tap alternative to swiping.
- **Restraint:** Flat colors or soft outlines. Avoid heavy gradients or drop shadows.

### Loading, Error, & Fallback States
- **Loading:** Minimalist skeletal loaders or a subtle fading pulse in the Warm Sand surface color. No flashy spinners.
- **Image Fallback:** If an image fails to load, display a Warm Sand placeholder block with a subtle floral icon and the alt text.

## 4. Mobile-First Responsive Rules
- **Viewport:** Use `min-h-[100dvh]` to handle mobile browser UI shifts gracefully.
- **Scaling:** On desktop/tablet, constrain the app width to a mobile footprint (e.g., `max-w-md mx-auto`) and center it on the screen. Do not stretch cards across wide desktop monitors.
- **Overflow:** Hide horizontal overflow to prevent swipe gestures from inadvertently scrolling the entire page.

## 5. Accessibility Rules
- **Contrast:** All text (especially text floating over images) must meet WCAG AA contrast ratios against its background.
- **Alt Text:** Every generated image MUST include the descriptive `image_alt` from the dataset.
- **Touch Targets:** All interactive elements (Next button) must be at least `44px` by `44px`.
- **Non-Swipe Controls:** The visible "Next" button is mandatory so users with motor limitations don't have to rely on complex swipe gestures.
- **Reduced Motion:** Respect `@media (prefers-reduced-motion: reduce)`. If enabled, replace swipe/slide animations with simple crossfades or instant transitions.

## 6. Motion & Animation Rules
- **Philosophy:** Keep it subtle. Motion should feel natural and guided, not excessively bouncy or elastic.
- **Card Swiping:** Cards should smoothly follow the finger and glide off-screen.
- **Dependencies:** Use Framer Motion for swipe/card transitions, while keeping motion subtle and respectful of reduced-motion settings.
