'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('C:/claudehome/tools/node_modules/playwright');
const root = path.resolve(__dirname, '../../..');
const base = process.env.READER_URL || 'http://127.0.0.1:8768/cortex/';
const shots = path.resolve(root, '../../tmp/book-translation-hip');
fs.mkdirSync(shots, { recursive: true });
const chapters = ['kinesiology/ch12', 'basic-biomechanics/ch08'];
const checks = [], check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const anchors = chapter => [...fs.readFileSync(path.join(root, 'content/library', chapter, 'index.md'), 'utf8')
  .matchAll(/^## .+ \{#([a-z0-9-]+)\}/gm)].map(m => m[1]);
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 1000 } });
    const errors = [], targets = new Map();
    page.on('pageerror', e => errors.push(e.message));
    for (const chapter of chapters) {
      check(chapter + ' HTTP', (await page.goto(base + 'library/' + chapter + '/')).status() === 200);
      await page.locator('#rd-font-size').selectOption('22');
      const actual = await page.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id));
      check(chapter + ' canonical anchors in order', JSON.stringify(actual) === JSON.stringify(anchors(chapter)), actual.length);
      check(chapter + ' 320px font22 fits', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const hrefs = await page.locator('.rd-prose > p a[href*="/library/"]').evaluateAll(es => es.map(e => e.href));
      for (const href of hrefs) {
        if (new URL(href).hash) targets.set(href, chapter);
      }
    }
    await page.goto(base + 'library/kinesiology/ch12/');
    check('original four anchors', ['hip-geometry', 'pelvis-on-femur', 'hip-balance', 'joint-load'].every(a => anchors(chapters[0]).includes(a)));
    check('mobile TOC starts closed', await page.locator('.rd-rail details').getAttribute('open') === null);
    await page.locator('.rd-rail summary').click();
    for (const anchor of ['hip-geometry', 'pelvis-on-femur', 'hip-balance', 'joint-load', 'cane-load', 'chapter-bridge']) {
      await page.locator('.rd-rail a[href="#' + anchor + '"]').click();
      await page.waitForFunction(id => {
        const y = document.getElementById(id).getBoundingClientRect().top;
        return y >= 50 && y < 300;
      }, anchor, { timeout: 5000 });
      check('TOC actual landing ' + anchor, new URL(page.url()).hash === '#' + anchor);
    }
    await page.locator('#pelvis-on-femur').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, 'mobile-pelvis-on-femur.png') });
    await page.goto(base + 'library/basic-biomechanics/ch08/');
    check('daily activity table fits', await page.locator('.rd-prose table').evaluate(el => el.getBoundingClientRect().right <= innerWidth));
    await page.locator('#daily-motion').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, 'mobile-daily-motion.png') });
    await page.locator('.rd-prose table').screenshot({ path: path.join(shots, 'mobile-daily-motion-table.png') });
    check('Nordin original four anchors', ['geometry', 'stance', 'muscle-reaction', 'measurement'].every(a => anchors(chapters[1]).includes(a))); 
    for (const [href, sourceChapter] of targets) {
      check('cross-link HTTP ' + href, (await page.request.get(href)).status() === 200);
      await page.goto(base + 'library/' + sourceChapter + '/');
      const target = new URL(href), anchor = target.hash;
      await page.locator('.rd-prose > p a[href$="' + target.pathname + anchor + '"]').first().click();
      await page.waitForFunction(id => {
        const el = document.querySelector(id), y = el?.getBoundingClientRect().top;
        return y >= 50 && y < 300;
      }, anchor, { timeout: 5000 }).catch(async error => {
        console.error('Cross-link failed', href, await page.locator(anchor).evaluate(el => ({ y: el.getBoundingClientRect().top, scrollY, hash: location.hash })));
        throw error;
      });
      check('cross-link actual landing ' + new URL(href).pathname + anchor, await page.locator(anchor).count() === 1);
    }
    await page.goto(base + 'library/kinesiology/ch12/');
    const figure = page.locator('[data-hip-support]'), slider = figure.locator('input');
    check('default static load', (await figure.locator('output').textContent()).includes('R＝1800 N'));
    await slider.press('Home');
    for (let step = 0; step <= 24; step++) {
      if (step) await slider.press('ArrowRight');
      const state = await figure.evaluate(el => ({
        cane: Number(el.querySelector('input').value), text: el.querySelector('output').textContent,
        desc: el.querySelector('desc').textContent,
        muscle: el.querySelector('[data-hip-muscle-label]').textContent,
        reaction: el.querySelector('[data-hip-reaction-label]').textContent,
        caneLabel: el.querySelector('[data-hip-cane-label]').textContent,
        visibility: el.querySelector('[data-hip-cane-arrow]').getAttribute('visibility'),
        muscleLength: Number(el.querySelector('[data-hip-muscle-bar]').getAttribute('d').split('H')[1]) - 20,
        reactionLength: Number(el.querySelector('[data-hip-reaction-bar]').getAttribute('d').split('H')[1]) - 20
      }));
      const c = step * 5, m = Number(state.muscle.match(/＝(\d+)/)[1]), r = Number(state.reaction.match(/＝(\d+)/)[1]);
      check('keyboard C=' + c + ' conserves force and moment', state.cane === c &&
        Math.abs(m * .05 + c * .30 - 600 * .10) < 1e-8 && r + c === 600 + m &&
        m >= 0 && r >= 0 && state.text.includes('M＝' + m + ' N') && state.text.includes('R＝' + r + ' N') &&
        state.text.includes((r / 720).toFixed(2) + '倍') && state.desc.includes('髖反力' + r + '牛頓') &&
        state.caneLabel === 'C ' + c && state.visibility === (c ? 'visible' : 'hidden') &&
        Math.abs(state.muscleLength / m - state.reactionLength / r) < 1e-8, state);
    }
    await slider.press('Home');
    check('Home returns no cane force', (await figure.locator('output').textContent()).includes('C＝0 N；M＝1200 N；R＝1800 N'));
    await slider.press('End');
    check('End exact values', (await figure.locator('output').textContent()).includes('C＝120 N；M＝480 N；R＝960 N'));
    check('keyboard focus visible', await slider.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'));
    check('label and live result', await slider.getAttribute('id') === await figure.locator('label').getAttribute('for') &&
      await figure.locator('output').getAttribute('aria-live') === 'polite');
    for (const width of [320, 1360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['paper', 'night']) {
        await page.locator('#rd-color').selectOption(theme);
        for (const state of ['zero', 'mid', 'max']) {
          await slider.press('Home');
          const increments = state === 'zero' ? 0 : state === 'mid' ? 12 : 24;
          for (let i = 0; i < increments; i++) await slider.press('ArrowRight');
          check('figure fits ' + width + ' ' + theme + ' ' + state, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          check('labels readable ' + width + ' ' + theme + ' ' + state, await figure.locator('svg').evaluate(svg =>
            [...svg.querySelectorAll('text')].every(t => {
              const b = t.getBBox(), v = svg.viewBox.baseVal;
              return b.x >= 0 && b.x + b.width <= v.width && b.y >= 0 && b.y + b.height <= v.height &&
                parseFloat(getComputedStyle(t).fontSize) * svg.getBoundingClientRect().width / v.width >= 14;
            })));
          await figure.screenshot({ path: path.join(shots, `hip-support-${width}-${theme}-${state}.png`) });
        }
      }
    }
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 1000 } });
    const plain = await ctx.newPage();
    await plain.goto(base + 'library/kinesiology/ch12/');
    check('no-JS complete headings', JSON.stringify(await plain.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id))) === JSON.stringify(anchors(chapters[0])));
    check('no-JS default diagram', await plain.locator('[data-hip-support] input').isDisabled() &&
      (await plain.locator('[data-hip-support] output').textContent()).includes('C＝0 N；M＝1200 N；R＝1800 N'));
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
