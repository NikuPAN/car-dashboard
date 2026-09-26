import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { CSV_URL } from './src/sheet.js';

// index.html starts the sheet download with %CARS_CSV_URL% before the app bundle loads.
const injectSheetUrl = {
  name: 'inject-sheet-url',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%CARS_CSV_URL%', CSV_URL) },
};

// Car images are not part of the build (they live on the VPS, served by nginx at /cars/). For local dev/preview,
// serve them from tools/car-images/out when they have been built there (`cd tools/car-images && npm run build`).
const localCarImages = () => {
  const dir = path.resolve('tools/car-images/out');
  // Must not return anything: Vite treats a function returned from these hooks as a "post" hook.
  const serve = (server) => {
    server.middlewares.use('/cars', (req, res, next) => {
      const file = path.join(dir, path.basename(decodeURIComponent(req.url.split('?')[0])));
      if (!file.startsWith(dir) || !fs.existsSync(file)) return next();
      res.setHeader('Content-Type', 'image/webp');
      fs.createReadStream(file).pipe(res);
    });
  };
  return { name: 'local-car-images', configureServer: serve, configurePreviewServer: serve };
};

export default defineConfig({
  plugins: [react(), injectSheetUrl, localCarImages()],
  build: { target: 'es2020' },
});
