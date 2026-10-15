/* node tools/test_workout_prep.cjs [URL]; isolated browser storage only.
   主課前的器材技術準備：目的與泳式篩模板、今天帶的器材、組數與增量、ABAB 展開、器材列不套一般配速、手機寬度。 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:1327/cortex/vortex/workout/';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('cortex-swim-v3')));
  const drillRows = async () => { const s = await state(); return s.menus[s.cur].blocks.find(b => b.title === 'Drill').rows; };
  const brief = () => page.evaluate(() => document.querySelector('[data-wk]').workout.brief());
  const pace = () => page.locator('[data-ws-tab="pace"]').click();
  const view = key => page.locator(`.ws-views [data-ws-view="${key}"]`).click(); // 成績與建議的子畫面
  const prep = () => page.locator('[data-wk-prep]');
  const items = () => prep().locator('.wk-prep-item');
  const goal = async (key, stroke = 'free') => { await page.locator('[data-wk-goal]').selectOption(key); await page.locator('[data-wk-goal-stroke]').selectOption(stroke); };
  const openPrep = async () => { if (!(await prep().locator('details').evaluate(d => d.open))) await prep().locator('summary').click(); };
  try {
    await page.goto(url);
    await pace(); await view('goals'); // 開頁預設是成績與配速

    // 輕鬆有氧＋自由式：三個模板；沒點「今天帶了」時全部停用
    await goal('aerobic_easy');
    await openPrep();
    assert.equal(await items().count(), 3);
    assert.equal(await prep().locator('[data-wk-prep-add]:disabled').count(), 3);
    assert.match(await prep().innerText(), /需要中央呼吸管/);

    // 點呼吸管：只開放呼吸管模板；預設 2 組 → ABAB 四列，休息 25 秒，不設配速，記模板版本
    await prep().locator('[data-wk-prep-eq="snorkel"]').click();
    assert.equal(await prep().locator('details').evaluate(d => d.open), true, '點器材後展開狀態要保留');
    assert.equal(await prep().locator('[data-wk-prep-add]:disabled').count(), 2);
    assert.match(await items().nth(0).innerText(), /新增 100 m（2 組 × 50 m）/);
    await prep().locator('[data-wk-prep-add="snorkel-head"]').click();
    let rows = await drillRows();
    assert.equal(rows.length, 4);
    assert.deepEqual(rows.map(r => r.equip), [['snorkel'], [], ['snorkel'], []]);
    assert.deepEqual(rows.map(r => r.dist), [25, 25, 25, 25]);
    assert.ok(rows.every(r => r.rest === 25 && r.int === 'none' && r.reps === 1 && r.prep === 'snorkel-head@1'));
    assert.match(rows[2].note, /第 2\/2 組/);

    // 8 字球選 3 組：增量 300 m，六列 pull／swim 交替
    await pace();
    await openPrep();
    await prep().locator('[data-wk-prep-eq="pull_buoy"]').click();
    await prep().locator('[data-wk-prep-sets="buoy-pull"]').selectOption('3');
    assert.match(await prep().locator('.wk-prep-item').filter({ hasText: '8 字球）拉手' }).innerText(), /新增 300 m（3 組 × 100 m）/);
    await prep().locator('[data-wk-prep-add="buoy-pull"]').click();
    rows = (await drillRows()).slice(4);
    assert.equal(rows.length, 6);
    assert.deepEqual(rows.map(r => r.mode), ['pull', 'swim', 'pull', 'swim', 'pull', 'swim']);
    assert.deepEqual(rows.map(r => r.equip.length), [1, 0, 1, 0, 1, 0]);

    // 目的篩選：閾值只剩呼吸管；乳酸耐受也只剩呼吸管；仰式沒有模板
    await pace();
    await goal('threshold');
    await openPrep();
    assert.equal(await items().count(), 1);
    assert.match(await items().nth(0).innerText(), /換氣加入後/);
    await goal('lactate_tolerance');
    assert.equal(await items().count(), 1);
    await goal('aerobic_easy', 'back');
    assert.equal(await items().count(), 0);
    assert.match(await prep().innerText(), /目前只有自由式的器材準備模板，仰式主課先照原課/);

    // 器材列不套一般成績配速：同一列不戴器材有閾值目標，戴划手板就沒有（顯示原因）
    await view('pb'); for (const [dist, value] of [[200, '150'], [400, '320']]) await page.locator(`[data-wk-pb="free:${dist}"] input`).fill(value); await view('goals');
    await goal('threshold');
    await page.locator('[data-wk-goal-add]').click();
    assert.ok((await brief()).items.at(-1).targetSeconds > 0, '不戴器材的閾值列要有目標');
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('cortex-swim-v3'));
      s.menus[s.cur].blocks.find(b => b.title === '主課').rows.at(-1).equip = ['paddles'];
      localStorage.setItem('cortex-swim-v3', JSON.stringify(s));
    });
    await page.reload();
    await view('pb'); for (const [dist, value] of [[200, '150'], [400, '320']]) await page.locator(`[data-wk-pb="free:${dist}"] input`).fill(value); await view('goals');
    assert.equal((await brief()).items.at(-1).targetSeconds, null, '戴器材不可沿用一般配速');
    assert.match(await page.locator('[data-ws-tab="plan"]').evaluate(() => document.querySelector('#wk-menu').innerText), /戴器材不套用一般成績配速/);

    // 連結指向器材指南的章節
    await pace(); await goal('aerobic_easy'); await openPrep();
    const hrefs = await prep().locator('a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    for (const h of ['#lesson', '#snorkel', '#fins', '#pull-buoy']) assert.ok(hrefs.some(x => x.includes('/vortex/instructional/equipment-guide/' + h)), h);

    for (const w of [320, 390]) {
      await page.setViewportSize({ width: w, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${w}px 不可水平捲動`);
    }
    assert.deepEqual(errors, []);
    console.log('test_workout_prep: PASS');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
