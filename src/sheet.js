// The Google Sheet this dashboard renders. It must be shared as "Anyone with the link can view".
// Used by src/load_data.js and injected into index.html (vite.config.js) so the download starts early.
const SHEET_ID = '16h6PwDjQ6X2NAD4cV1FFiuoYZRAWub7r2ZDYwLczVcg';
const GID = '0'; // the tab id (the number after gid= in the sheet URL)

export const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
