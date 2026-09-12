// Run against a built preview or the deployed site. Requires Playwright.
// PROBLEM_BASE_URL must include the /cortex/ base path when deployed there.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.PROBLEM_BASE_URL || 'http://127.0.0.1:8769/cortex/';
const shots = process.env.PROBLEM_SCREENSHOT_DIR;

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto(base + 'vortex/problems/');
    assert.equal(response.status(), 200);
    await page.waitForSelector('[data-vx-problems]');
    const cards = page.locator('.vx-problem-card');
    const shown = () => page.locator('.vx-problem-card:not(.is-hidden)').count();
    const reset = () => page.locator('[data-problem-reset]').click();
    assert.equal(await cards.count(), 73);
    assert.equal(await shown(), 73);
    for (const [stroke, count] of Object.entries({ free: 15, back: 12, breast: 12, fly: 11, udk: 11, 'starts-turns': 12 })) {
      await page.locator(`[data-problem-axis="stroke"] [data-value="${stroke}"]`).click();
      assert.equal(await shown(), count, stroke);
    }
    await reset();
    const categories = await page.locator('[data-problem-axis="category"] button').evaluateAll(nodes => nodes.map(n => n.dataset.value));
    for (const category of categories.filter(c => c !== 'all')) {
      await page.locator(`[data-problem-axis="category"] [data-value="${category}"]`).click();
      assert.equal(await shown(), await page.locator(`.vx-problem-card[data-category="${category}"]`).count());
    }
    await reset();
    await page.locator('[data-problem-has="land"]').check();
    assert.equal(await shown(), 6);
    await page.locator('[data-problem-has="drill"]').check();
    assert.equal(await shown(), await page.locator('.vx-problem-card[data-land="yes"][data-drill="yes"]').count());
    await page.locator('[data-problem-axis="stroke"] [data-value="breast"]').click();
    assert.equal(await shown(), 0);
    assert.ok(await page.locator('[data-problem-empty]').isVisible());
    await reset();
    await page.locator('#vxProblemSearch').fill('無此現象xyz');
    assert.equal(await shown(), 0);
    await page.locator('#vxProblemSearch').fill('抬頭');
    assert.ok(await shown() > 0);
    await reset();
    const first = cards.first();
    await first.locator(':scope > summary').focus();
    await page.keyboard.press('Enter');
    assert.ok(await first.evaluate(e => e.open));
    assert.equal(await first.locator('.vx-problem-column').count(), 4);
    const text = await page.locator('[data-vx-problems]').textContent();
    assert.ok(!/src\.|`|\*\*|map\[|diagnostic|do-not-prescribe|works_when_summary/.test(text));
    assert.equal(await cards.locator('section[aria-label="陸上動作"] .vx-problem-gap').count(), 67);
    assert.equal(await cards.locator('section[aria-label="力學解釋"] .vx-problem-gap').count(), 3);

    // Resolve every unique internal link against real HTTP pages and DOM anchors.
    const links = await cards.locator('a[href]').evaluateAll(nodes => [...new Set(nodes.map(n => n.href))]);
    const byPage = new Map();
    for (const link of links) {
      const url = new URL(link);
      assert.ok(url.pathname.startsWith(new URL(base).pathname));
      const anchor = decodeURIComponent(url.hash.slice(1));
      url.hash = '';
      if (!byPage.has(url.href)) byPage.set(url.href, []);
      byPage.get(url.href).push(anchor);
    }
    for (const [url, anchors] of byPage) {
      const response = await page.request.get(url);
      assert.equal(response.status(), 200, url);
      const html = await response.text();
      const missing = await page.evaluate(({ html, anchors }) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return anchors.filter(id => id && !doc.getElementById(id));
      }, { html, anchors });
      assert.deepEqual(missing, [], url);
    }

    // Hash navigation clears incompatible filters and opens the card.
    const target = 'prob.free.toes-up-kick';
    await page.locator('[data-problem-axis="stroke"] [data-value="breast"]').click();
    await page.evaluate(id => { location.hash = id; }, target);
    await page.waitForFunction(id => document.getElementById(id).open, target);
    assert.ok(await page.locator(`[id="${target}"]`).isVisible());
    assert.equal(await shown(), 73);
    await page.goto(base + 'vortex/problems/?q=' + encodeURIComponent('<img src=x onerror=alert(1)>') + '#' + target);
    assert.ok(await page.locator(`[id="${target}"]`).evaluate(e => e.open));
    assert.equal(await page.locator('[data-vx-problems] img').count(), 0);
    await page.goto(base + 'vortex/problems/#%E0%A4%A');
    await reset();

    // Visible layouts: desktop four columns, tablet two, mobile one; no overflow.
    for (const [width, columns] of [[1440, 4], [1024, 2], [390, 1], [320, 1]]) {
      await page.setViewportSize({ width, height: 1000 });
      await first.evaluate(e => { e.open = true; e.scrollIntoView({ behavior: 'instant', block: 'start' }); });
      const geometry = await first.evaluate(e => ({
        columns: getComputedStyle(e.querySelector('.vx-problem-grid')).gridTemplateColumns.split(' ').length,
        overflow: document.documentElement.scrollWidth - innerWidth
      }));
      assert.equal(geometry.columns, columns, String(width));
      assert.ok(geometry.overflow <= 1, `overflow ${width}: ${geometry.overflow}`);
      if (shots && [1440, 390].includes(width)) {
        fs.mkdirSync(shots, { recursive: true });
        await page.screenshot({ path: path.join(shots, `problems-${width}.png`) });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + 'vortex/database/');
    const entry = page.locator('.vx-find-types a[href$="/vortex/problems/"]');
    assert.match(await entry.textContent(), /問題\s*73/);
    await page.locator('.vx-chip--type[data-val="err"]').click();
    assert.equal(await page.locator('.vx-find-card[data-type="err"]:visible').count(), 104);
    await entry.click();
    assert.equal(await shown(), 73);

    for (const [slug, id] of [['freestyle', 'free.tech.1'], ['backstroke', 'back.err1'], ['breaststroke', 'breast.tech.5'], ['butterfly', 'fly.tech.21'], ['underwater-dolphin-kick', 'udk.tech.4'], ['starts-turns', 'starts-turns.tech.34']]) {
      await page.goto(base + `vortex/${slug}/#${id}`);
      assert.ok(await page.locator(`[id="${id}"]`).evaluate(e => e.open), id);
    }
    await page.goto(base + 'vortex/drills/#Br35');
    assert.ok(await page.locator('#Br35').evaluate(e => e.open));
    await page.locator('#vxNeeds [data-axis="s"] [data-val="back"]').click();
    await page.evaluate(() => { location.hash = 'Fr22'; });
    await page.waitForFunction(() => document.getElementById('Fr22').open);
    assert.ok(await page.locator('#Fr22').isVisible());
    assert.match(await page.locator('#vxNeedsCount').textContent(), /179/);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ pass: true, problems: 73, internalLinks: links.length, targetPages: byPage.size, widths: [1440, 1024, 390, 320] }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
