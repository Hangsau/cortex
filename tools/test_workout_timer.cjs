/* Browser regression checks. Serve a Hugo build first, then run:
   NODE_PATH=<playwright-core module directory> node tools/test_workout_timer.cjs <workout URL>
   Uses system Chrome by default; PLAYWRIGHT_CHANNEL can select another installed channel. */
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:1327/cortex/vortex/workout/';
const key = 'cortex-swim-v3';
const row = (extra = {}) => ({ sets: 1, reps: 1, dist: 50, stroke: 'free', mode: 'swim', int: 'custom', target: 2, rest: 3, ...extra });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.clock.install({ time: new Date('2026-10-05T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-05T00:00:00Z'));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copiedText = text; } }, configurable: true });
  });
  page.on('dialog', dialog => dialog.accept(dialog.type() === 'prompt' ? '間隔測試常用組' : undefined));
  const text = selector => page.locator(selector).textContent();
  const tick = (ms = 100) => page.clock.runFor(ms);
  const click = async selector => {
    if (selector === '[data-wk-start]') selector = '[data-ws-start]';
    if (['[data-wk-copy]', '[data-wk-share]'].includes(selector)) await page.locator('[data-ws-tab="review"]').click();
    await page.locator(selector).click(); await tick();
  };
  const phase = () => text('[data-wk-t-phase]');
  const state = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  const load = async blocks => {
    await page.evaluate(({ key, blocks }) => localStorage.setItem(key, JSON.stringify({
      menus: [{ name: '間隔測試', blocks }], cur: 0, voice: false, autorest: true,
    })), { key, blocks });
    await page.reload();
    await page.locator('.ws-ready').waitFor();
  };
  const start = async () => {
    await click('[data-wk-start]');
    assert.equal(await phase(), '準備');
    await click('[data-wk-skip]');
    assert.equal(await phase(), '游');
  };
  const edit = async () => { await page.locator('[data-ws-tab="plan"]').click(); await click('.wk-blk [data-act="edit"] >> nth=0'); };
  const field = () => page.locator('.wk-r--edit [data-tff="rowRest"] input');
  const until = async predicate => {
    for (let n = 0; n < 100; n++) {
      if (await predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.fail('asynchronous browser operation did not complete');
  };
  try {
    await page.goto(url);
    // Legacy rows retain their final per-rep rest; an explicit interval is saved, shared and copied.
    await load([{ title: '主課', rows: [row(), row({ stroke: 'back' })] }]);
    assert.equal((await state()).menus[0].blocks[0].rows[0].rowRest, null);
    await edit();
    await field().fill('1:30');
    assert.equal((await state()).menus[0].blocks[0].rows[0].rowRest, 90);
    for (const invalid of ['-1', 'Infinity', 'abc', '1:99', '1:2:3', '1e309']) {
      await field().fill(invalid);
      assert.equal(await field().getAttribute('aria-invalid'), 'true');
      assert.equal((await state()).menus[0].blocks[0].rows[0].rowRest, 90);
    }
    await click('.wk-r--edit [data-act="done"]');
    assert.equal(await page.locator('.wk-r--edit').count(), 1, 'invalid input prevents finishing');
    await field().fill('90');
    await click('.wk-r--edit [data-act="done"]');
    assert.match(await text('[data-wk-sum]'), /項目結束後休 1:30/);
    assert.match(await text('[data-wk-total]'), /約 2 分鐘/);
    await click('[data-wk-copy]');
    assert.match(await page.evaluate(() => copiedText), /項目結束後休 1:30/);
    await page.reload();
    await edit();
    assert.equal(await field().inputValue(), '1:30');
    await click('.wk-r--edit [data-act="save"]');
    assert.equal((await state()).lib[0].rows[0].rowRest, 90);
    await click('.wk-r--edit [data-act="done"]');
    await click('[data-wk-share]');
    await until(() => page.evaluate(() => !!window.copiedText));
    const shared = await page.evaluate(() => window.copiedText);
    await page.goto('about:blank');
    await page.goto(shared);
    await until(async () => (await state()).menus.length === 2);
    assert.equal((await state()).menus[1].blocks[0].rows[0].rowRest, 90);
    await edit();
    await field().fill('0');
    await click('.wk-r--edit [data-act="done"]');
    await edit();
    assert.equal(await field().inputValue(), '0');
    await field().fill('');
    assert.equal((await state()).menus[1].blocks[0].rows[0].rowRest, null);
    console.log('PASS editor, invalid input, reload, legacy defaults, summary, copy, library and sharing');

    // Multi-set row: per-rep rest, set rest, then exactly one item interval across empty blocks.
    await load([
      { title: '主課', rows: [row({ sets: 2, reps: 2, setRest: 4, rowRest: 6 })] },
      { title: '空段', rows: [] },
      { title: '緩和', rows: [row({ stroke: 'back', rowRest: 300 })] },
    ]);
    await start();
    for (const expected of ['休息', '組間休息', '休息']) {
      await click('[data-wk-wall]');
      assert.equal(await phase(), expected);
      await click('[data-wk-skip]');
      assert.equal(await phase(), '游');
    }
    await click('[data-wk-wall]');
    assert.equal(await phase(), '項目間休息');
    assert.equal(await text('[data-wk-t-clock]'), '0:06');
    assert.match(await text('[data-wk-t-row]'), /^下一項：.*仰/);
    await click('[data-wk-pause]');
    const paused = await text('[data-wk-t-clock]');
    await tick(10000);
    assert.equal(await text('[data-wk-t-clock]'), paused);
    await click('[data-wk-pause]');
    await click('[data-adj="r:10"]');
    assert.equal(await text('[data-wk-t-clock]'), '0:16');
    assert.equal((await state()).menus[0].blocks[0].rows[0].rowRest, 6, 'live adjustment is temporary');
    await tick(15000);
    assert.equal(await phase(), '項目間休息');
    await tick(1000);
    assert.equal(await phase(), '游');
    await click('[data-wk-wall]');
    assert.equal(await phase(), '完成', 'no rest after last item');
    assert.match(await text('[data-wk-t-drill]'), /項目間隔 \+10 秒/);
    console.log('PASS sets, repetitions, cross-block transition, countdown, pause, adjustment and final item');

    // Explicit item rest replaces send-off remainder. Zero goes straight to the next item.
    for (const rowRest of [6, 0, null]) {
      await load([{ title: '主課', rows: [row({ restMode: 'sendoff', sendoff: 20, rowRest }), row({ stroke: 'back' })] }]);
      await start();
      await tick(2000);
      if (rowRest === 0) assert.equal(await phase(), '游');
      else {
        assert.equal(await phase(), '項目間休息');
        assert.equal(await text('[data-wk-t-clock]'), rowRest === null ? '0:18' : '0:06');
        await click('[data-wk-skip]');
      }
      await tick(); // Paint the new swim after the boundary tick changes phase.
      assert.match(await text('[data-wk-t-row]'), /仰/);
      await click('[data-wk-wall]');
      assert.equal(await phase(), '完成');
    }
    console.log('PASS send-off override, zero interval, inherited send-off and skip');

    await load([{ title: '主課', rows: [row({ brokenEvery: 25, brokenRest: 3, rowRest: 6 }), row()] }]);
    await start();
    await click('[data-wk-wall]');
    assert.equal(await phase(), '分段休息');
    await click('[data-wk-skip]');
    await click('[data-wk-wall]');
    assert.equal(await phase(), '項目間休息');
    await click('[data-wk-stop]');
    await load([{ title: '主課', rows: [row({ reps: 2, stepOn: 'rest', stepSec: 5, rowRest: 6 }), row()] }]);
    await start();
    await click('[data-wk-wall]');
    assert.equal(await text('[data-wk-t-clock]'), '0:03');
    await click('[data-wk-skip]');
    await click('[data-wk-wall]');
    assert.equal(await text('[data-wk-t-clock]'), '0:06', 'progressive rest does not change the item interval');
    await click('[data-wk-stop]');
    for (const bad of [-1, '90', {}, null]) {
      await load([{ title: '主課', rows: [row({ rowRest: bad }), row()] }]);
      assert.equal((await state()).menus[0].blocks[0].rows[0].rowRest, null);
    }
    await start();
    await click('[data-wk-wall]');
    assert.equal(await text('[data-wk-t-clock]'), '0:03', 'legacy fixed rest remains');
    await click('[data-wk-stop]');
    console.log('PASS broken swims, progressive rest and malformed persisted intervals');

    await load([{ title: '主課', rows: [row({ rowRest: 90 }), row()] }]);
    await edit();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no horizontal overflow at ${width}px`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.wk-r--edit').screenshot({ path: process.env.WORKOUT_SCREENSHOT || path.join(os.tmpdir(), 'workout-row-rest-editor.png') });
    await load([{ title: '大量趟數', rows: [row({ sets: 20, reps: 99, dist: 100, brokenEvery: 25, rowRest: 90 }), row()] }]);
    assert.doesNotMatch(await text('[data-wk-total]'), /NaN|Infinity/);
    await start();
    await click('[data-wk-wall]');
    await click('[data-wk-stop]');
    await start();
    assert.match(await text('[data-wk-t-row]'), /第 1\/20 組・第 1\/99 趟・第 1\/4 段/);
    await click('[data-wk-stop]');
    await load([{ title: '空課表', rows: [] }]);
    assert.equal(await page.locator('[data-ws-start]').isDisabled(), true);
    assert.equal(await page.locator('[data-wk-timer]').isHidden(), true);
    assert.deepEqual(errors, []);
    console.log('PASS responsive layouts, large/empty workouts, interrupted restart and browser errors');
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
