'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('C:/claudehome/tools/node_modules/playwright');
const root = path.resolve(__dirname, '../../..');
const base = process.env.READER_URL || 'http://127.0.0.1:8768/cortex/';
const shots = path.resolve(root, '../../tmp/book-translation-cervical');
fs.mkdirSync(shots, { recursive: true });
const chapters = ['basic-biomechanics/ch11', 'kinesiology/ch09', 'kinesiology/ch10'];
const checks = [], check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const anchors = chapter => [...fs.readFileSync(path.join(root, 'content/library', chapter, 'index.md'), 'utf8')
  .matchAll(/^## .+ \{#([a-z0-9-]+)\}/gm)].map(m => m[1]);
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const targets = new Set();
    for (const chapter of chapters) {
      check(chapter + ' HTTP', (await page.goto(base + 'library/' + chapter + '/')).status() === 200);
      await page.locator('#rd-font-size').selectOption('22');
      const expected = anchors(chapter);
      const actual = await page.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id));
      check(chapter + ' canonical anchors in order', JSON.stringify(actual) === JSON.stringify(expected), actual.length);
      check(chapter + ' 320px font22 fits', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (chapter.startsWith('basic')) {
        check('original four anchors', ['upper-cervical', 'six-directions', 'stability', 'measurement-context'].every(a => actual.includes(a)));
        check('mobile TOC starts closed', await page.locator('.rd-rail details').getAttribute('open') === null);
        await page.locator('.rd-rail summary').click();
        for (const anchor of ['upper-cervical', 'six-directions', 'measurement-context', 'reading-bridge']) {
          await page.locator('.rd-rail a[href="#' + anchor + '"]').click();
          await page.waitForFunction(id => {
            const y = document.getElementById(id).getBoundingClientRect().top;
            return y >= 50 && y < 300;
          }, anchor, { timeout: 5000 });
          check('TOC actual landing ' + anchor, new URL(page.url()).hash === '#' + anchor);
        }
        await page.locator('#coupling-direction').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(shots, 'cervical-mobile-coupling.png') });
        check('coupling table readable at font22', await page.locator('.rd-prose table').evaluate(el => el.getBoundingClientRect().right <= innerWidth));
      }
      const hrefs = await page.locator('.rd-prose > p a[href*="/library/"]').evaluateAll(es => es.map(e => e.href));
      for (const href of hrefs) {
        if (new URL(href).hash && (chapter.startsWith('basic') || href.includes('/basic-biomechanics/ch11/'))) targets.add(href);
      }
    }
    for (const href of targets) {
      const response = await page.request.get(href);
      await page.goto(href);
      const anchor = new URL(href).hash;
      await page.waitForFunction(id => {
        const el = document.querySelector(id), y = el?.getBoundingClientRect().top;
        return y >= 50 && y < 300;
      }, anchor, { timeout: 5000 });
      check('cross-link landing ' + new URL(href).pathname + anchor, response.status() === 200 && await page.locator(anchor).count() === 1);
    }
    await page.goto(base + 'library/basic-biomechanics/ch11/');
    const figure = page.locator('[data-cervical-magnification]'), slider = figure.locator('input');
    check('default scale result', (await figure.locator('output').textContent()).includes('2.70 mm × 1.30＝3.51 mm'));
    await slider.press('Home');
    for (let percent = 0; percent <= 40; percent++) {
      if (percent) await slider.press('ArrowRight');
      const state = await figure.evaluate(el => {
        const p = el.querySelector('[data-image-bar]');
        return { text: el.querySelector('output').textContent, desc: el.querySelector('desc').textContent,
          x: p.getPointAtLength(2.7 * (1 + Number(el.querySelector('input').value) / 100) * 60).x,
          original: el.querySelector('.rd-line').getAttribute('d') };
      });
      const length = 2.7 * (1 + percent / 100);
      check('keyboard ' + percent + '% formula and geometry', state.text.includes('放大 ' + percent + '%') &&
        state.text.includes('＝' + length.toFixed(2) + ' mm') && state.desc.includes(length.toFixed(2) + '毫米') &&
        Math.abs(state.x - (20 + length * 60)) < .002 && state.original === 'M20 60 H182 M20 50 V70 M182 50 V70', state);
    }
    check('keyboard focus visible', await slider.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'));
    check('label and accessible result', await slider.getAttribute('id') === await figure.locator('label').getAttribute('for') && await figure.locator('output').getAttribute('aria-live') === 'polite');
    await slider.press('Home');
    for (let i = 0; i < 30; i++) await slider.press('ArrowRight');
    for (const width of [320, 1360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['paper', 'night']) {
        await page.locator('#rd-color').selectOption(theme);
        check('figure fits ' + width + ' ' + theme, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        check('labels fit and readable ' + width + ' ' + theme, await figure.locator('svg').evaluate(svg =>
          [...svg.querySelectorAll('text')].every(t => {
            const b = t.getBBox(), v = svg.viewBox.baseVal;
            return b.x >= 0 && b.x + b.width <= v.width && b.y >= 0 && b.y + b.height <= v.height &&
              parseFloat(getComputedStyle(t).fontSize) * svg.getBoundingClientRect().width / v.width >= 14;
          })));
        await figure.screenshot({ path: path.join(shots, 'magnification-' + width + '-' + theme + '.png') });
      }
    }
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 1000 } });
    const plain = await ctx.newPage();
    await plain.goto(base + 'library/basic-biomechanics/ch11/');
    check('no-JS complete headings', JSON.stringify(await plain.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id))) === JSON.stringify(anchors(chapters[0])));
    check('no-JS default diagram', await plain.locator('[data-cervical-magnification] input').isDisabled() &&
      (await plain.locator('[data-cervical-magnification] output').textContent()).includes('3.51 mm'));
    check('no-JS layout fits', await plain.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await ctx.close();
    check('no runtime errors', errors.length === 0, errors);
  } finally { await browser.close(); }
  const report = { checked_at: new Date().toISOString(), base, checks,
    passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length };
  fs.writeFileSync(path.join(__dirname, 'browser-checks.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed, failures: checks.filter(c => !c.pass) }));
  if (report.failed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
