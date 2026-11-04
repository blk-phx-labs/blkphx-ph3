# BLK PHX LABS — PH3 Combat Tracker
## Project Handoff — updated 2026-11-04

---

## What This Is

A PWA training tracker implementing Layne Norton's PH3 13-week powerlifting program, built for a 175lb martial artist running concurrent 2-mile Zone 2 sessions post-lift. Single HTML file, localStorage, science-backed nutrition engine, auto-regulation from AMRAP inputs, Google Sheets sync via OAuth PKCE + Sheets API v4.

---

## Repo

```
https://github.com/blk-phx-labs/blkphx-ph3
Local: C:\Users\f4l\Documents\GitHub\blkphx-ph3
Live:  https://blkphx-ph3.pages.dev
```

---

## Current State

| Phase | Status | Notes |
|---|---|---|
| 1 — Static PWA | ✅ Live | Every push to `main` deploys through `.github/workflows/deploy.yml` (wrangler, secret `CLOUDFLARE_API_TOKEN`), publishing only `index.html`, `manifest.json`, `sw.js`, `_redirects` and `assets/brand`. Pages' own Git link still names the old `fabzy4L` repo and doesn't work. Cloudflare's docs say a moved repo needs a new project, which would change the URL, so don't recreate it. |
| 2 — Apps Script | ❌ Obsolete | Code in `scripts/blkphx_apps_script.js` is dead — implementation went straight to OAuth+Sheets API v4. Ignore it. |
| 3 — Google OAuth + Sheets Sync | ✅ Working | OAuth PKCE flow live. The sync rewrite is deployed, and the real Sheet still needs checking after the first open on a connected device. |

---

## Infrastructure

| Component | Detail |
|---|---|
| Cloudflare account | "Fpalvarez23@gmail.com's Account" (`992d365604439945e980e38b5338b008`). Sign in with fpalvarez23@gmail.com; the GitHub button signs in as fabzy4l@gmail.com, which is not this account. |
| Frontend | Cloudflare Pages — `https://blkphx-ph3.pages.dev` |
| OAuth Worker | Cloudflare Worker — `https://blkphx-oauth.fpalvarez23.workers.dev` |
| Worker secrets | `GOOGLE_CLIENT_SECRET` set via `wrangler secret put` (never in repo) |
| Worker vars | `GOOGLE_CLIENT_ID` in `workers/oauth-proxy/wrangler.toml` |
| GCP credentials | OAuth 2.0 client — authorized origin + redirect URI registered for `blkphx-ph3.pages.dev` |
| Google Sheet | `https://docs.google.com/spreadsheets/d/1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg` |

---

## File Structure

```
blkphx-ph3/
├── index.html                          ← Full app (single file)
├── manifest.json                       ← PWA manifest
├── sw.js                               ← Service worker (pages network-first, other files cache-first)
├── _redirects                          ← Cloudflare Pages SPA routing (/* → index.html)
├── workers/
│   └── oauth-proxy/
│       ├── index.js                    ← Worker: /token and /refresh endpoints
│       └── wrangler.toml               ← Worker config (GOOGLE_CLIENT_ID as var)
├── assets/
│   └── brand/                          ← Logo, icons and fonts copied from blk-phx-labs.github.io/assets
├── scripts/
│   └── blkphx_apps_script.js           ← DEAD CODE — ignore
└── docs/
    ├── BLKPHX_CLAUDECODE_SPEC.md       ← Full spec (authoritative reference)
    └── reference/
        ├── MACROS.xlsx
        └── PH3_PROGRAMMING_POSTINJ.xlsx
```

---

## Google Sheets layout

`Sessions`, `Lifts`, `Stats` and `_data` all have a header in row 1. `_data` holds one JSON row per session and is what the app reads back. `Sessions` and `Lifts` are flat views of it, rewritten whole at fixed ranges on every change.

- Don't use `values:append`. It guesses a table from blank cells and stair-stepped `Sessions` 13 columns to the right on each save.
- Each session stores its own PH3 day and body profile at save time, so old rows don't change when settings do.
- `Est. Total` and `Est. Wilks` come from that session's estimated squat, bench and deadlift, and stay blank unless all three were logged. The program 1RM total lives on `Stats`.
- Edits keep the session ID. The newest `updatedAt` wins across devices. A delete stays in `_data` as `{id, deleted, updatedAt}` so other devices drop it too.
- Hand edits to `Sessions` or `Lifts` are overwritten on the next sync. Edit in the app.

---

## Screens

- **Today** and **Progress** sit in the bottom bar. Settings is behind the gear. Nutrition, Calculator, Science and the full session form open as pages with Back, using browser history.
- **Today:** ticking a set writes straight to that day's session through `commitDraft()`, and Sheets syncs 1.5 seconds later or when the app is hidden. Unticking the last set removes the session. `S.draft` keeps typed values between opens.
- **Finish:** a new best only raises the program max through `applyPRs()`, on Finish or once the session's day has passed, so weights don't move mid-workout.
- **Week strip:** tapping another day previews it read-only. "Make Dx today" moves the start date.
- **Insights:** `buildInsights()` is plain rules over logged sessions. Today shows the first two and Progress shows all of them.
- **Session form:** the pencil on a Progress card or the Today link opens it, for full edits and off-plan sessions.
- **CLEAR SESSIONS** clears this device only, and sessions load back on the next sync. **REWRITE SHEET FROM THIS DEVICE** removes anything that exists only on the Sheet.

---

## Key Technical Notes

| Thing | Detail |
|---|---|
| localStorage key | `blkphx3` — do not rename |
| OAuth token key | `blkphx_gtoken` in localStorage |
| PKCE verifier | Stored in `sessionStorage` as `pkce_v` during auth flow |
| OAuth callback | `window.location.origin + '/oauth-callback'` — handled by `_redirects` catch-all |
| Chart.js | Pinned to `4.4.0` via CDN — do not bump without testing |
| AUTOREG tables | In `index.html` as `const AR={...}` — treat as constants |
| Athlete defaults | 175lb / 11.5% BF / SQ 320 / BN 260 / DL 420 |
| Program start | Set via Settings → Program Start Date — drives `curDay()`. Tapping a day or saving Current Day moves the start date so today becomes that day. |
| Dates | Use `localISO()` for calendar dates. `toISOString()` is UTC and rolls to tomorrow in the US evening. |
| Theme | Matches blkphxlabs.com: 8-bit phoenix mark, `#e8520a` on `#0a0a09`, Silkscreen and Press Start 2P for labels and numbers, Georgia for names and reading text. Tokens live on `:root` in `index.html`; charts read them through `T()` and `tA()`. Orange = primary and squat, blue = run and bench, amber = AMRAP/PR and deadlift, green = success, red = danger. |
| Service worker | Bump `CACHE_NAME` in `sw.js` when the shell changes. Pages load network first, other files cache first. |
| Const ordering bug (fixed) | OAuth constants were declared after the init block that called them — caused `ReferenceError`. Fixed by moving init block below constants. |

---

## Spec Reference

Full architecture, data models, AUTOREG tables, nutrition engine, science citations, and deployment steps:

```
docs/BLKPHX_CLAUDECODE_SPEC.md
```

Feed that file + this HANDOFF to Claude Code to resume.
