# Lustre — Brand mark

**Chosen direction: "The Gleam" (1a).** A gold serif **L** with a four-point gleam, set in
Newsreader. Premium, editorial, and tied to the name (*lustre* = soft shine).

## Files (`brand/`)
| File | Use |
|---|---|
| `lustre-appicon-dark.svg` | Primary app icon — gold L + gleam on warm-dark squircle (1024²). |
| `lustre-appicon-gold.svg` | Inverted app icon — dark L on gold. For light placements / stickers. |
| `lustre-mark.svg` | Mark only (L + gleam), transparent. Favicons, avatars, loaders. |
| `lustre-lockup.svg` | Horizontal lockup: "Lustre" wordmark + gleam. Headers, marketing. |
| `_preview.html` | Open to see all four together. |

## Colors
- Gold gradient: `#F4DC8E → #C9882F` (the L and gleam).
- Wordmark on dark: `#FBFAF7`. Mark tile: `#221C16 → #15110D`.
- Matches the app token `--primary` (`oklch(0.825 0.125 86)`).

## Type
Wordmark + L are **Newsreader** (weight 500). It's already loaded in the client — no new font.
The SVGs name `Newsreader` with a `Georgia/serif` fallback, so they still read correctly if
opened somewhere the webfont isn't present.

## Clear space & min size
- Keep clear space ≥ the height of the gleam on all sides.
- Mark is legible to **16px**; below that, drop the gleam and keep the L.
- Never recolor the L outside the gold gradient or a single flat brand color (gold / ink / white).

## Wiring into the client (`client/`)
1. Drop `lustre-mark.svg` in `client/public/` as `favicon.svg` and set in `client/index.html`:
   ```html
   <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
   <link rel="apple-touch-icon" href="/lustre-appicon-dark.svg" />
   ```
2. Replace the loader/auth wordmark (`PrivateRoute`, `Login`, `Landing`) with the lockup —
   the serif `Lustre` already in those screens just needs the gleam `✦` accent beside it
   (see `Lustre.dc.html` control header for the exact treatment).
3. PNG exports (for stores / OG images): render the SVGs at 1024², 512², 192², 180², 32².
