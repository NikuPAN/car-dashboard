// Minimal RFC 4180 CSV parser (quoted fields, "" escapes, commas/newlines inside quotes, \n or \r\n rows).
// Replaces papaparse (~7 KB gzipped) for this one sheet; output matches Papa.parse(text).data for it.
export default function parseCsv(text) {
  if (!text) return []; // same as Papa.parse('')
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  row.push(field);
  rows.push(row);
  return rows;
}
