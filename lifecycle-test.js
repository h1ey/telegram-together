// Lifecycle test: node lifecycle-test.js   (needs: npm i playwright && npx playwright install chromium)
// Opens and ends every activity twice, then checks that nothing keeps running.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }), errs = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 120)));
  await p.addInitScript(() => {
    window.__iv = new Set(); const si = window.setInterval, ci = window.clearInterval;
    window.setInterval = (f, t, ...a) => { const id = si(f, t, ...a); __iv.add(id); return id };
    window.clearInterval = id => { __iv.delete(id); return ci(id) };
    window.__raf = 0; const raf = window.requestAnimationFrame; window.requestAnimationFrame = f => { __raf++; return raf(f) };
    window.__ac = []; const AC = window.AudioContext; window.AudioContext = function (...a) { const c = new AC(...a); __ac.push(c); return c }; window.AudioContext.prototype = AC.prototype;
  });
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForSelector('#list .row'); await p.click('.row[data-i="0"]');
  const open = async k => { await p.click('#tog'); await p.click(k === 'film' ? '#c' : '#g'); if (k === 'film') await p.click('.mc[data-i="0"]'); else await p.click(`[data-k="${k}"]`) };
  for (let r = 1; r <= 2; r++) {
    for (const k of ['chess', 'bg', 'xo', 'quiz']) { await open(k); await p.waitForTimeout(1500); await p.click('#x'); }
    await open('film'); await p.waitForSelector('.scr2.run', { timeout: 12000 }); await p.waitForTimeout(6500); await p.click('[data-e="❤️"]'); await p.click('#x');
  }
  await p.evaluate(() => { window.__raf = 0 }); await p.waitForTimeout(1000);
  const s = await p.evaluate(() => ({ iv: __iv.size, raf: __raf, ac: __ac.map(c => c.state) }));
  const n0 = await p.$$eval('#msgs .m', e => e.length); await p.waitForTimeout(9000); const n1 = await p.$$eval('#msgs .m', e => e.length);
  const check = (n, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + n); if (!ok) process.exitCode = 1 };
  check('no running intervals (' + s.iv + ')', s.iv === 0);
  check('no animation-frame loops (' + s.raf + '/s)', s.raf === 0);
  check('all audio contexts closed (' + s.ac.join(',') + ')', s.ac.every(x => x === 'closed'));
  check('no messages after sessions ended (' + (n1 - n0) + ')', n1 - n0 <= 0);
  check('no leftover video elements', await p.evaluate(() => document.querySelectorAll('video').length === 0));
  check('no console or page errors', errs.length === 0); if (errs.length) console.log(errs);
  await b.close();
})();
