/* node tools/test_workout_draw.cjs [URL]; 抽主課泳式：段落來源、抽完拿掉／放回、固定、加入課表、動畫、窄螢幕。isolated browser storage only. */
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:1327/cortex/vortex/workout/';
const output = process.env.WORKOUT_SCREENSHOTS || os.tmpdir();
const ZH = { 自由式: 'free', 仰式: 'back', 蛙式: 'breast', 蝶式: 'fly' };

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const errors = [];
  async function fresh(opts = {}) {
    const context = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 1000 } }, opts));
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.locator('[data-ws-tab="plan"]').click();
    await page.locator('[data-ws-recommend]').click();
    await page.locator('#wk-draw > summary').click();
    return { context, page };
  }
  const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('cortex-swim-v3')));
  const rows = async page => { const s = await state(page); return s.menus[s.cur].blocks.flatMap(b => b.rows); };
  const faces = async page => (await page.locator('[data-draw-card] [data-draw-face] b').allInnerTexts()).map(t => ZH[t.trim()]);
  const go = async page => { await page.locator('[data-draw-go]').click(); await page.waitForFunction(() => /抽到/.test(document.querySelector('[data-draw-live]').textContent), null, { timeout: 8000 }); };
  const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal scroll');

  try {
    // 減少動態：結果立即出現，方便大量重抽驗證規則
    let { context, page } = await fresh({ reducedMotion: 'reduce' });
    assert.match(await page.locator('[data-wk-draw-body]').innerText(), /還沒有比賽日期/, 'cycle mode without race date explains');
    assert.equal(await page.locator('[data-draw-deck]').count(), 0);

    // 自訂：預設三段，抽完拿掉 → 同一輪不重複
    await page.locator('[data-draw-src="custom"]').click();
    assert.equal(await page.locator('[data-draw-card]').count(), 3);
    for (let k = 0; k < 12; k++) {
      await go(page);
      const f = await faces(page);
      assert.equal(f.length, 3); assert.equal(new Set(f).size, 3, `remove mode no repeats: ${f}`);
    }
    // 六段、籤筒只放自由式＋仰式、抽完拿掉 → 每兩段一輪，輪內不重複
    for (let k = 0; k < 3; k++) await page.locator('[data-draw-addslot]').click();
    assert.equal(await page.locator('[data-draw-card]').count(), 6);
    assert.equal(await page.locator('[data-draw-addslot]').count(), 0, 'max six segments');
    await page.locator('[data-draw-pool="breast"]').click(); await page.locator('[data-draw-pool="fly"]').click();
    for (let k = 0; k < 6; k++) {
      await go(page);
      const f = await faces(page);
      for (let i = 0; i < 6; i += 2) assert.notEqual(f[i], f[i + 1], `round ${i / 2} distinct: ${f}`);
      assert.ok(f.every(s => s === 'free' || s === 'back'));
    }
    // 抽完放回：籤筒只剩自由式 → 全部自由式（重複允許）
    await page.locator('[data-draw-mode="replace"]').click();
    await page.locator('[data-draw-pool="back"]').click();
    await go(page);
    assert.deepEqual(await faces(page), Array(6).fill('free'));
    // 籤筒空了 → 不能抽；全部固定後可以
    await page.locator('[data-draw-pool="free"]').click();
    assert.equal(await page.locator('[data-draw-go]').isDisabled(), true);
    assert.match(await page.locator('[data-wk-draw-body]').innerText(), /籤筒是空的/);
    for (let k = 0; k < 3; k++) await page.locator('[data-draw-del="0"]').click();
    for (let i = 0; i < 3; i++) await page.locator(`[data-draw-lock="${i}"]`).selectOption(['fly', 'back', 'fly'][i]);
    assert.equal(await page.locator('[data-draw-go]').isDisabled(), false);
    await go(page);
    assert.deepEqual(await faces(page), ['fly', 'back', 'fly']);
    await context.close();

    // 固定 + 抽完拿掉：固定的那式不會再被抽到；加入主課沿用既有產生器與成績
    ({ context, page } = await fresh({ reducedMotion: 'reduce' }));
    for (const [d, v] of [[25, '12.5'], [50, '28'], [100, '60'], [200, '150'], [400, '320']]) await page.locator(`[data-wk-pb="free:${d}"] input`).fill(v);
    await page.locator('[data-wk-pb="free:400"] input').press('Tab');
    await page.locator('[data-draw-src="custom"]').click();
    await page.locator('[data-draw-lock="1"]').selectOption('free');
    for (let k = 0; k < 8; k++) {
      await go(page);
      const f = await faces(page);
      assert.equal(f[1], 'free'); assert.ok(!f.includes('free', 2) && f[0] !== 'free', `locked stroke removed from bag: ${f}`);
    }
    assert.match(await page.locator('[data-draw-card="1"] .wk-card-out').innerText(), /目標 2:50/, 'threshold free target from PBs (170 s)');
    const before = await rows(page), drawn = await faces(page);
    await page.locator('[data-draw-add]').click();
    assert.equal(await page.locator('#ws-tab-plan').getAttribute('aria-selected'), 'true');
    const after = await rows(page), added = after.slice(before.length);
    assert.deepEqual(after.slice(0, before.length), before, 'existing rows untouched');
    assert.deepEqual(added.map(r => r.stroke), drawn);
    assert.deepEqual(added.map(r => r.int), ['sprint', 'thr', 'easy']);
    const brief = await page.evaluate(() => document.querySelector('[data-wk]').workout.brief());
    assert.equal(brief.items.at(-2).targetSeconds, 170);
    // 另建課表
    await page.locator('[data-ws-tab="pace"]').click();
    const n = (await state(page)).menus.length;
    await page.locator('[data-draw-new]').click();
    const s = await state(page);
    assert.equal(s.menus.length, n + 1); assert.match(s.menus[s.cur].name, /^抽籤・/);
    assert.equal(s.menus[s.cur].blocks.find(b => b.title === '主課').rows.length, 3);
    assert.equal(s.menus[s.cur].blocks.find(b => b.title === 'Drill').rows.length, 0, 'drill left for the user');

    // 自選週期：專項準備第 1 堂＝賽速一段；第 2 堂＝速耐；過渡期＝輕鬆游
    await page.locator('[data-ws-tab="pace"]').click();
    await page.locator('[data-draw-src="phase"]').click();
    await page.locator('[data-draw-phase]').selectOption('specific_prep');
    assert.deepEqual(await page.locator('.wk-card-k').allInnerTexts(), ['第 1 段・賽速重複']);
    await page.locator('[data-draw-day]').selectOption('1');
    assert.equal(await page.locator('[data-draw-card]').count(), 1);
    await page.locator('[data-draw-phase]').selectOption('general_prep');
    await page.locator('[data-draw-day]').selectOption('0');
    assert.equal(await page.locator('[data-draw-card]').count(), 2, 'general prep: velocity + threshold');
    await page.locator('[data-draw-tocustom]').click();
    assert.deepEqual(await page.locator('[data-draw-goal]').evaluateAll(els => els.map(e => e.value)), ['velocity', 'threshold']);
    await page.locator('[data-draw-src="phase"]').click();
    await page.locator('[data-draw-phase]').selectOption('transition');
    assert.match(await page.locator('[data-wk-draw-body]').innerText(), /過渡期只排輕鬆游/);

    // 依賽事週期：填日期後讀 pzPhase
    const race = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
    await page.locator('[data-wk-race]').fill(race); await page.locator('[data-wk-race]').press('Tab');
    await page.locator('[data-draw-src="cycle"]').click();
    assert.match(await page.locator('[data-wk-draw-body]').innerText(), /現在是 .+期，離比賽 \d+ 天/);
    assert.ok(await page.locator('[data-draw-card]').count() >= 1);
    await context.close();

    // 動畫：洗牌 → 依序翻開；期間控制項鎖住；卡面有插圖
    ({ context, page } = await fresh());
    await page.locator('[data-draw-src="custom"]').click();
    await page.locator('[data-draw-go]').click();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('[data-draw-deck].is-shuffling').count(), 1);
    assert.equal(await page.locator('[data-draw-add]').isDisabled(), true, 'locked while animating');
    await page.waitForFunction(() => document.querySelectorAll('.wk-card.is-up').length === 1, null, { timeout: 3000 });
    await page.screenshot({ path: path.join(output, 'workout-draw-mid.png') });
    await page.waitForFunction(() => /抽到/.test(document.querySelector('[data-draw-live]').textContent), null, { timeout: 5000 });
    assert.equal(await page.locator('.wk-card.is-up').count(), 3);
    assert.equal(await page.locator('[data-draw-go]').evaluate(el => el === document.activeElement), true, 'focus returns to draw button');
    const imgs = await page.locator('.wk-card-face img').evaluateAll(els => els.map(e => e.complete && e.naturalWidth > 0));
    assert.ok(imgs.length === 3 && imgs.every(Boolean), 'card art loads');
    await page.locator('#wk-draw').screenshot({ path: path.join(output, 'workout-draw-1440.png') });
    for (const w of [320, 390]) {
      await page.setViewportSize({ width: w, height: 900 });
      await noOverflow(page);
      await page.locator('#wk-draw').screenshot({ path: path.join(output, `workout-draw-${w}.png`) });
    }
    await context.close();

    // 深連結直接開抽籤
    ({ context, page } = await (async () => { const c = await browser.newContext(); const p = await c.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(url + '#wk-draw'); return { context: c, page: p }; })());
    assert.equal(await page.locator('#wk-draw').evaluate(el => el.open), true);
    assert.equal(await page.locator('#ws-tab-pace').getAttribute('aria-selected'), 'true');
    await context.close();

    assert.deepEqual(errors, []);
    console.log('workout draw: PASS');
  } catch (e) {
    console.error(e); process.exitCode = 1;
  } finally { await browser.close(); }
})();
