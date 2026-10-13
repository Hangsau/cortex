/* node tools/test_workout_skills.cjs [URL]; isolated browser storage only.
   週課表（③）的期內負荷節律與水下海豚腿段：各期別、恢復週、堂數、重測週、建成課表、手機寬度。 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:1327/cortex/vortex/workout/';

const iso = (base, addDays) => { const d = new Date(base + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + addDays); return d.toISOString().slice(0, 10); };
const TODAY = '2026-10-13';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('cortex-swim-v3')));
  const out = () => page.locator('[data-wk-pzout]').innerText();
  const setPz = async (daysToRace, sess, mstart) => {
    await page.locator('[data-wk-today]').fill(TODAY); await page.locator('[data-wk-today]').dispatchEvent('change');
    await page.locator('[data-wk-mstart]').fill(mstart || ''); await page.locator('[data-wk-mstart]').dispatchEvent('change');
    await page.locator('[data-wk-sess]').selectOption(String(sess));
    await page.locator('[data-wk-race]').fill(iso(TODAY, daysToRace)); await page.locator('[data-wk-race]').dispatchEvent('change');
  };
  const days = () => page.locator('.wk-day');
  const uwDays = async () => { const n = await days().count(), r = []; for (let i = 0; i < n; i++) if (/水下海豚腿約 10 分鐘/.test(await days().nth(i).innerText())) r.push(i); return r; };
  try {
    await page.goto(url + '#wk-pz');

    // 一般準備期第 1 週：4:1 的負荷週 1／4；4 堂課→水下段 3 堂，先掛兩堂品質課再掛閾值
    await setPz(105, 4);
    let t = await out();
    assert.match(t, /現在是\s*一般準備期/);
    assert.match(t, /一般準備期第 1 週：負荷週 1／4/);
    assert.match(t, /4:1（4 個負荷週接 1 個恢復週；早期準備期）/);
    assert.match(t, /水下海豚腿：這週 3 堂/);
    assert.deepEqual(await uwDays(), [0, 2, 3]); // Q E Q T → Q, Q, T
    assert.match(t, /水下安全：.*正常訓練/s);
    assert.match(t, /15 m/);
    assert.doesNotMatch(t, /零水下/);

    // 第 5 週是 4:1 的恢復週（大週期 105 天，離賽 105−28 天）
    await setPz(77, 4);
    t = await out();
    assert.match(t, /一般準備期第 5 週：恢復週/);
    assert.match(t, /恢復週要降多少，書裡沒有給數字/);

    // 堂數上下限：1 堂→1；2 堂→2；6 堂→4
    for (const [sess, want] of [[1, 1], [2, 2], [3, 2], [6, 4]]) {
      await setPz(105, sess);
      assert.equal((await uwDays()).length, want, `每週 ${sess} 堂應排 ${want} 堂水下段`);
    }

    // 減量期：取下限 2 堂、附減量說明；沒有負荷節律框（減量另有規則）
    await setPz(10, 5);
    t = await out();
    assert.match(t, /現在是\s*減量期/);
    assert.match(t, /水下海豚腿：這週 2 堂/);
    assert.match(t, /減量期保留短的水下段，不加量/);
    assert.doesNotMatch(t, /負荷節律裡的位置/);

    // 過渡期（比賽已過）：不排水下段
    await setPz(-3, 4);
    t = await out();
    assert.match(t, /現在是\s*過渡期/);
    assert.doesNotMatch(t, /水下海豚腿/);

    // 重測週：大週期第 2 週（離賽 105−7 天）→ 第一堂水下段先重測，建成課表時列備註帶重測
    await setPz(98, 4);
    t = await out();
    assert.match(t, /這週是重測週/);
    assert.match(await days().nth(0).innerText(), /這堂先重測/);
    await days().nth(0).locator('[data-day]').click();
    let s = await state(), m = s.menus[s.cur];
    const drill = m.blocks.find(b => b.title === 'Drill').rows;
    assert.equal(drill.length, 1);
    assert.equal(drill[0].drill, 'UDK5');
    assert.equal(drill[0].mode, 'drill');
    assert.ok(drill[0].rest > 0, '水下列要有休息');
    assert.ok(drill[0].reps >= 4 && drill[0].reps <= 20, `趟數 ${drill[0].reps} 應由約 10 分鐘換算`);
    assert.match(drill[0].note, /這堂先重測/);
    assert.match(drill[0].note, /最多到 15 m/);

    // 非重測週：備註不帶重測；沒有水下段的堂次不加 drill 列
    const pace = () => page.locator('[data-ws-tab="pace"]').click();
    await pace();
    await setPz(105, 4);
    assert.doesNotMatch(await out(), /這週是重測週/);
    await days().nth(1).locator('[data-day]').click(); // 第 2 堂 E：不掛水下段
    s = await state(); m = s.menus[s.cur];
    assert.equal(m.blocks.find(b => b.title === 'Drill').rows.length, 0);
    await pace();
    await days().nth(3).locator('[data-day]').click(); // 第 4 堂 T：有水下段
    s = await state(); m = s.menus[s.cur];
    assert.doesNotMatch(m.blocks.find(b => b.title === 'Drill').rows[0].note, /重測/);

    await pace();
    // 出處連結指向站內頁
    const hrefs = await page.locator('[data-wk-pzout] .wk-box a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    assert.ok(hrefs.some(h => h.endsWith('/vortex/instructional/underwater-dolphin-kick-analysis/')));
    assert.ok(hrefs.some(h => h.endsWith('/vortex/drills/udk5/')));

    for (const w of [320, 390]) {
      await page.setViewportSize({ width: w, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${w}px 不可水平捲動`);
    }
    assert.deepEqual(errors, []);
    console.log('test_workout_skills: PASS');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
