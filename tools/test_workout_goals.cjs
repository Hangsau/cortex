/* node tools/test_workout_goals.cjs [URL]; isolated browser storage only. */
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
  const menu = async () => { const s = await state(); return s.menus[s.cur]; };
  const rows = async () => (await menu()).blocks.flatMap(b => b.rows);
  const brief = () => page.evaluate(() => document.querySelector('[data-wk]').workout.brief());
  const open = async () => { await page.locator('[data-ws-tab="plan"]').click(); await page.locator('[data-ws-recommend]').click(); };
  const select = key => page.locator('[data-wk-goal]').selectOption(key);
  const add = () => page.locator('[data-wk-goal-add]').click();
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  try {
    await page.goto(url);
    await open();
    assert.equal(await page.locator('[data-wk-race]').inputValue(), '');
    assert.equal(await page.locator('[data-wk-goal] option').count(), 7);
    assert.equal(await page.locator('[data-wk-goal-stroke] option').count(), 4);
    const cases = [
      ['aerobic_easy', 'easy', 400, 2, 15, 370.6],
      ['steady', 'steady', 400, 2, 15, 360.4],
      ['threshold', 'thr', 200, 5, 35, 170],
      ['velocity', 'sprint', 25, 4, 180, 12.5],
      ['lactate_production', 'sprint', 50, 3, 120, 28],
      ['lactate_tolerance', 'tol', 100, 3, 40, 66],
      ['race_pace', 'race', 25, 11, 15, 15],
    ];
    for (const [key, int, dist, reps, rest] of cases) {
      await select(key);
      assert.match(await page.locator('[data-wk-goal-out]').innerText(), /待補成績或自訂秒數/);
      const previous = await rows();
      await add();
      assert.equal(await page.locator('#ws-tab-plan').getAttribute('aria-selected'), 'true');
      const current = await rows(), row = current.at(-1);
      assert.deepEqual(current.slice(0, -1), previous, 'adding a recommendation preserves previous rows');
      assert.equal(row.int, int); assert.equal(row.dist, dist); assert.equal(row.reps, reps); assert.equal(row.rest, rest);
      assert.equal((await brief()).items.at(-1).targetSeconds, null, 'no PB must not invent a target');
      await open();
    }
    // Inputs update the selected recommendation and generated rows through the shared formulas.
    for (const [dist, value] of [[25, '12.5'], [50, '28'], [100, '60'], [200, '150'], [400, '320']]) {
      await page.locator(`[data-wk-pb="free:${dist}"] input`).fill(value);
    }
    for (const [key, , , , , target] of cases) {
      await select(key); await add();
      assert.ok(Math.abs((await brief()).items.at(-1).targetSeconds - target) < 0.001, `${key} target`);
      await open();
    }
    // Reducing volume preserves recovery; both transitions between sets and reps remain usable.
    await select('velocity');
    await page.locator('[data-wk-goal-size]').selectOption('standard');
    await add();
    let row = (await rows()).at(-1);
    assert.equal(row.sets, 2); assert.equal(row.reps, 4); assert.equal(row.rest, 180); assert.equal(row.setRest, 180);
    await open();
    await select('race_pace');
    await page.locator('[data-wk-goal-event]').selectOption('400');
    await add();
    row = (await rows()).at(-1);
    assert.equal(row.event, '400'); assert.equal(row.dist, 50); assert.equal(row.reps, 32); assert.equal(row.rest, 20);
    assert.equal((await brief()).items.at(-1).targetSeconds, 40);
    await open();
    // Each stroke uses its own PB, and changing stroke resets unsupported race distances.
    await page.locator('[data-wk-goal-stroke]').selectOption('fly');
    assert.equal(await page.locator('[data-wk-goal-event]').inputValue(), '100');
    await page.locator('[data-wk-pb="fly:100"] input').fill('80');
    await add();
    row = (await rows()).at(-1);
    assert.equal(row.stroke, 'fly'); assert.equal(row.event, '100');
    assert.equal((await brief()).items.at(-1).targetSeconds, 20);
    // New menu is separate and returns to the plan even when the item count stays the same.
    await open(); await select('steady');
    const before = await state();
    await page.locator('[data-wk-goal-new]').click();
    const created = await state();
    assert.deepEqual(created.menus.slice(0, -1), before.menus);
    assert.equal(created.menus.length, before.menus.length + 1);
    assert.deepEqual(created.menus.at(-1).blocks.map(b => b.rows.length), [0, 0, 1, 0]);
    assert.ok(created.menus.at(-1).intent);
    await open(); await page.locator('[data-wk-goal-new]').click();
    assert.equal(await page.locator('#ws-tab-plan').getAttribute('aria-selected'), 'true');
    const savedMenu = await menu();
    await page.reload();
    assert.deepEqual(await menu(), savedMenu);
    assert.deepEqual((await state()).pb, {});
    await open();
    // Invalid PB and a malformed option cannot create targets or select an unknown builder.
    await page.locator('[data-wk-pb="free:200"] input').fill('oops');
    await select('threshold');
    assert.match(await page.locator('[data-wk-goal-out]').innerText(), /待補成績/);
    await page.evaluate(() => {
      const select = document.querySelector('[data-wk-goal]');
      select.add(new Option('invalid', '__proto__')); select.value = '__proto__';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await add(); assert.equal((await rows()).at(-1).int, 'thr');
    // Existing race-date route still builds a week; new goal selections do not require or overwrite it.
    await open();
    await page.locator('[data-wk-today]').fill('2026-10-06');
    await page.locator('[data-wk-race]').fill('2026-12-20');
    assert.equal(await page.locator('[data-day]').count(), 4);
    const countBeforeWeek = (await state()).menus.length;
    await page.locator('[data-weekall]').click();
    assert.equal((await state()).menus.length, countBeforeWeek + 4);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      if (await page.locator('#ws-tab-plan').getAttribute('aria-selected') !== 'true') await page.locator('#ws-tab-plan').click();
      await noOverflow(); await open(); await select('race_pace'); await noOverflow();
      await page.locator('#wk-goals').scrollIntoViewIfNeeded();
      fs.mkdirSync(output, { recursive: true });
      await page.screenshot({ path: path.join(output, `workout-goals-${width}.png`) });
    }
    assert.deepEqual(errors, []);
    console.log('PASS workout goals: no race/PB, seven types, shared targets, rest, independent strokes, add/new, persistence, invalid input, existing weekly plan, 320/390/1440px');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
