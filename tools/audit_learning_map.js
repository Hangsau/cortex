'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/claudehome/tools/node_modules/playwright');
const SITE = path.resolve(__dirname, '..');
const BASE = process.env.READER_URL || 'http://127.0.0.1:8772/cortex/';
const MAP = BASE + 'library/kinesiology/learning-map/';
const data = JSON.parse(fs.readFileSync(path.join(SITE, 'data/reading/learning-map.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(SITE, 'data/reading/index.json'), 'utf8'));
const out = process.env.LEARNING_SCREENSHOTS || 'C:/claudehome/tmp/learning-map-review/screenshots';
const report = process.env.LEARNING_REPORT || path.join(SITE, 'research/learning-map-2026-09-22/browser-validation.json');
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, passed: Boolean(pass), detail });
const atTarget = async (page, id, requireTop = true) => {
  // Poll from Node: page requestAnimationFrame callbacks do not run with JS disabled.
  for (let attempt = 0; attempt < 160; attempt++) {
    const positioned = await page.evaluate(id => {
      const rect = document.getElementById(id).getBoundingClientRect();
      return rect.height > 0 && rect.top >= 60 && rect.top < 180;
    }, id);
    if (positioned || (!requireTop && await page.evaluate(id => document.getElementById(id).offsetParent !== null, id))) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  check(`${id}: fragment reaches viewport`, false);
  throw new Error(`Fragment did not reach viewport: ${id}`);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    let response = await page.goto(MAP);
    check('map HTTP 200', response.status() === 200);
    check('five routes', await page.locator('.lm-route').count() === data.routes.length);
    check('25 complete stations', await page.locator('.lm-station').count() === data.stations.length && await page.locator('.lm-answer').count() === data.stations.length);
    check('assigned reading links', await page.locator('.lm-readings > li').count() === data.stations.reduce((n, s) => n + s.readings.length, 0));
    check('one starting station expanded', await page.locator('.lm-station[open]').count() === 1);
    check('answer initially concealed', !(await page.locator('#motion .lm-answer').getAttribute('open')));
    await page.locator('.lm-start').click();
    await atTarget(page, 'motion');
    check('start button goes to first task', new URL(page.url()).hash === '#motion' && await page.locator('#motion').isVisible());
    await page.locator('#motion .lm-next a').click();
    await atTarget(page, 'joint');
    check('next opens closed station by fragment', new URL(page.url()).hash === '#joint' && await page.locator('#joint').isVisible());
    await page.goto(MAP + '#moment');
    await atTarget(page, 'moment');
    check('direct deep link reveals task', await page.locator('#moment').isVisible());
    await page.locator('#moment .lm-readings a').first().click();
    check('reading opens exact chapter section', new URL(page.url()).pathname.endsWith('/kinesiology/ch01/') && new URL(page.url()).hash === '#force-and-moment');
    await page.locator('.rd-map-return[href$="#moment"]').click();
    await atTarget(page, 'moment');
    check('chapter returns to same task', new URL(page.url()).pathname.endsWith('/learning-map/') && new URL(page.url()).hash === '#moment' && await page.locator('#moment').isVisible());
    await page.locator('#moment .lm-answer > summary').focus();
    check('keyboard focus visible', await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'));
    await page.keyboard.press('Enter');
    check('keyboard opens answer', await page.locator('#moment .lm-answer').evaluate(el => el.open));
    const coverage = new Set();
    for (const unit of index.units) {
      response = await page.goto(BASE + unit.path);
      const links = await page.locator('.rd-map-return').evaluateAll(els => els.map(el => new URL(el.href).hash.slice(1)));
      const expected = data.stations.filter(s => s.readings.some(r => r.section.startsWith(unit.id + '.'))).map(s => s.id);
      check(`${unit.id}: returns to all relevant stations`, response.status() === 200 && links.length === expected.length && expected.every(s => links.includes(s)));
      if (links.length) coverage.add(unit.id);
    }
    check('all 33 chapters reachable and linked back', coverage.size === 33);
    for (const entry of ['library/kinesiology/', 'library/basic-biomechanics/', 'library/kinesiology/topics/']) {
      await page.goto(BASE + entry);
      check(`${entry}: map entry visible`, await page.locator('a[href$="/learning-map/"]').first().isVisible());
    }
    fs.mkdirSync(out, { recursive: true });
    await page.goto(MAP);
    await page.screenshot({ path: path.join(out, 'desktop-map.png') });
    await page.goto(MAP + '#moment');
    await atTarget(page, 'moment');
    await page.screenshot({ path: path.join(out, 'desktop-station.png') });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ['paper', 'night']) {
        await page.goto(MAP);
        await page.locator('#rd-font-size').selectOption('22');
        await page.locator('#rd-color').selectOption(theme);
        await page.evaluate(() => { document.querySelectorAll('.lm-station').forEach(el => { el.open = true; }); });
        check(`${width}px ${theme}: all tasks fit at 22px`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        const ratios = await page.evaluate(() => {
          const luminance = value => value.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
          const bg = luminance(getComputedStyle(document.body).backgroundColor);
          return ['.lm-station-body', '.lm-source-label', '.lm-readings a', '.lm-role'].map(sel => {
            const fg = luminance(getComputedStyle(document.querySelector(sel)).color);
            return (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05);
          });
        });
        check(`${width}px ${theme}: contrast >= 4.5`, ratios.every(r => r >= 4.5), ratios.map(r => r.toFixed(2)).join(', '));
        await page.goto(MAP + '#moment');
        await atTarget(page, 'moment');
        await page.screenshot({ path: path.join(out, `${width}-${theme}-station.png`) });
      }
    }
    await page.reload();
    check('existing reading preferences persist', await page.locator('#rd-font-size').inputValue() === '22' && await page.locator('#rd-color').inputValue() === 'night');
    check('map creates no new progress storage', await page.evaluate(() => !Object.keys(localStorage).some(k => /learning|^lm-/.test(k))));
    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const plain = await noJS.newPage();
    for (const s of data.stations) {
      await plain.goto(MAP + '#' + s.id);
      await atTarget(plain, s.id, false);
      check(`${s.id}: deep link works without JS`, await plain.locator('#' + s.id).isVisible());
    }
    await plain.goto(MAP + '#motion');
    await plain.locator('#motion .lm-answer > summary').click();
    check('answer works without JS', await plain.locator('#motion .lm-answer').evaluate(el => el.open));
    await plain.locator('#motion .lm-readings a').first().click();
    check('reading link works without JS', new URL(plain.url()).hash === '#translation-rotation');
    await noJS.close();
    for (const mode of ['denied', 'corrupt']) {
      const isolated = await browser.newContext();
      await isolated.addInitScript(mode => {
        if (mode === 'denied') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } });
        else localStorage.setItem('rd-preferences-v1', '{invalid');
      }, mode);
      const p = await isolated.newPage();
      const issues = [];
      p.on('pageerror', e => issues.push(e.message));
      await p.goto(MAP + '#material');
      await p.locator('#rd-font-size').selectOption('22');
      check(`${mode} storage: reading survives`, issues.length === 0 && await p.locator('#material').isVisible() && await p.locator('.rd-page').getAttribute('data-reader-size') === '22');
      await isolated.close();
    }
    check('no JavaScript errors', errors.length === 0, errors.join('; '));
  } finally {
    await browser.close();
    const result = { base: BASE, checked_at: new Date().toISOString(), passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length, checks };
    fs.mkdirSync(path.dirname(report), { recursive: true });
    fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ passed: result.passed, failed: result.failed, failures: checks.filter(c => !c.passed), report }));
    if (result.failed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
