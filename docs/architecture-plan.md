# OzBloom Architecture and Build Plan

This document outlines the technical path for OzBloom, a mobile web app for discovering Australian native flowers. It builds on the OzBloom PRD and locked preferences.

## Core Decisions

- **Format**: Mobile web app.
- **Source of Truth**: OzBloom PRD.
- **Hosting**: Cloudflare Workers.
- **Storage**: Cloudflare R2 for images, Cloudflare D1 for flower data.
- **Frontend**: Vite, React, TypeScript, Tailwind CSS.
- **Package Manager**: npm.
- **Motion**: Framer Motion for swipe/card transitions.
- **Deployment Flow**: Direct production deployment only after explicit approval.

## Implementation Phases

### Phase 1: Infrastructure and Data
- Initialize project with Vite and Cloudflare Wrangler.
- Create Cloudflare R2 bucket and D1 database.
- Develop a seed script to populate D1 with 8 flower records.
- Seed only the flowers listed in the PRD: Golden Wattle, Sturt's Desert Pea, Waratah, Kangaroo Paw, Flannel Flower, Royal Bluebell, Pink Mulla Mulla, and Banksia.
- Use Cloudflare AI to generate flower images before launch.
- Upload images to R2 and store public URLs in D1.

### Phase 2: API and Backend
- Create Worker API routes (e.g., `/api/flowers`).
- Connect API to D1 to fetch flower data.
- Implement short-term caching for API responses.

### Phase 3: Frontend Foundation
- Set up React and Tailwind CSS.
- Define TypeScript interfaces for flower data.
- Implement basic layout and routing.

### Phase 4: Core UI and Interactions
- Build the single-screen card stack with subtle Framer Motion transitions.
- Implement random card ordering on each session.
- Ensure the card displays all flower data (image, name, facts, description) — no separate detail view needed.
- Implement "Next" button alongside swipe for accessibility.

### Phase 5: Polish and Verification
- Apply nature-inspired styling (eucalyptus green, soft cream).
- Perform build and smoke tests.
- Verify mobile responsiveness and accessibility targets.

## Data Schema (Cloudflare D1)

### Table: `flowers`
- `id`: TEXT (Primary Key)
- `common_name`: TEXT
- `scientific_name`: TEXT
- `region`: TEXT
- `bloom_season`: TEXT
- `color`: TEXT
- `habitat`: TEXT
- `conservation_status`: TEXT
- `short_description`: TEXT
- `description`: TEXT
- `image_url`: TEXT (Public R2 URL)
- `image_alt`: TEXT

## Folder Structure

```
/
├── public/          # Favicon and static assets
├── src/
│   ├── api/         # Worker API handlers
│   ├── components/  # Card and layout components
│   ├── hooks/       # Data fetching and swiping logic
│   ├── types/       # TypeScript definitions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css    # Tailwind styles
├── scripts/         # Seed and image generation scripts
├── db/              # SQL schema and migration files
├── docs/            # Architecture and design docs
├── wrangler.toml    # Cloudflare configuration
├── package.json
└── vite.config.ts
```

## Image Strategy

- **Generation**: Created before launch using Cloudflare AI in a soft watercolor botanical style. Prompts will be tuned until quality is high.
- **Accuracy**: Images are artistic representations. The app will not claim scientific photographic accuracy.
- **Hosting**: Stored in a public R2 bucket. Public read URLs are stored in the database.

## API Contract

- `GET /api/flowers/random?limit=8` returns a random sample of flowers from D1 as JSON. The `limit` parameter controls batch size (default 8).
- Each response includes all PRD-required fields plus the public R2 `image_url` and `image_alt`.
- Random sampling uses SQL `ORDER BY RANDOM() LIMIT ?` (SQLite/D1-native). This is efficient for up to thousands of records.
- Responses use a short cache (`Cache-Control: public, max-age=60`) so content updates during MVP testing are not blocked for long, but the batching already mitigates staleness risk.
- D1 access stays server-side in the Worker; the browser never connects directly to D1.

## Data Loading Strategy

The frontend loads flowers in random batches of 8 rather than fetching the entire dataset:

1. On load, fetch `/api/flowers/random?limit=8` — this is the first visible batch.
2. Display one card at a time. Swiping advances through the local batch.
3. When 2 cards remain in the current batch, prefetch the next random batch in the background and append it.
4. This ensures no loading gaps while keeping memory and payloads small regardless of total dataset size.
5. Since each batch is independently randomized, the same flower could appear across multiple batches (but the frontend deduplicates within a rolling window to avoid immediate repeats).

## Testing Plan

- **Build**: Ensure Vite build completes without errors.
- **Smoke**: Manually verify the core flow on a mobile device (swipe through random cards, use Next button).
- **LSP**: Ensure `lsp_diagnostics` is clean across the codebase.

## Non-Goals and Deferred Items

- **Security headers**: Custom security headers are deferred by user preference. The app should still avoid unsafe HTML rendering and keep D1/R2 credentials server-side.
- **Analytics**: No tracking or analytics in the MVP.
- **Features**: No accounts, favorites, maps, search, or filters.
- **Content**: No user-facing image generation or admin dashboard.
