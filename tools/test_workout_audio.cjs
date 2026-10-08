/* Browser timing and audio API contract tests; not a physical speaker / iOS device test. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:13380/cortex/vortex/workout/';
const row = extra => ({ sets: 1, reps: 3, dist: 50, stroke: 'free', mode: 'swim', int: 'custom', target: 5, rest: 5, setRest: 8, rowRest: null, restMode: 'sendoff', sendoff: 20, ...extra });
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-08T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-08T00:00:00Z'));
    await page.addInitScript(() => {
      const p = window.audioProbe = { tones: [], contexts: [], speech: [], fail: false, hang: false, unavailable: false };
      class Context {
        constructor() { if (p.unavailable) throw Error('Audio unavailable'); this.state = 'suspended'; this.destination = {}; this.resumes = 0; p.contexts.push(this); }
        get currentTime() { return performance.now() / 1000; }
        change(state) { this.state = state; this.onstatechange?.(); }
        resume() { this.resumes++; if (p.hang) return new Promise(() => {}); if (p.fail) return Promise.reject(Error('Not allowed')); this.change('running'); return Promise.resolve(); }
        close() { this.change('closed'); return Promise.resolve(); }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
        createOscillator() {
          const context = this;
          return { frequency: { value: 0 }, connect(dest) { return dest; }, disconnect() {},
            start(at) { this.event = { frequency: this.frequency.value, at, fired: performance.now() / 1000, state: context.state, cancelled: false }; p.tones.push(this.event); },
            stop(at) { if (this.event && (at == null || at <= context.currentTime)) this.event.cancelled = true; },
          };
        }
      }
      window.AudioContext = window.webkitAudioContext = Context;
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() { p.speech.push('cancel'); }, speak(u) { p.speech.push(u.text); } } });
      window.SpeechSynthesisUtterance = function(text) { this.text = text; };
      window.addEventListener('unhandledrejection', e => { p.rejection = String(e.reason); });
    });
    const click = s => page.locator(s).click(), tick = ms => page.clock.runFor(ms);
    const phase = () => page.locator('[data-wk-t-phase]').textContent();
    const tones = frequency => page.evaluate(f => window.audioProbe.tones.filter(t => t.frequency === f).length, frequency);
    const reset = () => page.evaluate(() => { window.audioProbe.tones = []; });
    const load = async (rows = [row()], options = {}) => {
      await page.evaluate(({ rows, options }) => localStorage.setItem('cortex-swim-v3', JSON.stringify({ menus: [{ name: '聲音驗收', blocks: [{ title: '主課', rows }] }], cur: 0, autorest: false, voice: false, ...options })), { rows, options });
      await page.goto(url); await page.locator('.ws-ready').waitFor();
    };
    const start = async () => { await click('[data-ws-start]'); await click('[data-wk-skip]'); await reset(); };
    await page.goto(url); await load();
    await click('[data-ws-start]'); await reset(); await tick(10100);
    assert.equal(await tones(880), 3); assert.equal(await tones(1320), 1); assert.equal(await phase(), '游');
    await load(); await start(); await tick(20100);
    assert.equal(await tones(880), 3); assert.equal(await tones(1320), 1);
    console.log('PASS ready and fixed send-off emit three countdown cues and one departure');

    await load(); await start(); await tick(18500); await click('[data-wk-wall]'); await tick(1600);
    assert.equal(await tones(880), 3, 'late wall must not replay countdown seconds already heard during swimming');
    assert.equal(await tones(1320), 1);
    await load([row()], { autorest: true }); await start(); await tick(20100);
    assert.equal(await tones(880), 3); assert.equal(await tones(1320), 1);
    await load([row({ restMode: 'rest', rest: 2 })]); await start(); await click('[data-wk-wall]'); await tick(2100);
    assert.equal(await tones(880), 2, 'two-second rest must not burst an obsolete three-second cue');
    assert.equal(await tones(1320), 1);
    console.log('PASS manual/automatic arrival and short rests preserve one cue per remaining second');

    for (const rows of [[row({ sets: 2, reps: 1, sendoff: 5, setRest: 5 })], [row({ reps: 1, sendoff: 5, rowRest: 5 }), row()]]) {
      await load(rows); await start(); await tick(5100);
      assert.equal(await tones(880), 0, 'a set/item break boundary is not a departure');
      assert.match(await phase(), /組間休息|項目間休息/);
      await tick(5000); assert.equal(await tones(880), 3); assert.equal(await tones(1320), 1);
    }
    await load([row({ dist: 100, target: 10, brokenEvery: 50, brokenRest: 2 })], { autorest: true });
    await start(); await tick(20100);
    assert.equal(await tones(880), 5); assert.equal(await tones(1320), 2);
    console.log('PASS set/item rest overrides and broken swims announce actual departures');

    await load(); await start(); await tick(18500); await click('[data-adj="r:10"]'); await tick(11600);
    assert.equal(await tones(880), 5, 'extending a send-off while swimming must re-arm 3, 2, 1');
    assert.equal(await tones(1320), 1);
    await load(); await start(); await tick(17000); await click('[data-wk-pause]');
    const beforePause = await tones(880); await tick(20000); assert.equal(await tones(880), beforePause);
    await page.evaluate(() => window.audioProbe.contexts.at(-1).change('interrupted'));
    const resumes = await page.evaluate(() => window.audioProbe.contexts.at(-1).resumes);
    await click('[data-wk-pause]');
    assert.ok(await page.evaluate(n => window.audioProbe.contexts.at(-1).resumes > n, resumes), 'continue must attempt audio recovery');
    await tick(3100); assert.equal(await tones(880), 3); assert.equal(await tones(1320), 1);
    console.log('PASS adjusted intervals re-arm cues; pause excludes elapsed time and continue restores audio');

    await load([row({ reps: 1 })]); await start(); await click('[data-wk-pause]'); await reset(); await click('[data-wk-skip]');
    assert.equal(await phase(), '完成'); assert.equal(await page.evaluate(() => window.audioProbe.tones.length), 0, 'finishing by a paused edit/skip stays silent');
    await load(); await start(); await tick(17000); await click('[data-wk-pause]');
    assert.ok(await page.evaluate(() => window.audioProbe.tones.filter(t => t.frequency === 880).every(t => t.cancelled)));
    await click('[data-wk-stop]'); assert.equal(await page.locator('[data-wk-timer]').isVisible(), false);

    await load(); await page.evaluate(() => { window.audioProbe.fail = true; }); await click('[data-ws-start]'); await tick(100);
    assert.equal(await page.evaluate(() => window.audioProbe.rejection), undefined);
    assert.match(await page.locator('[data-wk-timer] [data-wk-audio-status]').innerText(), /未啟用|中斷|無法/);
    await page.evaluate(() => { window.audioProbe.fail = false; }); await click('[data-wk-timer] [data-wk-audio-test]');
    assert.equal(await page.evaluate(() => window.audioProbe.contexts.at(-1).state), 'running');
    assert.equal(await tones(880), 1); assert.equal(await tones(1320), 1);
    await page.evaluate(() => { window.audioProbe.hang = true; window.audioProbe.contexts.at(-1).change('interrupted'); });
    await click('[data-wk-pause]'); await click('[data-wk-pause]');
    await page.evaluate(() => { window.audioProbe.hang = false; }); await click('[data-wk-timer] [data-wk-audio-test]');
    assert.equal(await page.evaluate(() => window.audioProbe.contexts.at(-1).state), 'running');
    await click('[data-wk-stop]');
    assert.ok(await page.evaluate(() => window.audioProbe.tones.every(t => t.cancelled)));
    await load(); await page.evaluate(() => { window.audioProbe.unavailable = true; });
    await click('[data-ws-start]'); await tick(10100);
    assert.equal(await phase(), '游');
    assert.match(await page.locator('[data-wk-timer] [data-wk-audio-status]').innerText(), /無法/);
    assert.equal(await page.evaluate(() => window.audioProbe.tones.length), 0);
    console.log('PASS unavailable/rejected/hung audio recovery, test cues and cancellation after pause/close');

    await load([row({ restMode: 'rest', rest: 5 })]); await start(); await page.evaluate(() => { window.audioProbe.contexts.at(-1).change('suspended'); });
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    assert.equal(await page.evaluate(() => window.audioProbe.contexts.at(-1).state), 'running');
    assert.deepEqual(errors, []);
    console.log('PASS foreground audio recovery and no browser/unhandled promise errors');
    await page.close();

    // Separate, real Web Audio context: mocks above cannot prove browser activation succeeds.
    const native = await browser.newPage({ viewport: { width: 390, height: 844 } });
    native.on('pageerror', e => errors.push(e.message));
    await native.addInitScript(() => {
      const Original = window.AudioContext;
      window.AudioContext = class extends Original { constructor(...args) { super(...args); window.nativeAudioProbe = this; } };
    });
    await native.goto(url); await native.locator('[data-ws-tab="review"]').click();
    await native.locator('[data-wk] [data-wk-audio-test]').click();
    await native.waitForFunction(() => window.nativeAudioProbe?.state === 'running');
    const audioTime = await native.evaluate(() => window.nativeAudioProbe.currentTime);
    await native.waitForFunction(t => window.nativeAudioProbe.currentTime > t, audioTime);
    for (const width of [320, 390, 1440]) {
      await native.setViewportSize({ width, height: 844 });
      assert.equal(await native.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    assert.deepEqual(errors, []);
    console.log('PASS native Chrome AudioContext activation/clock and responsive sound-test control');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
