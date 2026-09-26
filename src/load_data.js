import parseCsv from './csv';
import { CSV_URL } from './sheet';

// index.html starts the download before the app bundle arrives (window.__carsCsv). Use that once;
// any later call (e.g. React StrictMode's second effect run in dev) fetches fresh.
function fetchCsv() {
  const early = window.__carsCsv;
  window.__carsCsv = undefined;
  return early ?? fetch(CSV_URL).then((r) => {
    if (!r.ok) throw new Error(`sheet HTTP ${r.status}`);
    return r.text();
  });
}

export default async function loadCarData() {
  const grid = parseCsv(await fetchCsv()); // array of rows, each an array of strings

  // 1. Headers & metadata
  // (we ignore rows 0–1 metadata and row 4 group-labels by filtering later)
  const h1 = grid[2];
  const h2 = grid[3];

  // 2. fill-down h1
  const filled = [];
  let last = '';
  for (const c of h1) {
    if (c.trim()) last = c.trim();
    filled.push(last);
  }

  // 3. detect contiguous spans
  const groups = [];
  filled.forEach((name, i) => {
    if (i === 0 || name !== filled[i - 1]) {
      groups.push({ name, start: i, end: i + 1 });
    } else {
      groups[groups.length - 1].end = i + 1;
    }
  });

  // 4. raw data rows: from row 5 onward, skip blank-A rows
  const records = [];
  const COMBINE = new Set(['改裝方向']);
  for (let r = 4; r < grid.length; r++) {
    const row = grid[r];
    if (!row[0].trim()) continue; // skip blank-A

    // pad ragged rows
    while (row.length < filled.length) row.push('');

    // 5. build one record
    const rec = {};
    for (const g of groups) {
      const span = row.slice(g.start, g.end).map((v) => v.trim());
      if (g.end - g.start === 1) {
        rec[g.name] = span[0];
      } else if (COMBINE.has(g.name)) {
        rec[g.name] = span.join(', ');
      } else {
        // split into sub-fields
        for (let i = g.start; i < g.end; i++) {
          const key = h2[i].trim() || `col${i}`;
          rec[key] = row[i].trim();
        }
      }
    }
    records.push(rec);
  }

  return records;
}
