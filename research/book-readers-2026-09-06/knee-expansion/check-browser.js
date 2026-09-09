'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('C:/claudehome/tools/node_modules/playwright');
const root = path.resolve(__dirname, '../../..');
const base = process.env.READER_URL || 'http://127.0.0.1:8768/cortex/';
const shots = path.resolve(root, '../../tmp/book-translation-knee');
fs.mkdirSync(shots, { recursive: true });
const chapters = ['kinesiology/ch13', 'basic-biomechanics/ch07'];
const originals = [['knee-motion', 'meniscus-ligament', 'patella-leverage', 'contact-stress'],
  ['two-articulations', 'guided-motion', 'internal-load', 'contact-distribution']];
const checks = [], check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const anchors = chapter => [...fs.readFileSync(path.join(root, 'content/library', chapter, 'index.md'), 'utf8')
  .matchAll(/^## .+ \{#([a-z0-9-]+)\}/gm)].map(m => m[1]);
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 1000 } });
    const errors = [], targets = new Map();
    page.on('pageerror', e => errors.push(e.message));
    for (const [i, chapter] of chapters.entries()) {
      check(chapter + ' HTTP', (await page.goto(base + 'library/' + chapter + '/')).status() === 200);
      await page.locator('#rd-font-size').selectOption('22');
      const actual = await page.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id));
      check(chapter + ' canonical anchors in order', JSON.stringify(actual) === JSON.stringify(anchors(chapter)), actual.length);
      check(chapter + ' original four anchors', originals[i].every(a => actual.includes(a)));
      check(chapter + ' 320px font22 fits', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      for (const href of await page.locator('.rd-prose > p a[href*="/library/"]').evaluateAll(es => es.map(e => e.href))) {
        if (new URL(href).hash) targets.set(href, chapter);
      }
    }
    await page.goto(base + 'library/kinesiology/ch13/');
    check('mobile TOC starts closed', await page.locator('.rd-rail details').getAttribute('open') === null);
    await page.locator('.rd-rail summary').click();
    for (const anchor of ['knee-motion', 'meniscus-ligament', 'patella-leverage', 'contact-stress', 'medial-loading', 'chapter-bridge']) {
      await page.locator('.rd-rail a[href="#' + anchor + '"]').click();
      await page.waitForFunction(id => {
        const y = document.getElementById(id).getBoundingClientRect().top;
        return y >= 50 && y < 300;
      }, anchor, { timeout: 5000 });
      check('TOC actual landing ' + anchor, new URL(page.url()).hash === '#' + anchor);
    }
    await page.locator('#motion-reference').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, 'mobile-motion-reference.png') });
    await page.goto(base + 'library/basic-biomechanics/ch07/');
    check('daily activity table fits', await page.locator('.rd-prose table').evaluate(el => el.getBoundingClientRect().right <= innerWidth));
    check('daily activity table column spacing', await page.locator('.rd-prose tbody tr').evaluateAll(rows => rows.every(row => parseFloat(getComputedStyle(row.cells[0]).paddingRight) >= 16)));
    await page.locator('.rd-prose table').screenshot({ path: path.join(shots, 'mobile-daily-motion-table.png') });
    for (const [href, sourceChapter] of targets) {
      check('cross-link HTTP ' + href, (await page.request.get(href)).status() === 200);
      await page.goto(base + 'library/' + sourceChapter + '/');
      const target = new URL(href), anchor = target.hash;
      await page.locator('.rd-prose > p a[href$="' + target.pathname + anchor + '"]').first().click();
      await page.waitForFunction(id => {
        const el = document.querySelector(id), y = el?.getBoundingClientRect().top;
        return y >= 50 && y < 300;
      }, anchor, { timeout: 5000 });
      check('cross-link actual landing ' + target.pathname + anchor, await page.locator(anchor).count() === 1);
    }
    await page.goto(base + 'library/basic-biomechanics/ch07/');
    const figure = page.locator('[data-knee-compartments]'), slider = figure.locator('input');
    check('default equal distribution', (await figure.locator('output').textContent()).includes('M＝0 N·m；內側 FM＝1200 N；外側 FL＝1200 N'));
    await slider.press('Home');
    for (let step = 0; step <= 40; step++) {
      if (step) await slider.press('ArrowRight');
      const state = await figure.evaluate(el => ({
        moment: Number(el.querySelector('input').value), text: el.querySelector('output').textContent,
        desc: el.querySelector('desc').textContent,
        medial: Number(el.querySelector('[data-knee-medial-label]').textContent.split(' ')[0]),
        lateral: Number(el.querySelector('[data-knee-lateral-label]').textContent.split(' ')[0]),
        momentLabel: el.querySelector('[data-knee-moment-label]').textContent,
        medialStart: Number(el.querySelector('[data-knee-medial-arrow]').getAttribute('d').split(' ')[1]),
        lateralStart: Number(el.querySelector('[data-knee-lateral-arrow]').getAttribute('d').split(' ')[1])
      }));
      const moment = -40 + step * 2, signed = (moment < 0 ? '−' : moment > 0 ? '+' : '') + Math.abs(moment);
      check('keyboard M=' + moment + ' conserves force and moment', state.moment === moment &&
        state.medial + state.lateral === 2400 && Math.abs((state.medial - state.lateral) * .025 - moment) < 1e-8 &&
        state.medial > 0 && state.lateral > 0 && state.text.includes('FM＝' + state.medial + ' N') &&
        state.text.includes('FL＝' + state.lateral + ' N') && state.desc.includes('內側' + state.medial + '牛頓') &&
        state.desc.includes('外側' + state.lateral + '牛頓') && state.momentLabel === 'M＝' + signed + ' N·m' &&
        state.medialStart < 190 && state.lateralStart < 190 &&
        Math.abs((200 - state.medialStart) / state.medial - (200 - state.lateralStart) / state.lateral) < 1e-8, state);
    }
    await slider.press('Home');
    check('Home favors lateral', (await figure.locator('output').textContent()).includes('M＝−40 N·m；內側 FM＝400 N；外側 FL＝2000 N'));
    await slider.press('End');
    check('End favors medial', (await figure.locator('output').textContent()).includes('M＝+40 N·m；內側 FM＝2000 N；外側 FL＝400 N'));
    check('keyboard focus visible', await slider.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'));
    check('label and live result', await slider.getAttribute('id') === await figure.locator('label').getAttribute('for') &&
      await figure.locator('output').getAttribute('aria-live') === 'polite');
    for (const width of [320, 1360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['paper', 'night']) {
        await page.locator('#rd-color').selectOption(theme);
        for (const [state, increments] of [['negative', 0], ['zero', 20], ['positive', 40]]) {
          await slider.press('Home');
          for (let i = 0; i < increments; i++) await slider.press('ArrowRight');
          check('figure fits ' + width + ' ' + theme + ' ' + state, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          check('labels readable ' + width + ' ' + theme + ' ' + state, await figure.locator('svg').evaluate(svg =>
            [...svg.querySelectorAll('text')].every(t => {
              const b = t.getBBox(), v = svg.viewBox.baseVal;
              return b.x >= 0 && b.x + b.width <= v.width && b.y >= 0 && b.y + b.height <= v.height &&
                parseFloat(getComputedStyle(t).fontSize) * svg.getBoundingClientRect().width / v.width >= 14;
            })));
          await figure.screenshot({ path: path.join(shots, `knee-compartments-${width}-${theme}-${state}.png`) });
        }
      }
    }
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 1000 } });
    const plain = await ctx.newPage();
    for (const chapter of chapters) {
      await plain.goto(base + 'library/' + chapter + '/');
      check('no-JS complete headings ' + chapter, JSON.stringify(await plain.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id))) === JSON.stringify(anchors(chapter)));
      check('no-JS layout fits ' + chapter, await plain.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    check('no-JS default diagram', await plain.locator('[data-knee-compartments] input').isDisabled() &&
      (await plain.locator('[data-knee-compartments] output').textContent()).includes('M＝0 N·m；內側 FM＝1200 N；外側 FL＝1200 N'));
    await ctx.close();
    check('no runtime errors', errors.length === 0, errors);
  } finally { await browser.close(); }
  const report = { checked_at: new Date().toISOString(), base, checks,
    passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length };
  fs.writeFileSync(path.join(__dirname, 'browser-checks.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed, failures: checks.filter(c => !c.pass) }));
  if (report.failed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
