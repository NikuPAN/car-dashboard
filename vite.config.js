import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { CSV_URL } from './src/sheet.js';

// index.html starts the sheet download with %CARS_CSV_URL% before the app bundle loads.
const injectSheetUrl = {
  name: 'inject-sheet-url',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%CARS_CSV_URL%', CSV_URL) },
};

export default defineConfig({
  plugins: [react(), injectSheetUrl],
  build: { target: 'es2020' },
});
