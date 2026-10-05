/* Requires playwright-core (NODE_PATH may point to the shared browser harness).
   node tools/test_workout_studio.cjs [studio URL]
   Creates isolated browser storage; never uses the user's browser profile. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:1327/cortex/vortex/workout-studio/';
const oldUrl = new URL('../workout/', url).href;
const output = process.env.WORKOUT_SCREENSHOTS || os.tmpdir();
const oldKey = 'cortex-swim-v2', key = 'cortex-swim-studio-v1';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const errors = [];
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async value => { window.copiedText = value; } }, configurable: true });
  });
  const old = await context.newPage(), page = await context.newPage();
  for (const p of [old, page]) {
    p.on('pageerror', e => errors.push(e.message));
    p.on('dialog', dialog => dialog.accept());
  }
  const state = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  const current = async () => { const s = await state(); return s.menus[s.cur]; };
  const snapshot = () => page.evaluate(() => document.querySelector('[data-wk-studio]').workout.snapshot());
  const until = async predicate => {
    for (let i = 0; i < 100; i++) { if (await predicate()) return; await new Promise(r => setTimeout(r, 20)); }
    assert.fail('asynchronous operation timed out');
  };
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  try {
    await old.goto(oldUrl);
    await old.locator('[data-wk-mname]').fill('原版課表');
    const oldBefore = await old.evaluate(k => localStorage.getItem(k), oldKey);
    await page.goto(url);
    await page.locator('.ws-ready').waitFor();
    assert.equal((await current()).name, '原版課表');
    assert.equal(await page.evaluate(k => localStorage.getItem(k), oldKey), oldBefore);
    assert.equal(await page.locator('[data-ws-start]').isDisabled(), true);
    assert.equal(await page.locator('dialog[open]').count(), 0);
    await page.locator('[data-ws-rename]').click();
    await page.locator('[data-wk-mname]').fill('新版課表');
    await old.locator('[data-wk-mname]').fill('原版仍可獨立修改');
    assert.equal((await current()).name, '新版課表');
    assert.equal(await old.evaluate(k => JSON.parse(localStorage.getItem(k)).menus[0].name, oldKey), '原版仍可獨立修改');
    await page.reload();
    assert.equal((await current()).name, '新版課表');
    console.log('PASS initial import, independent concurrent tabs, persistence and empty state');

    await page.locator('[data-ws-sample]').click();
    assert.equal((await snapshot()).distance, 1200);
    assert.equal((await snapshot()).count, 4);
    await page.locator('[data-ws-add="2"]').click();
    let modal = page.locator('dialog[open]');
    await modal.locator('[data-f="reps"]').fill('2');
    await modal.locator('[data-f="dist"]').fill('25');
    await modal.locator('[data-f="int"]').selectOption('custom');
    await modal.locator('[data-tff="target"] input').fill('2');
    await modal.locator('[data-tff="rest"] input').fill('3');
    await modal.locator('[data-tff="rowRest"] input').fill('6');
    await modal.locator('[data-f="note"]').fill('測試新項目');
    await modal.locator('[data-act="add"]').click();
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal((await snapshot()).distance, 1250);
    assert.equal((await current()).blocks[2].rows[1].rowRest, 6);
    await page.locator('.wk-blk[data-b="2"] .wk-r[data-r="1"] [data-act="edit"]').click();
    modal = page.locator('dialog[open]');
    assert.equal(await modal.locator('[data-tff="rowRest"] input').inputValue(), '6');
    await modal.locator('[data-f="restMode"]').selectOption('sendoff');
    await modal.locator('[data-tff="sendoff"] input').fill('20');
    await modal.locator('[data-tff="rowRest"] input').fill('1:30');
    await modal.locator('[data-act="done"]').click();
    assert.equal((await current()).blocks[2].rows[1].rowRest, 90);
    await page.locator('[data-ws-add="0"]').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal((await snapshot()).count, 5);
    console.log('PASS modal add, edit, dependent controls, item intervals and Escape');

    await page.locator('.wk-blk[data-b="0"] [data-act="down"]').click();
    assert.equal((await current()).blocks[0].rows.length, 0);
    await page.locator('.wk-blk[data-b="1"] .wk-r[data-r="0"] [data-act="up"]').click();
    assert.equal((await current()).blocks[0].rows.length, 1);
    await page.locator('[data-wk-addblk]').click();
    await page.setViewportSize({ width: 1440, height: 2200 });
    await page.locator('.wk-blk[data-b="0"] .ws-drag').dragTo(page.locator('.wk-blk[data-b="4"] .wk-empty'));
    assert.equal((await current()).blocks[0].rows.length, 0);
    assert.equal((await current()).blocks[4].rows.length, 1);
    assert.equal((await snapshot()).distance, 1250);
    await page.setViewportSize({ width: 1440, height: 1000 });
    console.log('PASS accessible ordering and drag across blocks into an empty block');

    await page.locator('[data-ws-tab="pace"]').click();
    assert.equal(await page.locator('#wk-pb').isVisible(), true);
    await page.locator('[data-wk-pb="free:200"] input').fill('3:00');
    await page.locator('[data-wk-pb="free:400"] input').fill('6:20');
    assert.match(await page.locator('[data-wk-css]').textContent(), /CSS 配速/);
    await page.locator('[data-zadd="thr:100"]').click();
    assert.equal(await page.locator('#ws-panel-plan').isVisible(), true);
    const goal = '<img src=x onerror="window.studioXss=1"> 維持動作品質';
    await page.locator('[data-ws-intent]').fill(goal);
    await page.locator('[data-ws-tab="review"]').click();
    assert.equal(await page.locator('[data-ws-goal-text]').textContent(), goal);
    assert.equal(await page.locator('[data-ws-goal-text] img').count(), 0);
    assert.equal(await page.evaluate(() => window.studioXss), undefined);
    await page.locator('[data-ws-ai]').click();
    await until(() => page.evaluate(() => !!window.copiedText));
    const prompt = await page.evaluate(() => copiedText);
    assert.match(prompt, /不要為每份課表硬找優點/);
    const brief = JSON.parse(prompt.slice(prompt.indexOf('{\n')));
    assert.equal(brief.schemaVersion, 1);
    assert.equal(brief.kind, 'vortex.workout.brief');
    assert.equal(brief.goal, goal);
    assert.equal(brief.items.length, (await snapshot()).count);
    assert.equal(brief.menu.blocks[2].rows[1].rowRest, 90);
    assert.equal(brief.pb, undefined);
    assert.equal(brief.source.url, new URL('../periodization/', url).href);
    const downloaded = page.waitForEvent('download');
    await page.locator('[data-ws-export]').click();
    const download = await downloaded;
    const file = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.deepEqual(file, brief);
    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
    await page.locator('[data-ws-ai]').click();
    assert.equal(await page.locator('[data-ws-copy-dialog]').isVisible(), true);
    assert.match(await page.locator('[data-ws-copy-text]').inputValue(), /vortex.workout.brief/);
    await page.locator('[data-ws-copy-close]').click();
    console.log('PASS pace calculation, adding recommendations, escaped intent, AI prompt, JSON and clipboard fallback');

    await page.reload();
    assert.equal(await page.locator('[data-ws-intent]').inputValue(), goal);
    assert.equal(Object.keys((await state()).pb).length, 0);
    await page.locator('[data-ws-tab="review"]').click();
    await page.locator('[data-wk-share]').click();
    await until(() => page.evaluate(() => !!window.copiedText));
    const shared = await page.evaluate(() => copiedText), previous = (await state()).menus.length;
    await page.goto('about:blank'); await page.goto(shared);
    await until(async () => (await state()).menus.length === previous + 1);
    assert.equal((await current()).intent, goal);
    assert.equal((await current()).blocks[2].rows[1].rowRest, 90);
    console.log('PASS independent persistence, PB reset and shared course import');

    // Run a short course in the actual overlay with deterministic browser time.
    await page.evaluate(k => {
      const s = JSON.parse(localStorage.getItem(k));
      s.voice = false;
      s.menus[s.cur] = { name: '短計時測試', blocks: [{ title: '主課', rows: [
        { reps: 1, sets: 1, dist: 25, stroke: 'free', mode: 'swim', int: 'custom', target: 2, rest: 3, rowRest: 6 },
        { reps: 1, sets: 1, dist: 25, stroke: 'back', mode: 'swim', int: 'custom', target: 2, rest: 3, rowRest: 90 },
      ] }] }; localStorage.setItem(k, JSON.stringify(s));
    }, key);
    await page.reload();
    await page.clock.install({ time: new Date('2026-10-05T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-05T12:00:00Z'));
    await page.locator('[data-ws-start]').click();
    await page.locator('[data-wk-skip]').click(); await page.clock.runFor(100);
    assert.equal(await page.locator('[data-wk-t-phase]').textContent(), '游');
    await page.locator('[data-wk-wall]').click(); await page.clock.runFor(100);
    assert.equal(await page.locator('[data-wk-t-phase]').textContent(), '項目間休息');
    await page.locator('[data-wk-pause]').click(); await page.clock.runFor(10000);
    assert.equal(await page.locator('[data-wk-t-clock]').textContent(), '0:06');
    await page.locator('[data-wk-pause]').click(); await page.clock.runFor(6200);
    assert.equal(await page.locator('[data-wk-t-phase]').textContent(), '游');
    await page.locator('[data-wk-wall]').click();
    assert.equal(await page.locator('[data-wk-t-phase]').textContent(), '完成');
    await page.locator('[data-wk-stop]').click();
    console.log('PASS studio timer, pause, item transition and no final rest');

    await page.locator('[data-ws-sample]').click();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      for (const tab of ['plan', 'pace', 'library', 'review']) {
        await page.locator(`[data-ws-tab="${tab}"]`).click(); await noOverflow();
      }
      await page.locator('[data-ws-tab="plan"]').click(); await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(output, `workout-studio-${width}.png`) });
      await page.locator('[data-ws-add="2"]').click(); await noOverflow();
      assert.equal(await page.locator('dialog[open]').evaluate(el => el.scrollWidth <= el.clientWidth), true);
      await page.screenshot({ path: path.join(output, `workout-studio-editor-${width}.png`) });
      await page.keyboard.press('Escape');
    }
    await page.locator('[data-ws-tab="plan"]').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-ws-tab="pace"]').getAttribute('aria-selected'), 'true');
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' }); await noOverflow();
    console.log('PASS all tabs and editor at 320/390/1440, keyboard tabs and dark mode');

    const failedStorage = await context.newPage();
    await failedStorage.addInitScript(k => {
      const save = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) { if (name === k) throw new DOMException('quota', 'QuotaExceededError'); return save.call(this, name, value); };
    }, key);
    await failedStorage.goto(url);
    assert.match(await failedStorage.locator('[data-ws-save]').textContent(), /無法儲存/);
    await failedStorage.locator('[data-ws-rename]').click();
    await failedStorage.locator('[data-wk-mname]').fill('存檔失敗仍可操作');
    assert.match(await failedStorage.locator('[data-ws-save]').textContent(), /無法儲存/);
    await failedStorage.close();
    assert.deepEqual(errors, []);
    console.log('PASS truthful storage failure and no browser exceptions');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
