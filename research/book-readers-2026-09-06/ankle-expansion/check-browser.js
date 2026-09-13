'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('C:/claudehome/tools/node_modules/playwright');
const root = path.resolve(__dirname, '../../..');
const base = process.env.READER_URL || 'http://127.0.0.1:8768/cortex/';
const shots = path.resolve(root, '../../tmp/book-translation-ankle');
const chapters = ['kinesiology/ch14', 'basic-biomechanics/ch09'];
const original = [['foot-map', 'adaptation', 'windlass', 'foot-muscles'], ['arch', 'axes', 'tiptoe-model', 'dynamic-foot']];
const checks = [], check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const anchors = chapter => [...fs.readFileSync(path.join(root, 'content/library', chapter, 'index.md'), 'utf8')
  .matchAll(/^## .+ \{#([a-z0-9-]+)\}/gm)].map(m => m[1]);
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 1000 } });
    const errors = [], targets = new Map(), prose = new Map();
    page.on('pageerror', e => errors.push(e.message));
    for (const [i, chapter] of chapters.entries()) {
      check(chapter + ' HTTP', (await page.goto(base + 'library/' + chapter + '/')).status() === 200);
      await page.locator('#rd-font-size').selectOption('22');
      const ids = await page.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id));
      check(chapter + ' full canonical heading order', JSON.stringify(ids) === JSON.stringify(anchors(chapter)), ids.length);
      check(chapter + ' original four anchors', original[i].every(id => ids.includes(id)));
      check(chapter + ' 320px font22 fits', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      prose.set(chapter, await page.locator('.rd-prose > p').allTextContents());
      for (const href of await page.locator('.rd-prose > p a[href*="/library/"]').evaluateAll(es => es.map(e => e.href))) {
        if (new URL(href).hash) targets.set(href, chapter);
      }
    }
    await page.goto(base + 'library/kinesiology/ch14/');
    check('mobile TOC starts closed', await page.locator('.rd-rail details').getAttribute('open') === null);
    await page.locator('.rd-rail summary').click();
    for (const anchor of ['foot-map', 'adaptation', 'windlass', 'foot-muscles', 'tiptoe-lever', 'chapter-bridge']) {
      await page.locator('.rd-rail a[href="#' + anchor + '"]').click();
      await page.waitForFunction(id => {
        const y = document.getElementById(id).getBoundingClientRect().top;
        return y >= 50 && y < 300;
      }, anchor);
      check('TOC landing ' + anchor, new URL(page.url()).hash === '#' + anchor);
    }
    await page.locator('#loaded-pronation').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, 'mobile-prose.png') });
    for (const [href, sourceChapter] of targets) {
      check('cross-link HTTP ' + href, (await page.request.get(href)).status() === 200);
      await page.goto(base + 'library/' + sourceChapter + '/');
      const target = new URL(href), anchor = target.hash;
      await page.locator('.rd-prose > p a[href$="' + target.pathname + anchor + '"]').first().click();
      await page.waitForFunction(id => {
        const el = document.querySelector(id), y = el?.getBoundingClientRect().top;
        return y >= 50 && y < 300;
      }, anchor);
      check('cross-link landing ' + target.pathname + anchor, await page.locator(anchor).count() === 1);
    }
    await page.goto(base + 'library/basic-biomechanics/ch09/');
    const figure = page.locator('[data-ankle-load]'), slider = figure.locator('input');
    check('default d=10 forces', (await figure.locator('output').textContent()).includes('d＝10 cm；跟腱力 A＝1200 N；踝反力 J＝1800 N'));
    await slider.press('Home');
    for (let step = 0; step <= 20; step++) {
      if (step) await slider.press('ArrowRight');
      const state = await figure.evaluate(el => ({
        d: Number(el.querySelector('input').value), text: el.querySelector('output').textContent,
        desc: el.querySelector('desc').textContent,
        tendon: Number(el.querySelector('[data-ankle-tendon-label]').textContent.split(' ')[0]),
        joint: Number(el.querySelector('[data-ankle-joint-label]').textContent.split(' ')[0]),
        contact: Number(el.querySelector('[data-ankle-ground]').getAttribute('transform').match(/translate\((\d+)/)[1]),
        tendonBar: Number(el.querySelector('[data-ankle-tendon-bar]').getAttribute('d').split('H')[1]) - 60,
        jointBar: Number(el.querySelector('[data-ankle-joint-bar]').getAttribute('d').split('H')[1]) - 60
      }));
      const distance = 5 + step * .5;
      check('keyboard d=' + distance + ' force/moment equilibrium and scales', state.d === distance &&
        state.joint === state.tendon + 600 && Math.abs(state.tendon * .05 - 600 * distance / 100) < 1e-8 &&
        state.contact === 100 + distance * 12 && Math.abs(state.tendonBar / state.tendon - .08) < 1e-8 &&
        Math.abs(state.jointBar / state.joint - .08) < 1e-8 && state.text.includes('A＝' + state.tendon + ' N') &&
        state.text.includes('J＝' + state.joint + ' N') && state.desc.includes('跟腱力' + state.tendon + '牛頓'), state);
    }
    await slider.press('End');
    check('End maximum', (await figure.locator('output').textContent()).includes('A＝1800 N；踝反力 J＝2400 N'));
    await slider.press('Home');
    check('Home minimum', (await figure.locator('output').textContent()).includes('A＝600 N；踝反力 J＝1200 N'));
    check('focus visible', await slider.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'));
    check('label and live output', await slider.getAttribute('id') === await figure.locator('label').getAttribute('for') &&
      await figure.locator('output').getAttribute('aria-live') === 'polite');
    for (const width of [320, 1360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['paper', 'night']) {
        await page.locator('#rd-color').selectOption(theme);
        for (const [state, steps] of [['short', 0], ['middle', 10], ['long', 20]]) {
          await slider.press('Home');
          for (let i = 0; i < steps; i++) await slider.press('ArrowRight');
          check('figure fits ' + width + theme + state, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          check('labels legible ' + width + theme + state, await figure.locator('svg').evaluate(svg =>
            [...svg.querySelectorAll('text')].every(t => {
              const b = t.getBBox(), v = svg.viewBox.baseVal;
              const box = t.getBoundingClientRect(), bounds = svg.getBoundingClientRect();
              return b.y >= 0 && b.y + b.height <= v.height && box.left >= bounds.left && box.right <= bounds.right &&
                parseFloat(getComputedStyle(t).fontSize) * bounds.width / v.width >= 14;
            })));
          await figure.screenshot({ path: path.join(shots, `ankle-${width}-${theme}-${state}.png`),
            style: '.site-nav { visibility: hidden !important; }' });
        }
      }
    }
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 1000 } });
    const plain = await ctx.newPage();
    for (const chapter of chapters) {
      await plain.goto(base + 'library/' + chapter + '/');
      check('no-JS complete headings ' + chapter, JSON.stringify(await plain.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id))) === JSON.stringify(anchors(chapter)));
      check('no-JS complete paragraphs ' + chapter, JSON.stringify(await plain.locator('.rd-prose > p').allTextContents()) === JSON.stringify(prose.get(chapter)));
      check('no-JS fits ' + chapter, await plain.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    check('no-JS static diagram', await plain.locator('[data-ankle-load] input').isDisabled() &&
      (await plain.locator('[data-ankle-load] output').textContent()).includes('A＝1200 N；踝反力 J＝1800 N'));
    await ctx.close();
    check('no runtime errors', errors.length === 0, errors);
  } finally { await browser.close(); }
  const report = { checked_at: new Date().toISOString(), base, checks,
    passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length };
  fs.writeFileSync(path.join(__dirname, 'browser-checks.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed, failures: checks.filter(c => !c.pass) }));
  if (report.failed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
