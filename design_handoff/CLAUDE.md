# CLAUDE.md — Lustre working agreement

> This file is auto-loaded by Claude Code. It is the standing context for the
> **design-integration initiative**: bringing the approved gold/OKLCH design
> into the live client. Read `docs/DESIGN_INTEGRATION_SPRINT.md` for the work
> breakdown. Follow the rules below on every change.

## Project
Lustre — a curated dating + affiliate platform. Monorepo:
- `client/` — React 19 + Vite, **Tailwind v4 (CSS-first)**, shadcn-style components, cva, framer-motion, **TanStack Query v5**, **react-router v7**, `babel-plugin-react-compiler`.
- `server/` — Node/Express + Drizzle ORM (Neon Postgres), JWT, M-Pesa + Paystack, Cloudinary.
- `tests/` — Playwright BDD (16 `.feature` specs) + `ui_exploration` visual specs. Client unit tests are co-located `*.test.tsx` (Vitest, ~98.8% coverage).

## How we work — ONE STORY AT A TIME
1. Pick the next story from `docs/DESIGN_INTEGRATION_SPRINT.md` (LX-1, LX-2, …). Don't batch.
2. Implement only what its acceptance criteria list.
3. Run `npm run test:client` (and `npm run test:bdd` before release). Fix the tests the story says it touches.
4. Show me the diff. Commit per story (`LX-N: <summary>`) so each is revertable.
5. Stop. Wait for go-ahead on the next story.

## The three-layer rule (do not violate)
```
L1 Tokens       → client/src/index.css (:root + .light), client/tailwind.config.js   ← tune here
L2 Components   → client/src/components/ui/*                                          ← variants only
L3 Composition  → client/src/pages/*, client/src/components/layout/*                  ← screen work
```
**Components and pages reference L1 tokens only** — `bg-card`, `text-lustre-muted`, `border-border`, `bg-gradient-brand`, `shadow-[var(--shadow-card)]`. **Never hard-code a hex, rgb, or px color/radius/shadow** in L2/L3. If you need a new visual state, add a **cva variant** (e.g. in `button.tsx`), not an inline one-off class.

## Brand token law
- All colors authored in **`oklch()`**. No hex.
- **Primary brand = champagne gold.** The token NAMES are legacy (`--purple`, `--rose`, `lustre.purple`) but now carry gold — **keep the names** this initiative; renaming touches every page and is a separate PR.
- **Shadows are brand-tinted** (gold hue, low opacity, large blur) — never default black. They were `none` in dark before; keep them.
- **One `--radius`** knob (`1rem`); derive the rest. Never `rounded-[7px]`.
- `body` carries `letter-spacing: var(--tracking-normal)` (`-0.015em`).
- Source of truth for the token block: `docs/LX-1_index.tokens.css`.

## Fonts — do NOT swap
`Be Vietnam Pro` (sans/body), `Manrope` (`font-headline`), `EB Garamond` (`font-garamond`, the serif/italic display used for the "Lustre" wordmark and big headers). The design's serif-accent look is already these fonts — no new font loads.

## Premium = single plan
**One plan: Monthly KES 500.** No Basic/Full tiering. Backend charges a flat 500 and sets `premiumTier='basic'`; all premium features ship with the one plan. Don't build tier-gated copy or pricing.

## Always preserve
- **Aura tour anchors** — DOM ids like `#discovery-grid`, `#bottom-nav-*`. If you restructure, keep the ids or update the targets in `client/src/components/layout/TourGuide.tsx` in the same PR. Verify with `tests/features/Tour_Mobile_Responsive.feature`.
- **Navigation IA** — `BottomNav.tsx` = Discovery / Matches / Rewards / Premium / Profile (mobile, `md:hidden`); desktop = `Navbar.tsx`; the swipe/recommendations page is reached via `DiscoveryTabs`, NOT a bottom tab. Don't add tabs.
- **Theme system** — `ThemeContext` toggles a `light`/`dark` class on `documentElement` (`storageKey: 'dating-theme'`, default dark). Every change must work in **both** themes.
- **Real backend logic** — restyle UI; never replace working mutations (M-Pesa polling, `/matches/:id/reveal`, discovery 403 gating, Cloudinary uploads).

## Accessibility gate (every story)
WCAG AA: contrast ≥ 4.5:1 (verify white-on-gold and gold-on-dark), visible `focus-visible` ring (gold `--ring`), touch targets ≥ 44px (BottomNav, swipe controls), no color-only meaning, honor `prefers-reduced-motion`. Run on dark AND light.

## Commands
```bash
npm run dev --prefix client          # local
npm run test:client                  # vitest (run between stories)
npm run lint --prefix client         # eslint
npm run test:bdd                     # npx bddgen && npx playwright test (before release)
npm run test:coverage                # full coverage
```

## File map (where things live)
| Area | File |
|---|---|
| Tokens | `client/src/index.css`, `client/tailwind.config.js` |
| Buttons/variants | `client/src/components/ui/button.tsx` (cva) |
| Discovery + lock | `client/src/pages/Discovery.tsx`, `components/layout/DiscoveryTabs.tsx` |
| Premium / payments | `client/src/pages/Premium.tsx` |
| Matches / reveal | `client/src/pages/Matches.tsx` |
| Swipe | `client/src/pages/Recommendations.tsx` |
| Profile / Edit | `client/src/pages/{Profile,EditProfile}.tsx`, `components/PhotoUploader.tsx` |
| Referrals | `client/src/pages/ReferralDashboard.tsx` |
| Admin | `client/src/pages/AdminDashboard.tsx` |
| Auth / Landing | `client/src/pages/{Login,Register,Landing}.tsx` |
| Nav | `client/src/components/layout/{BottomNav,Navbar,TourGuide}.tsx` |
| Routing | `client/src/App.tsx` |
| Data hooks | `client/src/hooks/useQueries.ts` |

## Visual reference
`Lustre.dc.html` (in this handoff) is the approved design — a self-contained HTML prototype. **It is a reference, not code to copy.** Recreate its look using the patterns above. Read its source for exact spacing, composition, and the OKLCH values; the dark `:root` / light `[data-theme="light"]` blocks in its `<head>` are the canonical palette.

## Never
- Hard-code colors/radii/shadows in pages or components.
- Rename token keys this initiative.
- Swap fonts.
- Add premium tiers or new bottom-nav tabs.
- Ship a change that only works in one theme.
- Land a story with red tests.
