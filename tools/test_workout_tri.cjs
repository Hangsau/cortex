/* node tools/test_workout_tri.cjs [URL]; isolated browser storage only.
   鐵人三項泳段模式（排一週 → 對象：鐵人三項）：結構讀 canonical periodization/triathlon.yaml。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:1327/cortex/vortex/workout/';
const output = process.env.WORKOUT_SCREENSHOTS || os.tmpdir();

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('cortex-swim-v3')));
  const open = async () => { await page.locator('[data-ws-tab="plan"]').click(); await page.locator('[data-ws-recommend]').click(); };
  const view = key => page.locator(`.ws-views [data-ws-view="${key}"]`).click();
  const out = () => page.locator('[data-wk-pzout]').innerText();
  const days = () => page.locator('[data-tri-day]').count();
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const mainRows = (m) => m.blocks.find(b => b.title === '主課').rows;
  try {
    await page.goto(url);
    await open();
    await view('week');
    assert.equal(await page.locator('[data-wk-tri]').isHidden(), true, 'triathlon fields hidden for swimmers');
    await page.locator('[data-wk-who]').selectOption('tri');
    assert.equal(await page.locator('[data-wk-tri]').isVisible(), true);
    assert.equal(await page.locator('[data-wk-tdist] option').count(), 4);
    // 沒成績、沒填配速：只給定位，建成課表是佔位列
    assert.equal(await days(), 4, 'default 4 sessions');
    assert.match(await out(), /也沒填泳段目標配速/);
    await page.locator('[data-tri-all]').click();
    assert.ok((await state()).menus.slice(-4).every(m => mainRows(m).every(r => r.int === 'none' && /請自行設定/.test(r.note))), 'no PB and no pace → placeholders');

    // 有 200＋400：CSS＝(320−150)÷2＝85 秒／100 m；標準距離比賽配速暫用 CSS
    await open(); await view('pb');
    await page.locator('[data-wk-pb="free:200"] input').fill('2:30');
    await page.locator('[data-wk-pb="free:400"] input').fill('5:20');
    await view('week');
    assert.match(await out(), /1:25\.0／100 m（CSS 暫用/);
    // 一般分齡建議 3 堂，按鈕套用
    await page.locator('[data-tri-sess="3"]').click();
    assert.equal(await days(), 3);
    const text = await out();
    assert.match(text, /比賽配速課/); assert.match(text, /技術＋開放水域技能課/); assert.match(text, /長有氧/);
    assert.match(text, /約 20 分鐘（以穩定有氧配速約 1350 m）/, 'continuous swim minutes from Laughlin, metres from steady pace');
    await page.locator('[data-tri-day="0"]').click();
    let m = (await state()).menus.at(-1), rows = mainRows(m);
    assert.deepEqual(rows.map(r => [r.reps, r.dist, r.int, r.target, r.rest]), [[5, 200, 'custom', '2:50', 20], [5, 100, 'custom', '1:25', 10]]);
    await open(); await view('week');
    await page.locator('[data-tri-day="1"]').click();
    rows = mainRows((await state()).menus.at(-1));
    assert.deepEqual(rows.map(r => [r.reps, r.dist, r.int]), [[1, 400, 'steady'], [2, 200, 'steady'], [1, 200, 'easy'], [1, 400, 'steady'], [2, 200, 'steady'], [1, 200, 'easy']], 'skill set 2 rounds');

    // 短距離 ×0.7：5 → 4 趟
    await open(); await view('week');
    await page.locator('[data-wk-tdist]').selectOption('sprint');
    await page.locator('[data-tri-day="0"]').click();
    assert.deepEqual(mainRows((await state()).menus.at(-1)).map(r => r.reps), [4, 4]);
    // 70.3：沒填配速就不給比賽配速秒數（CSS 不暫用），趟數 ×1.3：5 → 7
    await open(); await view('week');
    await page.locator('[data-wk-tdist]').selectOption('half');
    assert.match(await out(), /沒有可用的比賽配速/);
    await page.locator('[data-tri-day="0"]').click();
    rows = mainRows((await state()).menus.at(-1));
    assert.deepEqual(rows.map(r => [r.reps, r.int]), [[7, 'none'], [7, 'none']]);
    assert.match(rows[0].note, /填泳段目標配速才有秒數/);
    // 超級距離：自填 1:40 → 第一堂換成 10×100（不縮放），目標 1:40
    await open(); await view('week');
    await page.locator('[data-wk-tdist]').selectOption('full');
    await page.locator('[data-wk-trp]').fill('abc');
    assert.match(await out(), /看不懂填的泳段配速/, 'unparseable pace is reported, not silently replaced');
    await page.locator('[data-wk-trp]').fill('1:40');
    assert.match(await out(), /1:40\.0／100 m（你填的泳段目標配速）/);
    await page.locator('[data-tri-day="0"]').click(); // 直接從配速欄點按鈕：不能被失焦重畫吃掉
    rows = mainRows((await state()).menus.at(-1));
    assert.deepEqual(rows.map(r => [r.reps, r.dist, r.target, r.rest]), [[10, 100, '1:40', 10]]);

    // 設定存檔、重開後還在
    await page.reload(); await open(); await view('week');
    assert.equal(await page.locator('[data-wk-who]').inputValue(), 'tri');
    assert.equal(await page.locator('[data-wk-tdist]').inputValue(), 'full');
    assert.equal(await page.locator('[data-wk-trp]').inputValue(), '1:40');
    // 賽前一個月提示
    await page.locator('[data-wk-today]').fill('2026-10-06'); await page.locator('[data-wk-race]').fill('2026-10-30');
    assert.match(await out(), /賽前一個月/); assert.match(await out(), /每週 2 次開放水域/);
    // 切回游泳：原本的週課表照舊
    await page.locator('[data-wk-who]').selectOption('swim');
    assert.equal(await page.locator('[data-wk-tri]').isHidden(), true);
    assert.ok(await page.locator('[data-day]').count() > 0);
    await page.locator('[data-wk-who]').selectOption('tri');
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await noOverflow();
      fs.mkdirSync(output, { recursive: true });
      await page.locator('#wk-pz').screenshot({ path: path.join(output, `workout-tri-${width}.png`) });
    }
    assert.deepEqual(errors, []);
    console.log('PASS workout tri: hidden for swimmers, placeholders without PB/pace, CSS fallback only for sprint/standard, level sessions, source sets, distance scaling, 10×100 unscaled, own pace, persistence, race month, swim mode intact, 320/390/1440px');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
