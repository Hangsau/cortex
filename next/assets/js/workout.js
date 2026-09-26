/* 課表與間歇計時（Claude 手寫，2026-09-26）
   處方數字來自頁內 #wk-rules（swim-coach 規則表同步）；輸入存本機 localStorage('cortex-swim-v1')。
   CSS 換算優先序（每一種都標方法、確定性與誤差方向）：
     200＋400 兩點（規則表方法）＞ 只有 400（+4.5 秒／100 m，業界慣例）＞ 只有 200（Riegel 外推）
     ＞ 50＋100（個人疲勞指數外推；使用者 2026-09-26 指示，規則表原為禁止）＞ 單一 50／100（Riegel 外推） */
(() => {
  'use strict';
  const root = document.querySelector('[data-wk]');
  if (!root) return;
  const R = JSON.parse(document.getElementById('wk-rules').textContent);
  const KEY = 'cortex-swim-v1';
  const $ = (s) => root.querySelector(s);
  const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const S = Object.assign({ stroke: 'free', pb: {}, pct: 95, sdist: '50', plan: [], autorest: true }, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { /* 無儲存空間時照常計算 */ } };

  /* ---------- 時間格式 ---------- */
  const parseT = (s) => {
    s = String(s || '').trim().replace('：', ':');
    if (!s) return null;
    let v;
    if (s.includes(':')) { const [m, x] = s.split(':'); v = (+m) * 60 + (+x); } else v = +s;
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  const fmt = (t, dec = 1) => {
    if (t == null || !Number.isFinite(t)) return '—';
    const neg = t < 0;
    const total = +Math.abs(t).toFixed(dec);
    const m = Math.floor(total / 60);
    const [si, sf] = (total - m * 60).toFixed(dec).split('.');
    return (neg ? '−' : '') + m + ':' + si.padStart(2, '0') + (sf ? '.' + sf : '');
  };
  const fmt0 = (t) => fmt(Math.round(t), 0);

  /* ---------- CSS 換算 ---------- */
  const RIEGEL = 1.06; // Riegel 1981（跑步耐力模型）
  function css() {
    const t = {}; [50, 100, 200, 400].forEach(d => { t[d] = parseT(S.pb[d]); });
    const fromPair = (a, ta, b, tb) => 100 / ((b - a) / (tb - ta));
    if (t[200] && t[400] && t[400] > t[200]) {
      return { pace: fromPair(200, t[200], 400, t[400]), label: '200 m＋400 m 兩筆（規則表方法）', grade: 'ok',
        how: `CSS 速度 ＝ (400 − 200) ÷ (${fmt(t[400])} − ${fmt(t[200])})`, warn: [R.css.pair_bias_note_zh] };
    }
    if (t[400]) {
      return { pace: t[400] / 4 + 4.5, label: '只有 400 m：400 配速 ＋ 4.5 秒／100 m', grade: 'mid',
        how: `${fmt(t[400] / 4)}／100 m ＋ 4.5 秒`, warn: [`${R.css.practice_shortcut.certainty}：${R.css.practice_shortcut.source}。補測 200 m 就能改用兩筆算法。`] };
    }
    const k = (t[50] && t[100] && t[100] > t[50]) ? Math.log(t[100] / t[50]) / Math.LN2 : null;
    const extrap = (d0, t0, e) => { const T200 = t0 * Math.pow(200 / d0, e), T400 = t0 * Math.pow(400 / d0, e); return { T200, T400, pace: fromPair(200, T200, 400, T400) }; };
    if (t[200]) {
      const x = extrap(200, t[200], RIEGEL);
      return { pace: x.pace, label: '只有 200 m：Riegel 公式外推 400 m', grade: 'low',
        how: `推估 400 m ≈ ${fmt(x.T400)}（指數 ${RIEGEL}）`, warn: ['Riegel 公式來自跑步，用在游泳的準確度未經驗證；補測 400 m 就能改用兩筆算法。'] };
    }
    if (k) {
      const kk = Math.min(Math.max(k, 1.02), 1.25);
      const x = extrap(100, t[100], kk);
      const w = ['短距離成績推出來的耐力配速會<b>偏快</b>，出發間隔要往<b>寬鬆</b>的方向修。規則表原本禁止這種換算（' + esc(R.css.single_forbidden_zh.split('\n')[0]) + '），此處依你 2026-09-26 的指示提供。'];
      if (kk !== k) w.push(`你的 50／100 疲勞指數 ${k.toFixed(3)} 超出常見範圍，已限制在 ${kk.toFixed(2)} 計算。`);
      return { pace: x.pace, label: '50 m＋100 m：個人疲勞指數外推', grade: 'low',
        how: `疲勞指數 ${kk.toFixed(3)}；推估 200 m ≈ ${fmt(x.T200)}、400 m ≈ ${fmt(x.T400)}`, warn: w };
    }
    const d0 = t[100] ? 100 : (t[50] ? 50 : null);
    if (d0) {
      const x = extrap(d0, t[d0], RIEGEL);
      return { pace: x.pace, label: `只有 ${d0} m：Riegel 公式外推（確定性最低）`, grade: 'low',
        how: `推估 200 m ≈ ${fmt(x.T200)}、400 m ≈ ${fmt(x.T400)}（指數 ${RIEGEL}）`,
        warn: ['只用一筆短距離成績推耐力配速，誤差最大而且會<b>偏快</b>；規則表的做法是補測 200 m 與 400 m。', '還沒補測前，也可以先用感覺判斷強度：' + R.css.perceived_anchors_zh.map(esc).join('；') + '。'] };
    }
    return null;
  }

  /* ---------- 衝刺：某距離的 PB（沒有就估） ---------- */
  function pbFor(d) {
    const own = parseT(S.pb[d]);
    if (own) return { t: own, est: false };
    const t = {}; [50, 100, 200, 400].forEach(x => { t[x] = parseT(S.pb[x]); });
    const k = (t[50] && t[100] && t[100] > t[50]) ? Math.log(t[100] / t[50]) / Math.LN2 : RIEGEL;
    const ref = [50, 100, 200, 400].filter(x => t[x]).sort((a, b) => Math.abs(Math.log(a / d)) - Math.abs(Math.log(b / d)))[0];
    if (!ref) return null;
    return { t: t[ref] * Math.pow(d / ref, k), est: true, from: ref };
  }

  const ROWS = [
    { key: 'main_technique', name: '技術組', zone: '不掛能量分區' },
    { key: 'main_endurance', name: '耐力組', zone: 'En-2 閾值有氧' },
    { key: 'main_speed', name: '速度組', zone: '偏快的主組' },
  ];
  const RND = R.send_off_rounding_sec || 5;
  const sendOff = (sec) => Math.ceil(sec / RND) * RND;

  function renderCss() {
    const box = $('[data-wk-css]');
    const c = css();
    if (!c) { box.innerHTML = '<p class="muted">填入至少一筆成績後，這裡會算出 CSS 與各強度每趟的目標秒數。</p>'; return; }
    const grade = { ok: '依規則', mid: '業界慣例', low: '低確定性' }[c.grade];
    let html = `<div class="wk-css"><p class="wk-css-k">CSS 配速</p><p class="wk-css-v">${fmt(c.pace)}<span>／100 m</span></p>
      <p class="wk-css-m"><span class="wk-grade wk-grade--${c.grade}">${grade}</span>${esc(c.label)}</p><p class="muted">${esc(c.how)}</p>
      ${c.warn.map(w => `<p class="wk-warn">${w}</p>`).join('')}</div>`;
    html += '<div class="wk-tablewrap"><table class="wk-table"><thead><tr><th scope="col">強度</th>' +
      [50, 100, 200].map(d => `<th scope="col">${d} m</th>`).join('') + '</tr></thead><tbody>';
    ROWS.forEach(row => {
      const off = R.pace_offset_sec_per_100[row.key] || 0;
      const rest = R.rest_seconds[row.key];
      html += `<tr><th scope="row">${row.name}<span>${row.zone}<br>每 100 m ${off > 0 ? '+' : ''}${off} 秒、休息 ${rest.min}–${rest.max} 秒</span></th>`;
      [50, 100, 200].forEach(d => {
        const tg = (c.pace + off) * d / 100;
        html += `<td><b>${fmt(tg)}</b><span>出發 ${fmt0(sendOff(tg + rest.min))}–${fmt0(sendOff(tg + rest.max))}</span>
          <button type="button" class="wk-add" data-add='${JSON.stringify({ label: row.name, dist: d, target: +tg.toFixed(1), rest: Math.round((rest.min + rest.max) / 2 / 5) * 5, zone: row.key })}'>加入</button></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    const en2 = R.zones['En-2'];
    html += `<p class="muted">耐力組依 ${esc(en2.name_zh)}：休息不超過游的時間、超過 100 m 的重複休息要少於游的時間一半；整組約 ${en2.set_duration_min[0]}–${en2.set_duration_min[1]} 分鐘。技術／耐力／速度三段的配速加減與休息秒數是教練判斷，沒有文獻依據。</p>`;
    box.innerHTML = html;
  }

  function renderSprint() {
    const box = $('[data-wk-sprint]');
    const d = +S.sdist;
    $('[data-wk-pctv]').textContent = S.pct;
    const p = pbFor(d);
    if (!p) { box.innerHTML = '<p class="muted">先在 ① 填至少一筆成績。</p>'; return; }
    const tg = p.t / (S.pct / 100);
    const sp = R.zones.Sp;
    const rr = sp.rest_sec_by_distance[String(d)], rp = sp.reps_by_distance[String(d)];
    const restDef = rr ? Math.round((rr[0] + rr[1]) / 2 / 30) * 30 : 180;
    const repsDef = rp ? Math.round((rp[0] + rp[1]) / 2) : 4;
    const pcts = [80, 85, 88, 90, 92, 95, 98, 100];
    let html = `<div class="wk-sp"><p class="wk-css-k">${d} m 目標</p><p class="wk-sp-v">${fmt(tg)}</p>
      <p class="muted">${p.est ? `你沒有 ${d} m 成績，由 ${p.from} m 推估 PB ≈ ${fmt(p.t)}（估計值）` : `PB ${fmt(p.t)}`} ÷ ${S.pct}%</p></div>
      <div class="wk-quick" role="list" aria-label="速查">${pcts.map(x => `<button type="button" role="listitem" class="wk-q${x === +S.pct ? ' is-on' : ''}" data-pct="${x}"><span>${x}%</span><b>${fmt(p.t / (x / 100))}</b></button>`).join('')}</div>`;
    if (rr) html += `<p class="wk-note"><b>${esc(sp.name_zh)}的休息：</b>${d} m 休 ${fmt0(rr[0])}–${fmt0(rr[1])}，做 ${rp[0]}–${rp[1]} 趟。練的是「休息充足下的速度」，不是累了之後的速度（${esc(R.source.zones_citation.split('.')[0])}）。</p>`;
    else html += `<p class="wk-note">文獻給的衝刺休息只到 50 m；${d} m 的休息請自己決定（下面預設 3 分鐘）。</p>`;
    if (d <= 50) html += `<p class="muted">另一個做法：${esc(R.zones['En-3'].name_zh)}用 ${R.zones['En-3'].repeat_distance_m.join('–')} m、約 ${R.zones['En-3'].cited_repeat_sec} 秒的重複，休息 ${R.zones['En-3'].cited_rest_min.join('–')} 分鐘。</p>`;
    html += `<div class="wk-sp-add"><label class="wk-field"><span>趟數</span><input type="number" min="1" max="40" value="${repsDef}" data-sp-reps></label>
      <label class="wk-field"><span>休息</span><input type="text" inputmode="decimal" value="${fmt0(restDef)}" data-sp-rest></label>
      <button type="button" class="wk-btn wk-btn--main" data-sp-add>加入課表</button></div>`;
    box.innerHTML = html;
    box.querySelectorAll('[data-pct]').forEach(b => b.addEventListener('click', () => { S.pct = +b.dataset.pct; $('[data-wk-pct]').value = S.pct; save(); renderSprint(); }));
    box.querySelector('[data-sp-add]').addEventListener('click', () => {
      const reps = +box.querySelector('[data-sp-reps]').value || repsDef;
      const rest = parseT(box.querySelector('[data-sp-rest]').value) || restDef;
      S.plan.push({ label: `衝刺 ${S.pct}%`, reps, dist: d, target: +tg.toFixed(1), rest });
      save(); renderPlan(); location.hash = 'wk-plan';
    });
  }

  function renderPlan() {
    const ol = $('[data-wk-plan]');
    if (!S.plan.length) { ol.innerHTML = '<li class="wk-empty muted">還沒有任何一組。</li>'; $('[data-wk-total]').textContent = ''; return; }
    ol.innerHTML = S.plan.map((s, i) => `<li class="wk-set" data-i="${i}">
      <input class="wk-set-l" value="${esc(s.label)}" data-f="label" aria-label="名稱">
      <label><input type="number" min="1" max="99" value="${s.reps}" data-f="reps" aria-label="趟數"> ×</label>
      <label><input type="number" min="10" max="1500" step="5" value="${s.dist}" data-f="dist" aria-label="距離"> m</label>
      <label>目標 <input type="text" inputmode="decimal" value="${fmt(s.target)}" data-f="target" aria-label="目標秒數"></label>
      <label>休息 <input type="text" inputmode="decimal" value="${fmt0(s.rest)}" data-f="rest" aria-label="休息"></label>
      <button type="button" class="wk-del" data-del aria-label="刪除這一組">✕</button></li>`).join('');
    const total = S.plan.reduce((a, s) => a + s.reps * (s.target + s.rest), 0);
    const dist = S.plan.reduce((a, s) => a + s.reps * s.dist, 0);
    $('[data-wk-total]').textContent = `共 ${dist} m，約 ${Math.round(total / 60)} 分鐘（以目標秒數＋休息估算）`;
    ol.querySelectorAll('.wk-set').forEach(li => {
      const i = +li.dataset.i;
      li.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', () => {
        const f = inp.dataset.f;
        if (f === 'label') S.plan[i].label = inp.value;
        else if (f === 'target' || f === 'rest') { const v = parseT(inp.value); if (v != null || f === 'rest') S.plan[i][f] = v || 0; }
        else S.plan[i][f] = +inp.value || S.plan[i][f];
        save(); renderPlan();
      }));
      li.querySelector('[data-del]').addEventListener('click', () => { S.plan.splice(i, 1); save(); renderPlan(); });
    });
  }

  /* ---------- 聲音與螢幕常亮 ---------- */
  let ac = null;
  const tone = (freq, ms, at = 0) => {
    if (!ac) return;
    try {
      ms = Math.max(ms, 40);
      const t0 = ac.currentTime + at + 0.01, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01);
      g.gain.setValueAtTime(0.35, t0 + ms / 1000 - 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
      o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + ms / 1000 + 0.02);
    } catch (_) { /* 聲音失敗不影響計時 */ }
  };
  const vib = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) { /* 不支援就略過 */ } };
  const SND = {
    tick: () => { tone(880, 120); vib(80); },          // 倒數 3、2、1
    go: () => { tone(1320, 600); vib(400); },           // 出發
    target: () => { tone(660, 180); tone(660, 180, 0.28); vib([150, 100, 150]); }, // 到達目標秒數
    done: () => { tone(990, 250); tone(1320, 250, 0.3); tone(1760, 500, 0.6); },
  };
  let wake = null;
  const holdScreen = async () => { try { wake = await navigator.wakeLock.request('screen'); } catch (_) { wake = null; } };

  /* ---------- 計時器 ---------- */
  const T = root.parentElement.querySelector('[data-wk-timer]');
  const tq = (s) => T.querySelector(s);
  let seq = [], idx = 0, phase = 'ready', t0 = 0, paused = 0, pausedAt = 0, beeped = {}, timer = null, log = [];

  function build() {
    seq = [];
    S.plan.forEach((s, si) => {
      for (let r = 1; r <= s.reps; r++) {
        seq.push({ kind: 'swim', si, r, reps: s.reps, set: s });
        seq.push({ kind: 'rest', si, r, reps: s.reps, set: s, sec: s.rest });
      }
    });
    if (seq.length) seq.pop(); // 最後一趟之後不休息
  }
  const now = () => performance.now() / 1000;
  const elapsed = () => (pausedAt ? pausedAt : now()) - t0 - paused;
  const begin = (p) => { phase = p; t0 = now(); paused = 0; pausedAt = 0; beeped = {}; };

  function nextStep() {
    if (phase === 'ready') { SND.go(); idx = 0; begin('swim'); return; }
    idx += 1;
    if (idx >= seq.length) { finish(); return; }
    if (seq[idx].kind === 'swim') SND.go();
    begin(seq[idx].kind);
  }
  function wall(auto) {
    if (phase !== 'swim') return;
    const cur = seq[idx];
    const actual = auto ? cur.set.target : elapsed();
    log.push({ where: `第 ${cur.si + 1} 組第 ${cur.r} 趟`, target: cur.set.target, actual, auto });
    renderLog();
    nextStep();
  }
  function renderLog() {
    tq('[data-wk-t-log]').innerHTML = log.slice().reverse().slice(0, 6).map(x => {
      const d = x.actual - x.target;
      return `<li>${x.where}：${x.auto ? '（未按到牆）' : fmt(x.actual)}${x.auto ? '' : `<span class="${d <= 0 ? 'is-ok' : 'is-slow'}">${d <= 0 ? '' : '+'}${d.toFixed(1)}</span>`}</li>`;
    }).join('');
  }
  function finish() {
    phase = 'done'; clearInterval(timer); SND.done();
    tq('[data-wk-t-phase]').textContent = '完成';
    const hit = log.filter(x => !x.auto && x.actual <= x.target).length, tapped = log.filter(x => !x.auto).length;
    tq('[data-wk-t-clock]').textContent = tapped ? `${hit}/${tapped}` : '✓';
    tq('[data-wk-t-sub]').textContent = tapped ? '趟達到目標秒數' : '課表跑完了';
    tq('[data-wk-wall]').hidden = true;
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  function frame() {
    if (pausedAt || phase === 'done') return;
    const e = elapsed();
    const cur = seq[idx];
    const where = tq('[data-wk-t-where]'), ph = tq('[data-wk-t-phase]'), ck = tq('[data-wk-t-clock]'), sub = tq('[data-wk-t-sub]');
    tq('[data-wk-wall]').hidden = phase !== 'swim';
    if (phase === 'ready') {
      const left = 10 - e;
      ph.textContent = '準備'; ck.textContent = fmt0(Math.max(0, Math.ceil(left)));
      const first = seq[0].set;
      where.textContent = `第 1 組 · ${first.reps}×${first.dist} m`;
      sub.textContent = `第一趟目標 ${fmt(first.target)}`;
      [3, 2, 1].forEach(n => { if (left <= n && !beeped['r' + n]) { beeped['r' + n] = 1; SND.tick(); } });
      if (left <= 0) nextStep();
      return;
    }
    where.textContent = `第 ${cur.si + 1} 組 · 第 ${cur.r}/${cur.reps} 趟 · ${cur.set.dist} m`;
    if (phase === 'swim') {
      ph.textContent = '游'; ck.textContent = fmt(e);
      const over = e - cur.set.target;
      sub.textContent = over < 0 ? `目標 ${fmt(cur.set.target)}（還有 ${fmt(-over)}）` : `目標 ${fmt(cur.set.target)} 已到`;
      ck.classList.toggle('is-over', over >= 0);
      if (over >= 0 && !beeped.t) { beeped.t = 1; SND.target(); if (S.autorest) wall(true); }
    } else if (phase === 'rest') {
      const left = cur.sec - e;
      ph.textContent = '休息'; ck.textContent = fmt0(Math.max(0, Math.ceil(left))); ck.classList.remove('is-over');
      const nx = seq[idx + 1];
      sub.textContent = nx ? `下一趟：${nx.set.dist} m 目標 ${fmt(nx.set.target)}` : '';
      [3, 2, 1].forEach(n => { if (left <= n && !beeped['r' + n]) { beeped['r' + n] = 1; SND.tick(); } });
      if (left <= 0) nextStep();
    }
  }
  function openTimer() {
    if (!S.plan.length) { alert('課表是空的，先加一組。'); return; }
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (_) { ac = null; }
    tone(440, 40); // 使用者按下的當下解鎖聲音（iPhone 要求）
    holdScreen();
    build(); log = []; renderLog(); idx = 0;
    T.hidden = false; document.body.classList.add('wk-running');
    tq('[data-wk-pause]').textContent = '暫停';
    begin('ready');
    clearInterval(timer); timer = setInterval(frame, 100); frame();
  }
  function closeTimer() {
    clearInterval(timer); phase = 'done'; T.hidden = true; document.body.classList.remove('wk-running');
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  tq('[data-wk-wall]').addEventListener('click', () => wall(false));
  tq('[data-wk-stop]').addEventListener('click', closeTimer);
  tq('[data-wk-skip]').addEventListener('click', () => { if (phase === 'swim') wall(true); else if (phase !== 'done') nextStep(); });
  tq('[data-wk-pause]').addEventListener('click', (ev) => {
    if (phase === 'done') return;
    if (pausedAt) { paused += now() - pausedAt; pausedAt = 0; ev.target.textContent = '暫停'; }
    else { pausedAt = now(); ev.target.textContent = '繼續'; }
  });
  document.addEventListener('visibilitychange', () => { if (!T.hidden && document.visibilityState === 'visible') holdScreen(); });

  /* ---------- 輸入與初始化 ---------- */
  root.querySelector('[data-wk-stroke]').value = S.stroke;
  root.querySelector('[data-wk-stroke]').addEventListener('change', e => { S.stroke = e.target.value; save(); });
  root.querySelectorAll('[data-wk-pb]').forEach(inp => {
    inp.value = S.pb[inp.dataset.wkPb] || '';
    inp.addEventListener('input', () => { S.pb[inp.dataset.wkPb] = inp.value; save(); renderCss(); renderSprint(); });
  });
  const sd = root.querySelector('[data-wk-sdist]'); sd.value = S.sdist;
  sd.addEventListener('change', () => { S.sdist = sd.value; save(); renderSprint(); });
  const pr = root.querySelector('[data-wk-pct]'); pr.value = S.pct;
  pr.addEventListener('input', () => { S.pct = +pr.value; save(); renderSprint(); });
  root.querySelector('[data-wk-css]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const a = JSON.parse(b.dataset.add);
    const reps = a.zone === 'main_endurance' ? Math.max(2, Math.floor(15 * 60 / (a.target + a.rest))) : 6;
    S.plan.push({ label: a.label, reps, dist: a.dist, target: a.target, rest: a.rest });
    save(); renderPlan(); location.hash = 'wk-plan';
  });
  root.querySelector('[data-wk-add]').addEventListener('click', () => { S.plan.push({ label: '自訂', reps: 4, dist: 50, target: 40, rest: 60 }); save(); renderPlan(); });
  root.querySelector('[data-wk-clear]').addEventListener('click', () => { if (confirm('清空整份課表？')) { S.plan = []; save(); renderPlan(); } });
  root.querySelector('[data-wk-start]').addEventListener('click', openTimer);
  const ar = root.querySelector('[data-wk-autorest]'); ar.checked = S.autorest !== false;
  ar.addEventListener('change', () => { S.autorest = ar.checked; save(); });
  renderCss(); renderSprint(); renderPlan();
})();
