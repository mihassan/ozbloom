# OzBloom

**Status: [Portfolio]**

**Live:** [ozbloom.mihassan.com](https://ozbloom.mihassan.com)

A mobile-first digital field guide for discovering Australian native flowers. Swipe through beautifully illustrated cards, save your favourites, and share discoveries.

## Features

- **Swipeable card stack** — browse randomly presented Australian native flowers
- **30 native species** — Golden Wattle, Waratah, Sturt's Desert Pea, Kangaroo Paw, and more
- **Favorites** — heart button to save flowers, view them all in the saved list
- **Share** — share flower details via Web Share API or clipboard
- **PWA** — installable on mobile, works offline (cached assets)
- **Watercolor illustrations** — AI-generated botanical art for each species
- **Responsive** — mobile-first design with reduced-motion support

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS + Framer Motion |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 (flower data) |
| Storage | Cloudflare R2 (flower images) |
| Image generation | Cloudflare AI (Stable Diffusion XL) |
| Testing | Vitest (unit) + Playwright (e2e) |

## Getting Started

```sh
npm install
npm run dev        # Vite dev server → localhost:5173
npx wrangler dev   # Worker dev server → localhost:8787
```

The Worker serves the API at `/api/flowers/random?limit=N`. The Vite dev server proxies API requests to the Worker.

## Project Structure

```
src/
├── api/            # Worker API handlers
├── components/     # FlowerCard, CardStack, SavedView
├── hooks/          # useFlowers, useFavorites
├── types/          # TypeScript interfaces
├── App.tsx         # Main app shell
├── main.tsx        # Entry point (includes PWA SW registration)
└── worker.ts       # Cloudflare Worker entry
```

## Tests

```sh
npm test            # Vitest unit tests (35 tests)
npx playwright test # Playwright e2e tests
```

## Deployment

```sh
npm run build
npm run worker:deploy  # dry-run only — real deploys via CI on main
```

## License

MIT
