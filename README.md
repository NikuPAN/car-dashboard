# 車輛底盤調教 by 鹹魚老默 (car-dashboard)

A searchable table / card view of car suspension tunes, read live from a public Google Sheet.
Live at https://car-dashboard.niku-aws.com.

- **Stack:** React 19 · plain CSS · Vite. No backend: the browser downloads the sheet as CSV (`src/sheet.js`) and parses it (`src/csv.js`, `src/load_data.js`).
- **Develop:** `npm install`, then `npm run dev` (http://localhost:5173).
- **Build:** `npm run build` → static files in `dist/`; `npm run preview` serves that build locally.
- **Deploy:** push to `main` — see `CLAUDE.md` for the VPS setup.

To change the data, edit the Google Sheet; the site reads it on every page load, so no deploy is needed.
