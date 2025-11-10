// scripts/postinstall.js
const { execFileSync } = require('node:child_process');

const npm = process.env.npm_execpath || 'npm';
const run = (args, cwd) => {
  console.log(`> ${npm} ${args.join(' ')} ${cwd ? '(cwd='+cwd+')' : ''}`);
  execFileSync(process.execPath, [npm, ...args], { stdio: 'inherit', cwd });
};

try {
  // Skip Chromium download – safe to keep for CI/dev
  process.env.PUPPETEER_SKIP_DOWNLOAD = process.env.PUPPETEER_SKIP_DOWNLOAD || '1';

  run(['install'], 'frontend/Responsive Booking Marketplace');
  run(['install'], 'frontend/Merchant Portal Design');
} catch (e) {
  console.warn('postinstall: continuing despite error:', e?.message || e);
  // Do not throw – keep behavior similar to "|| exit 0"
}
