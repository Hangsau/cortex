/* node tools/test_workout_group.cjs [URL]; isolated browser storage, no member data persists. */
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:13380/cortex/vortex/workout/';
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const f = key => page.locator(`[data-lane-field="${key}"]`);
  const choice = key => page.locator(`[data-lane-choice="${key}"]`);
  const people = page.locator('[data-lane-person]');
  const person = (i, key) => people.nth(i).locator(`[data-person-field="${key}"]`);
  const pb = (i, d) => people.nth(i).locator(`[data-person-pb="${d}"]`);
  const mode = key => page.locator(`[data-ws-mode="${key}"]`).click();
  const compute = () => page.locator('[data-lane-form] button[type="submit"]').click();
  const snapshot = () => page.evaluate(() => ({ menu: document.querySelector('[data-wk]').workout.snapshot(), saved: JSON.stringify(localStorage) }));
  const targets = () => page.locator('[data-person-field="time"]').evaluateAll(xs => xs.map(x => x.value));
  const dataRows = () => page.locator('[data-lane-output] tbody tr').evaluateAll(xs => xs.map(x => [...x.querySelectorAll('td')].map(x => x.textContent)));
  try {
    await page.goto(url);
    assert.equal(await page.locator('[data-ws-mode="personal"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#wk-lane').isVisible(), false);
    for (const [d, value] of [[25, '12.5'], [50, '28'], [100, '60'], [200, '150'], [400, '320']]) await page.locator(`[data-wk-pb="free:${d}"] input`).fill(value);
    const original = await snapshot();
    // Group calculations use explicit member data and the existing seven goal rules.
    const results = await page.evaluate(() => {
      const api = document.querySelector('[data-wk]').workout;
      const sample = { 25: 12.5, 50: 28, 100: 60, 200: 150, 400: 320 };
      return api.groupOptions().strokes.map(stroke => api.groupOptions().goals.map(goal => {
        const c = { key: goal.key, stroke: stroke.key, size: 'compact', event: 100 };
        return { key: goal.key, stroke: stroke.key, full: api.groupRecommendation(c, { [stroke.key]: sample }), empty: api.groupRecommendation(c, {}) };
      }));
    });
    const expected = { aerobic_easy: 370.6, steady: 360.4, threshold: 170, velocity: 12.5, lactate_production: 28, lactate_tolerance: 66, race_pace: 15 };
    for (const x of results.flat()) {
      // 400 m PB is not a supported input for non-freestyle strokes; CSS uses their 100/200 fit.
      if (x.stroke === 'free' || !['aerobic_easy', 'steady', 'threshold'].includes(x.key)) assert.ok(Math.abs(x.full.target - expected[x.key]) < 0.001, `${x.stroke}/${x.key}`);
      assert.ok(x.full.target > 0); assert.equal(x.empty.target, null); assert.equal(x.empty.sendoff, null);
    }
    const edge = await page.evaluate(() => {
      const api = document.querySelector('[data-wk]').workout, c = { key: 'threshold', stroke: 'free', size: 'compact', event: 100 };
      const invalid = ['0', '-3', 'NaN', '1:60', '1:23:45', '1e2', '7201'].map(value => { try { api.groupRecommendation(c, { free: { 200: value } }); return false; } catch (_) { return true; } });
      return { invalid, decimal: api.groupRecommendation({ ...c, key: 'race_pace' }, { free: { 100: '1：00.25' } }).target,
        partial: api.groupRecommendation(c, { free: { 200: 150 } }).target,
        other: api.groupRecommendation(c, { back: { 200: 150, 400: 320 } }).target };
    });
    assert.ok(edge.invalid.every(Boolean)); assert.equal(edge.decimal, 15.0625); assert.equal(edge.partial, null); assert.equal(edge.other, null);
    assert.deepEqual(await snapshot(), original);
    await mode('group');
    assert.equal(await page.locator('#wk-pb').isVisible(), false);
    assert.equal(await page.locator('.ws-aside').isVisible(), false);
    assert.equal(await page.locator('.ws-bottom').isVisible(), false);
    assert.match(await page.locator('[data-ws-save]').innerText(), /僅保留於本次頁面/);
    assert.deepEqual(await targets(), ['', '', '', '']);
    await compute(); assert.equal(await page.locator('[data-lane-error]').isVisible(), true);
    await people.last().locator('[data-lane-remove]').click(); await people.last().locator('[data-lane-remove]').click();
    await choice('key').selectOption('threshold');
    await f('distance').fill('100'); await f('sets').fill('2'); await f('reps').fill('3'); await f('setRest').fill('60'); await f('minRest').fill('20');
    await page.locator('[data-lane-pb-toggle]').click();
    for (const [i, t200, t400] of [[0, '2:30.00', '5:20.00'], [1, '180', '380']]) {
      await person(i, 'name').fill(i ? '乙' : '甲'); await pb(i, 200).fill(t200); await pb(i, 400).fill(t400);
    }
    await compute();
    assert.equal(await page.locator('[data-lane-error]').isVisible(), false);
    assert.deepEqual(await targets(), ['1:25', '1:40']);
    let rows = await dataRows();
    assert.deepEqual(rows.map(r => r.slice(0, 3)), [['1:25', '0:35', '2:00'], ['1:40', '0:20', '2:00']]);
    assert.match(await page.locator('[data-lane-summary]').innerText(), /12:30.*12:35/);
    await mode('personal'); assert.equal(await page.locator('.ws-bottom').isVisible(), true);
    assert.match(await page.locator('[data-ws-save]').innerText(), /已儲存/);
    assert.equal(await page.locator('[data-wk-pb="free:200"] input').inputValue(), '150');
    await mode('group'); assert.equal(await pb(0, 200).inputValue(), '2:30.00');
    assert.deepEqual(await targets(), ['1:25', '1:40']); assert.deepEqual(await snapshot(), original);
    await f('timing').selectOption('rest'); await compute();
    rows = await dataRows();
    assert.deepEqual(rows.map(r => r.slice(0, 3)), [['1:25', '0:20', '1:45'], ['1:40', '0:20', '2:00']]);
    assert.deepEqual(rows.map(r => r[5]), ['1:50', '1:05']);
    assert.match(await page.locator('[data-lane-output]').innerText(), /現場從實際到牆起算/);
    assert.equal(await page.locator('[data-lane-group]').isDisabled(), true);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.groupCopy = text; } } }));
    await page.locator('[data-lane-copy]').click();
    assert.match(await page.evaluate(() => window.groupCopy), /2 組.*3.*100 m/);
    assert.match(await page.evaluate(() => window.groupCopy), /CSS.*實測/);
    // Invalid and missing member scores cannot silently reuse an old target or owner's PB.
    await pb(0, 200).fill('oops'); assert.equal(await page.locator('[data-lane-export]').isVisible(), false);
    await compute(); assert.match(await page.locator('[data-lane-error]').innerText(), /甲.*200 m/);
    assert.equal(await person(0, 'time').inputValue(), '');
    await pb(0, 200).fill(''); await pb(0, 400).fill(''); await compute();
    assert.equal(await page.locator('[data-lane-output] table').count(), 0);
    await person(0, 'source').selectOption('manual'); await person(0, 'time').fill('95'); await compute();
    assert.equal(await page.locator('[data-lane-error]').isVisible(), false);
    assert.deepEqual(await targets(), ['95', '1:40']);
    // Distance invalidates targets while retaining comparable PBs; conditions invalidate both.
    await f('distance').fill('200'); await f('reps').focus();
    assert.deepEqual(await targets(), ['', '']); assert.equal(await pb(1, 200).inputValue(), '180');
    await f('pool').selectOption('50'); assert.equal(await pb(1, 200).inputValue(), '');
    await pb(1, 200).fill('180'); await choice('stroke').selectOption('back');
    assert.equal(await pb(1, 200).inputValue(), '');
    await person(0, 'source').selectOption('pb');
    await pb(1, 200).fill('180'); await f('task').fill('仰式・划手板'); await f('purpose').focus();
    assert.equal(await pb(1, 200).inputValue(), ''); await compute();
    assert.match(await page.locator('[data-lane-error]').innerText(), /器材或自訂游法/);
    // Personal recommendation opens group mode and imports the entire multi-set structure.
    await mode('personal'); await page.locator('[data-wk-goal]').selectOption('velocity');
    await page.locator('[data-wk-goal-size]').selectOption('standard');
    await page.locator('[data-wk-goal-lane]').click();
    assert.equal(await page.locator('[data-ws-mode="group"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await f('sets').inputValue(), '2'); assert.equal(await f('setRest').inputValue(), '180');
    assert.deepEqual(await targets(), ['', '']); assert.equal(await choice('key').inputValue(), 'velocity');
    assert.deepEqual(await snapshot(), original);
    // Mobile roster with PB fields and results is scrollable without overflowing the page.
    await f('pool').selectOption('25'); await choice('key').selectOption('threshold');
    await page.locator('[data-lane-pb-toggle]').evaluate(el => { for (const d of document.querySelectorAll('[data-person-scores]')) d.open = true; });
    for (let i = 0; i < 2; i++) { await pb(i, 200).fill(String(150 + i * 30)); await pb(i, 400).fill(String(320 + i * 60)); }
    await compute();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow ${width}`);
      assert.ok(await page.locator('[data-ws-mode="group"]').evaluate(el => el.getBoundingClientRect().height >= 48));
      if (process.env.WORKOUT_SCREENSHOTS) {
        await page.locator('[data-ws-mode="group"]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(process.env.WORKOUT_SCREENSHOTS, `group-${width}.png`), fullPage: true });
      }
    }
    await person(0, 'name').fill('PRIVATE_GROUP_7264'); await pb(0, 200).fill('171.23');
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('PRIVATE_GROUP_7264') || JSON.stringify(localStorage).includes('171.23')), false);
    await page.reload(); assert.equal(await page.locator('#wk-lane').isVisible(), true);
    assert.deepEqual(await targets(), ['', '', '', '']);
    assert.equal(await pb(0, 200).inputValue(), '');
    await page.goto(url.split('#')[0] + '#wk-pb'); assert.equal(await page.locator('#wk-pb').isVisible(), true);
    assert.equal(await page.locator('#wk-lane').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS group pacing: seven goals, own PBs, validation, fixed rest/sendoff, full sets, mode switching, privacy and 320/390/1440px');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
