# Lustre — Design Integration Sprint Plan

**Goal:** Integrate the approved `Lustre.dc.html` design direction into the live React/Vite client, using the UI/UX Handbook's three-layer model so the visual upgrade ships as a **token migration + targeted screen work**, not a rewrite.

**Design source of truth:** `Lustre.dc.html` (champagne-gold, OKLCH, dark + light, 8 screens, Veiled/Editorial discovery).
**Reference discipline:** `UI_UX_HANDBOOK.md` (Part I tokens · §6 starter block · §14 Definition of Done).
**Codebase:** `client/` (React 19 + Tailwind v4 CSS-first + shadcn-style `components/ui` + cva + framer-motion + TanStack Query v5 + react-router v7).

---

## 0. The governing idea (read first)

The handbook's central claim — *~90% of the premium feel lives in the tokens, not the components* (§1) — is the entire integration strategy. The client is already built on the correct three layers:

| Layer | Where it lives today | Sprint touches it? |
|---|---|---|
| **L1 — Tokens** | `client/src/index.css` (`:root` + `.light`), `client/tailwind.config.js` | **Yes — rewrite once (LX-1).** This is where ~90% of the new look comes from. |
| **L2 — Components** | `client/src/components/ui/*` (button, card, badge, dialog, input, switch…) | Lightly — variants only, no structural change. |
| **L3 — Composition** | `client/src/pages/*`, `client/src/components/layout/*` | Per-screen polish stories. |

Because every component already reads tokens (`bg-card`, `text-lustre-muted`, `border-border`, `bg-gradient-brand`), **re-theming = editing `index.css` and watching the app inherit it.** Stories LX-2…LX-9 are mostly verification + the handful of places that hard-code values.

### The one product decision this sprint encodes
The prototype makes **champagne gold the primary brand** (you chose it); the live app today uses **purple→rose as primary, gold reserved for premium**. This plan adopts gold-forward. *If you'd rather keep purple/rose, only the hue numbers in LX-1 change — every other story is identical.*

---

## 1. Sprint shape

Two one-week sprints. Sprint 1 lands the foundation + the three highest-traffic surfaces so the app *looks* shipped by Friday. Sprint 2 finishes the long tail and pays down test/QA debt.

- **Sprint 1 — Foundation & hero surfaces:** LX-1 tokens, LX-2 component variants, LX-3 Discovery, LX-4 Premium, LX-5 Matches.
- **Sprint 2 — Long tail & hardening:** LX-6 Profile/Edit, LX-7 Referrals, LX-8 Admin, LX-9 Auth/Landing, LX-10 Swipe + match overlay, LX-11 test & QA gate.

Total: **~42 points.**

---

## EPIC A — Token & system foundation

### LX-1 · Migrate the token block to OKLCH gold + brand-tinted shadows  ⭐ blocker · 5 pts
**Files:** `client/src/index.css`, `client/tailwind.config.js`
**Handbook:** §3.1 (OKLCH), §3.2 (colored shadows), §3.3 (one `--radius`), §3.4 (tracking), §3.5 (semantic roles), §6 (starter block).

The prototype's token set (see `Lustre.dc.html` `<helmet>` `:root` / `[data-theme="light"]`) is the target. Port it into the existing structure — keep the `:root` (dark) + `.light` split and the shadcn variable mapping; **do not** rename the Tailwind color keys (`void/base/card/lustre.*`) or every page breaks.

**Acceptance criteria**
- [ ] All colors authored in `oklch()` (replaces the current hex in `:root` and `.light`).
- [ ] `--primary` / `--ring` move to champagne gold (`oklch(0.815 0.122 84)` dark · `oklch(0.62 0.13 66)` light); `--primary-foreground` updated for AA contrast on fills.
- [ ] `--gradient-brand` re-pointed to the gold ramp (today it's `#d2bcff → #ffb0ce`); decide whether `--gold` premium tokens collapse into `--primary` or stay as a distinct "elite" accent (recommend: keep one `--gold` for the premium badge so "premium" still reads as special — see LX-4 note).
- [ ] **Brand-tinted shadows added** — today `--shadow-card: none` in dark. Add `--shadow-sm/-card/-card-hover` as low-opacity, large-blur, **gold-tinted** shadows (§3.2). This is the single biggest perceived-quality lever and is currently empty.
- [ ] One `--radius` knob drives the scale (today `0.75rem`; prototype reads ~`1.125rem` — pick one and derive sm/md/lg).
- [ ] `--tracking-normal: -0.015em` applied on `body` (matches prototype's `-0.014em`).
- [ ] **Fonts unchanged.** Keep `Be Vietnam Pro` (sans), `Manrope` (headline), `EB Garamond` (serif). The prototype's serif-accent role (wordmark, big italic headers) already exists in-app as `font-garamond italic` — no font swap, lower risk.
- [ ] Light theme reaches full parity (every role has a `.light` value) and shadows replace borders for depth (§4.6, already the pattern).
- [ ] `npm run dev` renders with **no `console` token-resolution warnings**; toggle via existing `ThemeContext` (`storageKey: 'dating-theme'`, class on `documentElement`).

**Test impact:** snapshot/className assertions in `button.test.tsx`, `badge.test.tsx`, `card.test.tsx` may reference colors — expect minor updates (covered in LX-11).

---

### LX-2 · Reconcile component variants with the gold system · 3 pts
**Files:** `client/src/components/ui/button.tsx` (cva variants), `badge.tsx`, `card.tsx`, `switch.tsx`, `input.tsx`
**Handbook:** §4.7 (variants over one-off classes), §5 (components reference L1 only).

`button.tsx` hard-codes `bg-gradient-brand`, `bg-gradient-gold`, `text-black`, `text-white` in its cva table. After LX-1 these need a once-over so `default` and `gold` don't fight.

**Acceptance criteria**
- [ ] `default` variant = gold gradient with correct `--primary-foreground`; `text-black`/`text-white` literals replaced by token-driven foreground.
- [ ] `gold` variant either retired (now redundant) or repurposed as the premium "elite" treatment — one explicit decision, documented in the file.
- [ ] `pill`, `outline`, `link`, `ghost` re-verified against gold `--ring` focus state (§4.8 — every interactive element keeps a visible `focus-visible` ring).
- [ ] No new one-off color classes introduced in pages; if a page needs a state, it goes in the variant table.

---

## EPIC B — Hero surfaces (Sprint 1)

### LX-3 · Discovery grid + premium lock · 8 pts
**Files:** `client/src/pages/Discovery.tsx`, `client/src/components/layout/DiscoveryTabs.tsx`
**Prototype:** Discovery screen (Veiled / Editorial) + lock state. **Handbook:** §4.6 (empty/loading/lock states first-class), Nielsen #1 (system status).

Discovery already has the right bones: a `UserCard` over a 2/3 photo, the `isGated` full-page lock ("Discovery is Reserved"), the per-card upgrade `Dialog`, and `Skeleton` loading. This story is **restyle + one product choice**, not a rebuild. Real Cloudinary photos stay — the prototype's gradient faces were placeholders only.

**Product choice to resolve in refinement:** the prototype offers two card treatments —
- **Veiled** (privacy-forward: frosted photo, reveal-on-like) — leans into the app's ghost-mode/consent DNA, and elegantly handles photo-less profiles.
- **Editorial** (full-bleed duotone, large serif name) — closer to today's `UserCard`.

Pick one for v1 (or ship Veiled behind a flag for an A/B). Recommendation: **Editorial** for v1 (smallest delta from current `UserCard`), Veiled as a fast-follow experiment.

**Acceptance criteria**
- [ ] `UserCard` restyled to the chosen treatment using tokens + new gold shadow; gold `Crown` premium marker retained.
- [ ] `isGated` lock screen matches the prototype's "Premium privilege" composition (gold lock chip, serif headline, single primary CTA → `/premium`). Copy stays in the user's voice (§14).
- [ ] Per-card upgrade `Dialog` restyled consistently.
- [ ] Loading `Skeleton` grid and the end-of-list empty state both reviewed against §4.6.
- [ ] **`id="discovery-grid"` preserved** — `TourGuide`/Aura targets it (see LX-CC1).
- [ ] Dark + light parity.

**Test impact:** `Discovery.test.tsx`, `tests/features/Free_User_Gated_Discovery.feature`, `Discovery_Filtering.feature` — verify selectors/copy still match.

---

### LX-4 · Premium paywall · 5 pts
**Files:** `client/src/pages/Premium.tsx`
**Prototype:** Premium screen + M-Pesa STK states. **Handbook:** §3.5 (primary used sparingly — one CTA), Nielsen #1.

Today: single **Monthly KES 500** plan, M-Pesa (STK + 3s polling) and Paystack, payment `Dialog`. Restyle to the prototype's plan card + STK "check your phone" loader + success state.

**Acceptance criteria**
- [ ] Plan card, feature list, and payment `Dialog` restyled to tokens; gradient CTA → gold.
- [ ] M-Pesa flow keeps real logic (`handleMpesaPay` → `polling`); add the prototype's **explicit loading state** ("STK push sent — enter your PIN") and **success state** (handbook §4.6 + Doherty <400ms feedback). Wire to the existing `useSubscription` poll, not a fake timer.
- [ ] Paystack path untouched functionally.
- [ ] **Single plan only — Monthly KES 500.** No Basic/Full tiering. The prototype's two-tier card is dropped; build the one plan card to match the live backend (flat 500, `handleSuccessfulPayment` → `premiumTier='basic'`). Do **not** add tier-gated feature copy (e.g. "ghost mode only on Full") — all premium features come with the one plan.

**Test impact:** `tests/features/Premium_Upgrade.feature`, `Paystack_Payment.feature`.

---

### LX-5 · Matches + mutual-consent reveal · 5 pts
**Files:** `client/src/pages/Matches.tsx`
**Prototype:** Matches screen with gated WhatsApp/Instagram reveal. **Handbook:** Nielsen #1/#5, §4.6.

Restyle match list cards; make the **consent gate** legible — the "links hidden until *both* consent" rule is a core, trust-defining interaction and should read clearly (dashed locked panel → reveal CTA → unlocked WhatsApp/Instagram), per the prototype.

**Acceptance criteria**
- [ ] Match card, compatibility badge, and the locked/revealed states restyled to tokens.
- [ ] Three states explicit: not-yet-consented, *you* consented (waiting on them), both-revealed (links live).
- [ ] Real `reveal` mutation preserved (`POST /matches/:id/reveal`).
- [ ] Dark + light parity.

**Test impact:** `tests/features/Match_Contact_Reveal.feature`, `Matches.test.tsx`.

---

## EPIC C — Long tail (Sprint 2)

### LX-6 · Profile + Edit Profile · 5 pts
**Files:** `client/src/pages/Profile.tsx`, `client/src/pages/EditProfile.tsx`, `client/src/components/PhotoUploader.tsx`, `client/src/components/ui/AgeSlider.tsx`
**Prototype:** Profile (cover + completeness meter) and Edit (photo grid, intent chips, bio, ghost-mode switch).

**Acceptance criteria**
- [ ] Profile header, completeness `Progress`, and CTAs restyled; tier chip reflects `premiumTier`.
- [ ] Edit: `PhotoUploader` grid (1–6, main badge), intent selector, bio + counter, Instagram field, ghost-mode `switch` — all on tokens.
- [ ] Form a11y intact (labels, focus rings) — §12, Form Design Patterns.

**Test impact:** `EditProfile.test.tsx`, `PhotoUploader.test.tsx`, `tests/features/Profile_Management.feature`, `Matchmaking_Age_Slider.feature`.

---

### LX-7 · Referral & affiliate dashboard · 3 pts
**Files:** `client/src/pages/ReferralDashboard.tsx`
**Prototype:** gold wallet card, copy-link, stat trio, activity feed, KES 500 withdraw threshold.

**Acceptance criteria**
- [ ] Wallet hero (available/pending/per-upgrade), referral-link copy with confirmation, stats, and activity feed restyled.
- [ ] Withdraw CTA reflects the real **≥ KES 500** rule and disabled/below-threshold messaging.

**Test impact:** `ReferralDashboard.test.tsx`, `tests/features/Referral_Dashboard.feature`, `Referral_Commission_Tracking.feature`, `Withdrawal_Flow.feature`.

---

### LX-8 · Admin dashboard · 3 pts
**Files:** `client/src/pages/AdminDashboard.tsx`
**Prototype:** stat cards, withdrawal queue with approve/reject, top affiliates, CSV export. Admin path hides nav (`isAdminPath` in `App.tsx`) — keep that.

**Acceptance criteria**
- [ ] Stat cards, withdrawal queue (mark-paid / reject), CSV export buttons restyled to tokens.
- [ ] `destructive` (reject) and `success` (paid) states use semantic tokens, not literals.
- [ ] Desktop-first layout preserved.

**Test impact:** `tests/features/Admin_CSV_Export.feature`.

---

### LX-9 · Auth + Landing · 3 pts
**Files:** `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`, `client/src/pages/Landing.tsx`, `client/src/components/ui/ShaderBackground.tsx`
**Prototype:** login (email + Google), OTP step, editorial hero.

**Acceptance criteria**
- [ ] Login/Register/OTP inputs, buttons, and Google CTA restyled; OTP 6-box pattern matches prototype.
- [ ] Landing hero adopts the serif headline treatment; `hero.png` / `ShaderBackground` retuned to the gold palette.
- [ ] Loaders in `PrivateRoute`/`AdminRoute` (the gold `Loader2` + serif "Lustre") already match — verify only.

**Test impact:** `Login.test.tsx`, `Register.test.tsx`, `Landing.test.tsx`, `tests/features/Registration.feature`, `Email_Verification.feature`.

---

### LX-10 · Swipe deck + "It's a match" overlay · 3 pts
**Files:** `client/src/pages/Recommendations.tsx`
**Prototype:** scored swipe card stack, pass/super/like controls, full-screen match celebration, caught-up empty state. **Handbook:** §4.5 (animation CSS-first, subtle), Doherty threshold.

**Acceptance criteria**
- [ ] Recommendation card restyled with compatibility score chip (real `/matching/recommendations` data, scored /80).
- [ ] Like/pass/super controls + **"It's a match" overlay** (new) on mutual like.
- [ ] Empty state when the deck is exhausted.
- [ ] Motion via framer-motion or CSS, fast and subtle; respects `prefers-reduced-motion` (§12).

---

## Cross-cutting stories

### LX-CC1 · Preserve TourGuide ("Aura") anchors · 1 pt
`TourGuide.tsx` spotlights elements by DOM id (`#discovery-grid`, `#bottom-nav-*`, etc.). Any restructure in LX-3/5/6 must keep those ids or update the tour step targets in the same PR. **AC:** tour runs end-to-end on mobile (`tests/features/Tour_Mobile_Responsive.feature` green).

### LX-CC2 · Navigation IA stays as-is · included
`BottomNav.tsx` = Discovery / Matches / Rewards / Premium / Profile (mobile, `md:hidden`); `Navbar.tsx` = desktop; matching is reached via `DiscoveryTabs`. **Do not** add a "Daily/Matching" bottom-tab (the prototype's control chrome was a review aid, not product IA). Restyle nav active state to gold; keep ids.

### LX-CC3 · Accessibility & dark/light parity gate · included in each story
Per handbook §12 / §14: contrast ≥ 4.5:1 on the new gold (verify gold-on-dark and white-on-gold), visible focus rings, ≥44px touch targets on `BottomNav` and swipe controls, no color-only meaning, reduced-motion honored. Run on **both** themes.

---

### LX-11 · Test & QA hardening gate · 4 pts
**Why it's a story:** client coverage is **98.8%** and there are **16 Playwright BDD feature specs** + `ui_exploration.spec.ts` / `ui_exploration_light.spec.ts`. Token + markup changes *will* ripple into snapshot/className assertions.

**Acceptance criteria**
- [ ] `npm run test:client` green (update color/class assertions in `*.test.tsx` to new tokens).
- [ ] `npm run test:bdd` green (`npx bddgen && npx playwright test`); update any selector/copy drift.
- [ ] `ui_exploration` visual specs re-baselined for dark **and** light (`playwright.light.config.ts`).
- [ ] `npm run lint` clean.
- [ ] Handbook **§14 Definition of Done** run as the exit checklist on each migrated screen (states, heuristics, tokens-only, a11y, responsive, regression).

---

## Sequencing & dependencies

```
Sprint 1: LX-1 ──▶ LX-2 ──▶ ┬─ LX-3 (Discovery)
 (blocker tokens)           ├─ LX-4 (Premium)
                            └─ LX-5 (Matches)
Sprint 2: LX-6 Profile/Edit · LX-7 Referrals · LX-8 Admin · LX-9 Auth/Landing · LX-10 Swipe
          ── LX-CC1 rides with LX-3/5/6 ──  LX-11 QA gate closes the sprint
```

- **LX-1 blocks everything** — merge it first, behind no flag, so screen work inherits the look.
- LX-3/4/5 are parallelizable once LX-1+LX-2 land.
- LX-11 runs continuously but is the hard gate before release.

## Risks & mitigations
- **Snapshot test breakage (high likelihood):** budgeted as LX-11; keep token *names* stable in LX-1 to minimize blast radius.
- **Gold contrast in light mode:** gold on white fails AA for text — LX-1 uses a deeper amber (`oklch(0.62 0.13 66)`) for fills/text and reserves the bright gold for dark surfaces. Verify with axe.
- **Premium scope:** locked to the single KES 500 plan — no tiering, matching the live backend. Removes a whole class of server/UI work.
- **Tour anchors:** LX-CC1 makes id preservation a first-class AC.
- **react-compiler:** the build uses `babel-plugin-react-compiler` — keep components rules-of-hooks clean during restyles.

## Out of scope (backlog)
- Veiled discovery as a permanent A/B (if Editorial ships v1).
- Roadmap items from the audit §6 (M-Pesa B2C payouts, WebSocket notifications, PostGIS, photo verification) — unaffected by this design work.

## Definition of Done (per screen — from Handbook §14)
- [ ] Tokens only — no hard-coded color/radius/shadow.
- [ ] Empty / loading / error / lock states designed.
- [ ] One primary action per view; copy in the user's voice.
- [ ] WCAG AA: contrast, keyboard, focus, labels; reduced-motion + dark/light.
- [ ] Touch targets ≥ 44px; feedback < 400ms.
- [ ] Unit + BDD tests updated and green; visual snapshots re-baselined.
