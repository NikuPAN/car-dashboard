# CLAUDE.md — car-dashboard (車輛底盤調教 by 鹹魚老默)

A static single-page dashboard of car suspension tunes. **No backend, no database, no secrets**: the browser downloads a public
Google Sheet as CSV and renders it as a searchable MUI table, or as cards.
Live at **https://car-dashboard.niku-aws.com** · GitHub **`NikuPAN/car-dashboard`**.

## Stack & layout
- React 19 · MUI 7 (Emotion) · **Vite 8** (migrated from Create React App in Sept 2026). `npm run dev` / `npm run build` (→ `dist/`) / `npm run preview`.
- `index.html` (repo root, Vite entry) **starts the sheet download inline** (`window.__carsCsv`) so it runs in parallel with the JS bundle;
  `vite.config.js` injects the URL from `src/sheet.js` (single source of truth for the sheet id/gid).
- `src/load_data.js` — takes that early download (or fetches), parses it with `src/csv.js`, and turns the sheet's two header rows
  (row 3 group names, row 4 sub-names) into flat records. **The column names shown in the UI are whatever the sheet says** — records are
  rendered with `Object.keys/values`, so never add extra properties to a record (use a wrapper, as `App.jsx` does with `{ id, car, name }`).
- `src/csv.js` replaced papaparse (−7 KB gz). It was verified identical to `Papa.parse(text).data` on the real sheet (173 rows, CRLF,
  quoted commas). If the sheet ever gains odd CSV features, re-run that comparison before trusting it.
- `src/App.jsx` — table view (default), search with `useDeferredValue`, memoised rows keyed by sheet position.
  `src/components/CardView.jsx` is **lazy-loaded** (own ~6.5 KB gz chunk) only when the card view is opened.

## Why it was optimised (2026-09-26)
Heroku ran `react-scripts start` — the **webpack dev server** — in production: ~680 MB RAM (R14 errors every 20 s) and a 2.2 MB
unminified bundle. Now: static files served by nginx (**32 MB cap**, a few MB used), main bundle 314 KB / 103 KB gz, first load
~1.6 s vs ~4 s, dependencies 1,410 → 126 lockfile entries. Icons were recompressed losslessly (favicon was a 210 KB raw BMP → 4.8 KB
16/32/48 PNG ICO); the 32 px header logo is a 64 px WebP. Screens were pixel-diffed against the old site: identical except the logo's
resampling (0.017% of pixels).
**Never run the dev server in production again** — the container has no Node at runtime.

## Hosting & deploy — Nick's personal VPS
- Runs on Nick's personal Hostinger VPS (`srv1672611`) as Docker Compose project **`car-dashboard`** in `/srv/personal-projects/car-dashboard/app`:
  multi-stage build (node:24 builds → `nginxinc/nginx-unprivileged:alpine-slim` serves), read-only root fs, `/tmp` tmpfs,
  config in `deploy/nginx.conf` (hashed `/assets/*` cached 1 year, `index.html` no-cache, `/healthz`). Behind the **shared Caddy**
  (`/srv/proxy`, site file `caddy/sites/car-dashboard.caddy`, on-demand TLS for car-dashboard.niku-aws.com) on the `web` network
  as `car-dashboard:8080`. No `.env`, no `personal-db`. The same box runs Nick's **OpenClaw** — never touch anything outside this app's folder.
  Server-wide runbook: `~/.claude/playbooks/heroku-to-hostinger-vps.md`.
- **Deploy = push to `main`** via the self-hosted runner (label `personal-vps-car-dashboard`) → `deploy/remote-deploy.sh`.
  Fallback from the PC: `bash deploy/push-to-vps.sh`. Access: `ssh root@100.104.160.3` (Nick's personal tailnet, Tailscale SSH check mode).
- Windows checkout has `core.autocrlf=true`: `.gitattributes` forces LF for everything that runs on Linux; `push-to-vps.sh` archives with `core.autocrlf=false`.

## Gotchas
- The sheet must stay shared "Anyone with the link can view", or the page loads with an empty table (the error is only in the console).
- `lang="en"` on `<html>` is kept from the original so CJK glyph rendering didn't change; switching to `zh-Hant` would be more correct but changes the fonts.
- The first data row "極限組" with empty fields is a group-label row in the sheet, rendered as-is (same as before the rewrite).
