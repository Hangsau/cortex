/* Browser acceptance checks. Run against book_reader.py, optionally --smoke. */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/claudehome/tools/node_modules/playwright');
const BASE = process.env.READER_URL || 'http://127.0.0.1:8768/cortex/';
const SITE = path.resolve(__dirname, '..');
const books = JSON.parse(fs.readFileSync(path.join(SITE, 'data/reading/books.json'), 'utf8'));
const smoke = process.argv.includes('--smoke');
const screenshotDir = path.resolve(SITE, '../../tmp/book-reader-review');
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text()); });
    for (const book of Object.values(books)) {
      const response = await page.goto(BASE + `library/${book.slug}/`);
      check(`${book.slug}: book HTTP`, response.status() === 200);
      if (!smoke) check(`${book.slug}: all chapters`, await page.locator('.rd-chapter-row').count() === book.chapters.length);
    }
    await page.goto(BASE + 'library/kinesiology/ch04/');
    await page.waitForSelector('.rd-local-sources:not([hidden])', { state: 'attached' });
    check('original links available only with local service', await page.locator('.rd-local-sources:not([hidden])').count() > 0);
    await page.locator('#rd-font-size').selectOption('22');
    await page.locator('#rd-color').selectOption('night');
    await page.reload();
    check('preferences survive reload', await page.locator('#rd-font-size').inputValue() === '22' && await page.locator('#rd-color').inputValue() === 'night');
    await page.locator('#rd-color').selectOption('paper');
    await page.locator('#rd-font-size').selectOption('20');
    await page.locator('[data-torque-demo] input').focus();
    await page.locator('[data-torque-demo] input').press('End');
    check('torque example responds to changed distance', (await page.locator('[data-torque-demo] output').textContent()).includes('8.0'));
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(screenshotDir, 'desktop.png'), fullPage: false });
    await page.goto(BASE + 'library/kinesiology/');
    check('resume points to a real chapter', (await page.locator('.rd-resume').getAttribute('href')).endsWith('/ch04/'));
    await page.locator('#rd-query').fill('肩膀');
    check('Chinese synonym search finds shoulder precisely', await page.locator('.rd-chapter-row:not([hidden])').count() === 1 && (await page.locator('.rd-chapter-row:not([hidden]) h3 a').getAttribute('href')).endsWith('/ch05/'));
    await page.locator('#rd-query').fill('moment arm');
    check('English bilingual-term search', await page.locator('.rd-chapter-row:not([hidden])').count() > 0);
    await page.locator('#rd-query').fill('<img src=x onerror=alert(1)>');
    check('special search input gives empty state without injection', await page.locator('.rd-no-results').isVisible() && await page.locator('#rd-query img').count() === 0);
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(BASE + 'library/kinesiology/ch05/');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      check(`${width}px: no horizontal overflow`, !overflow);
      check(`${width}px: mobile outline starts collapsed`, await page.locator('.rd-rail details').getAttribute('open') === null);
      if (width === 390) await page.screenshot({ path: path.join(screenshotDir, 'mobile.png'), fullPage: false });
    }
    await page.goto(BASE + 'library/basic-biomechanics/ch04/');
    await page.locator('#rd-font-size').selectOption('22');
    await page.locator('#rd-color').selectOption('night');
    check('320px largest type and graphs fit', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    for (const theme of ['paper', 'night']) {
      await page.locator('#rd-color').selectOption(theme);
      const ratios = await page.evaluate(() => {
        const lum = color => color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0);
        const bg = lum(getComputedStyle(document.body).backgroundColor);
        return ['.rd-prose', '.rd-muted', '.rd-source summary'].map(sel => { const fg = lum(getComputedStyle(document.querySelector(sel)).color); return (Math.max(bg,fg) + .05) / (Math.min(bg,fg) + .05); });
      });
      check(`${theme}: prose, secondary text and source links contrast >=4.5`, ratios.every(r => r >= 4.5), ratios.map(r=>r.toFixed(2)).join(', '));
    }
    await page.locator('.rd-diagram').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotDir, 'mobile-diagram-night.png'), fullPage: false });
    await page.locator('#rd-font-size').focus();
    await page.keyboard.press('Tab');
    check('keyboard focus is visible', await page.evaluate(() => document.activeElement.id === 'rd-color' && getComputedStyle(document.activeElement).outlineStyle !== 'none'));
    await page.goto(BASE + 'library/kinesiology/topics/');
    check('topic index links all 33 chapters across seven topics', await page.locator('.rd-topic-section').count() === 7 && await page.locator('.rd-topic-section li a').count() === 33);
    const noStorage = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noStorage.newPage();
    await staticPage.goto(BASE + 'library/kinesiology/ch01/');
    check('core reading works without JavaScript', (await staticPage.locator('#rd-article').textContent()).includes('關節面運動學'));
    await noStorage.close();
    const denied = await browser.newContext();
    await denied.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }); });
    const deniedPage = await denied.newPage();
    const deniedErrors = [];
    deniedPage.on('pageerror', error => deniedErrors.push(error.message));
    await deniedPage.goto(BASE + 'library/kinesiology/ch01/');
    await deniedPage.locator('#rd-font-size').selectOption('22');
    check('denied storage preserves reading and controls', deniedErrors.length === 0 && await deniedPage.locator('.rd-page').getAttribute('data-reader-size') === '22');
    await denied.close();
    const staticOnly = await browser.newContext();
    await staticOnly.route('**/reader-health', route => route.fulfill({ status:404, body:'' }));
    const publicPage = await staticOnly.newPage();
    await publicPage.goto(BASE + 'library/kinesiology/ch01/');
    check('static hosting keeps unavailable original links hidden', await publicPage.locator('.rd-local-sources:not([hidden])').count() === 0);
    await staticOnly.close();
    await page.addInitScript(() => { localStorage.setItem('rd-preferences-v1', '{bad'); localStorage.setItem('rd-last-v1-neumann', JSON.stringify({path:'javascript:alert(1)',title:'bad'})); });
    await page.goto(BASE + 'library/kinesiology/');
    check('malformed bookmark safely ignored', await page.locator('.rd-resume').isHidden());
    await page.goto(BASE + 'library/kinesiology/ch01/');
    check('malformed preferences recover to defaults', await page.locator('#rd-font-size').inputValue() === '20');
    const original = await page.request.get(BASE + 'originals/neumann/74/');
    check('original page has contextual return link and image', original.status() === 200 && (await original.text()).includes('回中文讀本'));
    const simultaneous = await Promise.all(['originals/neumann/74/image.png', 'originals/nordin/19/image.png'].map(route => page.request.get(BASE + route)));
    check('concurrent original requests remain separate', simultaneous.every(response => response.status() === 200) && (await simultaneous[0].body()).length !== (await simultaneous[1].body()).length);
    for (const invalid of ['originals/other/1/', 'originals/neumann/0/', 'originals/neumann/9999/']) {
      check(`reject invalid source ${invalid}`, (await page.request.get(BASE + invalid)).status() === 404);
    }
    if (!smoke) {
      for (const book of Object.values(books)) {
        for (const chapter of book.chapters) {
          await page.goto(BASE + chapter.path);
          check(`${chapter.id}: chapter present`, (await page.locator('#rd-article').count()) === 1 && (await page.locator('#rd-article').textContent()).length > 800);
          const badLinks = await page.locator('.rd-page a').evaluateAll(links => links.filter(link => /undefined|javascript:|NaN/.test(link.getAttribute('href') || '')).length);
          check(`${chapter.id}: clean generated links`, badLinks === 0);
        }
      }
    }
    check('no browser runtime errors', errors.length === 0, errors.join('; '));
  } finally { await browser.close(); }
  const report = { mode: smoke ? 'smoke' : 'full', checks, passed: checks.filter(x => x.pass).length, failed: checks.filter(x => !x.pass).length };
  fs.writeFileSync(path.join(screenshotDir, 'browser-results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.failed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
