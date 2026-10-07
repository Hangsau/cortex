/* node tools/test_workout_lane.cjs [--unit | URL]; browser state stays in an isolated context. */
const assert = require('node:assert/strict');
const path = require('node:path');
const { calculate, suggestGroups, parseTime, fmt } = require('../next/assets/js/workout-lane.js');
const example = { purpose: '穩定有氧', people: [90, 95, 100, 105].map((time, i) => ({ name: 'ABCD'[i], time, batch: 1 })) };
const calc = extra => calculate({ ...example, ...extra });

assert.equal(parseTime('1:30.5'), 90.5);
assert.equal(parseTime('90 秒'), 90);
for (const v of ['', '1:60', '-1', 'NaN', Infinity, {}, '1e2', '1:2', '0:00.01']) assert.equal(parseTime(v), null);
assert.equal(fmt(59.96), '1:00');
let r = calc();
assert.equal(r.groups[0].interval, 125);
assert.deepEqual(r.groups[0].people.map(p => p.rest), [35, 30, 25, 20]);
assert.deepEqual(r.groups[0].people.map(p => p.first), [0, 5, 10, 15]);
assert.deepEqual(r.groups[0].people.map(p => p.next), [125, 130, 135, 140]);
assert.equal(r.finish, 745); assert.equal(r.nextBlock, 750); assert.deepEqual(r.warnings, []);
assert.equal(calc({ maxRest: 30 }).warnings.length, 1);
assert.deepEqual(suggestGroups({ ...example, maxRest: 30 }).map(p => p.batch), [1, 1, 1, 2]);
assert.equal(calc({ minutes: 12 }).warnings.some(w => w.includes('超過')), true);
assert.equal(calc({ minutes: 13 }).warnings.some(w => w.includes('超過')), false);
for (const extra of [{ people: [] }, { people: [{ time: '', batch: 1 }] }, { people: [{ time: 0, batch: 1 }] }, { people: [{ time: 90, batch: 0 }] }, { distance: 75, pool: 50 }, { distance: 25, pool: 50 }, { interval: '1:00' }, { interval: '1:59' }, { interval: 'bogus' }, { maxRest: 19 }, { reps: 201 }, { gap: 0 }, { minutes: 'NaN' }, { purpose: '' }]) assert.throws(() => calc(extra), undefined, JSON.stringify(extra));
r = calc({ reps: 1, interval: '1' });
assert.equal(r.finish, 120); assert.equal(r.nextBlock, 125);
assert.ok(r.groups[0].people.every(p => p.next === null && p.rest === null));
assert.ok(calc({ distance: 75 }).notes.some(n => n.includes('對岸')));
r = calc({ people: [{ name: 'first', time: 60, batch: 2 }, { name: 'tie', time: 60, batch: 2 }, { time: 30, batch: 2 }], regroup: false, maxRest: '', reps: 2 });
assert.deepEqual(r.groups[0].people.map(p => p.name), ['泳者 3', 'first', 'tie']);
assert.ok(r.notes.some(n => n.includes('跨趟')));
const two = { ...example, people: example.people.map((p, i) => ({ ...p, batch: i < 2 ? 1 : 2 })), reps: 2 };
r = calculate(two);
assert.deepEqual(r.groups.map(g => [g.start, g.interval, g.end]), [[0, 115, 215], [220, 125, 455]]);
assert.equal(r.nextBlock, 460);
r = calculate({ ...two, mode: 'rotation' });
assert.deepEqual(r.groups.map(g => [g.start, g.interval, g.end]), [[0, 220, 320], [105, 220, 435]]);
assert.deepEqual(r.groups.flatMap(g => g.people.map(p => p.rest)), [130, 125, 120, 115]);
assert.equal(r.warnings.length, 4); assert.equal(r.nextBlock, 440);
assert.throws(() => calculate({ ...two, mode: 'rotation', interval: 219 }), /輪完/);
assert.equal(calc({ interval: 125.5 }).finish, 747.5);
assert.equal(calc({ people: [{ time: 90.5, batch: 1 }], regroup: false }).groups[0].interval, 115);
assert.ok(calc({ distance: 400, people: [{ time: 100, batch: 1 }, { time: 300, batch: 1 }] }).warnings.some(w => w.includes('追及')));
assert.ok(calc({ distance: 100, gap: 60 }).warnings.some(w => w.includes('隊尾')));
assert.equal(calc({ reps: 200, people: Array.from({ length: 24 }, () => ({ time: 60, batch: 1 })), maxRest: '' }).groups[0].people.length, 24);
assert.throws(() => calc({ people: Array.from({ length: 25 }, () => ({ time: 60, batch: 1 })) }), /1–24/);
console.log('PASS shared-lane math: scheduling, rest bounds, batches, rounding, invalid inputs and limits');
if (process.argv[2] === '--unit') process.exit(0);

const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:13379/cortex/vortex/workout/';
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const f = key => page.locator(`[data-lane-field="${key}"]`);
  const demo = () => page.locator('[data-lane-example]').click();
  const compute = () => page.locator('[data-lane-form] button[type="submit"]').click();
  const snapshot = () => page.evaluate(() => document.querySelector('[data-wk]').workout.snapshot());
  const roster = () => page.locator('[data-person-field="time"]').evaluateAll(xs => xs.map(x => x.value));
  const overflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  try {
    await page.goto(url); await page.locator('[data-ws-lane]').click();
    assert.equal(await page.locator('#wk-lane').isVisible(), true);
    assert.deepEqual(await roster(), ['', '', '', '']);
    const original = await snapshot();
    await compute(); assert.equal(await page.locator('[data-lane-error]').isVisible(), true);
    await demo(); await compute();
    assert.match(await page.locator('[data-lane-summary]').innerText(), /12:25.*12:30/);
    assert.equal(await page.locator('[data-lane-output] tbody tr').count(), 4);
    assert.equal(await page.locator('[data-lane-error]').isVisible(), false);
    assert.deepEqual(await snapshot(), original);

    // Changing a condition invalidates the export; changing swimming conditions also clears reference times.
    await f('maxRest').fill('30'); assert.equal(await page.locator('[data-lane-export]').isVisible(), false);
    await compute(); assert.match(await page.locator('[data-lane-output] .wk-warn').innerText(), /A.*0:35/);
    await page.locator('[data-lane-group]').click();
    assert.deepEqual(await page.locator('[data-person-field="batch"]').evaluateAll(xs => xs.map(x => x.value)), ['1', '1', '1', '2']);
    await compute(); assert.equal(await page.locator('[data-lane-output] table').count(), 2);
    await f('mode').selectOption('rotation'); await compute();
    assert.match(await page.locator('[data-lane-output]').innerText(), /等其他批的時間已計入休息/);
    await f('distance').fill('50'); await f('purpose').focus(); assert.deepEqual(await roster(), ['', '', '', '']);
    await compute(); assert.match(await page.locator('[data-lane-error]').innerText(), /50 m/);

    // Recommendation import is a single set, does not substitute the owner's PB for other swimmers.
    await page.locator('[data-wk-goal]').selectOption('velocity');
    await page.locator('[data-wk-goal-size]').selectOption('standard');
    await page.locator('[data-wk-goal-lane]').click();
    assert.equal(await page.locator('#wk-lane').isVisible(), true);
    assert.match(await page.locator('[data-lane-context]').innerText(), /原推薦.*組間休息.*先算其中 1 組/);
    assert.deepEqual(await roster(), ['', '', '', '']); assert.deepEqual(await snapshot(), original);

    // Names and purpose stay text, and clipboard denial yields a selectable in-page fallback.
    await demo();
    const payload = '<img src=x onerror="window.laneXss=1">';
    await page.locator('[data-person-field="name"]').first().fill(payload);
    await f('purpose').fill(payload); await compute();
    assert.equal(await page.locator('[data-lane-output] img').count(), 0);
    assert.equal(await page.evaluate(() => window.laneXss), undefined);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
    await page.locator('[data-lane-copy]').click();
    assert.equal(await page.locator('[data-lane-fallback]').isVisible(), true);
    assert.match(await page.locator('[data-lane-copy-text]').inputValue(), /最後一人 12:25/);
    await f('gap').fill('6'); assert.equal(await page.locator('[data-lane-fallback]').isVisible(), false);
    assert.equal(await page.locator('[data-lane-copy-text]').inputValue(), '');

    // A delayed clipboard failure cannot restore an obsolete schedule after an edit.
    await demo(); await compute();
    await page.evaluate(() => { navigator.clipboard.writeText = () => new Promise((resolve, reject) => { window.rejectLaneCopy = reject; }); });
    await page.locator('[data-lane-copy]').click(); await f('reps').fill('5');
    await page.evaluate(() => window.rejectLaneCopy(new Error('late denial')));
    assert.equal(await page.locator('[data-lane-fallback]').isVisible(), false);

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 }); await demo(); await compute(); await overflow();
      assert.ok(await page.locator('[data-lane-form] button[type="submit"]').evaluate(el => el.getBoundingClientRect().height >= 48));
      if (width < 600) assert.ok(await page.locator('[data-lane-output] .wk-tablewrap').evaluate(el => el.scrollWidth > el.clientWidth));
      if (process.env.WORKOUT_SCREENSHOTS) {
        await page.locator('#wk-lane').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(process.env.WORKOUT_SCREENSHOTS, `lane-${width}.png`), fullPage: true });
      }
    }
    await page.locator('[data-person-field="name"]').first().fill('LANE_EPHEMERAL_9472');
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('LANE_EPHEMERAL_9472')), false);
    await page.reload(); await page.locator('#wk-lane').waitFor({ state: 'visible' });
    assert.deepEqual(await roster(), ['', '', '', '']); assert.deepEqual(await snapshot(), original);
    assert.deepEqual(errors, []);
    console.log('PASS shared-lane browser: navigation, imports, manual batches, invalidation, privacy, clipboard, XSS and 320/390/1440px');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
