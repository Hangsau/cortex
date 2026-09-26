/* 課表與間歇計時（Claude 手寫，2026-09-26）
   處方數字來自頁內 #wk-rules（swim-coach 規則表同步）；drill 與器材詞彙來自 #wk-drills。
   輸入存本機 localStorage('cortex-swim-v2')；舊版 v1（只有自由式成績＋單層課表）第一次開啟時自動搬過來。
   CSS 換算（每一式分開算，每種都標方法、確定性與誤差方向）：
     200＋400 兩點（規則表方法）＞ 有 400（+4.5 秒／100 m，業界慣例）＞ 兩筆以上其他距離（個人疲勞指數外推；
     使用者 2026-09-26 指示，規則表原為禁止）＞ 單一成績（Riegel 外推）＞ 混合式無成績時取各式 CSS 平均 */
(() => {
  'use strict';
  const root = document.querySelector('[data-wk]');
  if (!root) return;
  const R = JSON.parse(document.getElementById('wk-rules').textContent);
  const V = JSON.parse(document.getElementById('wk-drills').textContent);
  const $ = (s) => root.querySelector(s);
  const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const STROKES = V.strokes; // [{k, zh, d:[距離]}]
  const SZH = Object.fromEntries(STROKES.map(s => [s.k, s.zh]));
  SZH.choice = '自選';
  const DRILL_STROKE = { free: 'freestyle', back: 'backstroke', breast: 'breaststroke', fly: 'butterfly' };
  const MODES = { swim: '游', kick: '腳', pull: '手', drill: 'drill' };
  const INTS = { none: '不設目標', tech: '技術', end: '耐力', speed: '速度', sprint: '衝刺 %', custom: '自訂秒數' };
  const ZKEY = { tech: 'main_technique', end: 'main_endurance', speed: 'main_speed' };
  const DRILL = Object.fromEntries(V.drills.map(d => [d.id, d]));

  /* ---------- 狀態 ---------- */
  const KEY = 'cortex-swim-v2';
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } };
  const newMenu = (name) => ({ name, blocks: [{ title: '暖身', rows: [] }, { title: 'Drill', rows: [] }, { title: '主課', rows: [] }, { title: '緩和', rows: [] }] });
  const S = Object.assign({
    course: 'scm', pb: {}, zstroke: 'free', sstroke: 'free', sdist: '50', pct: 95, autorest: true,
    menus: [newMenu('今天的課表')], cur: 0, myDrills: [], myEquip: [],
  }, load(KEY) || {});
  STROKES.forEach(s => { S.pb[s.k] = S.pb[s.k] || {}; });
  if (!load(KEY)) {
    const v1 = load('cortex-swim-v1');
    if (v1) {
      S.pb.free = v1.pb || {};
      (v1.plan || []).forEach(p => S.menus[0].blocks[2].rows.push({ reps: p.reps, dist: p.dist, stroke: v1.stroke || 'free', mode: 'swim', int: 'custom', target: p.target, pct: 95, rest: p.rest, drill: '', equip: [], note: p.label || '' }));
    }
  }
  if (!S.menus.length) S.menus.push(newMenu('今天的課表'));
  if (S.cur >= S.menus.length) S.cur = 0;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { /* 無儲存空間時照常計算 */ } };
  const M = () => S.menus[S.cur];

  /* ---------- 時間格式 ---------- */
  const parseT = (s) => {
    s = String(s == null ? '' : s).trim().replace('：', ':');
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

  /* ---------- CSS 與 PB 推估 ---------- */
  const RIEGEL = 1.06; // Riegel 1981（跑步耐力模型）
  const clampK = (k) => Math.min(Math.max(k, 1.02), 1.25);
  const known = (s) => (STROKES.find(x => x.k === s) || { d: [] }).d.map(d => [d, parseT(S.pb[s][d])]).filter(x => x[1]);
  const pair = (a, ta, b, tb) => 100 / ((b - a) / (tb - ta));
  const expOf = (k) => {
    if (k.length < 2) return { e: RIEGEL, own: false };
    const [a, ta] = k[k.length - 2], [b, tb] = k[k.length - 1];
    const raw = Math.log(tb / ta) / Math.log(b / a);
    return Number.isFinite(raw) && raw > 0 ? { e: clampK(raw), raw, own: true } : { e: RIEGEL, own: false };
  };
  const cssCache = {};
  function css(s) {
    if (s === 'choice') s = 'free';
    if (s in cssCache) return cssCache[s];
    return (cssCache[s] = cssCalc(s));
  }
  function cssCalc(s) {
    const k = known(s), t = Object.fromEntries(k);
    if (t[200] && t[400] && t[400] > t[200]) {
      return { pace: pair(200, t[200], 400, t[400]), label: '200 m＋400 m 兩筆（規則表方法）', grade: 'ok',
        how: `CSS 速度 ＝ (400 − 200) ÷ (${fmt(t[400])} − ${fmt(t[200])})`, warn: [esc(R.css.pair_bias_note_zh)] };
    }
    if (t[400]) {
      return { pace: t[400] / 4 + 4.5, label: '有 400 m：400 配速 ＋ 4.5 秒／100 m', grade: 'mid',
        how: `${fmt(t[400] / 4)}／100 m ＋ 4.5 秒`, warn: [`${esc(R.css.practice_shortcut.certainty)}：${esc(R.css.practice_shortcut.source)}。補測 200 m 就能改用兩筆算法。`] };
    }
    if (k.length >= 2) {
      const x = expOf(k), [b, tb] = k[k.length - 1];
      const T200 = t[200] || tb * Math.pow(200 / b, x.e), T400 = tb * Math.pow(400 / b, x.e);
      const w = [];
      if (b <= 100) w.push('短距離成績推出來的耐力配速會<b>偏快</b>，出發間隔要往<b>寬鬆</b>的方向修。規則表原本禁止這種換算（' + esc(R.css.single_forbidden_zh.split('\n')[0]) + '），此處依你 2026-09-26 的指示提供。');
      else w.push('外推值，規則表的做法是實測 200 m 與 400 m 兩筆。');
      if (x.raw !== x.e) w.push(`疲勞指數 ${x.raw.toFixed(3)} 超出常見範圍，已限制在 ${x.e.toFixed(2)} 計算。`);
      return { pace: pair(200, T200, 400, T400), label: `${k[k.length - 2][0]} m＋${b} m：個人疲勞指數外推`, grade: 'low',
        how: `疲勞指數 ${x.e.toFixed(3)}；${t[200] ? '' : `推估 200 m ≈ ${fmt(T200)}、`}推估 400 m ≈ ${fmt(T400)}`, warn: w };
    }
    if (k.length === 1) {
      const [d0, t0] = k[0];
      const T200 = t0 * Math.pow(200 / d0, RIEGEL), T400 = t0 * Math.pow(400 / d0, RIEGEL);
      const w = ['只用一筆成績推耐力配速，誤差最大' + (d0 <= 100 ? '而且會<b>偏快</b>' : '') + '；規則表的做法是補測 200 m 與 400 m。'];
      if (R.css.perceived_anchors_zh.length) w.push('還沒補測前，也可以先用感覺判斷強度：' + R.css.perceived_anchors_zh.map(esc).join('；') + '。');
      return { pace: pair(200, T200, 400, T400), label: `只有 ${d0} m：Riegel 公式外推（確定性最低）`, grade: 'low',
        how: `推估 200 m ≈ ${fmt(T200)}、400 m ≈ ${fmt(T400)}（指數 ${RIEGEL}）`, warn: w };
    }
    if (s === 'im') {
      const four = ['free', 'back', 'breast', 'fly'].map(x => css(x)).filter(Boolean);
      if (four.length) {
        const pace = four.reduce((a, c) => a + c.pace, 0) / four.length;
        return { pace, label: `沒有混合式成績：取 ${four.length} 式 CSS 平均推估`, grade: 'low',
          how: four.length < 4 ? '缺的泳式沒算進去，數字會偏向已填的那幾式。' : '四式 CSS 平均，沒算轉換泳式的時間損失。',
          warn: ['推估值；填一筆 200 或 400 混合式成績會準得多。'] };
      }
    }
    return null;
  }
  function pbFor(s, d) {
    if (s === 'choice') s = 'free';
    const own = parseT(S.pb[s] && S.pb[s][d]);
    if (own) return { t: own, est: false };
    const k = known(s);
    if (!k.length) return null;
    const x = expOf(k);
    const ref = k.slice().sort((a, b) => Math.abs(Math.log(a[0] / d)) - Math.abs(Math.log(b[0] / d)))[0];
    return { t: ref[1] * Math.pow(d / ref[0], x.e), est: true, from: ref[0] };
  }

  /* ---------- 一列課表的目標秒數 ---------- */
  const NO_AUTO = { kick: 1, drill: 1 };
  function targetOf(row) {
    const custom = parseT(row.target);
    if (row.int === 'custom') return custom ? { t: custom } : null;
    if (NO_AUTO[row.mode] || row.int === 'none') return null;
    if (row.int === 'sprint') {
      const p = pbFor(row.stroke, row.dist);
      return p ? { t: p.t / ((row.pct || 95) / 100), est: p.est } : { miss: true };
    }
    const c = css(row.stroke);
    if (!c) return { miss: true };
    const off = R.pace_offset_sec_per_100[ZKEY[row.int]] || 0;
    return { t: (c.pace + off) * row.dist / 100, est: c.grade === 'low' };
  }
  const RND = R.send_off_rounding_sec || 5;
  const sendOff = (sec) => Math.ceil(sec / RND) * RND;
  const mid = (r) => Math.round((r.min + r.max) / 2 / 5) * 5;
  function defaultRest(row) {
    if (row.mode === 'drill') { const f = R.drill_rest_by_stroke[row.stroke]; return mid(f || R.rest_seconds.drill); }
    if (ZKEY[row.int]) return mid(R.rest_seconds[ZKEY[row.int]]);
    if (row.int === 'sprint') { const r = R.zones.Sp.rest_sec_by_distance[String(row.dist)]; return r ? Math.round((r[0] + r[1]) / 2 / 30) * 30 : 180; }
    return 20;
  }

  /* ---------- drill 與器材 ---------- */
  const EQN = Object.fromEntries(V.equip.map(e => [e.k, e.n]));
  const eqName = (k) => k.startsWith('x:') ? k.slice(2) : (EQN[k] || k);
  const allEquip = () => V.equip.map(e => e.k).concat(S.myEquip.map(n => 'x:' + n));
  function drillOf(id) {
    if (!id) return null;
    if (id.startsWith('my:')) { const d = S.myDrills.find(x => 'my:' + x.id === id); return d ? { name: d.name, cue: d.cue, equip: d.equip || [], mine: true } : null; }
    const d = DRILL[id];
    return d ? { name: d.n, cue: d.h || d.p, equip: d.e || [], url: d.u } : null;
  }

  /* ---------- 描述文字 ---------- */
  function rowHead(row) {
    const d = drillOf(row.drill);
    const mode = row.mode === 'swim' ? '' : row.mode === 'drill' ? ' drill' : ' ' + MODES[row.mode];
    return `${row.reps} × ${row.dist} m ${SZH[row.stroke]}${mode}${row.mode === 'drill' && d ? '：' + d.name : ''}`;
  }
  function rowInt(row) {
    const tg = targetOf(row);
    let s = row.int === 'sprint' ? `衝刺 ${row.pct}%` : (row.int === 'custom' || row.int === 'none' || NO_AUTO[row.mode]) ? '' : INTS[row.int];
    if (tg && tg.t) s += (s ? ' ' : '') + '目標 ' + fmt(tg.t) + (tg.est ? '（估）' : '');
    else if (tg && tg.miss) s += `（沒有${SZH[row.stroke === 'choice' ? 'free' : row.stroke]}成績，算不出目標）`;
    return s;
  }
  const rowEquip = (row) => (row.equip || []).map(eqName).join('、');
  function estSec(row) {
    const tg = targetOf(row);
    if (tg && tg.t) return tg.t;
    const c = css(row.stroke);
    const per100 = c ? c.pace + 20 : 120;
    return per100 * row.dist / 100 * (row.mode === 'kick' || row.mode === 'drill' ? 1.3 : 1);
  }

  /* ---------- ② 換算結果 ---------- */
  const ZROWS = [
    { int: 'tech', name: '技術組', zone: '不掛能量分區' },
    { int: 'end', name: '耐力組', zone: 'En-2 閾值有氧' },
    { int: 'speed', name: '速度組', zone: '偏快的主組' },
  ];
  const GRADE = { ok: '依規則', mid: '業界慣例', low: '低確定性' };
  function renderCss() {
    const box = $('[data-wk-css]');
    const have = STROKES.filter(s => css(s.k));
    if (!have.length) { box.innerHTML = '<p class="muted">填入至少一筆成績後，這裡會算出各式 CSS 與各強度每趟的目標秒數。</p>'; return; }
    if (!css(S.zstroke)) S.zstroke = have[0].k;
    let html = '<div class="wk-cssall">' + STROKES.map(s => {
      const c = css(s.k);
      return `<button type="button" class="wk-cs${s.k === S.zstroke ? ' is-on' : ''}" data-zs="${s.k}" aria-pressed="${s.k === S.zstroke}"${c ? '' : ' disabled'}><span>${s.zh}</span><b>${c ? fmt(c.pace) : '—'}</b><i>${c ? GRADE[c.grade] : '沒有成績'}</i></button>`;
    }).join('') + '</div>';
    const c = css(S.zstroke);
    html += `<div class="wk-css"><p class="wk-css-k">${SZH[S.zstroke]} CSS 配速</p><p class="wk-css-v">${fmt(c.pace)}<span>／100 m</span></p>
      <p class="wk-css-m"><span class="wk-grade wk-grade--${c.grade}">${GRADE[c.grade]}</span>${esc(c.label)}</p><p class="muted">${esc(c.how)}</p>
      ${c.warn.map(w => `<p class="wk-warn">${w}</p>`).join('')}</div>`;
    html += '<div class="wk-tablewrap"><table class="wk-table"><thead><tr><th scope="col">強度</th>' +
      [50, 100, 200].map(d => `<th scope="col">${d} m</th>`).join('') + '</tr></thead><tbody>';
    ZROWS.forEach(z => {
      const off = R.pace_offset_sec_per_100[ZKEY[z.int]] || 0;
      const rest = R.rest_seconds[ZKEY[z.int]];
      html += `<tr><th scope="row">${z.name}<span>${z.zone}<br>每 100 m ${off > 0 ? '+' : ''}${off} 秒、休息 ${rest.min}–${rest.max} 秒</span></th>`;
      [50, 100, 200].forEach(d => {
        const tg = (c.pace + off) * d / 100;
        html += `<td><b>${fmt(tg)}</b><span>出發 ${fmt0(sendOff(tg + rest.min))}–${fmt0(sendOff(tg + rest.max))}</span>
          <button type="button" class="wk-add" data-zadd="${z.int}:${d}">加入主課</button></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    const en2 = R.zones['En-2'];
    html += `<p class="muted">耐力組依 ${esc(en2.name_zh)}：休息不超過游的時間、超過 100 m 的重複休息要少於游的時間一半；整組約 ${en2.set_duration_min[0]}–${en2.set_duration_min[1]} 分鐘。技術／耐力／速度三段的配速加減與休息秒數是教練判斷，沒有文獻依據。</p>`;
    box.innerHTML = html;
  }

  /* ---------- ③ 衝刺換算 ---------- */
  function mainBlock() {
    const m = M();
    let b = m.blocks.find(x => x.title === '主課');
    if (!b) { b = { title: '主課', rows: [] }; m.blocks.push(b); }
    return b;
  }
  function renderSprint() {
    const box = $('[data-wk-sprint]');
    const ss = $('[data-wk-sstroke]');
    ss.innerHTML = STROKES.map(s => `<option value="${s.k}">${s.zh}</option>`).join('');
    ss.value = S.sstroke;
    const dists = [25].concat(STROKES.find(s => s.k === S.sstroke).d.filter(d => d <= 400));
    if (!dists.includes(+S.sdist)) S.sdist = String(dists.includes(50) ? 50 : dists[1]);
    const sd = $('[data-wk-sdist]');
    sd.innerHTML = dists.map(d => `<option value="${d}">${d} m</option>`).join('');
    sd.value = S.sdist;
    const d = +S.sdist;
    $('[data-wk-pctv]').textContent = S.pct;
    $('[data-wk-pct]').value = S.pct;
    const p = pbFor(S.sstroke, d);
    if (!p) { box.innerHTML = `<p class="muted">先在 ① 填至少一筆${SZH[S.sstroke]}成績。</p>`; return; }
    const tg = p.t / (S.pct / 100);
    const sp = R.zones.Sp;
    const rr = sp.rest_sec_by_distance[String(d)], rp = sp.reps_by_distance[String(d)];
    const row = { reps: rp ? Math.round((rp[0] + rp[1]) / 2) : 4, dist: d, stroke: S.sstroke, mode: 'swim', int: 'sprint', pct: S.pct };
    const restDef = defaultRest(row);
    const pcts = [80, 85, 88, 90, 92, 95, 98, 100];
    let html = `<div class="wk-sp"><p class="wk-css-k">${SZH[S.sstroke]} ${d} m 目標</p><p class="wk-sp-v">${fmt(tg)}</p>
      <p class="muted">${p.est ? `你沒有${SZH[S.sstroke]} ${d} m 成績，由 ${p.from} m 推估 PB ≈ ${fmt(p.t)}（估計值）` : `PB ${fmt(p.t)}`} ÷ ${S.pct}%</p></div>
      <div class="wk-quick" aria-label="速查">${pcts.map(x => `<button type="button" class="wk-q${x === +S.pct ? ' is-on' : ''}" data-pct="${x}"><span>${x}%</span><b>${fmt(p.t / (x / 100))}</b></button>`).join('')}</div>`;
    if (rr) html += `<p class="wk-note"><b>${esc(sp.name_zh)}的休息：</b>${d} m 休 ${fmt0(rr[0])}–${fmt0(rr[1])}，做 ${rp[0]}–${rp[1]} 趟。練的是「休息充足下的速度」，不是累了之後的速度（${esc(R.source.zones_citation.split('.')[0])}）。</p>`;
    else html += `<p class="wk-note">文獻給的衝刺休息只到 50 m；${d} m 的休息請自己決定（下面預設 3 分鐘）。</p>`;
    if (d <= 50) html += `<p class="muted">另一個做法：${esc(R.zones['En-3'].name_zh)}用 ${R.zones['En-3'].repeat_distance_m.join('–')} m、約 ${R.zones['En-3'].cited_repeat_sec} 秒的重複，休息 ${R.zones['En-3'].cited_rest_min.join('–')} 分鐘。</p>`;
    html += `<div class="wk-sp-add"><label class="wk-field"><span>趟數</span><input type="number" min="1" max="40" value="${row.reps}" data-sp-reps></label>
      <label class="wk-field"><span>休息</span><input type="text" inputmode="decimal" value="${fmt0(restDef)}" data-sp-rest></label>
      <button type="button" class="wk-btn wk-btn--main" data-sp-add>加入主課</button></div>`;
    box.innerHTML = html;
    box.querySelectorAll('[data-pct]').forEach(b => b.addEventListener('click', () => { S.pct = +b.dataset.pct; save(); renderSprint(); }));
    box.querySelector('[data-sp-add]').addEventListener('click', () => {
      row.reps = +box.querySelector('[data-sp-reps]').value || row.reps;
      row.rest = parseT(box.querySelector('[data-sp-rest]').value) || restDef;
      mainBlock().rows.push(Object.assign({ target: null, drill: '', equip: [], note: '' }, row));
      save(); renderMenu(); location.hash = 'wk-menu';
    });
  }

  /* ---------- ④ 排課表 ---------- */
  const openEq = new Set();
  const opt = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(v)}</option>`).join('');
  function drillOptions(row) {
    const want = DRILL_STROKE[row.stroke];
    let html = '<option value="">— 選一個 drill —</option>';
    if (S.myDrills.length) {
      html += '<optgroup label="我的 drill">' + S.myDrills.map(d => `<option value="my:${esc(d.id)}"${row.drill === 'my:' + d.id ? ' selected' : ''}>${esc(d.name)}${d.stroke !== 'any' ? '（' + SZH[d.stroke] + '）' : ''}</option>`).join('') + '</optgroup>';
    }
    const mine = V.drills.filter(d => !want || d.s.includes(want));
    const rest = want ? V.drills.filter(d => !d.s.includes(want)) : [];
    V.cats.forEach(c => {
      const list = mine.filter(d => d.c === c.k);
      if (list.length) html += `<optgroup label="${want ? SZH[row.stroke] + '・' : ''}${esc(c.n)}">` + list.map(d => `<option value="${d.id}"${row.drill === d.id ? ' selected' : ''}>${esc(d.n)}</option>`).join('') + '</optgroup>';
    });
    if (rest.length) html += '<optgroup label="其他泳式">' + rest.map(d => `<option value="${d.id}"${row.drill === d.id ? ' selected' : ''}>${esc(d.n)}</option>`).join('') + '</optgroup>';
    return html;
  }
  function rowHtml(row, bi, ri) {
    const tg = targetOf(row);
    const ints = NO_AUTO[row.mode] ? { none: INTS.none, custom: INTS.custom } : INTS;
    if (!ints[row.int]) row.int = 'none';
    const d = drillOf(row.drill);
    const key = bi + '-' + ri;
    let tgText = '';
    if (row.int === 'none') tgText = '<span class="muted">到牆自己按</span>';
    else if (row.int !== 'custom') tgText = tg && tg.t ? `目標 <b>${fmt(tg.t)}</b>${tg.est ? '（估）' : ''}` : `<span class="wk-miss">沒有${SZH[row.stroke === 'choice' ? 'free' : row.stroke]}成績</span>`;
    const eq = row.equip || [];
    return `<li class="wk-r" data-b="${bi}" data-r="${ri}">
      <div class="wk-r-line">
        <label class="wk-in"><input type="number" min="1" max="99" value="${row.reps}" data-f="reps" aria-label="趟數"><span>×</span></label>
        <label class="wk-in"><input type="number" min="10" max="3000" step="5" value="${row.dist}" data-f="dist" aria-label="距離"><span>m</span></label>
        <select data-f="stroke" aria-label="泳式">${opt(SZH, row.stroke)}</select>
        <select data-f="mode" aria-label="游法">${opt(MODES, row.mode)}</select>
      </div>
      ${row.mode === 'drill' ? `<div class="wk-r-line"><select class="wk-r-drill" data-f="drill" aria-label="drill">${drillOptions(row)}</select>${d && d.url ? `<a class="wk-r-link" href="${d.url}">看這個 drill</a>` : ''}</div>${d && d.cue ? `<p class="wk-r-cue">${esc(d.cue)}</p>` : ''}` : ''}
      <div class="wk-r-line">
        <select data-f="int" aria-label="強度">${opt(ints, row.int)}</select>
        ${row.int === 'sprint' ? `<label class="wk-in"><input type="number" min="50" max="100" value="${row.pct}" data-f="pct" aria-label="強度百分比"><span>%</span></label>` : ''}
        ${row.int === 'custom' ? `<label class="wk-in"><span>目標</span><input type="text" inputmode="decimal" value="${parseT(row.target) ? fmt(parseT(row.target)) : ''}" placeholder="秒" data-f="target" aria-label="目標秒數"></label>` : ''}
        <span class="wk-r-tg">${tgText}</span>
        <label class="wk-in"><span>休息</span><input type="text" inputmode="decimal" value="${fmt0(row.rest || 0)}" data-f="rest" aria-label="休息"></label>
      </div>
      <details class="wk-r-eq" data-eq="${key}"${openEq.has(key) ? ' open' : ''}><summary>器材：${eq.length ? esc(rowEquip(row)) : '不用'}</summary>
        <div class="wk-chips">${allEquip().map(k => `<button type="button" class="wk-chip" aria-pressed="${eq.includes(k)}" data-eqk="${esc(k)}">${esc(eqName(k))}</button>`).join('')}</div>
      </details>
      <input class="wk-r-note" type="text" value="${esc(row.note || '')}" placeholder="備註（例如：每 25 m 換氣 3 次）" data-f="note" aria-label="備註">
      <div class="wk-r-act">
        <button type="button" data-act="up" aria-label="往上移">↑</button><button type="button" data-act="down" aria-label="往下移">↓</button>
        <button type="button" data-act="dup">複製</button><button type="button" data-act="del" aria-label="刪除這一列">刪除</button>
      </div>
    </li>`;
  }
  const blockDist = (b) => b.rows.reduce((a, r) => a + r.reps * r.dist, 0);
  function renderMenu() {
    const m = M();
    $('[data-wk-menus]').innerHTML = S.menus.map((x, i) => `<option value="${i}"${i === S.cur ? ' selected' : ''}>${esc(x.name || '未命名')}</option>`).join('');
    $('[data-wk-mname]').value = m.name || '';
    $('[data-wk-blocks]').innerHTML = m.blocks.map((b, bi) => `<section class="wk-blk" data-b="${bi}">
      <div class="wk-blk-h">
        <input class="wk-blk-t" type="text" value="${esc(b.title)}" data-bt aria-label="段落名稱">
        <span class="muted">${blockDist(b)} m</span>
        <span class="wk-r-act"><button type="button" data-bact="up" aria-label="整段往上">↑</button><button type="button" data-bact="down" aria-label="整段往下">↓</button><button type="button" data-bact="del" aria-label="刪除整段">刪除</button></span>
      </div>
      <ol class="wk-rows">${b.rows.map((r, ri) => rowHtml(r, bi, ri)).join('')}</ol>
      <button type="button" class="wk-add" data-addrow="${bi}">＋ 加一列</button>
    </section>`).join('');
    const rows = m.blocks.flatMap(b => b.rows);
    const dist = rows.reduce((a, r) => a + r.reps * r.dist, 0);
    const sec = rows.reduce((a, r) => a + r.reps * (estSec(r) + (r.rest || 0)), 0);
    $('[data-wk-total]').textContent = rows.length ? `共 ${dist} m，約 ${Math.round(sec / 60)} 分鐘（有目標的用目標秒數，其餘用 CSS 放慢估算）` : '';
    renderSum();
  }
  function newRow(bi) {
    const b = M().blocks[bi];
    const last = b.rows[b.rows.length - 1];
    if (last) return JSON.parse(JSON.stringify(last));
    const t = (b.title || '').trim();
    const row = {
      reps: t === '暖身' || t === '緩和' ? 1 : 4, dist: t === '暖身' ? 200 : t === '緩和' ? 100 : 50, stroke: 'free',
      mode: t.toLowerCase() === 'drill' ? 'drill' : 'swim', int: t === '主課' ? 'end' : 'none', pct: 95, target: null, drill: '', equip: [], note: '',
    };
    row.rest = t === '緩和' ? mid(R.rest_seconds.cool_down) : defaultRest(row);
    return row;
  }
  const blocksEl = $('[data-wk-blocks]');
  blocksEl.addEventListener('change', (e) => {
    const m = M();
    if (e.target.matches('[data-bt]')) { m.blocks[+e.target.closest('.wk-blk').dataset.b].title = e.target.value; save(); renderMenu(); return; }
    const li = e.target.closest('.wk-r'); if (!li || !e.target.dataset.f) return;
    const row = m.blocks[+li.dataset.b].rows[+li.dataset.r];
    const f = e.target.dataset.f, v = e.target.value;
    if (f === 'reps' || f === 'dist' || f === 'pct') row[f] = Math.max(1, +v || row[f]);
    else if (f === 'rest') row.rest = parseT(v) || 0;
    else if (f === 'target') row.target = parseT(v);
    else if (f === 'drill') {
      const old = drillOf(row.drill), d = drillOf(v);
      row.drill = v; // 換 drill 時拿掉上一個 drill 帶進來的器材，保留使用者自己勾的
      row.equip = (row.equip || []).filter(k => !(old && old.equip.includes(k)));
      if (d) row.equip = Array.from(new Set(row.equip.concat(d.equip)));
    } else if (f === 'mode') {
      row.mode = v;
      if (NO_AUTO[v] && !{ none: 1, custom: 1 }[row.int]) row.int = 'none';
      if (v === 'drill') row.rest = defaultRest(row);
    } else if (f === 'int') { row.int = v; row.rest = defaultRest(row); } else row[f] = v;
    save(); renderMenu();
  });
  blocksEl.addEventListener('toggle', (e) => {
    const d = e.target; if (!d.matches || !d.matches('[data-eq]')) return;
    if (d.open) openEq.add(d.dataset.eq); else openEq.delete(d.dataset.eq);
  }, true);
  const move = (arr, i, j) => { if (j < 0 || j >= arr.length) return; const [x] = arr.splice(i, 1); arr.splice(j, 0, x); };
  blocksEl.addEventListener('click', (e) => {
    const m = M();
    const btn = e.target.closest('button'); if (!btn) return;
    if (btn.dataset.addrow != null) { const bi = +btn.dataset.addrow; m.blocks[bi].rows.push(newRow(bi)); save(); renderMenu(); return; }
    if (btn.dataset.bact) {
      const bi = +btn.closest('.wk-blk').dataset.b;
      if (btn.dataset.bact === 'del') { if (m.blocks[bi].rows.length && !confirm(`刪除「${m.blocks[bi].title}」整段？`)) return; m.blocks.splice(bi, 1); }
      else move(m.blocks, bi, bi + (btn.dataset.bact === 'up' ? -1 : 1));
      openEq.clear(); save(); renderMenu(); return;
    }
    const li = btn.closest('.wk-r'); if (!li) return;
    const bi = +li.dataset.b, ri = +li.dataset.r, rows = m.blocks[bi].rows, row = rows[ri];
    if (btn.dataset.eqk) {
      const k = btn.dataset.eqk; row.equip = row.equip || [];
      row.equip = row.equip.includes(k) ? row.equip.filter(x => x !== k) : row.equip.concat(k);
      save(); renderMenu(); return;
    }
    const a = btn.dataset.act;
    if (a === 'del') rows.splice(ri, 1);
    else if (a === 'dup') rows.splice(ri + 1, 0, JSON.parse(JSON.stringify(row)));
    else if (a === 'up' || a === 'down') {
      const j = ri + (a === 'up' ? -1 : 1);
      if (j >= 0 && j < rows.length) move(rows, ri, j);
      else if (j < 0 && bi > 0) { rows.splice(ri, 1); m.blocks[bi - 1].rows.push(row); } // 移到上一段末尾
      else if (j >= rows.length && bi < m.blocks.length - 1) { rows.splice(ri, 1); m.blocks[bi + 1].rows.unshift(row); }
    }
    openEq.clear(); save(); renderMenu();
  });

  /* ---------- ⑤ 總覽 ---------- */
  function sumLines(row) {
    const bits = [rowInt(row), row.rest ? '休 ' + fmt0(row.rest) : '', rowEquip(row), row.note || ''].filter(Boolean);
    return { head: rowHead(row), tail: bits.join(' · ') };
  }
  function renderSum() {
    const m = M();
    const blocks = m.blocks.filter(b => b.rows.length);
    if (!blocks.length) { $('[data-wk-sum]').innerHTML = '<p class="muted">課表還是空的。</p>'; return; }
    $('[data-wk-sum]').innerHTML = `<p class="wk-sum-t">${esc(m.name || '課表')}<span>${esc($('[data-wk-total]').textContent)}</span></p>` + blocks.map(b =>
      `<div class="wk-sum-b"><p class="wk-sum-h">${esc(b.title)}<span>${blockDist(b)} m</span></p><ul>` +
      b.rows.map(r => { const s = sumLines(r); return `<li><b>${esc(s.head)}</b>${s.tail ? `<span>${esc(s.tail)}</span>` : ''}</li>`; }).join('') + '</ul></div>').join('');
  }
  function sumText() {
    const m = M();
    const out = [m.name || '課表'];
    m.blocks.filter(b => b.rows.length).forEach(b => {
      out.push('', `【${b.title}】${blockDist(b)} m`);
      b.rows.forEach(r => { const s = sumLines(r); out.push(s.head + (s.tail ? '  ' + s.tail : '')); });
    });
    out.push('', $('[data-wk-total]').textContent);
    return out.join('\n');
  }
  $('[data-wk-copy]').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(sumText()); b.textContent = '已複製'; } catch (_) { b.textContent = '瀏覽器不允許複製'; }
    setTimeout(() => { b.textContent = '複製成文字'; }, 2000);
  });

  /* ---------- ⑥ 我的 drill 與器材 ---------- */
  let draftEq = [];
  function renderMine() {
    $('[data-wk-deq]').innerHTML = allEquip().map(k => `<button type="button" class="wk-chip" aria-pressed="${draftEq.includes(k)}" data-deqk="${esc(k)}">${esc(eqName(k))}</button>`).join('');
    $('[data-wk-dlist]').innerHTML = S.myDrills.map((d, i) => `<li><span><b>${esc(d.name)}</b>${d.stroke !== 'any' ? '・' + SZH[d.stroke] : ''}${d.cue ? '<br>' + esc(d.cue) : ''}${(d.equip || []).length ? '<br>器材：' + esc(d.equip.map(eqName).join('、')) : ''}</span><button type="button" class="wk-del" data-ddel="${i}" aria-label="刪除 ${esc(d.name)}">✕</button></li>`).join('') || '<li class="muted">還沒有自訂 drill。</li>';
    $('[data-wk-elist]').innerHTML = S.myEquip.map((n, i) => `<li><span>${esc(n)}</span><button type="button" class="wk-del" data-edel="${i}" aria-label="刪除 ${esc(n)}">✕</button></li>`).join('');
  }
  $('[data-wk-deq]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-deqk]'); if (!b) return;
    const k = b.dataset.deqk; draftEq = draftEq.includes(k) ? draftEq.filter(x => x !== k) : draftEq.concat(k); renderMine();
  });
  $('[data-wk-dadd]').addEventListener('click', () => {
    const name = $('[data-wk-dname]').value.trim();
    if (!name) { $('[data-wk-dname]').focus(); return; }
    S.myDrills.push({ id: String(Date.now()), name, stroke: $('[data-wk-dstroke]').value, cue: $('[data-wk-dcue]').value.trim(), equip: draftEq });
    $('[data-wk-dname]').value = ''; $('[data-wk-dcue]').value = ''; draftEq = [];
    save(); renderMine(); renderMenu();
  });
  $('[data-wk-dlist]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ddel]'); if (!b) return;
    const d = S.myDrills[+b.dataset.ddel];
    if (!confirm(`刪除自訂 drill「${d.name}」？已排進課表的那幾列會變成沒選 drill。`)) return;
    S.myDrills.splice(+b.dataset.ddel, 1); save(); renderMine(); renderMenu();
  });
  $('[data-wk-eadd]').addEventListener('click', () => {
    const n = $('[data-wk-ename]').value.trim();
    if (!n || S.myEquip.includes(n) || Object.values(EQN).includes(n)) { $('[data-wk-ename]').value = ''; return; }
    S.myEquip.push(n); $('[data-wk-ename]').value = ''; save(); renderMine(); renderMenu();
  });
  $('[data-wk-elist]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-edel]'); if (!b) return;
    S.myEquip.splice(+b.dataset.edel, 1); save(); renderMine(); renderMenu();
  });

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

  /* ---------- 計時器：整份課表逐列、逐趟跑 ---------- */
  const T = root.parentElement.querySelector('[data-wk-timer]');
  const tq = (s) => T.querySelector(s);
  let seq = [], idx = 0, phase = 'ready', t0 = 0, paused = 0, pausedAt = 0, beeped = {}, timer = null, log = [];

  function build() {
    seq = [];
    M().blocks.forEach(b => b.rows.forEach(row => {
      const tg = targetOf(row);
      const target = tg && tg.t ? tg.t : null;
      for (let r = 1; r <= row.reps; r++) {
        seq.push({ kind: 'swim', b, row, r, target });
        if (row.rest > 0) seq.push({ kind: 'rest', b, row, r, sec: row.rest });
      }
    }));
    while (seq.length && seq[seq.length - 1].kind === 'rest') seq.pop(); // 最後一趟之後不休息
  }
  const now = () => performance.now() / 1000;
  const elapsed = () => (pausedAt ? pausedAt : now()) - t0 - paused;
  const begin = (p) => { phase = p; t0 = now(); paused = 0; pausedAt = 0; beeped = {}; };
  const nextSwim = (i) => { for (let j = i; j < seq.length; j++) if (seq[j].kind === 'swim') return seq[j]; return null; };
  const swimLine = (st) => `${rowHead(st.row)}（第 ${st.r}/${st.row.reps} 趟）`;
  const drillLine = (row) => {
    const d = row.mode === 'drill' ? drillOf(row.drill) : null;
    return [d && d.cue, rowEquip(row) && '器材：' + rowEquip(row), row.note].filter(Boolean).join('　');
  };

  function nextStep() {
    if (phase === 'ready') idx = 0; else idx += 1;
    if (idx >= seq.length) { finish(); return; }
    if (seq[idx].kind === 'swim') SND.go();
    begin(seq[idx].kind);
  }
  function wall(auto) {
    if (phase !== 'swim') return;
    const cur = seq[idx];
    log.push({ where: `${cur.b.title}・${rowHead(cur.row)} 第 ${cur.r} 趟`, target: cur.target, actual: auto ? null : elapsed() });
    renderLog();
    nextStep();
  }
  function renderLog() {
    tq('[data-wk-t-log]').innerHTML = log.slice().reverse().slice(0, 6).map(x => {
      if (x.actual == null) return `<li>${esc(x.where)}<span>（未按到牆）</span></li>`;
      if (x.target == null) return `<li>${esc(x.where)}<span>${fmt(x.actual)}</span></li>`;
      const d = x.actual - x.target;
      return `<li>${esc(x.where)}<span class="${d <= 0 ? 'is-ok' : 'is-slow'}">${fmt(x.actual)}（${d <= 0 ? '' : '+'}${d.toFixed(1)}）</span></li>`;
    }).join('');
  }
  function finish() {
    phase = 'done'; clearInterval(timer); SND.done();
    tq('[data-wk-t-phase]').textContent = '完成';
    tq('[data-wk-t-row]').textContent = M().name || '';
    const aimed = log.filter(x => x.actual != null && x.target != null), hit = aimed.filter(x => x.actual <= x.target).length;
    tq('[data-wk-t-clock]').textContent = aimed.length ? `${hit}/${aimed.length}` : '✓';
    tq('[data-wk-t-sub]').textContent = aimed.length ? '趟達到目標秒數' : '課表跑完了';
    tq('[data-wk-t-drill]').textContent = '';
    tq('[data-wk-wall]').hidden = true;
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  function frame() {
    if (pausedAt || phase === 'done') return;
    const e = elapsed();
    const cur = seq[idx];
    const where = tq('[data-wk-t-where]'), rowEl = tq('[data-wk-t-row]'), ph = tq('[data-wk-t-phase]'), ck = tq('[data-wk-t-clock]'), sub = tq('[data-wk-t-sub]'), dr = tq('[data-wk-t-drill]');
    tq('[data-wk-wall]').hidden = phase !== 'swim';
    if (phase === 'ready') {
      const left = 10 - e, first = seq[0];
      ph.textContent = '準備'; ck.textContent = fmt0(Math.max(0, Math.ceil(left))); ck.classList.remove('is-over');
      where.textContent = first.b.title; rowEl.textContent = swimLine(first);
      sub.textContent = first.target ? `第一趟目標 ${fmt(first.target)}` : '這一列沒有目標秒數，到牆按一下';
      dr.textContent = drillLine(first.row);
      [3, 2, 1].forEach(n => { if (left <= n && !beeped['r' + n]) { beeped['r' + n] = 1; SND.tick(); } });
      if (left <= 0) nextStep();
      return;
    }
    where.textContent = cur.b.title;
    if (phase === 'swim') {
      rowEl.textContent = swimLine(cur); dr.textContent = drillLine(cur.row);
      ph.textContent = '游'; ck.textContent = fmt(e);
      if (cur.target == null) { sub.textContent = '沒有目標秒數，到牆按一下'; ck.classList.remove('is-over'); return; }
      const over = e - cur.target;
      sub.textContent = over < 0 ? `目標 ${fmt(cur.target)}（還有 ${fmt(-over)}）` : `目標 ${fmt(cur.target)} 已到`;
      ck.classList.toggle('is-over', over >= 0);
      if (over >= 0 && !beeped.t) { beeped.t = 1; SND.target(); if (S.autorest) wall(true); }
    } else if (phase === 'rest') {
      const left = cur.sec - e, nx = nextSwim(idx + 1);
      ph.textContent = '休息'; ck.textContent = fmt0(Math.max(0, Math.ceil(left))); ck.classList.remove('is-over');
      rowEl.textContent = nx ? '下一趟：' + swimLine(nx) : '';
      sub.textContent = nx && nx.target ? `目標 ${fmt(nx.target)}` : '';
      dr.textContent = nx ? (nx.row !== cur.row ? '換下一列　' : '') + drillLine(nx.row) : '';
      [3, 2, 1].forEach(n => { if (left <= n && !beeped['r' + n]) { beeped['r' + n] = 1; SND.tick(); } });
      if (left <= 0) nextStep();
    }
  }
  function openTimer() {
    build();
    if (!seq.length) { alert('課表是空的，先加一列。'); return; }
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (_) { ac = null; }
    tone(440, 40); // 使用者按下的當下解鎖聲音（iPhone 要求）
    holdScreen();
    log = []; renderLog(); idx = 0;
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
  const refresh = () => { Object.keys(cssCache).forEach(k => delete cssCache[k]); renderCss(); renderSprint(); renderMenu(); };
  const course = $('[data-wk-course]'); course.value = S.course;
  course.addEventListener('change', () => { S.course = course.value; save(); });
  root.querySelectorAll('[data-wk-pb]').forEach(inp => {
    const [s, d] = inp.dataset.wkPb.split(':');
    inp.value = S.pb[s][d] || '';
    inp.addEventListener('change', () => { S.pb[s][d] = inp.value; save(); refresh(); });
  });
  $('[data-wk-css]').addEventListener('click', (e) => {
    const zs = e.target.closest('[data-zs]');
    if (zs) { S.zstroke = zs.dataset.zs; save(); renderCss(); return; }
    const b = e.target.closest('[data-zadd]'); if (!b) return;
    const [int, d] = b.dataset.zadd.split(':');
    const row = { reps: 6, dist: +d, stroke: S.zstroke, mode: 'swim', int, pct: 95, target: null, drill: '', equip: [], note: '' };
    row.rest = defaultRest(row);
    if (int === 'end') { const tg = targetOf(row); row.reps = Math.max(2, Math.floor(15 * 60 / (((tg && tg.t) || 60) + row.rest))); }
    mainBlock().rows.push(row);
    save(); renderMenu(); location.hash = 'wk-menu';
  });
  $('[data-wk-sstroke]').addEventListener('change', (e) => { S.sstroke = e.target.value; save(); renderSprint(); });
  $('[data-wk-sdist]').addEventListener('change', (e) => { S.sdist = e.target.value; save(); renderSprint(); });
  $('[data-wk-pct]').addEventListener('input', (e) => { S.pct = +e.target.value; save(); renderSprint(); });
  $('[data-wk-menus]').addEventListener('change', (e) => { S.cur = +e.target.value; openEq.clear(); save(); renderMenu(); });
  $('[data-wk-mname]').addEventListener('change', (e) => { M().name = e.target.value.trim() || '未命名'; save(); renderMenu(); });
  $('[data-wk-mnew]').addEventListener('click', () => { S.menus.push(newMenu('新課表 ' + (S.menus.length + 1))); S.cur = S.menus.length - 1; openEq.clear(); save(); renderMenu(); });
  $('[data-wk-mdup]').addEventListener('click', () => { const c = JSON.parse(JSON.stringify(M())); c.name += '（複製）'; S.menus.push(c); S.cur = S.menus.length - 1; save(); renderMenu(); });
  $('[data-wk-mdel]').addEventListener('click', () => {
    if (!confirm(`刪除課表「${M().name}」？`)) return;
    S.menus.splice(S.cur, 1); if (!S.menus.length) S.menus.push(newMenu('今天的課表')); S.cur = 0; openEq.clear(); save(); renderMenu();
  });
  $('[data-wk-addblk]').addEventListener('click', () => { M().blocks.push({ title: '新的一段', rows: [] }); save(); renderMenu(); });
  $('[data-wk-start]').addEventListener('click', openTimer);
  const ar = $('[data-wk-autorest]'); ar.checked = S.autorest !== false;
  ar.addEventListener('change', () => { S.autorest = ar.checked; save(); });
  renderCss(); renderSprint(); renderMenu(); renderMine();
})();
