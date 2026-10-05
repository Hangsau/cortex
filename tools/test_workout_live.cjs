/* Actual browser coverage for migration, reversible timer controls and live edits.
   NODE_PATH=<playwright-core directory> node tools/test_workout_live.cjs [workout URL] */
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:1327/cortex/vortex/workout/';
const key = 'cortex-swim-v3';
const row = (extra = {}) => ({ sets: 1, reps: 3, dist: 50, stroke: 'free', mode: 'swim', int: 'custom', target: 20, rest: 5, setRest: 8, rowRest: 10, ...extra });
const state = (name, rows) => ({ menus: [{ name, blocks: [{ title: '主課', rows }] }], cur: 0, voice: false, autorest: false });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.copied = t; } }, configurable: true });
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    const read = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    const text = s => page.locator(s).textContent();
    const phase = () => text('[data-wk-t-phase]');
    const tick = ms => page.clock.runFor(ms);
    const click = s => page.locator(s).click();
    const field = k => page.locator(`[data-live="${k}"]`);
    const apply = () => click('[data-wk-live-form] button[type="submit"]');
    const load = async (rows, options = {}) => {
      await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key, data: { ...state('池邊測試', rows), ...options } });
      await page.goto(url); await page.locator('.ws-ready').waitFor();
    };
    const start = async () => { await click('[data-ws-start]'); await click('[data-wk-skip]'); };
    const edit = () => click('[data-wk-live-open]');
    const finish = async () => {
      for (let i = 0; i < 100; i++) {
        const p = await phase();
        if (p === '完成') return;
        assert.doesNotMatch(p, /暫停/);
        await click(p === '游' ? '[data-wk-wall]' : '[data-wk-skip]');
      }
      assert.fail('workout did not finish');
    };

    await page.goto(new URL('../', url).href);
    const studio = state('試用課表', [row({ mode: 'drill', drill: 'my:123' })]);
    studio.myDrills = [{ id: '123', name: '試用動作', stroke: 'free', cue: '試用提示', equip: [] }];
    const legacy = state('試用課表', [row({ mode: 'drill', drill: 'my:123', rowRest: 90 })]);
    legacy.myDrills = [{ id: '123', name: '舊版動作', stroke: 'free', cue: '舊版提示', equip: [] }];
    legacy.menus.push({ name: '共同課表', blocks: [{ title: '暖身', rows: [] }] });
    studio.menus.push(structuredClone(legacy.menus[1]));
    legacy.lib = [{ name: '舊常用組', rows: [row({ drill: 'my:123' })] }];
    legacy.pb = { free: { 100: 60 } }; studio.pb = legacy.pb;
    await page.evaluate(({ studio, legacy }) => {
      localStorage.setItem('cortex-swim-studio-v1', JSON.stringify(studio));
      localStorage.setItem('cortex-swim-v2', JSON.stringify(legacy));
    }, { studio, legacy });
    await page.goto(url);
    let saved = await read();
    assert.equal(saved.menus.length, 3);
    assert.equal(saved.menus[saved.cur].name, '試用課表');
    assert.deepEqual(saved.pb, {});
    const migrated = saved.menus.find(m => m.name === '試用課表（原版保留）').blocks[0].rows[0];
    assert.equal(migrated.rowRest, 90);
    assert.notEqual(migrated.drill, 'my:123');
    assert.equal(saved.lib[0].rows[0].drill, migrated.drill);
    assert.equal(saved.myDrills.find(d => 'my:' + d.id === migrated.drill).name, '舊版動作');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('cortex-swim-v2'))), legacy);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('cortex-swim-studio-v1'))), studio);
    await page.reload(); assert.equal((await read()).menus.length, 3);
    await click('[data-ws-tab="review"]'); await click('[data-wk-share]');
    await page.waitForFunction(() => window.copied);
    const shared = new URL(await page.evaluate(() => window.copied));
    shared.pathname = shared.pathname.replace('/workout/', '/workout-studio/'); shared.search = '?from=old-link';
    await page.goto(shared.href);
    await page.waitForFunction(() => !location.hash && location.pathname.endsWith('/workout/'));
    assert.equal(new URL(page.url()).search, '?from=old-link');
    assert.equal((await read()).menus.length, 4);
    console.log('PASS merge both stored versions, duplicate menus, drill collisions, PB reset, old backups and redirect sharing');

    await page.clock.install({ time: new Date('2026-10-05T02:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-05T02:00:00Z'));
    await load([row()]); await start(); await tick(3100);
    const beforeSkip = await text('[data-wk-t-clock]');
    await click('[data-wk-skip]'); await tick(1000);
    assert.match(await text('[data-wk-t-log]'), /手動跳過/);
    const restClock = await text('[data-wk-t-clock]');
    await click('[data-wk-skip]'); await tick(2000);
    await click('[data-wk-undo]');
    assert.match(await phase(), /休息.*已暫停/); assert.equal(await text('[data-wk-t-clock]'), restClock);
    await click('[data-wk-undo]');
    assert.match(await phase(), /游.*已暫停/); assert.equal(await text('[data-wk-t-clock]'), beforeSkip);
    assert.equal(await page.locator('[data-wk-t-log] li').count(), 0);
    await tick(50000); assert.equal(await text('[data-wk-t-clock]'), beforeSkip);
    await click('[data-wk-skip]'); assert.match(await phase(), /休息.*已暫停/);
    await click('[data-wk-undo]'); await click('[data-wk-pause]'); await tick(1000);
    assert.equal(await text('[data-wk-t-clock]'), '0:04.1');
    console.log('PASS consecutive skip undo, original elapsed time, log rollback and paused skip');

    await load([row({ reps: 1, target: 3 })], { autorest: true }); await start(); await tick(1000);
    await click('[data-wk-skip]'); assert.equal(await phase(), '完成');
    await click('[data-wk-undo]'); assert.match(await phase(), /已暫停/);
    assert.equal(await text('[data-wk-t-clock]'), '0:01.0');
    await click('[data-wk-pause]'); await tick(2100); assert.equal(await phase(), '完成');
    assert.equal(await page.locator('[data-wk-t-log] li').count(), 1);
    console.log('PASS undo final skip, restart interval after finish and automatic completion');

    await load([row({ sets: 2 })]); const stored = await read();
    await start(); await tick(2200); await edit(); const pausedClock = await text('[data-wk-t-clock]');
    await tick(60000); assert.equal(await text('[data-wk-t-clock]'), pausedClock);
    await field('sets').fill('3'); await field('reps').fill('2'); await field('dist').fill('25');
    await field('stroke').selectOption('back'); await field('target').fill('12'); await field('rest').fill('2');
    await field('setRest').fill('4'); await field('note').fill('<img src=x onerror="window.liveXss=1">池邊提醒');
    await apply(); assert.equal(await page.locator('[data-wk-live]').isVisible(), false);
    assert.equal(await text('[data-wk-t-clock]'), pausedClock);
    assert.match(await text('[data-wk-t-row]'), /第 1\/3 組・第 1\/2 趟/);
    assert.match(await text('[data-wk-t-row]'), /25 m 仰/);
    assert.match(await text('[data-wk-t-sub]'), /0:12/);
    assert.equal(await page.locator('[data-wk-t-drill] img').count(), 0);
    assert.equal(await page.evaluate(() => window.liveXss), undefined);
    assert.deepEqual(await read(), stored, 'live edits never alter saved course');
    await click('[data-wk-pause]'); await finish();
    assert.equal(await page.locator('[data-wk-t-log] li').count(), 6);
    await click('[data-wk-t-copy]'); assert.match(await page.evaluate(() => window.copied), /臨場修改.*3 組 × 2 × 25/);
    await click('[data-wk-stop]'); await start(); assert.match(await text('[data-wk-t-row]'), /第 1\/2 組・第 1\/3 趟/);
    console.log('PASS live sets/reps/distance/stroke/target/rest/note, immutable saved course, results and restart');

    await load([row({ sets: 2 })]); await start();
    await click('[data-wk-wall]'); await click('[data-wk-skip]'); await tick(1200); await edit();
    const oldLog = await text('[data-wk-t-log]');
    await field('reps').fill('1'); await apply(); assert.match(await text('[data-wk-live-error]'), /2–99/);
    await field('reps').fill('2');
    for (const invalid of ['-1', 'Infinity', '1:99', '1:2:3', 'abc', '999999999999999999999']) {
      await field('rest').fill(invalid); await apply();
      assert.equal(await page.locator('[data-wk-live]').isVisible(), true);
      assert.ok((await text('[data-wk-live-error]')).length);
    }
    await field('rest').fill('0'); await field('sets').fill('1'); await apply();
    assert.equal(await text('[data-wk-t-log]'), oldLog);
    await click('[data-wk-undo]'); assert.match(await text('[data-wk-t-row]'), /第 1\/2 組・第 2\/3 趟/);
    await edit(); await field('reps').fill('9'); await page.keyboard.press('Escape');
    assert.match(await phase(), /已暫停/); await edit(); assert.equal(await field('reps').inputValue(), '3');
    await click('[data-wk-live-cancel]');
    console.log('PASS completed history preservation, input validation, edit undo, Escape and cancel');

    await load([row({ reps: 1, rowRest: 10 }), row({ stroke: 'back', reps: 2 })]); await start(); await click('[data-wk-wall]'); await tick(2000);
    await click('[data-adj="r:10"]'); const gap = await text('[data-wk-t-clock]');
    await edit(); await page.locator('[data-wk-live-row]').selectOption('1'); await field('reps').fill('4'); await apply();
    assert.equal(await text('[data-wk-t-clock]'), gap);
    assert.match(await text('[data-wk-t-row]'), /第 1\/4 趟/);
    await click('[data-wk-pause]'); await click('[data-wk-skip]'); await finish();
    assert.equal(await page.locator('[data-wk-t-log] li').count(), 5);
    console.log('PASS edit a future item during item rest, preserve temporary interval and completed logs');

    // Remove an ongoing rest by reducing the row to the already completed rep.
    await load([row(), row({ reps: 1, stroke: 'back' })]); await start(); await click('[data-wk-wall]'); await edit();
    await field('reps').fill('1'); await field('rowRest').fill('0'); await apply();
    assert.match(await phase(), /游.*已暫停/); assert.match(await text('[data-wk-t-row]'), /仰/);
    assert.equal(await text('[data-wk-t-clock]'), '0:00.0');
    await click('[data-wk-undo]'); assert.match(await phase(), /休息.*已暫停/);
    await load([row()]); await start(); await click('[data-wk-wall]'); await edit(); await field('reps').fill('1'); await apply();
    assert.equal(await phase(), '完成'); await click('[data-wk-undo]'); assert.match(await phase(), /休息.*已暫停/);
    console.log('PASS removing current rest, dropping remaining reps, final completion and undo');

    await load([row({ restMode: 'sendoff', sendoff: 20 })]); await start(); await tick(4000); await click('[data-wk-wall]');
    await edit(); await field('sendoff').fill('30'); await apply();
    assert.equal(await text('[data-wk-t-clock]'), '0:26');
    await tick(30000); assert.equal(await text('[data-wk-t-clock]'), '0:26');
    await click('[data-wk-pause]'); await tick(1000); await click('[data-wk-skip]'); await tick(3000); await click('[data-wk-undo]');
    assert.equal(await text('[data-wk-t-clock]'), '0:25');
    await click('[data-wk-pause]'); await tick(25100); assert.match(await text('[data-wk-t-row]'), /第 2\/3 趟/);
    console.log('PASS live send-off, pause exclusion, undo remaining departure time');

    await load([row({ reps: 1, restMode: 'sendoff', sendoff: 20, rowRest: null }), row({ reps: 1 })]);
    await start(); await tick(4000); await click('[data-wk-wall]'); await click('[data-adj="r:10"]');
    assert.equal(await text('[data-wk-t-clock]'), '0:26');
    await edit(); assert.equal(await field('rowRest').inputValue(), '26'); await field('note').fill('保留剛才加的間隔'); await apply();
    assert.equal(await text('[data-wk-t-clock]'), '0:26');
    console.log('PASS preserve adjusted inherited send-off gap through live edit');

    await load([row({ sets: 2, reps: 2, brokenEvery: 25, brokenRest: 3, stepOn: 'target', stepSec: 2 })]); await start();
    await click('[data-wk-wall]'); await click('[data-wk-skip]'); await tick(1000); await edit();
    await field('dist').fill('25'); await apply(); assert.match(await text('[data-wk-live-error]'), /已完成的 25 m/);
    await field('dist').fill('50'); await field('sets').fill('3'); await field('reps').fill('3'); await apply();
    assert.match(await text('[data-wk-t-row]'), /第 2\/2 段/); assert.equal(await text('[data-wk-t-clock]'), '0:01.0');
    await click('[data-wk-pause]'); await click('[data-wk-wall]'); await click('[data-wk-skip]');
    assert.match(await text('[data-wk-t-sub]'), /0:11/); // 22 sec / 2 segments
    await click('[data-wk-undo]'); await edit(); await field('rest').fill('8'); await apply();
    assert.match(await phase(), /已暫停/);
    console.log('PASS partial broken rep, segment validation, progression and repeated live edits');

    await load([row({ sets: 2, reps: 1 })]); await start(); await click('[data-wk-wall]');
    assert.equal(await phase(), '組間休息'); await edit(); await field('reps').fill('2'); await apply();
    assert.match(await phase(), /^休息.*已暫停/);
    await click('[data-wk-pause]'); await click('[data-wk-skip]'); assert.match(await text('[data-wk-t-row]'), /第 1\/2 組・第 2\/2 趟/);
    console.log('PASS adding reps at a set boundary');

    await load([row({ sets: 20, reps: 99 })]); await click('[data-ws-start]'); await edit();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.locator('[data-wk-live]').evaluate(el => el.scrollWidth <= el.clientWidth), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (width === 390) await page.screenshot({ path: path.join(process.env.WORKOUT_SCREENSHOTS || os.tmpdir(), 'workout-live-editor.png') });
    }
    await field('sets').fill('1'); await field('reps').fill('1'); await apply();
    assert.match(await phase(), /準備.*已暫停/); await click('[data-wk-undo]'); await click('[data-wk-pause]'); await click('[data-wk-skip]');
    assert.match(await text('[data-wk-t-row]'), /第 1\/20 組・第 1\/99 趟/);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-wk-timer]').evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: path.join(process.env.WORKOUT_SCREENSHOTS || os.tmpdir(), 'workout-live-timer.png') });
    await click('[data-wk-stop]'); await load([]);
    assert.equal(await page.locator('[data-ws-start]').isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log('PASS ready edits, large and empty courses, 320/390/1440 dialog, no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
