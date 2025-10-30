// Copies Vite build outputs into Express static directories
// marketplace → Public/site, merchant-portal → Public/portal

import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return { ok: false, reason: 'missing', src };
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      copyDir(s, d);
    } else if (e.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
  return { ok: true, src, dest };
}

const mappings = [
  { from: path.join(root, 'frontend', 'Responsive Booking Marketplace', 'dist'), to: path.join(root, 'public', 'site') },
  { from: path.join(root, 'frontend', 'Merchant Portal Design', 'dist'), to: path.join(root, 'public', 'portal') }
];

for (const m of mappings) {
  const res = copyDir(m.from, m.to);
  if (res.ok) console.log(`[copy-frontend] Copied: ${m.from} -> ${m.to}`);
  else console.log(`[copy-frontend] Skipped (not found): ${m.from}`);
}
