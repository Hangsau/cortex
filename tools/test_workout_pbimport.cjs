/* node tools/test_workout_pbimport.cjs [URL]：教練後台帶學生成績（#pb=）匯入。isolated browser storage only. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:1327/cortex/vortex/workout/';
const enc = (o) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const page = await (await browser.newContext()).newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    const link = url + '#pb=' + enc({ v: 1, name: '林小魚', course: 'lcm', who: 'tri', pb: { free: { 200: 150, 400: 320, 999: 1 }, back: { 100: 80 } } });
    await page.goto(link);
    await page.waitForFunction(() => document.querySelector('[data-wk-pb="free:400"] input').value !== '');
    assert.equal(await page.inputValue('[data-wk-pb="free:200"] input'), '2:30');
    assert.equal(await page.inputValue('[data-wk-pb="free:400"] input'), '5:20');
    assert.equal(await page.inputValue('[data-wk-pb="back:100"] input'), '1:20');
    assert.equal(await page.inputValue('[data-wk-course]'), 'lcm');
    assert.equal(await page.inputValue('[data-wk-who]'), 'tri', '鐵人學生帶入鐵人模式');
    assert.equal(new URL(page.url()).hash, '', '網址裡的成績資料要清掉');
    assert.match(await page.textContent('[data-wk-toast]'), /已帶入「林小魚」的成績/);
    const stored = await page.evaluate(() => localStorage.getItem('cortex-swim-v3'));
    assert.ok(!stored.includes('320') && !stored.includes('林小魚'), '成績與名字不存進瀏覽器');
    const bad = await page.context().newPage(); bad.on('pageerror', e => errors.push(e.message));
    await bad.goto(url + '#pb=not-json'); await bad.waitForTimeout(800);
    assert.match(await bad.textContent('[data-wk-toast]'), /讀不出來/);
    assert.deepEqual(errors, []);
    console.log('PASS workout pb import: fills PBs, course, triathlon mode, clears hash, not persisted, bad link message');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
