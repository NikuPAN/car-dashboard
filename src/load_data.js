import Papa from 'papaparse';

// your sheet’s ID & gid (the bottom-left number on your sheet tab)
const SHEET_ID = '16h6PwDjQ6X2NAD4cV1FFiuoYZRAWub7r2ZDYwLczVcg';
const GID      = '0';

// CSV export URL (must be “Anyone with link can view”)
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

export default function loadCarData() {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      download: true,
      skipEmptyLines: false,
      complete: (results) => {
        const grid = results.data;  // array of rows, each an array of strings

        // 1. Headers & metadata
        // (we’ll ignore row 0–1 metadata and row 4 group-labels by filtering later)
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
          if (i === 0 || name !== filled[i-1]) {
            groups.push({ name, start: i, end: i+1 });
          } else {
            groups[groups.length-1].end = i+1;
          }
        });

        // 4. raw data rows: from row 5 onward, skip blank-A & any group-label rows
        const records = [];
        const COMBINE = new Set(['改裝方向']);
        for (let r = 4; r < grid.length; r++) {
          const row = grid[r];
          if (!row[0].trim()) continue;      // skip blank-A
          // optionally: skip known sheet rows 34,67 etc by r index if needed

          // pad ragged rows
          while (row.length < filled.length) row.push('');

          // 5. build one record
          const rec = {};
          for (const g of groups) {
            const span = row.slice(g.start, g.end).map(v => v.trim());
            if (g.end - g.start === 1) {
              rec[g.name] = span[0];
            } else if (COMBINE.has(g.name)) {
              rec[g.name] = span.join('');
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

        resolve(records);
      },
      error: (err) => reject(err)
    });
  });
}
