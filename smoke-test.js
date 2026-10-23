// Smoke test: node smoke-test.js   (needs: npm i playwright && npx playwright install chromium)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 390, height: 844 } }), errs = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.resolve(__dirname, 'index.html'));
  const check = (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) process.exitCode = 1; };
  await p.click('.row[data-i="0"]'); await p.click('#tog'); await p.click('#g'); await p.click('[data-k="chess"]');
  await p.waitForSelector('#bd .sq', { timeout: 9000 });
  const sizes = await p.$$eval('#bd .sq', els => els.map(e => e.offsetHeight));
  check('chess squares are all equal height', new Set(sizes).size === 1);
  await p.click('[data-q="e2"]'); await p.click('[data-q="e4"]'); await p.waitForTimeout(2500);
  check('opponent replied (it is white to move again)', await p.evaluate(() => __t.g.t === 'w'));
  await p.click('#x'); await p.click('#tog'); await p.click('#g'); await p.click('[data-k="bg"]'); await p.waitForSelector('.pt');
  await p.click('#rl'); await p.waitForTimeout(300);
  check('backgammon dice are shown after rolling', await p.$$eval('.dice img.dc', els => els.length >= 2 && els.every(e => e.complete && e.naturalWidth > 0)));
  check('no console or page errors', errs.length === 0); if (errs.length) console.log(errs);
  await b.close();
})();
