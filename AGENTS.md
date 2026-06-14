# AGENTS.md — OzBloom

## Project State

Phase 1 (scaffold) and Phase 2 (infrastructure + seeding) are complete. Phase 3+ (Worker API, React frontend) is next.

## Planned Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Cloudflare Workers (serves API + static assets)
- **Database**: Cloudflare D1 (flower data)
- **Storage**: Cloudflare R2 (flower images, public bucket)
- **Image generation**: Cloudflare AI (pre-launch, watercolor botanical style)
- **Package manager**: npm

## Key Planning Documents

Read these before implementing anything:

| Document | Path |
|---|---|
| Product Requirements | `docs/prd.md` |
| Architecture + build phases | `docs/architecture-plan.md` |
| UI/UX brief | `docs/ui-ux-brief.md` |
| Implementation plan | `.omo/plans/ozbloom-implementation-plan.md` |
| Stitch design system | `.stitch/DESIGN.md` |
| Stitch project metadata | `.stitch/metadata.json` |

## Architecture Decisions (Non-Negotiable)

- Single-screen app — no separate detail view, no completed-deck state screen
- D1 access is **server-side only** in the Worker — browser never calls D1 directly
- Cards shown in random order; frontend fetches `/api/flowers/random?limit=8` and prefetches next batch when 2 cards remain
- Frontend deduplicates flowers within a rolling window to avoid immediate repeats across batches
- No accounts, favorites, search, filters, analytics, or admin dashboard in MVP

## Cloudflare Setup

- Auth via `CLOUDFLARE_API_TOKEN` environment variable (headless GCE — `wrangler login` OAuth does not work)
- Account ID: `3bea2e6d6f93b5cc822b36b69958d4cd`
- Verify auth: `wrangler whoami`
- Config file should be `wrangler.toml` (as specified in architecture plan — not `wrangler.jsonc`)

## Stitch Design System

- Stitch project ID: `6991780127964850390`
- Design system asset ID: `f8aa13bcc45d4e049061323a593360e8`
- Design summary: eucalyptus green, cream, warm sand, rounded cards, elegant sans typography, soft watercolor imagery
- Final screen: `home-card-stack` (`screens/0620cf3cc3cc4200b7ccdd9e93ce1de6`)
- Local HTML mock: `.stitch/designs/home-card-stack.html`
- When generating new screens, use the design system asset ID above for consistency

## D1 Schema

Table: `flowers`
```
id TEXT PK, common_name TEXT, scientific_name TEXT, region TEXT,
bloom_season TEXT, color TEXT, habitat TEXT, conservation_status TEXT,
short_description TEXT, description TEXT, image_url TEXT, image_alt TEXT
```

Seed data: exactly 8 flowers — Golden Wattle, Sturt's Desert Pea, Waratah, Kangaroo Paw, Flannel Flower, Royal Bluebell, Pink Mulla Mulla, Banksia.

## Folder Structure (Target)

```
/
├── public/
├── src/
│   ├── api/          # Worker API handlers
│   ├── components/   # Card and layout components
│   ├── hooks/        # Data fetching and swipe logic
│   ├── types/        # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css     # Tailwind entry
├── scripts/          # Seed and image generation scripts
├── db/               # SQL schema and migrations
├── docs/
├── wrangler.toml
├── package.json
└── vite.config.ts
```

## Gitignored — Do Not Commit

- `opencode.json` / `opencode.jsonc` (contains Stitch API key)
- `.omo/` (OpenCode runtime/plans)
- `.stitch/` (local design exports)
- `.dev.vars` (local Cloudflare secrets)
- `.wrangler/` (local Wrangler state)
- `*.sqlite`, `*.sqlite3`

## Deployment

- **No production deploys without explicit user approval**
- `wrangler deploy --dry-run` before any real deploy
- Use `.dev.vars` for local secrets (never committed)

## Verification Targets

- `lsp_diagnostics` clean across all changed files
- `vite build` exits 0
- Manual smoke test: swipe through random cards on mobile viewport, verify Next button works
