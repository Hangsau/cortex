/* Run from my-site: node tools/audit_periodization_planner.js [base URL]
 * Requires Python/PyYAML and Playwright (repo module or workspace tools module).
 * Exercises rules from real canonical data, browser behavior and public boundaries. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const api = require('../static/js/vortex-periodization-planner.js');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require(path.resolve(root, '../../tools/node_modules/playwright'))); }
const base = (process.argv[2] || 'http://127.0.0.1:8768/cortex/').replace(/\/?$/, '/');
const destination = path.join(root, 'research/periodization-planner-2026-09-10');
fs.mkdirSync(destination, { recursive: true });
const checks = [];
function check(name, assertion) { assertion(); checks.push(name); }
const guide = JSON.parse(execFileSync('python', ['-X', 'utf8', '-c', `
import json, yaml, sys
from pathlib import Path
sys.path.insert(0, 'tools')
from sync_vortex import unfold_cjk
p = Path('data/periodization')
canonical = Path('../TheVortexProject/canonical/periodization')
def walk(value):
    if isinstance(value, dict):
        if 'id' in value: yield value['id']
        for child in value.values(): yield from walk(child)
    elif isinstance(value, list):
        for child in value: yield from walk(child)
actual = {}
for f in canonical.glob('*.yaml'):
    if f.name.startswith('_'): continue
    data = yaml.safe_load(f.read_text(encoding='utf-8'))
    # Publication removes only the established CJK YAML folding spaces.
    assert unfold_cjk(data) == yaml.safe_load((p / f.name).read_text(encoding='utf-8')), f.name
    for eid in walk(data):
        assert eid not in actual, eid
        actual[eid] = f.name
index = yaml.safe_load((p / '_index.yaml').read_text(encoding='utf-8'))
assert unfold_cjk(yaml.safe_load((canonical / '_index.yaml').read_text(encoding='utf-8'))) == index
indexed = {}
for group, entries in index.items():
    if not isinstance(entries, list): continue
    for e in entries:
        assert e['id'] not in indexed
        assert e['file'] == group + '.yaml', e
        indexed[e['id']] = e['file']
assert indexed == actual, (set(indexed) ^ set(actual))
assert len(actual) == 48
print(json.dumps(yaml.safe_load((p / 'decisions.yaml').read_text(encoding='utf-8')), ensure_ascii=False))
`], { cwd: root, encoding: 'utf8' }));
checks.push('All 48 periodization IDs indexed exactly once in correct file; five canonical files and index equal synced data after CJK publication normalization');
const planner = guide.planner;
const requiredClaims = ['affirmative_conclusion', 'works_when', 'fails_when', 'how_to_identify', 'action', 'remaining_boundary', 'next'];
check('Canonical rule contract and priority fallback', () => {
  assert.equal(planner.cert, '🔵');
  assert.equal(new Set(planner.rules.map(r => r.key)).size, 8);
  planner.rules.forEach((r, index) => {
    requiredClaims.forEach(key => assert.ok(typeof r[key] === 'string' && r[key].length > 0));
    assert.equal(r.when.length === 0, index === planner.rules.length - 1);
    r.when.forEach(condition => {
      const field = planner.fields.find(f => f.key === condition.field);
      assert.ok(field);
      condition.values.forEach(value => assert.ok(field.options.some(o => o.key === value)));
    });
    assert.ok(Object.hasOwn(planner.cadence, r.schedule));
  });
  Object.entries(planner.cadence).forEach(([key, values]) => {
    assert.equal(values.length, key === 'none' ? 0 : 7);
    values.forEach(value => assert.ok(planner.slot_templates[value]));
  });
});
let combinations = 0;
const reached = new Set();
const seed = { ...planner.examples[0].inputs };
function visit(index, input) {
  if (index < planner.fields.length) {
    const field = planner.fields[index];
    for (const option of field.options) visit(index + 1, { ...input, [field.key]: option.key });
    return;
  }
  for (let count = 1; count <= 7; count++) {
    const raw = { ...input, sessions: count };
    const result = api.evaluate(guide, raw);
    const r = result.rule.key;
    reached.add(r);
    const expected = raw.readiness === 'symptoms' ? 'stop' : raw.readiness === 'fatigued' ? 'adjust_today' :
      raw.trend === 'declining' ? 'recover' : raw.event === 'soon' ? 'consolidate' :
      raw.trend === 'unknown' ? 'baseline' : raw.trend === 'transfer' ? 'transfer' :
      raw.trend === 'improving' ? 'progress' : 'maintain';
    assert.equal(r, expected, JSON.stringify(raw));
    assert.equal(result.slots.length, r === 'stop' ? 0 : count);
    const rendered = api.toText(guide, result);
    assert.ok(rendered.includes(result.rule.remaining_boundary));
    assert.ok(rendered.includes(result.rule.next));
    if (r === 'stop') assert.ok(!rendered.includes('下次可沿用的記錄欄'));
    if (r !== 'progress') assert.ok(!rendered.includes('若決定推進，只選一項'));
    combinations++;
  }
}
visit(0, seed);
check('8,820 combinations respect priority, available slots and limitations', () => {
  assert.equal(combinations, 8820);
  assert.equal(reached.size, 8);
});
check('Reject missing/unknown enum, noninteger, blank and out-of-range resources', () => {
  for (const field of planner.fields) for (const value of [undefined, '', '__proto__', 'wrong']) {
    assert.throws(() => api.evaluate(guide, { ...seed, [field.key]: value }));
  }
  for (const key of ['sessions', 'minutes']) for (const value of ['', ' ', 0, -1, 1.5, 'NaN', Infinity, '3e0', '0x3', 9999999]) {
    assert.throws(() => api.evaluate(guide, { ...seed, [key]: value }));
  }
  assert.equal(api.evaluate(guide, { ...seed, minutes: 1 }).input.minutes, 1);
  assert.equal(api.evaluate(guide, { ...seed, minutes: 240 }).input.minutes, 240);
  assert.throws(() => api.evaluate({ ...guide, schema_version: 2 }, seed));
});

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Exercise the manual-copy path without depending on browser clipboard permission.
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('test denied')) } }));
    await page.goto(base + 'vortex/periodization/#planner', { waitUntil: 'networkidle' });
    const host = page.locator('[data-vx-planner]');
    await host.locator('form').waitFor({ state: 'visible' });
    check('Rendered config equals canonical data', () => {});
    assert.deepEqual(JSON.parse(await host.locator('[data-planner-config]').textContent()), guide);
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id));
    check('No duplicate page IDs', () => assert.equal(new Set(ids).size, ids.length));
    const invalidDescriptions = await page.locator('[aria-describedby]').evaluateAll(nodes => nodes.flatMap(n =>
      n.getAttribute('aria-describedby').split(/\s+/).filter(id => !document.getElementById(id))));
    check('All accessible descriptions resolve', () => assert.deepEqual(invalidDescriptions, []));
    await host.locator('button[type=submit]').click();
    assert.equal(await host.locator('[data-planner-result]').isVisible(), false);
    checks.push('Empty form never produces a plan');
    for (const [i, expected] of ['baseline', 'adjust_today', 'transfer'].entries()) {
      const example = planner.examples[i];
      await host.locator('[data-planner-example="' + example.key + '"]').click();
      assert.equal(await host.locator('[data-result-title]').innerText(), planner.rules.find(r => r.key === expected).title);
      assert.equal(await host.locator('.vx-planner-slots li').count(), example.inputs.sessions);
      assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-result-title')), true);
    }
    checks.push('All three examples fill inputs, choose correct branch, focus the result and allocate exact slots');
    await host.locator('[data-copy-plan]').click();
    const copy = await host.locator('[data-copy-fallback]').inputValue();
    assert.ok(copy.includes('規則版本 1.0') && copy.includes('何時重看') && copy.includes('這個判斷的適用範圍'));
    checks.push('Denied clipboard permission provides complete selectable copy');
    await host.locator('[name=readiness]').selectOption('symptoms');
    assert.equal(await host.locator('[data-planner-result]').isVisible(), false);
    await host.locator('button[type=submit]').click();
    assert.equal(await host.locator('[data-result-title]').innerText(), planner.rules[0].title);
    assert.equal(await host.locator('.vx-planner-slots li').count(), 0);
    checks.push('Changed inputs invalidate old result; symptoms suppress all scheduled practice');
    await host.locator('button[type=reset]').click();
    assert.equal(await host.locator('[name=population]').inputValue(), '');
    assert.equal(await host.locator('[data-planner-result]').isVisible(), false);
    checks.push('Reset clears selections and old results');
    await host.locator('[data-planner-example="adult-three"]').click();
    await host.locator('[name=goal_note]').fill('<img src=x onerror="window.bad=true">');
    await host.locator('button[type=submit]').click();
    assert.ok((await host.locator('[data-result-body]').innerText()).includes('<img src=x'));
    assert.equal(await host.locator('[data-result-body] img').count(), 0);
    assert.equal(await page.evaluate(() => window.bad), undefined);
    checks.push('User goal is rendered as text, never executable HTML');
    await host.locator('[data-planner-example="adult-three"]').click();
    await host.locator('[data-planner-result]').screenshot({ path: path.join(destination, 'desktop-result.png'), style: '.site-nav { visibility: hidden !important; }' });

    // Keyboard through all controls, including the static fallback table.
    await host.locator('[name=population]').focus();
    const focusTags = [];
    for (let i = 0; i < 20; i++) {
      focusTags.push(await page.evaluate(() => document.activeElement.tagName));
      await page.keyboard.press('Tab');
    }
    check('Keyboard reaches selects, inputs, buttons and expandable guidance', () => {
      ['SELECT', 'INPUT', 'BUTTON', 'SUMMARY'].forEach(tag => assert.ok(focusTags.includes(tag)));
    });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await host.locator('[data-planner-example="adult-three"]').click();
      const metrics = await page.evaluate(() => ({ w: innerWidth, scroll: document.documentElement.scrollWidth,
        targets: [...document.querySelectorAll('.vx-planner button')].filter(n => !n.hidden).every(n => n.getBoundingClientRect().height >= 44) }));
      assert.ok(metrics.scroll <= metrics.w + 1, JSON.stringify(metrics));
      assert.ok(metrics.targets);
      checks.push(width + 'px: no page overflow; button targets at least 44px');
      if (width === 390) {
        await host.locator('form').screenshot({ path: path.join(destination, 'mobile-form.png'), style: '.site-nav { visibility: hidden !important; }' });
        await host.locator('[data-planner-result]').screenshot({ path: path.join(destination, 'mobile-result.png'), style: '.site-nav { visibility: hidden !important; }' });
      }
    }
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    checks.push('320px with 200% root font has no page overflow');
    // Reload restores type scale and tests direct links into closed research details.
    await page.goto(base + 'vortex/periodization/#periodization.decisions.hrv_response', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#planner-research').getAttribute('open'), '');
    assert.ok(await page.locator('[id="periodization.decisions.hrv_response"] a').getAttribute('href') === 'https://pubmed.ncbi.nlm.nih.gov/41348148/');
    checks.push('Direct research hash opens details and resolves registered primary source');
    await page.goto(base + 'vortex/database/', { waitUntil: 'networkidle' });
    await page.locator('button[data-val=period]').click();
    assert.equal(await page.locator('.vx-find-card[data-type=period]:visible').count(), 5);
    await page.locator('.vx-find-card[data-type=period]').filter({ hasText: '套用週期決策' }).first().locator('summary').click();
    const destinationLink = page.locator('a[href$="/vortex/periodization/#planner"]');
    await destinationLink.click();
    assert.ok(page.url().endsWith('/vortex/periodization/#planner'));
    checks.push('Database lists generated decision entries and navigates to planner');
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const plain = await nojs.newPage();
    await plain.goto(base + 'vortex/periodization/#planner');
    assert.equal(await plain.locator('.vx-planner-form').isVisible(), false);
    await plain.locator('#planner-rules > summary').click();
    assert.equal(await plain.locator('.vx-planner-table tbody tr').count(), 8);
    assert.equal(await plain.locator('.vx-planner-examples article').count(), 3);
    assert.equal(await plain.locator('.vx-planner-table').isVisible(), true);
    checks.push('No JavaScript: native decision table, three examples and monitoring remain usable');
    await nojs.close();
    check('No browser runtime errors', () => assert.deepEqual(errors, []));
    const report = { checkedAt: new Date().toISOString(), base, combinations, checks, pass: true };
    fs.writeFileSync(path.join(destination, base.includes('127.0.0.1') ? 'validation.json' : 'public-validation.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ pass: true, checks: checks.length, combinations, base }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
