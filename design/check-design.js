#!/usr/bin/env node
/* House-rule checker for the preview.
 *
 *   node design/check-design.js
 *
 * A rule that is only written down rots. (This file exists because a comment
 * in index.html referenced `design/check-tap-targets.js` for months and that
 * file was never actually written — so the tap-target rule quietly drifted
 * until 40 controls were under size.) Everything checked here is a rule in
 * CLAUDE.md. Exit code 1 means a rule was broken.
 *
 * Needs a static server on the port below; it starts one itself.
 */
// playwright-core is not a dependency of this repo (it has none) — resolve it
// from wherever it happens to be installed, and say so plainly if it isn't.
let chromium;
try { chromium = require('playwright-core').chromium; }
catch (e) {
  try { chromium = require(require('child_process')
    .execSync('node -e "console.log(require.resolve(\'playwright-core\'))"',
      { cwd: process.env.PW_DIR || process.cwd(), encoding: 'utf8' }).trim()).chromium; }
  catch (e2) {
    console.error('This check needs playwright-core. Install it anywhere and run with:\n' +
                  '  NODE_PATH=/path/to/node_modules node design/check-design.js');
    process.exit(2);
  }
}
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8899;
const EXEC = process.env.CHROMIUM || '/opt/pw-browsers/chromium';

const SCREENS = [
  ['order', null], ['floor', null],
  ['admin', 'menu'], ['admin', 'screen'], ['admin', 'floorplan'],
  ['admin', 'settings-covers'], ['admin', 'settings-courses'],
  ['admin', 'staff'], ['admin', 'settings-hub'],
];

function serve() {
  return new Promise(res => {
    const s = http.createServer((req, rq) => {
      const f = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
      fs.readFile(f, (e, d) => { if (e) { rq.writeHead(404); rq.end(); } else { rq.writeHead(200); rq.end(d); } });
    });
    s.listen(PORT, () => res(s));
  });
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch({ executablePath: EXEC });
  const fails = [];

  for (const [view, tab] of SCREENS) {
    for (const w of [430, 1300]) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 }, isMobile: w < 800, hasTouch: w < 800 });
      const label = `${view}${tab ? '/' + tab : ''}@${w}`;
      await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
      await page.evaluate(async ({ v, t }) => {
        await loadInitial();
        state.currentStaff = (state.staffList || []).find(s => s.role === 'manager');
        const fp = (state.floorPlans || [])[0];
        state.table = fp && (fp.tables || [])[0];
        state.covers = 4; state.settings.coversEnabled = true;
        const m = state.menu || [];
        state.cart = m.slice(0, 3).map((it, i) => ({ id: 'l' + i, itemId: it.id, name: it.name, price: it.price, qty: 1, mods: [], seat: i + 1, course: 1 }));
        if (v === 'admin') { state.view = 'admin'; state.adminTab = t; }
        else if (v === 'floor') { state.view = 'order'; state.orderType = 'dine-in'; state.showTablePicker = true; }
        else { state.view = 'order'; state.orderType = 'dine-in'; state.showTablePicker = false; state.activeCat = 'Food'; }
        render();
      }, { v: view, t: tab });
      await page.waitForTimeout(1200);

      const bad = await page.evaluate((label) => {
        const out = [];
        const skip = el => el.closest('.scrmock, .mk-wrap') || el.classList.contains('floor-marker');

        // RULE: one swatch wherever a colour is picked.
        const SW = '.color-dot-btn, .accent-swatch, .swatch, .color-popover-grid .color-swatch';
        document.querySelectorAll(SW).forEach(el => {
          if (skip(el)) return;
          const r = el.getBoundingClientRect(); if (r.width < 2) return;
          const c = getComputedStyle(el);
          const want = getComputedStyle(document.documentElement).getPropertyValue('--swatch').trim() || '44px';
          const wantR = getComputedStyle(document.documentElement).getPropertyValue('--swatch-r').trim() || '10px';
          const name = (el.className || '').toString().split(' ')[0];
          if (Math.round(r.height) !== parseInt(want)) out.push(`${label}  swatch ${name} is ${Math.round(r.width)}x${Math.round(r.height)}, must be ${want}`);
          if (c.borderTopLeftRadius !== wantR) out.push(`${label}  swatch ${name} corner ${c.borderTopLeftRadius}, must be ${wantR}`);
          if (!el.classList.contains('empty') && c.borderTopWidth !== '2px') out.push(`${label}  swatch ${name} inner ring ${c.borderTopWidth}, must be 2px`);
        });

        // RULE: the finger law — ink >= --tap, or nothing interactive within --tap.
        const tap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tap')) || 44;
        const els = [...document.querySelectorAll('button,[role=button]')].filter(el => {
          if (skip(el)) return false;
          const b = el.getBoundingClientRect(); if (b.width < 6 || b.height < 6) return false;
          const c = getComputedStyle(el);
          return c.visibility !== 'hidden' && c.pointerEvents !== 'none' && !el.disabled;
        });
        const boxes = els.map(e => e.getBoundingClientRect());
        els.forEach((el, i) => {
          const a = boxes[i], acx = a.left + a.width / 2, acy = a.top + a.height / 2;
          let okW = a.width >= tap - 0.5, okH = a.height >= tap - 0.5;
          if (!okW || !okH) {
            let dx = Infinity, dy = Infinity;
            boxes.forEach((o, j) => {
              if (i === j || els[j].contains(el) || el.contains(els[j])) return;
              const ox = o.left + o.width / 2, oy = o.top + o.height / 2;
              if (Math.abs(oy - acy) < 30) dx = Math.min(dx, Math.abs(ox - acx));
              if (Math.abs(ox - acx) < 30) dy = Math.min(dy, Math.abs(oy - acy));
            });
            okW = okW || dx >= tap - 0.5;
            okH = okH || dy >= tap - 0.5;
          }
          if (!okW || !okH) out.push(`${label}  tap ${(el.className || el.tagName).toString().split(' ')[0]} ${Math.round(a.width)}x${Math.round(a.height)} act=${el.getAttribute('data-act') || ''}`);
        });
        return [...new Set(out)];
      }, label);

      fails.push(...bad);
      await page.close();
    }
  }

  await browser.close();
  server.close();

  if (fails.length) {
    console.error(`\n${fails.length} rule breaks:\n` + fails.map(f => '  ' + f).join('\n'));
    process.exit(1);
  }
  console.log('All house rules pass.');
})();
