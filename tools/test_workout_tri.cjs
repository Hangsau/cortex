/* node tools/test_workout_tri.cjs [URL]; isolated browser storage only.
   鐵人三項泳段：在「成績與配速」選「我是：鐵人三項」→ 選主課給鐵人課、排一週給鐵人週課表。
   結構讀 canonical periodization/triathlon.yaml。 */
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
  const pace = () => page.locator('[data-ws-tab="pace"]').click();
  const view = key => page.locator(`.ws-views [data-ws-view="${key}"]`).click();
  const goalOut = () => page.locator('[data-wk-goal-out]').innerText();
  const pzOut = () => page.locator('[data-wk-pzout]').innerText();
  const triPace = () => page.locator('[data-wk-tri-pace]').innerText();
  const days = () => page.locator('[data-tri-day]').count();
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const mainRows = (m) => m.blocks.find(b => b.title === '主課').rows;
  const lastMain = async () => mainRows((await state()).menus.at(-1));
  const newRp = async () => { await pace(); await view('goals'); await page.locator('[data-wk-tri-goal="rp"]').click(); await page.locator('[data-wk-tri-new]').click(); return lastMain(); };
  try {
    await page.goto(url);
    // 開頁先到成績與配速；游泳時看不到鐵人欄位
    assert.equal(await page.locator('.ws-views [data-ws-view="pb"]').getAttribute('aria-pressed'), 'true', 'PB view first');
    assert.equal(await page.locator('[data-wk-pb="free:200"]').isVisible(), true);
    assert.equal(await page.locator('[data-wk-tri]').isHidden(), true, 'triathlon fields hidden for swimmers');
    await page.locator('[data-wk-who]').selectOption('tri');
    assert.equal(await page.locator('[data-wk-tri]').isVisible(), true);
    assert.equal(await page.locator('[data-wk-pbset="back"]').isHidden(), true, 'only freestyle PBs for triathletes');
    assert.equal(await page.locator('[data-wk-pbset="free"]').isVisible(), true);
    assert.equal(await page.locator('[data-wk-tdist] option').count(), 4);
    assert.match(await triPace(), /還沒有比賽配速/);

    // 選主課：鐵人四種課；沒成績、沒配速 → 佔位列
    await view('goals');
    assert.equal(await page.locator('[data-wk-goal-swim]').first().isHidden(), true, 'swim goal fields hidden');
    assert.equal(await page.locator('[data-wk-tri-goal]').count(), 4);
    assert.match(await goalOut(), /也沒有比賽配速/);
    await page.locator('[data-wk-tri-new]').click();
    assert.ok((await lastMain()).every(r => r.int === 'none' && /請自行設定/.test(r.note)));

    // 填 200＋400：CSS＝(320−150)÷2＝85 秒；標準距離暫用 CSS
    await pace(); await view('pb');
    await page.locator('[data-wk-pb="free:200"] input').fill('2:30');
    await page.locator('[data-wk-pb="free:400"] input').fill('5:20');
    await page.locator('[data-wk-pb="free:400"] input').press('Tab');
    assert.match(await triPace(), /1:25\.0.*CSS 暫用/);
    // 上次泳段成績 30:00（1500 m）→ 實際比賽配速 2:00，優先於 CSS
    await page.locator('[data-wk-tsplit]').fill('30:00');
    assert.match(await triPace(), /2:00\.0.*上次泳段成績 ÷ 15/);
    await page.locator('[data-wk-tsplit]').fill('abc');
    assert.match(await triPace(), /看不懂填的泳段成績/);
    await page.locator('[data-wk-tsplit]').fill('30:00');

    assert.deepEqual((await newRp()).map(r => [r.reps, r.dist, r.int, r.target, r.rest]), [[5, 200, 'custom', '4:00', 20], [5, 100, 'custom', '2:00', 10]]);
    await pace(); await view('goals');
    await page.locator('[data-wk-tri-goal="skill"]').click();
    assert.equal(await page.locator('[data-wk-tri-goal="skill"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-wk-tri-new]').click();
    assert.deepEqual((await lastMain()).map(r => [r.reps, r.dist, r.int]), [[1, 400, 'steady'], [2, 200, 'steady'], [1, 200, 'easy'], [1, 400, 'steady'], [2, 200, 'steady'], [1, 200, 'easy']], 'skill set 2 rounds');
    await pace(); await view('goals');
    await page.locator('[data-wk-tri-goal="aerobic"]').click();
    assert.match(await goalOut(), /約 20 分鐘（以穩定有氧配速約 1350 m）/, 'continuous swim minutes from Laughlin, metres from steady pace');

    // 排一週：同一套設定；一般分齡建議 3 堂
    await view('week');
    assert.equal(await page.locator('[data-wk-who]').count(), 1, 'one who-switch only, in the PB view');
    assert.equal(await days(), 4, 'default 4 sessions');
    await page.locator('[data-tri-sess="3"]').click();
    assert.equal(await days(), 3);
    assert.match(await pzOut(), /比賽配速課[\s\S]*技術＋開放水域技能課[\s\S]*長有氧/);

    // 短距離 ×0.7（5 → 4）；自填配速優先於泳段成績
    await view('pb');
    await page.locator('[data-wk-tdist]').selectOption('sprint');
    await page.locator('[data-wk-trp]').fill('1:30');
    assert.match(await triPace(), /1:30\.0.*你填的泳段目標配速/);
    assert.deepEqual((await newRp()).map(r => [r.reps, r.target]), [[4, '3:00'], [4, '1:30']]);
    await pace(); await view('pb');
    await page.locator('[data-wk-trp]').fill('abc');
    assert.match(await triPace(), /看不懂填的泳段配速/);
    await page.locator('[data-wk-trp]').fill('');
    // 70.3：不暫用 CSS；沒有泳段成績就不給比賽配速秒數；趟數 ×1.3（5 → 7）
    await page.locator('[data-wk-tsplit]').fill('');
    await page.locator('[data-wk-tdist]').selectOption('half');
    assert.match(await triPace(), /這個賽距不暫用 CSS/);
    const half = await newRp();
    assert.deepEqual(half.map(r => [r.reps, r.int]), [[7, 'none'], [7, 'none']]);
    assert.match(half[0].note, /填泳段目標配速才有秒數/);
    // 超級距離：泳段成績 1:05:00（3800 m）→ 3900 ÷ 38 ≈ 102.6 秒；第一堂換 10×100（不縮放）
    await pace(); await view('pb');
    await page.locator('[data-wk-tdist]').selectOption('full');
    await page.locator('[data-wk-tsplit]').fill('1:05:00');
    assert.match(await triPace(), /1:42\.6/);
    await view('week');
    await page.locator('[data-tri-day="0"]').click();
    assert.deepEqual((await lastMain()).map(r => [r.reps, r.dist, r.rest]), [[10, 100, 10]]);

    // 設定存檔、重開後還在（成績本來就不存）
    await page.reload();
    assert.equal(await page.locator('[data-wk-who]').inputValue(), 'tri');
    assert.equal(await page.locator('[data-wk-tdist]').inputValue(), 'full');
    assert.equal(await page.locator('[data-wk-tsplit]').inputValue(), '1:05:00');
    assert.equal(await page.locator('[data-wk-pbset="back"]').isHidden(), true);
    // 賽前一個月提示
    await view('week');
    await page.locator('[data-wk-today]').fill('2026-10-06'); await page.locator('[data-wk-race]').fill('2026-10-30');
    assert.match(await pzOut(), /賽前一個月[\s\S]*每週 2 次開放水域/);
    // 切回游泳：四式成績與原本的選主課、週課表照舊
    await view('pb');
    await page.locator('[data-wk-who]').selectOption('swim');
    assert.equal(await page.locator('[data-wk-pbset="back"]').isVisible(), true);
    assert.equal(await page.locator('[data-wk-tri]').isHidden(), true);
    await view('goals');
    assert.equal(await page.locator('[data-wk-goal]').isVisible(), true);
    assert.equal(await page.locator('[data-wk-tri-goal]').count(), 0);
    await view('week');
    assert.ok(await page.locator('[data-day]').count() > 0);
    await view('pb'); await page.locator('[data-wk-who]').selectOption('tri');
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      fs.mkdirSync(output, { recursive: true });
      for (const v of ['pb', 'goals']) { await view(v); await noOverflow(); await page.screenshot({ path: path.join(output, `workout-tri-${v}-${width}.png`), fullPage: true }); }
    }
    assert.deepEqual(errors, []);
    console.log('PASS workout tri: PB view first, who-switch in PB view, freestyle-only PBs, tri goals without race date, split → race pace (h:m:s), own pace first, CSS fallback only sprint/standard, distance scaling, 10×100 unscaled, persistence, race month, swim mode intact, 320/390/1440px');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
