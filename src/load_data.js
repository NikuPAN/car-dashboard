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

const isEmpty = (v) => !v || /^[\s,;\-–—]*$/.test(v);

// "高度 (前, 後)" -> { label: '高度', hint: ['前', '後'] }; "直徑" -> { label: '直徑', hint: null }
function parseLabel(raw) {
  const m = raw.match(/^(.*?)\s*[(（]([^)）]+)[)）]\s*$/);
  if (!m) return { label: raw, hint: null };
  const hint = m[2].split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  return { label: m[1].trim(), hint: hint.length === 2 ? hint : null };
}

// A value for a two-part label ("前, 後" / "白,藍"): "0, 10; 0, 10" splits on ';', "-3, -8" on ','.
function splitPair(value, hint) {
  if (!hint || isEmpty(value)) return null;
  const parts = (value.includes(';') ? value.split(';') : value.split(',')).map((s) => s.trim());
  return parts.length === 2 ? parts : null;
}

// Sheet layout (driven by its own header rows, so renamed columns still render):
//   row 0: title "… (更新: 26/03/2026 20:20:18)"   row 1: community link
//   row 2: column groups (車輛 | 組別 | 改裝方向 ×5 | 懸吊 ×2 | 車輪 ×3 | 最後更新)
//   row 3: sub-headings for multi-column groups     row 4+: cars, plus one "<class>組" label row per class
export default async function loadCarData() {
  const grid = parseCsv(await fetchCsv());

  const title = (grid[0]?.[0] ?? '').trim();
  const meta = {
    sheetUpdated: title.match(/[(（]\s*更新[:：]\s*([^)）]+)[)）]/)?.[1]?.trim() ?? null,
    link: /^https?:\/\//.test((grid[1]?.[0] ?? '').trim()) ? grid[1][0].trim() : null,
  };

  const h1 = grid[2];
  const h2 = grid[3];

  // fill-down the group row, then find each group's column span
  const filled = [];
  let last = '';
  for (const c of h1) {
    if (c.trim()) last = c.trim();
    filled.push(last);
  }
  const spans = [];
  filled.forEach((name, i) => {
    if (i === 0 || name !== filled[i - 1]) spans.push({ name, start: i, end: i + 1 });
    else spans[spans.length - 1].end = i + 1;
  });

  // first span = car name, second = class, last single column = updated date, everything between = detail sections
  const [nameSpan, classSpan] = spans;
  const lastSpan = spans[spans.length - 1];
  const hasUpdated = spans.length > 3 && lastSpan.end - lastSpan.start === 1;
  const detailSpans = spans.slice(2, hasUpdated ? -1 : undefined);
  const sections = detailSpans.map((s) => ({
    title: s.name,
    fields: Array.from({ length: s.end - s.start }, (_, k) => {
      const i = s.start + k;
      const sub = s.end - s.start === 1 ? s.name : (h2[i] ?? '').trim() || `col${i}`;
      return { col: i, ...parseLabel(sub) };
    }),
  }));

  const cars = [];
  const classLabels = new Map(); // '極限' -> '極限組' (from the sheet's label rows)
  const classOrder = [];
  for (let r = 4; r < grid.length; r++) {
    const row = grid[r];
    const name = (row[nameSpan.start] ?? '').trim();
    if (!name) continue;
    const rawCls = (row[classSpan.start] ?? '').trim();
    const rest = row.slice(classSpan.end).join('');
    if (!rawCls && isEmpty(rest)) { // a "<class>組" label row, not a car
      const base = name.replace(/組$/, '');
      classLabels.set(base, name);
      if (!classOrder.includes(base)) classOrder.push(base);
      continue;
    }
    const cls = rawCls || '其他'; // a car with no class still shows up, under 其他
    if (!classOrder.includes(cls)) classOrder.push(cls);
    const variant = name.match(/\s*[(（]([^)）]+)[)）]\s*$/);
    const updated = hasUpdated ? (row[lastSpan.start] ?? '').trim() : '';
    cars.push({
      id: cars.length, // position in the sheet: stable React key and default order
      name,
      base: variant ? name.slice(0, variant.index).trim() : name,
      variant: variant ? variant[1].trim() : null,
      cls,
      updated: isEmpty(updated) ? null : updated,
      values: sections.map((s) => s.fields.map((f) => {
        const v = (row[f.col] ?? '').trim();
        return { text: isEmpty(v) ? null : v, pair: splitPair(v, f.hint) };
      })),
      search: `${name} ${cls}`.toLowerCase(),
    });
  }

  const classes = classOrder.map((c) => ({
    key: c,
    label: classLabels.get(c) ?? `${c}組`,
    count: cars.filter((car) => car.cls === c).length,
  })).filter((c) => c.count > 0);

  return {
    meta,
    columns: { name: nameSpan.name, cls: classSpan.name, updated: hasUpdated ? lastSpan.name : null },
    sections,
    classes,
    cars,
  };
}
