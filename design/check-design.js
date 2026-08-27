#!/usr/bin/env node
/* House-rule checker for the preview.
 *
 *   NODE_PATH=<where playwright-core lives> node design/check-design.js
 *
 * A rule that is only written down rots. This file exists because a comment
 * in index.html referenced `design/check-tap-targets.js` for months and that
 * file was never written — so the tap-target rule drifted until 40 controls
 * were under size. Everything checked here is a rule in CLAUDE.md.
 * Exit 1 means a rule was broken. Exit 2 means the checker could not run.
 */
let chromium;
try { chromium = require('playwright-core').chromium; }
catch (e) {
  console.error('This check needs playwright-core. Install it anywhere and run with:\n' +
                '  NODE_PATH=/path/to/node_modules node design/check-design.js');
  process.exit(2);
}
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8899;
const EXEC = process.env.CHROMIUM || '/opt/pw-browsers/chromium';

/* Screens you reach by tapping a nav item. */
const SCREENS = [
  ['order', null], ['floor', null],
  ['admin', 'menu'], ['admin', 'screen'], ['admin', 'floorplan'],
  ['admin', 'settings-covers'], ['admin', 'settings-courses'],
  ['admin', 'staff'], ['admin', 'settings-hub'],
];

/* States you have to OPEN to reach. The first version of this checker only
 * looked at the list above, and it passed clean while the button that takes
 * the money in a split was 41px tall. A rule is only kept where the checker
 * actually looks. */
const DEEP = [
  ['pay pane',   () => document.querySelector('.icon-action.pay') && document.querySelector('.icon-action.pay').click()],
  ['split pane', () => { const p = document.querySelector('.icon-action.pay'); if (p) p.click();
                         setTimeout(() => { const s = [...document.querySelectorAll('.cat-btn')].find(x => /split/i.test(x.textContent)); if (s) s.click(); }, 300); }],
  ['line edit',  () => { state.editLine = { idx: 0 }; render(); }],
  ['notes',      () => { state.notesPanel = true; render(); }],
  ['covers pad', () => { state.coversPad = { buf: '', touched: false }; render(); }],
  ['checkout',   () => { state.showCheckout = true; render(); }],
];

/* ── the rules ─────────────────────────────────────────────────────────── */
function RULES(label) {
  const out = [];
  const root = getComputedStyle(document.documentElement);
  const skip = el => el.closest('.scrmock, .mk-wrap') || el.classList.contains('floor-marker');

  // ONE swatch wherever a colour is picked.
  const want = root.getPropertyValue('--swatch').trim() || '44px';
  const wantR = root.getPropertyValue('--swatch-r').trim() || '10px';
  document.querySelectorAll('.color-dot-btn, .accent-swatch, .swatch, .color-popover-grid .color-swatch').forEach(el => {
    if (skip(el)) return;
    const r = el.getBoundingClientRect(); if (r.width < 2) return;
    const c = getComputedStyle(el);
    const name = (el.className || '').toString().split(' ')[0];
    if (Math.round(r.height) !== parseInt(want)) out.push(`${label}  swatch ${name} is ${Math.round(r.width)}x${Math.round(r.height)}, must be ${want}`);
    if (c.borderTopLeftRadius !== wantR) out.push(`${label}  swatch ${name} corner ${c.borderTopLeftRadius}, must be ${wantR}`);
    if (!el.classList.contains('empty') && c.borderTopWidth !== '2px') out.push(`${label}  swatch ${name} inner ring ${c.borderTopWidth}, must be 2px`);
  });

  // THE CORNER FAMILY — control, surface, pill, and nothing else.
  const OK = new Set([
    root.getPropertyValue('--r-control').trim(),
    root.getPropertyValue('--r-surface').trim(),
    root.getPropertyValue('--r-pill').trim(),
    '0px', '50%',
  ]);
  const SHAPES = '.shape-chip-preview, .switch-knob, .floor-marker, .tbl-wash, .fm-num';
  document.querySelectorAll('*').forEach(el => {
    if (skip(el)) return;
    if (el.matches(SHAPES) || el.closest(SHAPES)) return;
    if (el.parentElement === document.body) return;      // dev-only preview pills
    const b = el.getBoundingClientRect(); if (b.width < 10 || b.height < 10) return;
    const c = getComputedStyle(el);
    if (c.borderTopLeftRadius === '0px' || OK.has(c.borderTopLeftRadius)) return;
    if (c.backgroundColor === 'rgba(0, 0, 0, 0)' && c.borderTopWidth === '0px' && c.boxShadow === 'none') return;
    out.push(`${label}  corner ${(el.className || el.tagName).toString().split(' ')[0]} is ${c.borderTopLeftRadius}, must be one of ${[...OK].join(' / ')}`);
  });

  // CONTROL HEIGHT — two chosen, the rest derived and each derivation named.
  const H_OK = new Set([
    parseInt(root.getPropertyValue('--h-control')) || 44,
    parseInt(root.getPropertyValue('--h-primary')) || 64,
  ]);
  const DERIVED = [
    '.tl-qty', '.tkt-icon-btn', '.admin-nav-group', '.admin-nav-btn',
    '.item-card', '.acct-tile', '.cat-btn', '.subcat-seg button',
    '.menu-item-header', '.sel-head', '.order-row', '.ticket-line',
    '.color-dot-btn', '.accent-swatch', '.swatch', '.color-swatch',
    '.floor-marker', '.shape-chip', '.seat-ghost', '.covers-pad-key',
    '.qty-pad-key', '.pin-pad button', '.staff-tile', '.osk button',
    '.qp-actions .icon-action', '.note-preset-grid button', '.io-size-grid button',
  ].join(', ');
  document.querySelectorAll('button,[role=button]').forEach(el => {
    if (skip(el)) return;
    if (el.matches(DERIVED) || el.closest(DERIVED)) return;
    const b = el.getBoundingClientRect(); if (b.width < 6 || b.height < 6) return;
    const c = getComputedStyle(el);
    if (c.visibility === 'hidden' || c.pointerEvents === 'none' || el.disabled) return;
    const h = Math.round(b.height);
    if (!H_OK.has(h)) out.push(`${label}  height ${(el.className || el.tagName).toString().split(' ')[0]} is ${h}px, must be ${[...H_OK].join(' or ')} (or a named derivation)`);
  });

  // THE TYPE SCALE — five steps, plus families that are DERIVED from
  // something (a tile's own scale, the docket text slider, the rail, the
  // floor zoom). Anything else invented its own size.
  // A custom property holds its TEXT (a calc), not a length — so resolve each
  // step by actually applying it to a probe and reading the computed size.
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;';
  document.body.appendChild(probe);
  const STEPS = ['--fs-chip', '--fs-md', '--fs-lg', '--fs-xl', '--fs-num'].map(v => {
    probe.style.fontSize = `var(${v})`;
    return Math.round(parseFloat(getComputedStyle(probe).fontSize) * 10) / 10;
  });
  probe.remove();
  const TYPE_DERIVED = [
    '.item-name', '.acct-tile-label', '.item-tile-price',       // the tile's scale
    '.ticket-line', '.tot-row', '.course-tab', '.tl-qty',       // --tkt-fs
    '.tl-name', '.tl-sub', '.tl-price-btn', '.item-opt-dots', '.seat-chip',
    '.ang-em', '.ang-label', '.fp-chip', '.cat-btn', '.subcat-seg',  // --rail-fs / --rail-icon
    '.fm-num', '.tbl-cpill', '.floor-marker', '.ico-g',         // the floor's zoom
    '.covers-pad-key', '.qty-pad-key', '.qp-display',   // sized off --pad-key-h
    '.osk', '.brand-mark',
  ].join(', ');
  document.querySelectorAll('*').forEach(el => {
    if (skip(el)) return;
    if (el.children.length) return;
    if (!(el.textContent || '').trim()) return;
    if (el.matches(TYPE_DERIVED) || el.closest(TYPE_DERIVED)) return;
    if (el.parentElement === document.body) return;             // dev-only pills
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return;
    const fs = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10;
    if (!STEPS.includes(fs)) out.push(`${label}  type ${(el.className || el.tagName).toString().split(' ')[0]} is ${fs}px, must be one of ${STEPS.join(' / ')} (or a named derivation)`);
  });

  // THE FINGER LAW — ink >= --tap, or nothing interactive within --tap.
  const tap = parseInt(root.getPropertyValue('--tap')) || 44;
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
}

/* ── harness ───────────────────────────────────────────────────────────── */
function serve() {
  return new Promise(res => {
    const s = http.createServer((req, rq) => {
      const f = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
      fs.readFile(f, (e, d) => { if (e) { rq.writeHead(404); rq.end(); } else { rq.writeHead(200); rq.end(d); } });
    });
    s.listen(PORT, () => res(s));
  });
}

async function boot(page, view, tab) {
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
    else {
      state.view = 'order'; state.orderType = 'dine-in'; state.showTablePicker = false; state.activeCat = 'Food';
      if (innerWidth <= 768) state.mobileCartOpen = true;
    }
    render();
  }, { v: view, t: tab });
  await page.waitForTimeout(1200);
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch({ executablePath: EXEC });
  const fails = [];
  let checked = 0;

  for (const [view, tab] of SCREENS) {
    for (const w of [430, 1300]) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 }, isMobile: w < 800, hasTouch: w < 800 });
      await boot(page, view, tab);
      fails.push(...await page.evaluate(RULES, `${view}${tab ? '/' + tab : ''}@${w}`));
      checked++;
      await page.close();
    }
  }

  for (const [what, open] of DEEP) {
    for (const w of [430, 1300]) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 }, isMobile: w < 800, hasTouch: w < 800 });
      await boot(page, 'order', null);
      try { await page.evaluate(open); } catch (e) {}
      await page.waitForTimeout(1200);
      fails.push(...await page.evaluate(RULES, `${what}@${w}`));
      checked++;
      await page.close();
    }
  }

  await browser.close();
  server.close();

  if (fails.length) {
    console.error(`\n${fails.length} rule breaks across ${checked} views:\n` + fails.map(f => '  ' + f).join('\n'));
    process.exit(1);
  }
  console.log(`All house rules pass across ${checked} views.`);
})();
