# CLAUDE.md — car-dashboard (車輛底盤調教 by 鹹魚老默)

A static single-page dashboard of car chassis tunes. **No backend, no database, no secrets**: the browser downloads a public
Google Sheet as CSV and renders it as a searchable card grid or a dense table.
Live at **https://car-dashboard.niku-aws.com** · GitHub: **`NikuPAN/car-dashboard-private`** (deploys) + **`NikuPAN/car-dashboard`** (public, open source).

**Two repos, same `main` (since 2026-09-26).** The git remote `origin` fetches from the private repo and **pushes to both**
(`git remote -v` shows two push URLs), so one `git push` keeps them identical. Nick is happy for all work to be public.
- The self-hosted runner is registered **only on the private repo**, and GitHub Actions is **disabled on the public repo**.
  **Never register a runner on, or re-enable Actions for, the public repo**: fork PRs could then run code on the VPS.
  (The deploy workflow file in the public copy is inert: GitHub only routes a repo's jobs to runners registered to that repo.)
- Nothing in this repo is secret. Keep it that way — no `.env`, keys or tokens; server secrets live only in `/srv/...` on the VPS.

## Stack & layout
- React 19 + **plain CSS** (no UI library) · **Vite 8** (migrated from Create React App, Sept 2026).
  `npm run dev` / `npm run build` (→ `dist/`) / `npm run preview`. Runtime dependencies: `react`, `react-dom` only.
- `index.html` (Vite entry, `lang="zh-Hant"`) applies the saved theme before first paint and **starts the sheet download inline**
  (`window.__carsCsv`) in parallel with the JS bundle; `vite.config.js` injects the URL from `src/sheet.js` (single source of the sheet id/gid).
- `src/load_data.js` turns the sheet into `{ meta, columns, sections, classes, cars }`, **driven by the sheet's own header rows**:
  - row 0 title "… (更新: <time>)" → `meta.sheetUpdated`; row 1 URL → `meta.link` (the Discord invite);
  - row 2 column groups (車輛 | 組別 | 改裝方向 ×5 | 懸吊 ×2 | 車輪 ×3 | 最後更新), row 3 sub-labels (引擎, 輪胎, … 高度 (前, 後) …).
    First column = name, second = class, last single column = updated date, everything between = detail sections.
  - A label like "高度 (前, 後)" becomes `{ label: '高度', hint: ['前', '後'] }` and its values split into pairs (on `;` first, else `,`),
    so "寬度 (白,藍)" = "0, 10; 0, 10" → 白 "0, 10" / 藍 "0, 10".
  - **"<class>組" rows with an empty class are section labels, not cars** (極限組 / 性能組 / 運動組 / 越野組); they name the sections.
    A car row with no class is filed under 其他. A trailing "(…)" in a name becomes the `variant` tag (e.g. 4-5階, 裂空青雷套件).
- `src/csv.js` — small RFC 4180 parser that replaced papaparse (−7 KB gz); verified identical to `Papa.parse(text).data` on the real
  sheet (173 rows, CRLF, quoted commas). Re-run that comparison if the sheet ever gains unusual CSV.
- `src/App.jsx` — sticky top bar: search (`/` focuses, Esc clears, matches highlighted), class chips with live counts,
  sort (預設排序 = sheet order with class sections / 名稱 A–Z / 最近更新), 卡片/表格 switch, theme toggle, Discord link.
  Theme and view persist in `localStorage` (`cd-theme`, `cd-view`; every access guarded). Filtering uses `useDeferredValue`.
- **Cards show cars, the table shows tunes.** `App.jsx` groups tunes into models by class + base name (the name without its "(…)"
  suffix): 165 tunes → 113 cars, 32 of them with 2–4 tunes (tiers 0-3階/4-5階, ECU levels, kits like 曼巴套件). Chip counts and the
  count line are per car in card view ("款車（套調校）") and per tune in table view.
- `src/components/CarCard.jsx` — a car with several tunes gets a pill switch (sheet order; no suffix = 標準; "a, b" shown as "a · b");
  a search that matches only a variant (e.g. "曼巴") pre-selects it. Every value is visible, no expanding: the first section (改裝方向)
  as 5 cells, the others (懸吊, 車輪) as side-by-side label/value columns. `src/components/CarTable.jsx` (**lazy-loaded**) mirrors the sheet's two-level header.
- **Car images (added 2026-09-26).** Each card has a 560×232 WebP banner from the game Racing Master (巔峰極速, NetEase).
  - `tools/car-images/sources.json` maps every card's base name to one source image: **racingmaster.info** (98 cars, 1500×680
    showroom shots; the game's rarity/class banners in the top 60 px are cropped, **the site's watermark is kept — Nick's decision**)
    or **IGCD.net** (15 cars racingmaster.info lacks or only has in its older red showroom; no watermark). "Nissan GTR R33 頭文字D版"
    uses IGCD's "1994 Skyline GT-R" 頭文字D car, which looks like an R32 — confirm with Nick if anyone questions it.
  - `cd tools/car-images && npm install && npm run build` downloads (cached in `.cache/`), crops, writes `out/<slug>.<hash>.webp` and
    `src/car-images.json` (name → file). Then **`bash deploy/push-images.sh`** uploads to `/srv/personal-projects/car-dashboard/images`
    (and prunes stale files), and only then commit `src/car-images.json` and push.
  - **The images are never committed** (third-party game art; the public repo must not republish it). nginx serves them read-only at
    `/cars/` from a bind mount (`docker-compose.yml`), cached 1 year (hash in the name). `vite.config.js` serves `tools/car-images/out`
    at `/cars/` for local `dev`/`preview`. A card with no mapping, or a failed load, simply has no banner.
  - A new car in the sheet has no image until it's added to `sources.json`: find it on racingmaster.info (WordPress media API
    `https://racingmaster.info/wp-json/wp/v2/media`, 1500×680 PNGs from 2026) or IGCD (`https://www.igcd.net/game.php?id=1000015448`,
    image `https://www.igcd.net/images/<id[0:3]>/<id[3:]>.jpg`). Footer credits NetEase and both sites.
- `src/ui.jsx` — class colour mapping `tone()`, search `highlight()`, inline SVG icons.
- `src/styles.css` — dark (default) / light tokens on `:root[data-theme]`; class colours via `.tone-*`; phones get a 3-row sticky bar
  (sort, view and class chips share one sideways-scrolling row).

## Why it was optimised and redesigned (2026-09-26)
Heroku ran `react-scripts start` — the **webpack dev server** — in production: ~680 MB RAM (R14 errors every 20 s) and a 2.2 MB
unminified bundle. Step 1 (same look, verified by pixel diff): Vite build served by nginx, unused deps removed (1,410 → 126 lockfile
entries), early sheet download, lazy card view, icons recompressed (favicon was a 210 KB raw BMP → 4.8 KB ICO).
Step 2: Nick found the UI awkward (full-width collapsed cards, very tall table rows), so it was redesigned search-first: responsive
card grid with the whole tune visible, class sections and filters, and a dense two-level table. MUI/Emotion were dropped for plain CSS.
**Never run a dev server in production again** — the container has no Node at runtime.

## Performance notes (measured 2026-09-26, Edge, clean profile, renderer private memory)
- Bundle: 199 KB JS / 65 KB gz + 3 KB CSS. Container: nginx, ~2 MB RAM (32 MB cap).
- Browser tab: blank tab ~25 MB, + CJK fonts ~5 MB, + 165 cards painted ~13 MB, + React/app ~10 MB → cards ~55 MB, table ~57 MB.
  After grouping into 113 cards and adding the lazy-loaded banners (20 of 113 load on the first screen): cards ~60 MB
  (the old MUI build was ~51 MB while showing less: 改裝方向 squashed into one column, details collapsed). Keep it that way:
  - **Never put `position: sticky` on many table cells** — each gets its own compositing layer (~12 MB for 165 name cells).
    The whole `<thead>` is sticky; the name column is pinned only under 900 px, where the table actually scrolls sideways.
  - Cards use `content-visibility: auto`. Rendering only on-screen cards would save ~10 MB more but breaks the browser's Ctrl+F — not done.
- A 250 MB+ tab reported by Nick was the browser environment (extensions, or a tab still running the old dev build), not this page.

## Hosting & deploy — Nick's personal VPS
- **Cut-over done 2026-09-26 (~12:30 Brisbane):** car-dashboard.niku-aws.com CNAME → `srv1672611.hstgr.cloud`; Let's Encrypt cert via Caddy
  on-demand TLS. The Heroku app `car-dashboard` is off (dynos 0, maintenance on; it has no add-ons). Staging URL
  https://car-dashboard.72-60-198-241.sslip.io points at the same container.
- Runs on Nick's personal Hostinger VPS (`srv1672611`) as Docker Compose project **`car-dashboard`** in `/srv/personal-projects/car-dashboard/app`:
  multi-stage build (node:24 builds → `nginxinc/nginx-unprivileged:alpine-slim` serves), read-only root fs, `/tmp` tmpfs,
  config in `deploy/nginx.conf` (hashed `/assets/*` cached 1 year, `index.html` no-cache, `/healthz`). Behind the **shared Caddy**
  (`/srv/proxy`, site file `caddy/sites/car-dashboard.caddy`, on-demand TLS for car-dashboard.niku-aws.com) on the `web` network
  as `car-dashboard:8080`. No `.env`, no `personal-db`. The box runs other services too — never touch anything outside this app's folder.
  Server-wide runbook: `~/.claude/playbooks/heroku-to-hostinger-vps.md`.
- **Deploy = push to `main` of the private repo** via the self-hosted runner (label `personal-vps-car-dashboard`, `/opt/actions-runner/car-dashboard`)
  → `deploy/remote-deploy.sh`. Watch: github.com/NikuPAN/car-dashboard-private/actions.
  Fallback from the PC: `bash deploy/push-to-vps.sh`. Access: `ssh root@100.104.160.3` (Nick's personal tailnet, Tailscale SSH check mode).
- Windows checkout has `core.autocrlf=true`: `.gitattributes` forces LF for everything that runs on Linux; `push-to-vps.sh` archives with `core.autocrlf=false`.

## Gotchas
- The sheet must stay shared "Anyone with the link can view", or the page shows 無法載入資料 (details in the console).
- The UI copy is Traditional Chinese (HK/TW wording: 搜尋, 顯示, 預設排序). Keep new strings consistent.
- Class colours are keyed by class name in `src/ui.jsx`; a new class in the sheet renders in the neutral `other` tone until added there.
