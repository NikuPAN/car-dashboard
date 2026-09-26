// Builds the card banner images: `cd tools/car-images && npm install && npm run build`, then `bash deploy/push-images.sh`.
//
// sources.json maps each car (the card's base name, as src/load_data.js derives it) to one source image:
//   racingmaster.info — 1500×680 showroom shots; the game's rarity/class banners (top 60 px) are cropped off,
//                       the site's watermark (bottom-left) is kept, as agreed with Nick.
//   igcd              — IGCD.net vehicle images (720×~405, no watermark), used where racingmaster.info has no current shot.
// Every image is fitted to the same 2.42:1 frame (the racingmaster.info shape after the banner crop) and saved as
// 560×232 WebP named <slug>.<hash>.webp, so nginx can cache it for a year. The images are NOT committed (third-party
// game art stays out of the public repo): they go to /srv/personal-projects/car-dashboard/images on the VPS.
// The app only ships the name -> file map, written to src/car-images.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(here, '.cache');
const OUT = path.join(here, 'out');
const MAP = path.join(here, '..', '..', 'src', 'car-images.json');
const W = 560, H = 232;
const UA = { 'User-Agent': 'car-dashboard image build (contact nick@kovyn.ai)' };

const url = (s) => (s.src === 'igcd'
  ? `https://www.igcd.net/images/${s.ref.slice(0, 3)}/${s.ref.slice(3)}.jpg`
  : `https://racingmaster.info/wp-content/uploads/${s.ref}`);

const slug = (car, s) => {
  const base = car.replace(/頭文字D版?/g, ' initial-d ').normalize('NFKD').toLowerCase()
    .replace(/[’'´]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || path.basename(s.ref).replace(/\.[a-z]+$/i, '').toLowerCase();
};

async function fetchCached(s) {
  const file = path.join(CACHE, `${s.src}-${s.ref.replace(/[\\/]/g, '_')}`);
  if (fs.existsSync(file)) return fs.readFileSync(file);
  const r = await fetch(url(s), { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url(s)}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(file, buf);
  await new Promise((res) => setTimeout(res, 400)); // be polite to the source sites
  return buf;
}

async function render(buf, s) {
  let img = sharp(buf);
  const { width, height } = await img.metadata();
  if (s.src === 'racingmaster.info') img = img.extract({ left: 0, top: 60, width, height: height - 60 }); // drop the banners
  return img.resize(W, H, { fit: 'cover', position: 'centre' }).webp({ quality: 80, effort: 6 }).toBuffer();
}

fs.mkdirSync(CACHE, { recursive: true });
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const sources = JSON.parse(fs.readFileSync(path.join(here, 'sources.json'), 'utf8'));
const map = {};
let bytes = 0;
for (const s of sources) {
  const webp = await render(await fetchCached(s), s);
  const name = `${slug(s.car, s)}.${crypto.createHash('sha1').update(webp).digest('hex').slice(0, 8)}.webp`;
  fs.writeFileSync(path.join(OUT, name), webp);
  map[s.car] = name;
  bytes += webp.length;
}
fs.writeFileSync(MAP, JSON.stringify(map, null, 1) + '\n');
console.log(`${sources.length} cars -> ${new Set(Object.values(map)).size} files, ${(bytes / 1024).toFixed(0)} KB total, map: src/car-images.json`);
