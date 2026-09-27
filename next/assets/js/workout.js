/* 課表與間歇計時（Claude 手寫，2026-09-26；2026-09-27 第四版）
   ── 公式真相源：Vortex canonical data/periodization/（頁內 #wk-pzdata）──
   CSS 四級（set-design generator.anchor_tiers）：
     A 有 200＋400 → (T400−T200)÷2（實測）
     B 只有 400   → (T400÷4)÷0.92（估計）
     C 沒有 400、有兩筆其他距離 → 用這兩筆擬合個人指數 k＝log(T2/T1)÷log(D2/D1)，T400＝T2×(400/D2)^k，再走 B（外推）
     D 只有一筆非 400 或沒有 → 不給絕對秒數，改「以第 1 趟為準」自校準
   不再借跑步的 Riegel 1.06、不夾限指數、不拿各式平均代替混合式——canonical 明文說單點外推不成立。
   衝刺／純速／乳酸生成的目標只用「同一式、同一距離」的 PB；沒有就不換算。
   （2026-09-27 使用者回報：蝶式 50 m 38 秒推 25 m 竟比自由式 50 m 34 秒推的還快——就是跨距離外推加指數夾限造成的。）
   有氧倍率（穩定 ×1.06、輕鬆 ×1.09）、各組型距離／休息／趟數、週期各期意圖、週組裝、減量參數全部讀資料。
   編輯器鐵則：打字只更新狀態與衍生文字，不重畫。休息預設＝建議區間中值，使用者改過就不覆蓋。
   成績不存進瀏覽器（每次開頁都是空白），課表、自訂 drill、器材、常用組照存。
   2026-09-27 第五版（教練需求調查後）：出發間隔模式（計時器照出發時間跑）、逐趟遞減／遞增、分段游、PB＋秒、
   總量統計、語音報讀、常用組與測驗組範本、分享連結、大螢幕側欄、複製這次結果。多組別與多人紀錄留待以後。 */
(() => {
  'use strict';
  const root = document.querySelector('[data-wk]');
  if (!root) return;
  const R = JSON.parse(document.getElementById('wk-rules').textContent);
  const PZ = JSON.parse(document.getElementById('wk-pzdata').textContent);
  const V = JSON.parse(document.getElementById('wk-drills').textContent);
  const $ = (s) => root.querySelector(s);
  const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // 資料裡的散文用 **粗體**；顯示時轉成 <b>，其餘一律跳脫
  const md = (x) => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  const STROKES = V.strokes; // [{k, zh, d:[距離]}]
  const SZH = Object.fromEntries(STROKES.map(s => [s.k, s.zh]));
  SZH.choice = '自選';
  const baseStroke = (s) => (s === 'choice' ? 'free' : s);
  const DRILL_STROKE = { free: 'freestyle', back: 'backstroke', breast: 'breaststroke', fly: 'butterfly' };
  const MODES = { swim: '游', kick: '腳', pull: '手', drill: 'drill' };
  const INTS = { none: '不設目標', easy: '輕鬆有氧', steady: '穩定有氧', thr: '閾值（CSS）', tol: '速耐', race: '賽速', sprint: '衝刺 %', pbplus: 'PB ＋ 秒', custom: '自訂秒數' };
  const STEP_ON = { none: '不變', target: '目標秒數', sendoff: '出發間隔', rest: '休息' };
  // 每一列的欄位預設；舊存檔、分享連結匯入的列都用它補齊
  const ROW_DEF = { sets: 1, reps: 4, dist: 50, stroke: 'free', mode: 'swim', int: 'none', pct: 95, pbPlus: 0, event: '', target: null, rest: 0, setRest: 0,
    restMode: 'rest', sendoff: 0, stepOn: 'none', stepSec: -1, stepCycle: 0, brokenEvery: 0, brokenRest: 10, drill: '', equip: [], note: '', restAuto: false };
  const normRow = (r) => { Object.keys(ROW_DEF).forEach(k => { if (r[k] == null) r[k] = Array.isArray(ROW_DEF[k]) ? [] : ROW_DEF[k]; }); return r; };
  const DRILL = Object.fromEntries(V.drills.map(d => [d.id, d]));

  /* ---------- canonical 參數 ---------- */
  const TYPE = Object.fromEntries(PZ.gen.types.map(t => [t.key, t]));
  const lastNum = (s) => { const m = String(s).match(/([\d.]+)\s*$/); return m ? +m[1] : null; };
  const DER = Object.fromEntries(PZ.gen.derived.map(d => [d.key, d]));
  const K_FALLBACK = lastNum(DER.css_per_100_s_fallback.formula); // 0.92
  const K_STEADY = lastNum(DER.steady_per_100_s.formula);         // 1.06
  const K_EASY = lastNum(DER.easy_per_100_s.formula);             // 1.09
  const K_TOL = 1.10; // lactate_tolerance.target_rule「由 T100 換算配速後放慢約 10%」（🟠 實務慣例）
  const RACE_REST = (TYPE.race_pace.rest_s.rule.match(/\d+/g) || []).map(Number); // [25, 15, 25, 20]
  const raceRest = (d) => (d <= RACE_REST[0] ? RACE_REST[1] : RACE_REST[3]);
  const TIER = Object.fromEntries(PZ.gen.tiers.map(t => [t.key, t]));

  /* ---------- 狀態 ---------- */
  const KEY = 'cortex-swim-v2';
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } };
  const newMenu = (name) => ({ name, blocks: [{ title: '暖身', rows: [] }, { title: 'Drill', rows: [] }, { title: '主課', rows: [] }, { title: '緩和', rows: [] }] });
  const S = Object.assign({
    course: 'scm', pb: {}, zstroke: 'free', sstroke: 'free', sdist: '50', pct: 95, autorest: true,
    menus: [newMenu('今天的課表')], cur: 0, myDrills: [], myEquip: [], lib: [], voice: true, pz: {},
  }, load(KEY) || {});
  // 成績不存進瀏覽器：每次開頁都是乾淨的空白成績（2026-09-27 使用者要求：重新整理不要帶上次的秒數）
  S.pb = {};
  STROKES.forEach(s => { S.pb[s.k] = {}; });
  S.pz = Object.assign({ race: '', today: '', mstart: '', sess: '4' }, S.pz || {});
  if (!load(KEY)) {
    const v1 = load('cortex-swim-v1');
    if (v1) {
      S.pb.free = v1.pb || {};
      (v1.plan || []).forEach(p => S.menus[0].blocks[2].rows.push({ sets: 1, reps: p.reps, dist: p.dist, stroke: v1.stroke || 'free', mode: 'swim', int: 'custom', target: p.target, pct: 95, rest: p.rest, setRest: 0, drill: '', equip: [], note: p.label || '' }));
    }
  }
  if (!S.menus.length) S.menus.push(newMenu('今天的課表'));
  if (S.cur >= S.menus.length) S.cur = 0;
  const OLD_INT = { tech: 'easy', end: 'thr', speed: 'thr' }; // 第三版以前的 swim-coach 分段，對到 canonical 組型
  S.menus.forEach(m => m.blocks.forEach(b => b.rows.forEach(r => {
    r.sets = r.sets || 1; if (r.setRest == null) r.setRest = 0;
    if (OLD_INT[r.int]) r.int = OLD_INT[r.int];
    if (!INTS[r.int]) r.int = 'none';
    normRow(r);
  })));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, S, { pb: {} }))); } catch (_) { /* 無儲存空間時照常計算 */ } };
  const M = () => S.menus[S.cur];
  save(); // 立刻把舊版存下的成績清掉

  /* ---------- 時間：解析、顯示、分／秒兩格輸入 ---------- */
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
  const r5 = (x) => Math.round(x / 5) * 5;
  // 時間欄：單一格，可寫「1:30」或「90」，用一般鍵盤（2026-09-27 使用者：分秒兩格容易填錯）
  const showT = (t, dec) => {
    if (t == null || !(t > 0)) return '';
    const x = +(+t).toFixed(dec);
    if (x < 60) return String(x);
    const m = Math.floor(x / 60), sec = +(x - m * 60).toFixed(dec);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  };
  const tfHtml = (attrs, t, dec, label, ph) => `<span class="wk-tf" ${attrs} data-dec="${dec}"><input class="wk-tf-i" type="text" placeholder="${ph || '例 90 或 1:30'}" value="${showT(t, dec)}" aria-label="${label}" autocomplete="off"></span>`;
  const readTF = (el) => parseT(el.querySelector('.wk-tf-i').value.replace(',', '.'));
  const setTF = (el, t) => { el.querySelector('.wk-tf-i').value = showT(t, +el.dataset.dec || 0); };

  /* ---------- 成績與 CSS ---------- */
  const pb = (s, d) => parseT(S.pb[baseStroke(s)] && S.pb[baseStroke(s)][d]);
  const known = (s) => (STROKES.find(x => x.k === s) || { d: [] }).d.map(d => [d, pb(s, d)]).filter(x => x[1]);
  // CSS 擬合不用 25 m：出發／蹬牆占比太大，會扭曲配速—距離關係（canonical 的例子是 100＋200、50＋100）
  const knownCss = (s) => known(s).filter(([d]) => d >= 50);
  const cssCache = {};
  function css(s) {
    s = baseStroke(s);
    if (!(s in cssCache)) cssCache[s] = cssCalc(s);
    return cssCache[s];
  }
  function cssCalc(s) {
    const t400 = pb(s, 400), t200 = pb(s, 200);
    if (t200 && t400) {
      if (t400 <= t200) return { bad: '400 m 成績比 200 m 還快，請確認。' };
      return { pace: (t400 - t200) / 2, tier: 'tier_a', how: `(${fmt(t400, 2)} − ${fmt(t200, 2)}) ÷ 2` };
    }
    if (t400) return { pace: t400 / 4 / K_FALLBACK, tier: 'tier_b', how: `(${fmt(t400, 2)} ÷ 4) ÷ ${K_FALLBACK}` };
    const k = knownCss(s);
    if (k.length >= 2) {
      const [d1, t1] = k[k.length - 2], [d2, t2] = k[k.length - 1];
      const e = Math.log(t2 / t1) / Math.log(d2 / d1);
      if (!(e > 1)) return { bad: `${d1} m 與 ${d2} m 兩筆成績的配速不合理（長距離配速不該比短距離快），請確認。` };
      const T400 = t2 * Math.pow(400 / d2, e);
      return { pace: T400 / 4 / K_FALLBACK, tier: 'tier_c', how: `用 ${d1} m＋${d2} m 擬合個人指數 ${e.toFixed(3)}，推 400 m ≈ ${fmt(T400)}，再 (T400 ÷ 4) ÷ ${K_FALLBACK}`, short: d2 <= 100 };
    }
    return known(s).length ? { tier: 'tier_d', one: known(s).map(x => x[0]).join('、') } : null;
  }
  // 沒有該距離 PB：用同式較長距離成績平均切段。50 → 25 直接 ÷ 2——跳水比蹬牆快、距離短速度快，兩者大致抵銷
  // （2026-09-27 使用者判斷；曾試過按泳式的教練觀測比例，使用者認為不必修正）
  function baseFor(s, d) {
    const own = pb(s, d);
    if (own) return { t: own, src: `${d} m PB` };
    const longer = known(s).find(([D]) => D > d && D % d === 0);
    if (!longer) return null;
    const [D, T] = longer;
    return { t: T * d / D, split: true, D, T, src: `${D} m 成績 ÷ ${D / d}` };
  }
  const hasCss = (s) => { const c = css(s); return !!(c && c.pace); };
  const TIER_LABEL = { tier_a: '實測', tier_b: '估計', tier_c: '外推', tier_d: '自校準' };

  /* ---------- 一列課表的目標秒數（找不到依據就不給，並說缺什麼） ---------- */
  const NO_AUTO = { kick: 1, drill: 1 };
  function targetOf(row) {
    const s = baseStroke(row.stroke);
    if (row.int === 'custom') { const t = parseT(row.target); return t ? { t } : null; }
    if (NO_AUTO[row.mode] || row.int === 'none') return null;
    if (row.int === 'sprint') {
      const b = baseFor(s, row.dist);
      return b ? { t: b.t / ((row.pct || 95) / 100), note: b.split ? `由 ${b.src}` : '' } : { miss: `沒有${SZH[s]} ${row.dist} m 或更長距離的成績` };
    }
    if (row.int === 'race') {
      const ev = +row.event, p = ev && pb(s, ev);
      if (!p) return { miss: ev ? `沒有${SZH[s]} ${ev} m 成績` : '選一個比賽距離' };
      return { t: p / (ev / row.dist), note: `${ev} m 配速` };
    }
    if (row.int === 'pbplus') {
      const b = baseFor(s, row.dist);
      return b ? { t: b.t + (+row.pbPlus || 0), note: b.split ? `由 ${b.src}` : '' } : { miss: `沒有${SZH[s]} ${row.dist} m 或更長距離的成績` };
    }
    if (row.int === 'tol') {
      const p = pb(s, 100);
      return p ? { t: p * row.dist / 100 * K_TOL, note: '🟠' } : { miss: `沒有${SZH[s]} 100 m 成績` };
    }
    const c = css(s);
    if (!c || !c.pace) return { miss: c && c.bad ? '成績不合理' : `${SZH[s]}成績不足以算 CSS` };
    const mult = row.int === 'easy' ? K_EASY : row.int === 'steady' ? K_STEADY : 1;
    return { t: c.pace * mult * row.dist / 100, note: c.tier === 'tier_a' ? '' : TIER_LABEL[c.tier] };
  }
  // 休息建議（canonical 組型；drill／緩和走 swim-coach 規則表）——autoRest 會帶入中值，使用者改過就不覆蓋
  function restHint(row, blockTitle) {
    const range = (r) => ({ min: r.min, max: r.max, mid: r5((r.min + r.max) / 2) });
    if (row.mode === 'drill') { const f = R.drill_rest_by_stroke[row.stroke] || R.rest_seconds.drill; return Object.assign(range(f), { why: 'drill（swim-coach 規則表）' }); }
    if ((blockTitle || '').trim() === '緩和') return Object.assign(range(R.rest_seconds.cool_down), { why: '緩和（swim-coach 規則表）' });
    const tp = { easy: 'aerobic_easy', thr: 'threshold', tol: 'lactate_tolerance' }[row.int];
    if (tp) return Object.assign(range(TYPE[tp].rest_s), { why: `${INTS[row.int]}組 ${TYPE[tp].cert}` });
    if (row.int === 'race') { const v = raceRest(row.dist); return { min: v, max: v, mid: v, why: `賽速重複 ${TYPE.race_pace.cert}` }; }
    if (row.int === 'sprint') {
      const t = row.dist <= TYPE.velocity.distance_m.max ? TYPE.velocity : row.dist <= TYPE.lactate_production.distance_m.max ? TYPE.lactate_production : null;
      if (t) return Object.assign(range(t.rest_s), { why: `${t.key === 'velocity' ? '純速' : '乳酸生成'}組 ${t.cert}` });
    }
    return null;
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
  const rowDist = (row) => (row.sets || 1) * row.reps * row.dist;
  function rowHead(row) {
    const d = drillOf(row.drill);
    const mode = row.mode === 'swim' ? '' : row.mode === 'drill' ? ' drill' : ' ' + MODES[row.mode];
    const count = (row.sets || 1) > 1 ? `${row.sets} 組 × ${row.reps} × ${row.dist} m` : `${row.reps} × ${row.dist} m`;
    return `${count} ${SZH[row.stroke]}${mode}${row.mode === 'drill' && d ? '：' + d.name : ''}`;
  }
  function rowInt(row) {
    const tg = targetOf(row);
    let s = row.int === 'pbplus' ? `PB ${+row.pbPlus >= 0 ? '+' : '−'}${Math.abs(+row.pbPlus || 0)} 秒` : row.int === 'sprint' ? `衝刺 ${row.pct}%` : row.int === 'race' ? (row.event ? `賽速（${row.event} m）` : '賽速（未選項目）') : row.int === 'custom' ? (row.intLabel || '') : (row.int === 'none' || NO_AUTO[row.mode]) ? '' : INTS[row.int];
    if (tg && tg.t) s += (s ? ' ' : '') + '目標 ' + fmt(tg.t) + (tg.note && tg.note !== '🟠' && !tg.note.includes('配速') ? `（${tg.note}）` : '');
    else if (tg && tg.miss) s += `（${tg.miss}，無目標）`;
    return s;
  }
  const rowEquip = (row) => (row.equip || []).map(eqName).join('、');
  function estSec(row) {
    const tg = targetOf(row);
    if (tg && tg.t) return tg.t;
    const c = css(row.stroke);
    const per100 = c && c.pace ? c.pace * K_EASY : 120;
    return per100 * row.dist / 100 * (row.mode === 'kick' || row.mode === 'drill' ? 1.3 : 1);
  }
  const segsOf = (row) => (row.brokenEvery > 0 && row.brokenEvery < row.dist ? Math.ceil(row.dist / row.brokenEvery) : 1);
  const rowSec = (row) => {
    const n = (row.sets || 1) * row.reps;
    const per = row.restMode === 'sendoff' && row.sendoff > 0 ? row.sendoff : estSec(row) + (row.rest || 0) + (segsOf(row) - 1) * (row.brokenRest || 0);
    return n * per + ((row.sets || 1) - 1) * Math.max(0, (row.setRest || 0) - (row.rest || 0));
  };
  function stepText(row) {
    if (!row.stepOn || row.stepOn === 'none' || !+row.stepSec) return '';
    const v = +row.stepSec;
    return `${STEP_ON[row.stepOn]}每趟 ${v > 0 ? '+' : '−'}${Math.abs(v)} 秒${row.stepCycle > 0 ? `，每 ${row.stepCycle} 趟重來（1–${row.stepCycle} ${v < 0 ? '遞減' : '遞增'}）` : ''}`;
  }
  const brokenText = (row) => (segsOf(row) > 1 ? `每 ${row.brokenEvery} m 停 ${row.brokenRest} 秒` : '');
  const advText = (row) => [stepText(row), brokenText(row)].filter(Boolean).join('；');

  /* ---------- 小提示 ---------- */
  const toastEl = root.parentElement.querySelector('[data-wk-toast]');
  let toastT = 0;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2200); };

  /* ---------- ② 換算 ---------- */
  function renderCss() {
    const box = $('[data-wk-css]');
    const any = STROKES.some(s => known(s.k).length);
    if (!any) { box.innerHTML = '<p class="muted">填入成績後，這裡會算出各式 CSS（臨界游速）與閾值、有氧的每趟目標秒數。</p>'; return; }
    if (!known(S.zstroke).length) S.zstroke = STROKES.find(s => known(s.k).length).k;
    let html = '<div class="wk-cssall">' + STROKES.map(s => {
      const c = css(s.k), has = known(s.k).length;
      const v = c && c.pace ? fmt(c.pace) : c && c.bad ? '？' : '—';
      const lab = c && c.pace ? TIER_LABEL[c.tier] : c && c.bad ? '成績不合理' : has ? '自校準' : '沒有成績';
      return `<button type="button" class="wk-cs${s.k === S.zstroke ? ' is-on' : ''}" data-zs="${s.k}" aria-pressed="${s.k === S.zstroke}"${has ? '' : ' disabled'}><span>${s.zh}</span><b>${v}</b><i>${lab}</i></button>`;
    }).join('') + '</div>';
    const c = css(S.zstroke), zh = SZH[S.zstroke];
    if (c && c.bad) { box.innerHTML = html + `<p class="wk-warn">${esc(c.bad)}</p>`; return; }
    if (!c || !c.pace) {
      box.innerHTML = html + `<div class="wk-css"><p class="wk-css-k">${zh}：${TIER_LABEL.tier_d}</p><p>只有 ${c.one} m（50 m 以上不到兩筆），算不出 CSS，所以不給閾值／有氧的絕對秒數。</p>
        <p class="wk-note">${md(TIER.tier_d.target_time_zh)}</p><p class="muted">補一筆 200 m 或 400 m（同式同池長），這裡就會出現數字。</p></div>`;
      return;
    }
    html += `<div class="wk-css"><p class="wk-css-k">${zh} CSS 配速</p><p class="wk-css-v">${fmt(c.pace)}<span>／100 m</span></p>
      <p class="wk-css-m"><span class="wk-grade wk-grade--${c.tier === 'tier_a' ? 'ok' : c.tier === 'tier_b' ? 'mid' : 'low'}">${TIER_LABEL[c.tier]}</span>${md(TIER[c.tier].have_zh)}</p>
      <p class="muted">${esc(c.how)}</p>
      ${c.tier === 'tier_c' ? `<p class="wk-warn">外推值：研究比對中兩筆推 400 m 平均仍偏快，建議近期補測 400 m。${c.short ? '只用 50／100 m 推，偏快更明顯（短距離會把斜率抬高）。' : ''}</p>` : ''}</div>`;
    const rows = [
      { int: 'thr', name: '閾值（CSS）', t: TYPE.threshold, mult: 1, note: `每趟 ${TYPE.threshold.distance_m.min}–${TYPE.threshold.distance_m.max} m，總量 ${esc(TYPE.threshold.volume_rule.replace('總量 ', ''))}` },
      { int: 'steady', name: '穩定有氧', t: null, mult: K_STEADY, note: `CSS × ${K_STEADY}` },
      { int: 'easy', name: '輕鬆有氧', t: TYPE.aerobic_easy, mult: K_EASY, note: `CSS × ${K_EASY}` },
    ];
    html += '<div class="wk-tablewrap"><table class="wk-table"><thead><tr><th scope="col">強度</th>' + [100, 200, 400].map(d => `<th scope="col">${d} m</th>`).join('') + '</tr></thead><tbody>';
    rows.forEach(z => {
      html += `<tr><th scope="row">${z.name}<span>${z.note}${z.t ? `<br>休 ${z.t.rest_s.min}–${z.t.rest_s.max} 秒 ${z.t.cert}` : '<br>🔵'}</span></th>`;
      [100, 200, 400].forEach(d => { html += `<td><b>${fmt(c.pace * z.mult * d / 100)}</b><button type="button" class="wk-add" data-zadd="${z.int}:${d}">加入主課</button></td>`; });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += `<p class="muted">退出規則（閾值組）：${esc(TYPE.threshold.exit)}。${esc(TYPE.threshold.continuous_note_zh || '')}</p>`;
    box.innerHTML = html;
  }

  /* ---------- 主課 ---------- */
  function mainBlock() {
    const m = M();
    let b = m.blocks.find(x => x.title === '主課');
    if (!b) { b = { title: '主課', rows: [] }; m.blocks.push(b); }
    return b;
  }
  const blankRow = (o) => normRow(Object.assign(JSON.parse(JSON.stringify(ROW_DEF)), o));
  const RND = R.send_off_rounding_sec || 5; // 出發間隔進位（swim-coach 規則表 send_off.rounding_sec）
  // 休息預設＝建議區間中值；使用者自己改過（restAuto=false）就不再覆蓋
  function autoRest(row, blockTitle) {
    if (!row.restAuto) return;
    const h = restHint(row, blockTitle);
    row.rest = h ? h.mid : 0;
    const tg = targetOf(row);
    row.sendoff = Math.ceil(((tg && tg.t ? tg.t : estSec(row)) + row.rest) / RND) * RND; // 出發間隔＝目標（沒有就估計）＋建議休息，進位
  }
  function addMain(row, label) {
    mainBlock().rows.push(blankRow(row));
    save(); renderMenu();
    toast(`已加入主課：${label || rowHead(row)}`);
  }

  /* ---------- ③ 週期與本週建議 ---------- */
  const DAY = 86400000;
  const isoToday = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const dateOf = (s) => (s ? new Date(s + 'T00:00:00') : null);
  const PHASE_NAME = { general_prep: '一般準備期', specific_prep: '專項準備期', competition: '競賽期', taper: '減量期', transition: '過渡期' };
  const PROP = { general_prep: 45, specific_prep: 25, competition: 12.5 }; // phase_proportions_zh 🟠 的區間中值（40–50／20–30／10–15）
  const MACRO_W = Math.max(...(String(PZ.macro).match(/\d+(?=\s*週)|\d+/g) || [15]).map(Number).filter(n => n > 5 && n < 30), 15);
  // 各期四類重點——轉寫自 phase_allocation.intent_by_phase（原文一併顯示）
  const FOCUS = {
    general_prep: { 有氧: ['主', '閾值與輕鬆有氧為主'], 純速: ['維持', '低量、高品質'], 賽速: ['少量', '當動作校準'], 速耐: ['不練', '不放或極少'] },
    specific_prep: { 賽速: ['主', '與閾值並重'], 有氧: ['並重', '閾值；輕鬆有氧的量讓位但不歸零'], 速耐: ['每週 ≤1 次', '乳酸耐受開始進場'], 純速: ['維持', '乳酸生成開始進場'] },
    competition: { 賽速: ['主', '保持銳利'], 純速: ['主', '速度組保持銳利'], 速耐: ['不再新增', '主賽前 10–14 天內'], 有氧: ['恢復用', '閾值與輕鬆課負責恢復'] },
    taper: { 賽速: ['保留少量', '每堂保留短賽速'], 純速: ['保留', '短爆發、完整休息'], 有氧: ['降量', '總量下降的主要來源'], 速耐: ['不練', '主賽前 10–14 天內不新增'] },
    transition: { 有氧: ['輕鬆', '不設目標時間'], 純速: ['不練', ''], 賽速: ['不練', ''], 速耐: ['不練', ''] },
  };
  const FOCUS_ORDER = ['純速', '賽速', '速耐', '有氧'];
  function pzPhase() {
    const p = S.pz;
    const race = dateOf(p.race), today = dateOf(p.today || isoToday()), mstart = dateOf(p.mstart);
    if (!race) return null;
    const days = Math.round((race - today) / DAY);
    const macroDays = mstart && mstart < race ? Math.round((race - mstart) / DAY) : MACRO_W * 7;
    const tot = PROP.general_prep + PROP.specific_prep + PROP.competition;
    const compD = Math.max(Math.round(macroDays * PROP.competition / tot), PZ.taper.max);
    const specD = Math.round(macroDays * PROP.specific_prep / tot);
    const bounds = { taper: PZ.taper.max, competition: compD, specific_prep: compD + specD, general_prep: macroDays };
    let phase, note = '';
    if (days < 0) { phase = 'transition'; note = `比賽已過 ${-days} 天。`; }
    else if (days <= bounds.taper) { phase = 'taper'; note = days > PZ.taper.min ? `減量可以從現在開始，最晚賽前 ${PZ.taper.min} 天。` : '已在減量窗內。'; }
    else if (days <= bounds.competition) phase = 'competition';
    else if (days <= bounds.specific_prep) phase = 'specific_prep';
    else { phase = 'general_prep'; if (days > macroDays) note = `離比賽 ${Math.round(days / 7)} 週，超過一個大週期（約 ${Math.round(macroDays / 7)} 週）；時間軸從賽前 ${Math.round(macroDays / 7)} 週算起，現在先當一般準備。`; }
    if (mstart && today < mstart && days >= 0) note += ' 你填的週期開始日還沒到。';
    return { days, phase, note, macroDays, bounds };
  }
  // 推薦組：組型參數全部取 set_types；取區間中值，並標明
  // 各組型的推薦組（參數全取 set_types，取區間中值）；週課表與單堂推薦共用
  function setBuilders(s) {
    // 比賽項目可能多項（使用者 2026-09-27），不在這裡選；賽速組以 25 m 一趟、100 m 賽距 × 5 的量當樣板，項目在課表列裡選
    // 項目預設：有 100 m 成績用 100，否則用最短的一筆 ≥50 m 成績；都沒有就留空（課表列裡再選）
    const race = (scale, label) => {
      const have = known(s).map(x => x[0]).filter(d => d >= 50);
      const ev = have.includes(100) ? 100 : (have[0] || 100);
      const rep = ev <= 100 ? 25 : 50, mult = ev >= 800 ? 2.5 : ev === 400 ? 4 : 5.5; // race_pace.volume_rule 取中值
      const reps = Math.max(4, Math.round(ev * mult * (scale || 1) / rep));
      return { type: 'race_pace', name: label || '賽速重複', row: { reps, dist: rep, stroke: s, int: 'race', event: have.length ? String(ev) : '', rest: raceRest(rep) },
        why: `以 ${ev} m 項目計：總量＝${ev} m × ${mult}${scale ? ` × ${scale}` : ''}（race_pace.volume_rule 取中值）；要換項目，在課表那一列改` };
    };
    const thr = () => { const x = TYPE.threshold, d = 200, vol = 2000; return { type: 'threshold', name: '閾值', row: { reps: vol / d, dist: d, stroke: s, int: 'thr', rest: r5((x.rest_s.min + x.rest_s.max) / 2) }, why: `總量取 ${esc(x.volume_rule.replace(/^總量\s*/, ''))} 的下緣` }; };
    const easy = (label) => { const x = TYPE.aerobic_easy; return { type: 'aerobic_easy', name: label || '輕鬆有氧', row: { reps: 3, dist: 400, stroke: s, int: 'easy', rest: r5((x.rest_s.min + x.rest_s.max) / 2) }, why: '量依可用時間調' }; };
    const vel = (sets) => { const x = TYPE.velocity; return { type: 'velocity', name: '純速', row: { sets: sets || x.reps.blocks, reps: 4, dist: x.distance_m.max, stroke: s, int: 'sprint', pct: 100, rest: r5((x.rest_s.min + x.rest_s.max) / 2), setRest: 0 }, why: `每趟 ${x.distance_m.min}–${x.distance_m.max} m，${x.reps.min}–${x.reps.max} 趟分 ${x.reps.blocks} 組；熱身後、還不累時做` }; };
    const tol = () => { const x = TYPE.lactate_tolerance; return { type: 'lactate_tolerance', name: '速耐', row: { reps: 5, dist: 100, stroke: s, int: 'tol', rest: 40 }, why: `每趟 ${x.distance_m.min}–${x.distance_m.max} m，${x.reps.min}–${x.reps.max} 趟，休 ${x.rest_s.min}–${x.rest_s.max} 秒；每週最多 ${x.weekly_max} 次` }; };
    const free = () => ({ type: null, name: '輕鬆游', row: { reps: 2, dist: 400, stroke: s, int: 'none', rest: 30 }, why: '過渡期不設目標時間，維持下水頻率' });
    return { race, thr, easy, vel, tol, free };
  }
  // 一週 N 堂的堂次類型：轉寫自 weekly_assembly.session_budgets 的 s1–s6（原文在畫面上並列）
  //   Q＝品質課（賽速／速耐／乳酸生成等吃力的課）、E＝輕鬆或技術、T＝閾值有氧、L＝長有氧
  const WEEK_SLOTS = { 1: ['Q'], 2: ['Q', 'E'], 3: ['Q', 'E', 'Q'], 4: ['Q', 'E', 'Q', 'T'], 5: ['Q', 'T', 'E', 'Q', 'L'], 6: ['Q', 'T', 'E', 'Q', 'L', 'E'] };
  const SLOT_NAME = { Q: '品質課', E: '輕鬆＋技術', T: '閾值有氧', L: '長有氧' };
  // 各期品質課的重點：轉寫 phase_allocation.intent_by_phase；第二堂品質課換不同意圖（weekly_assembly s3 原文）
  function qualityDay(ph, k, B) {
    const second = k % 2 === 1;
    if (ph === 'general_prep') return second ? { focus: '賽速（少量，動作校準）＋閾值', sets: [B.race(0.5, '賽速（少量）'), B.thr()] } : { focus: '純速（維持）＋閾值', sets: [B.vel(), B.thr()] };
    if (ph === 'specific_prep') return second ? { focus: '速耐（本週唯一一次）', sets: [B.tol()] } : { focus: '賽速', sets: [B.race()] };
    if (ph === 'competition') return second ? { focus: '純速', sets: [B.vel()] } : { focus: '賽速', sets: [B.race()] };
    return second ? { focus: '純速（短）', sets: [B.vel(1)] } : { focus: '賽速（減量）', sets: [B.race(0.5, '賽速（減量）')] }; // taper
  }
  function weekPlan(ph, n) {
    const B = setBuilders(S.zstroke);
    if (ph === 'transition') return Array.from({ length: n }, () => ({ slot: 'E', focus: '過渡：輕鬆游', sets: [B.free()] }));
    let q = 0, obs = false;
    return WEEK_SLOTS[n].map(sl => {
      if (sl === 'Q') return Object.assign({ slot: 'Q' }, qualityDay(ph, q++, B));
      if (sl === 'T') return { slot: 'T', focus: '閾值有氧', sets: [B.thr()] };
      if (sl === 'L') return { slot: 'L', focus: '長有氧', sets: [B.easy('長有氧')] };
      const d = { slot: 'E', focus: '輕鬆有氧＋技術（drill 自選）', sets: [B.easy()] };
      if (!obs) { obs = true; d.obs = true; } // 每週一個觀察點，掛在第一堂輕鬆課（weekly_assembly 間隔規則第 4 條）
      return d;
    });
  }
  function menuFromDay(d, k) {
    const m = newMenu(`第 ${k + 1} 堂・${d.focus}`);
    const main = m.blocks.find(b => b.title === '主課');
    d.sets.forEach(x => { const r = blankRow(Object.assign({ note: x.name, restAuto: true }, x.row)); autoRest(r, '主課'); r.rest = x.row.rest; main.rows.push(r); });
    if (d.obs) m.blocks[0].rows.push(blankRow({ reps: 1, dist: 100, stroke: S.zstroke, int: 'none', rest: 60, note: '觀察點：同池長、同出發、同距離計時一趟，和前幾週比' }));
    return m;
  }
  function renderPz() {
    const box = $('[data-wk-pzout]');
    const P = pzPhase();
    if (!P) { box.innerHTML = '<p class="muted">填目標賽事日期後開始推算。</p>'; return; }
    const s = S.zstroke;
    const b = P.bounds, tot = Math.max(b.general_prep, P.days, 1);
    const seg = (key, from, to) => `<div class="wk-tl-seg wk-tl-${key}" data-grow="${Math.max(to - from, 0)}"><span>${PHASE_NAME[key]}</span></div>`;
    const pos = P.days < 0 ? 100 : Math.max(0, Math.min(100, 100 * (1 - P.days / tot)));
    let html = `<div class="wk-pzhead"><p class="wk-css-k">現在是</p><p class="wk-pz-phase">${PHASE_NAME[P.phase]}</p>
      <p>${P.days >= 0 ? `離比賽 <b>${P.days}</b> 天（約 ${(P.days / 7).toFixed(1)} 週）` : ''}${P.note ? ' ' + esc(P.note) : ''}</p></div>`;
    if (P.days >= 0) {
      html += `<div class="wk-tl" aria-hidden="true">${seg('general_prep', b.specific_prep, tot)}${seg('specific_prep', b.competition, b.specific_prep)}${seg('competition', b.taper, b.competition)}${seg('taper', 0, b.taper)}<i class="wk-tl-now" data-pos="${pos.toFixed(1)}"></i></div>
        <p class="muted">時間軸：大週期 ${Math.round(P.macroDays / 7)} 週（${S.pz.mstart ? '依你填的開始日' : `沒填開始日，用研究觀察到的大週期長度：${esc(PZ.macro)}`}）；各期比例用教練慣例的區間中值——${md(PZ.phase_prop.split('\n')[0])}減量窗 ${PZ.taper.min}–${PZ.taper.max} 天 🟢。</p>`;
    }
    const F = FOCUS[P.phase];
    html += `<h3>這週的重點 <span class="wk-cert">${PZ.phase_cert}</span></h3><div class="wk-focus">` + FOCUS_ORDER.map(k => `<div class="wk-fc wk-fc--${F[k][0] === '主' ? 'main' : /不練|不再/.test(F[k][0]) ? 'off' : 'mid'}"><span>${k}</span><b>${F[k][0]}</b><i>${esc(F[k][1])}</i></div>`).join('') + '</div>';
    const intent = PZ.phases.find(x => x.phase === (P.phase === 'taper' ? 'competition' : P.phase));
    if (intent) html += `<p class="wk-note"><b>${esc(intent.name_zh)}原文：</b>${md(intent.emphasis_zh)}</p>`;
    html += `<p class="muted">項目越短，純速與賽速越吃重；400 m 以上有氧是主幹（各距離有氧占比：${PZ.energy.map(x => `${esc(x.event)} ${esc(x.aerobic_pct)}`).join('、')} ${PZ.energy[0] ? PZ.energy[0].cert : ''}）。</p>`;
    html += '<p class="muted">四類的對應：純速＝速度組與乳酸生成；賽速＝目標賽速重複；速耐＝乳酸耐受；有氧＝閾值（CSS）與輕鬆有氧。研究沒有「每週各練幾成」的單一答案，所以這裡只給主次，不給百分比。</p>';
    if (P.phase === 'taper' || (P.days >= 0 && P.days <= PZ.taper.max + 7)) {
      html += `<div class="wk-taper"><h3>減量怎麼做 🟢</h3><ul>
        <li>時長 ${PZ.taper.min}–${PZ.taper.max} 天：${md(PZ.taper.dur_note)}</li>
        <li>總量降 ${esc(PZ.taper.vol.typical)}（剛完成高量訓練塊降 ${esc(PZ.taper.vol.heavy_pretaper)}）</li>
        <li>${md(PZ.taper.freq)}</li><li>${esc(PZ.taper.by_event.replace(/^🟢\s*/, ''))}</li></ul></div>`;
    }
    const n = Math.min(6, Math.max(1, +S.pz.sess || 1));
    const bud = PZ.budgets.find(x => x.sessions === n);
    const week = weekPlan(P.phase, n);
    html += `<h3>這週 ${n} 堂的建議（${SZH[s]}）</h3>
      <p class="muted">照上課順序排，吃力的品質課之間隔一堂輕鬆課。每堂只給主課，暖身、drill、緩和留給你排；泳式跟著 ② 選中的那一式，目標秒數用 ① 的成績算。</p>`;
    if (bud && P.phase !== 'transition') html += `<details class="wk-more"><summary>週組裝規則原文 🔵</summary><p>${md(bud.layout_zh)}</p><p>${md(PZ.spacing).replace(/\n/g, '<br>')}</p></details>`;
    html += '<ol class="wk-week">' + week.map((d, k) => `<li class="wk-day wk-day--${d.slot}">
        <div class="wk-day-h"><b>第 ${k + 1} 堂</b><span>${SLOT_NAME[d.slot]}</span></div>
        <p class="wk-day-f">${esc(d.focus)}</p>
        <ul>${d.sets.map(x => { const row = blankRow(x.row), tg = targetOf(row), ty = x.type && TYPE[x.type];
          return `<li><b>${esc(x.name)}</b>${ty ? ` <span class="wk-cert">${ty.cert}</span>` : ''}<br>${esc(rowHead(row))}　${tg && tg.t ? '目標 ' + fmt(tg.t) : tg && tg.miss ? `<span class="wk-miss">${esc(tg.miss)}</span>` : '不設目標'}　休 ${fmt0(row.rest)}<br><span class="muted">${x.why}${ty && ty.exit ? `。退出：${esc(ty.exit)}` : ''}</span></li>`; }).join('')}</ul>
        ${d.obs ? '<p class="muted">這堂放本週的觀察點：熱身後同池長、同出發、同距離計時一趟，和前幾週比。</p>' : ''}
        <button type="button" class="wk-add" data-day="${k}">用這堂建立課表</button></li>`).join('') + '</ol>'
      + `<div class="wk-actions"><button type="button" class="wk-btn" data-weekall>整週建成 ${n} 份課表</button></div>`;
    box.innerHTML = html;
    const now = box.querySelector('.wk-tl-now'); if (now) now.style.left = now.dataset.pos + '%';
    box.querySelectorAll('.wk-tl-seg').forEach(el => { el.style.flexGrow = el.dataset.grow; }); // 比例由資料算，只能在執行時設
    box.querySelectorAll('[data-day]').forEach(btn => btn.addEventListener('click', () => {
      const k = +btn.dataset.day; S.menus.push(menuFromDay(week[k], k)); S.cur = S.menus.length - 1;
      save(); renderMenu(); toast(`已建立課表：${M().name}`); document.getElementById('wk-menu').scrollIntoView();
    }));
    box.querySelector('[data-weekall]').addEventListener('click', () => {
      week.forEach((d, k) => S.menus.push(menuFromDay(d, k))); S.cur = S.menus.length - week.length;
      save(); renderMenu(); toast(`已建立 ${week.length} 份課表，在 ⑤ 的「課表」選單切換`); document.getElementById('wk-menu').scrollIntoView();
    });
  }
  function initPz() {
    $('[data-wk-race]').value = S.pz.race;
    $('[data-wk-today]').value = S.pz.today || isoToday();
    $('[data-wk-mstart]').value = S.pz.mstart;
    $('[data-wk-sess]').value = S.pz.sess;
    const on = (sel, key, extra) => $(sel).addEventListener('change', (e) => { S.pz[key] = e.target.value; if (extra) extra(); save(); renderPz(); });
    on('[data-wk-race]', 'race'); on('[data-wk-mstart]', 'mstart'); on('[data-wk-sess]', 'sess');
    // 「今天」不存成固定值：沒改就永遠用當天日期
    $('[data-wk-today]').addEventListener('change', (e) => { S.pz.today = e.target.value === isoToday() ? '' : e.target.value; save(); renderPz(); });
  }

  /* ---------- ④ 衝刺換算：只用同式同距離的 PB ---------- */
  function renderSprint() {
    const box = $('[data-wk-sprint]');
    const ss = $('[data-wk-sstroke]');
    ss.innerHTML = STROKES.map(s => `<option value="${s.k}">${s.zh}</option>`).join('');
    ss.value = S.sstroke;
    const dists = STROKES.find(s => s.k === S.sstroke).d.filter(d => d <= 400);
    if (!dists.includes(+S.sdist)) S.sdist = String(dists[0]);
    const sd = $('[data-wk-sdist]');
    sd.innerHTML = dists.map(d => `<option value="${d}">${d} m${pb(S.sstroke, d) ? '' : baseFor(S.sstroke, d) ? '（由較長距離切段）' : '（沒有成績）'}</option>`).join('');
    sd.value = S.sdist;
    const d = +S.sdist, zh = SZH[S.sstroke];
    $('[data-wk-pctv]').textContent = S.pct;
    $('[data-wk-pct]').value = S.pct;
    const base = baseFor(S.sstroke, d);
    if (!base) {
      box.innerHTML = `<p class="wk-note">沒有${zh} ${d} m 或更長距離的成績，算不出來。先在 ① 填一筆${zh}成績。</p>`;
      return;
    }
    const p = base.t;
    const tg = p / (S.pct / 100);
    const row = blankRow({ reps: 0, dist: d, stroke: S.sstroke, int: 'sprint', pct: S.pct });
    const h = restHint(row);
    const t = d <= TYPE.velocity.distance_m.max ? TYPE.velocity : d <= TYPE.lactate_production.distance_m.max ? TYPE.lactate_production : null;
    const repsMid = t ? Math.round((t.reps.min + t.reps.max) / 2) : 4;
    const pcts = [80, 85, 88, 90, 92, 95, 98, 100];
    let html = `<div class="wk-sp"><p class="wk-css-k">${zh} ${d} m 目標</p><p class="wk-sp-v">${fmt(tg, 2)}</p>
      <p class="muted">${base.split ? `基準 ${fmt(p, 2)}＝${zh} ${base.D} m 成績 ${fmt(base.T, 2)} ÷ ${base.D / d}` : `PB ${fmt(p, 2)}`} ÷ ${S.pct}%</p>
      ${base.split ? `<p class="wk-note">沒有${zh} ${d} m 成績，基準用 ${base.D} m 成績平均切段${base.D === 50 && d === 25 ? '（跳水比蹬牆快、距離短速度較快，兩者大致抵銷，直接 ÷ 2）' : `；這是 ${base.D} m 的比賽配速，比 ${d} m 全力慢一些`}。有 ${d} m 成績填進 ① 就改用它。</p>` : ''}</div>
      <div class="wk-quick" aria-label="速查">${pcts.map(x => `<button type="button" class="wk-q${x === +S.pct ? ' is-on' : ''}" data-pct="${x}"><span>${x}%</span><b>${fmt(p / (x / 100), 2)}</b></button>`).join('')}</div>`;
    if (t) html += `<p class="wk-note"><b>${t.key === 'velocity' ? '純速組' : '乳酸生成組'} ${t.cert}：</b>每趟 ${t.distance_m.min}–${t.distance_m.max} m，${t.reps.min}–${t.reps.max} 趟，休 ${fmt0(t.rest_s.min)}–${fmt0(t.rest_s.max)}。退出：${esc(t.exit)}。</p>`;
    else html += '<p class="wk-note">衝刺組的休息參數只到 50 m；這個距離的休息請自己決定。</p>';
    html += `<div class="wk-sp-add"><div class="wk-field"><span>趟數</span><input type="number" inputmode="numeric" min="1" max="40" value="${repsMid}" data-sp-reps></div>
      <div class="wk-field"><span>休息</span>${tfHtml('data-sp-rest', h ? h.mid : null, 0, '休息')}</div>
      <button type="button" class="wk-btn wk-btn--main" data-sp-add>加入主課</button></div>`;
    box.innerHTML = html;
    box.querySelectorAll('[data-pct]').forEach(b => b.addEventListener('click', () => { S.pct = +b.dataset.pct; save(); renderSprint(); }));
    box.querySelector('[data-sp-add]').addEventListener('click', () => {
      row.reps = +box.querySelector('[data-sp-reps]').value || repsMid;
      row.rest = readTF(box.querySelector('[data-sp-rest]')) || (h ? h.mid : 0);
      addMain(row);
    });
  }

  /* ---------- ⑤ 排課表 ---------- */
  const openEq = new Set(), openAdv = new Set();
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
  function tgHtml(row) {
    if (row.int === 'none' || NO_AUTO[row.mode] && row.int !== 'custom') return '<span class="muted">到牆自己按</span>';
    if (row.int === 'custom') return '';
    const tg = targetOf(row);
    if (tg && tg.t) return `目標 <b>${fmt(tg.t)}</b>${tg.note ? `<span class="wk-tgn">${esc(tg.note)}</span>` : ''}`;
    return `<span class="wk-miss">${esc(tg ? tg.miss : '')}，沒有目標</span>`;
  }
  function hintHtml(row, bi) {
    const h = restHint(row, M().blocks[bi] && M().blocks[bi].title);
    if (!h) return '';
    const txt = h.min === h.max ? fmt0(h.min) : `${fmt0(h.min)}–${fmt0(h.max)}`;
    return `建議休 ${txt}（${esc(h.why)}）${row.restAuto ? '，已帶入中值' : `<button type="button" class="wk-apply" data-apply="${h.mid}">改回 ${fmt0(h.mid)}</button>`}`;
  }
  function eventOptions(row) {
    const s = baseStroke(row.stroke);
    const evs = known(s).map(x => x[0]).filter(d => d >= row.dist && d >= 50);
    if (!evs.length) return '<option value="">（沒有可用的比賽成績）</option>';
    return '<option value="">以哪個項目的成績？</option>' + evs.map(d => `<option value="${d}"${String(d) === String(row.event) ? ' selected' : ''}>${d} m 成績</option>`).join('');
  }
  function rowHtml(row, bi, ri) {
    const ints = NO_AUTO[row.mode] ? { none: INTS.none, custom: INTS.custom } : INTS;
    if (!ints[row.int]) row.int = 'none';
    const d = drillOf(row.drill);
    const key = bi + '-' + ri;
    const eq = row.equip || [];
    return `<li class="wk-r" data-b="${bi}" data-r="${ri}">
      <div class="wk-r-line wk-r-count">
        <label class="wk-in"><input type="number" inputmode="numeric" min="1" max="20" value="${row.sets || 1}" data-f="sets" aria-label="組數"><span>組 ×</span></label>
        <label class="wk-in"><input type="number" inputmode="numeric" min="1" max="99" value="${row.reps}" data-f="reps" aria-label="每組趟數"><span>趟 ×</span></label>
        <label class="wk-in"><input type="number" inputmode="numeric" min="10" max="3000" step="5" value="${row.dist}" data-f="dist" aria-label="距離"><span>m</span></label>
        <span class="wk-r-sum muted" data-rsum>${rowDist(row)} m</span>
      </div>
      <div class="wk-r-line">
        <select data-f="stroke" aria-label="泳式">${opt(SZH, row.stroke)}</select>
        <select data-f="mode" aria-label="游法">${opt(MODES, row.mode)}</select>
      </div>
      ${row.mode === 'drill' ? `<div class="wk-r-line"><select class="wk-r-drill" data-f="drill" aria-label="drill">${drillOptions(row)}</select>${d && d.url ? `<a class="wk-r-link" href="${d.url}">看這個 drill</a>` : ''}</div>${d && d.cue ? `<p class="wk-r-cue">${esc(d.cue)}</p>` : ''}` : ''}
      <div class="wk-r-line">
        <select data-f="int" aria-label="強度">${opt(ints, row.int)}</select>
        ${row.int === 'sprint' ? `<label class="wk-in"><input type="number" inputmode="numeric" min="50" max="100" value="${row.pct}" data-f="pct" aria-label="強度百分比"><span>%</span></label>` : ''}
        ${row.int === 'race' ? `<select data-f="event" aria-label="比賽距離">${eventOptions(row)}</select>` : ''}
        ${row.int === 'pbplus' ? `<label class="wk-in"><span>PB ＋</span><input type="number" step="0.5" value="${row.pbPlus}" data-f="pbPlus" aria-label="比 PB 慢幾秒"><span>秒</span></label>` : ''}
        ${row.int === 'custom' ? `<span class="wk-in"><span>目標</span>${tfHtml('data-tff="target"', parseT(row.target), 2, '目標秒數')}</span>` : ''}
        <span class="wk-r-tg" data-rtg>${tgHtml(row)}</span>
      </div>
      <div class="wk-r-line">
        <select data-f="restMode" aria-label="休息方式">${opt({ rest: '每趟休息', sendoff: '出發間隔' }, row.restMode)}</select>
        ${row.restMode === 'sendoff' ? `<span class="wk-in"><span>每</span>${tfHtml('data-tff="sendoff"', row.sendoff, 0, '出發間隔')}<span>出發</span></span>` : tfHtml('data-tff="rest"', row.rest, 0, '每趟休息')}
        <span class="wk-in" data-setrest${(row.sets || 1) > 1 ? '' : ' hidden'}><span>組間休息</span>${tfHtml('data-tff="setRest"', row.setRest, 0, '組間休息')}</span>
      </div>
      <p class="wk-hint" data-rhint>${hintHtml(row, bi)}</p>
      <details class="wk-r-adv" data-adv="${key}"${openAdv.has(key) ? ' open' : ''}><summary>進階：<span data-advs>${esc(advText(row) || '逐趟遞減、分段游')}</span></summary>
        <div class="wk-r-line"><span>逐趟變化</span><select data-f="stepOn" aria-label="逐趟變化的項目">${opt(STEP_ON, row.stepOn)}</select>
          <label class="wk-in"><span>每趟</span><input type="number" step="0.5" value="${row.stepSec}" data-f="stepSec" aria-label="每趟加減秒數"><span>秒</span></label>
          <label class="wk-in"><span>每</span><input type="number" inputmode="numeric" min="0" max="20" value="${row.stepCycle || ''}" placeholder="—" data-f="stepCycle" aria-label="幾趟重來"><span>趟重來</span></label></div>
        <p class="muted">負數＝一趟比一趟快（遞減）；填「每 4 趟重來」就是 1–4 遞減。</p>
        <div class="wk-r-line"><span>分段游</span><label class="wk-in"><span>每</span><input type="number" inputmode="numeric" min="0" step="25" value="${row.brokenEvery || ''}" placeholder="—" data-f="brokenEvery" aria-label="每幾公尺停"><span>m 停</span></label>
          <label class="wk-in"><input type="number" inputmode="numeric" min="0" value="${row.brokenRest}" data-f="brokenRest" aria-label="分段停幾秒"><span>秒</span></label></div>
      </details>
      <details class="wk-r-eq" data-eq="${key}"${openEq.has(key) ? ' open' : ''}><summary>器材：${eq.length ? esc(rowEquip(row)) : '不用'}</summary>
        <div class="wk-chips">${allEquip().map(k => `<button type="button" class="wk-chip" aria-pressed="${eq.includes(k)}" data-eqk="${esc(k)}">${esc(eqName(k))}</button>`).join('')}</div>
      </details>
      <input class="wk-r-note" type="text" value="${esc(row.note || '')}" placeholder="備註（例如：每 25 m 換氣 3 次）" data-f="note" aria-label="備註">
      <div class="wk-r-act">
        <button type="button" data-act="up" aria-label="往上移">↑</button><button type="button" data-act="down" aria-label="往下移">↓</button>
        <button type="button" data-act="dup">複製</button><button type="button" data-act="save">存成常用</button><button type="button" data-act="del" aria-label="刪除這一列">刪除</button>
      </div>
    </li>`;
  }
  // 內建測驗組：CSS 測驗（canonical 的 200＋400 錨點）、7×200 漸進測驗（Topend Sports 協定：每 6 分鐘出發；
  // 青少年版為 PB＋24、+20、+16、+12、+8、PB、目標 PB，這裡簡化成每趟快 4 秒）
  const BUILTIN = [
    { name: 'CSS 測驗：400 全力＋200 全力', rows: [
      { reps: 1, dist: 400, int: 'none', rest: 600, note: '全力，記下秒數填回 ①；游完充分休息（先填 10 分鐘，可改）' },
      { reps: 1, dist: 200, int: 'none', rest: 0, note: '全力，記下秒數填回 ①' }] },
    { name: '7 × 200 漸進測驗（每 6 分鐘出發）', rows: [
      { reps: 7, dist: 200, int: 'pbplus', pbPlus: 24, restMode: 'sendoff', sendoff: 360, stepOn: 'target', stepSec: -4, note: '從 PB＋24 秒起每趟快 4 秒，最後一趟全力；記下每趟秒數' }] },
  ];
  const insOptions = () => '<option value="">＋ 插入常用組…</option><optgroup label="測驗組">' + BUILTIN.map((x, i) => `<option value="b:${i}">${esc(x.name)}</option>`).join('') + '</optgroup>'
    + (S.lib.length ? '<optgroup label="我的常用組">' + S.lib.map((x, i) => `<option value="u:${i}">${esc(x.name)}</option>`).join('') + '</optgroup>' : '');
  const blockDist = (b) => b.rows.reduce((a, r) => a + rowDist(r), 0);
  function totals() {
    const rows = M().blocks.flatMap(b => b.rows);
    const dist = rows.reduce((a, r) => a + rowDist(r), 0);
    const sec = rows.reduce((a, r) => a + rowSec(r), 0);
    $('[data-wk-total]').textContent = rows.length ? `共 ${dist} m，約 ${Math.round(sec / 60)} 分鐘（有目標的用目標秒數，其餘用輕鬆有氧配速估算）` : '';
    root.querySelectorAll('.wk-blk').forEach(el => { const b = M().blocks[+el.dataset.b]; if (b) el.querySelector('[data-bdist]').textContent = blockDist(b) + ' m'; });
    renderSum();
  }
  function renderMenu() {
    const m = M();
    $('[data-wk-menus]').innerHTML = S.menus.map((x, i) => `<option value="${i}"${i === S.cur ? ' selected' : ''}>${esc(x.name || '未命名')}</option>`).join('');
    $('[data-wk-mname]').value = m.name || '';
    $('[data-wk-blocks]').innerHTML = m.blocks.map((b, bi) => `<section class="wk-blk" data-b="${bi}">
      <div class="wk-blk-h">
        <input class="wk-blk-t" type="text" value="${esc(b.title)}" data-bt aria-label="段落名稱">
        <span class="muted" data-bdist></span>
        <span class="wk-r-act"><button type="button" data-bact="up" aria-label="整段往上">↑</button><button type="button" data-bact="down" aria-label="整段往下">↓</button><button type="button" data-bact="save">存整段</button><button type="button" data-bact="del" aria-label="刪除整段">刪除</button></span>
      </div>
      <ol class="wk-rows">${b.rows.map((r, ri) => rowHtml(r, bi, ri)).join('')}</ol>
      <button type="button" class="wk-addrow" data-addrow="${bi}">＋ 在「${esc(b.title)}」加一列</button>
      <select class="wk-ins" data-ins="${bi}" aria-label="插入常用組">${insOptions()}</select>
    </section>`).join('');
    totals();
  }
  function replaceRow(li) {
    const bi = +li.dataset.b, ri = +li.dataset.r;
    // 展開狀態直接從畫面讀（toggle 事件是非同步的，不能靠它）
    li.querySelectorAll('details[data-eq], details[data-adv]').forEach(d => { const set = d.dataset.eq ? openEq : openAdv, k = d.dataset.eq || d.dataset.adv; if (d.open) set.add(k); else set.delete(k); });
    li.outerHTML = rowHtml(M().blocks[bi].rows[ri], bi, ri);
    totals();
  }
  function newRow(bi) {
    const t = (M().blocks[bi].title || '').trim();
    const row = blankRow({ reps: t === '暖身' || t === '緩和' ? 1 : 4, dist: t === '暖身' ? 200 : t === '緩和' ? 100 : 50, mode: t.toLowerCase() === 'drill' ? 'drill' : 'swim',
      int: t === '主課' ? 'thr' : t === '暖身' || t === '緩和' ? 'easy' : 'none', restAuto: true });
    autoRest(row, t);
    return row;
  }
  const blocksEl = $('[data-wk-blocks]');
  const rowOf = (li) => M().blocks[+li.dataset.b].rows[+li.dataset.r];
  const refreshRow = (li, row) => {
    li.querySelector('[data-rtg]').innerHTML = tgHtml(row);
    li.querySelector('[data-rsum]').textContent = rowDist(row) + ' m';
    li.querySelector('[data-setrest]').hidden = !((row.sets || 1) > 1);
    li.querySelector('[data-rhint]').innerHTML = hintHtml(row, +li.dataset.b);
    const as = li.querySelector('[data-advs]'); if (as) as.textContent = advText(row) || '逐趟遞減、分段游';
  };
  const syncRest = (li, row) => {
    if (!row.restAuto) return;
    autoRest(row, M().blocks[+li.dataset.b].title);
    const rf = li.querySelector('[data-tff="rest"]'); if (rf) setTF(rf, row.rest);
    const sf = li.querySelector('[data-tff="sendoff"]'); if (sf) setTF(sf, row.sendoff);
  };
  const FREE_NUM = { stepSec: 1, stepCycle: 1, brokenEvery: 1, brokenRest: 1, pbPlus: 1 };
  // 打字：只改狀態與衍生文字，不重畫
  blocksEl.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches('[data-bt]')) {
      const blk = el.closest('.wk-blk'); M().blocks[+blk.dataset.b].title = el.value;
      blk.querySelector('[data-addrow]').textContent = `＋ 在「${el.value}」加一列`;
      save(); renderSum(); return;
    }
    const li = el.closest('.wk-r'); if (!li) return;
    const row = rowOf(li);
    const tf = el.closest('.wk-tf');
    if (tf) { const v = readTF(tf); const f = tf.dataset.tff; row[f] = f === 'target' ? v : (v || 0); if (f === 'rest' || f === 'sendoff') row.restAuto = false; }
    else if (el.tagName === 'INPUT' && el.dataset.f) {
      const f = el.dataset.f;
      if (f === 'note') row.note = el.value;
      else if (FREE_NUM[f]) { if (el.value === '') row[f] = 0; else if (Number.isFinite(+el.value)) row[f] = +el.value; else return; if (f === 'pbPlus') syncRest(li, row); }
      else if (+el.value >= 1) { row[f] = +el.value; if (f === 'dist' || f === 'pct') syncRest(li, row); }
    } else return;
    refreshRow(li, row);
    save(); totals();
  });
  // 失焦：時間格整理成「分:秒」；下拉選單：改結構，只重畫這一列
  blocksEl.addEventListener('change', (e) => {
    const el = e.target;
    if (el.matches('[data-ins]')) {
      const [k, i] = el.value.split(':');
      const src = k === 'b' ? BUILTIN[+i] : k === 'u' ? S.lib[+i] : null;
      if (src) {
        const rows = src.rows.map(r => (k === 'b' ? blankRow(Object.assign({ stroke: S.zstroke }, r)) : normRow(JSON.parse(JSON.stringify(r)))));
        M().blocks[+el.dataset.ins].rows.push(...rows);
        save(); renderMenu(); toast(`已插入：${src.name}`);
      }
      return;
    }
    const tf = el.closest('.wk-tf');
    if (tf) return;
    if (el.tagName !== 'SELECT') return;
    const li = el.closest('.wk-r'); if (!li) return;
    const row = rowOf(li), f = el.dataset.f, v = el.value;
    if (f === 'drill') {
      const old = drillOf(row.drill), d = drillOf(v);
      row.drill = v; // 換 drill 時拿掉上一個 drill 帶進來的器材，保留使用者自己勾的
      row.equip = (row.equip || []).filter(k => !(old && old.equip.includes(k)));
      if (d) row.equip = Array.from(new Set(row.equip.concat(d.equip)));
    } else if (f === 'mode') {
      row.mode = v;
      if (NO_AUTO[v] && !{ none: 1, custom: 1 }[row.int]) row.int = 'none';
    } else row[f] = v;
    if (f === 'int') delete row.intLabel;
    if (f === 'mode' || f === 'int' || f === 'stroke') { row.restAuto = true; autoRest(row, M().blocks[+li.dataset.b].title); }
    else if (f === 'event' || f === 'restMode') syncRestNoDom(row, +li.dataset.b);
    save(); replaceRow(li);
  });
  const syncRestNoDom = (row, bi) => { if (row.restAuto) autoRest(row, M().blocks[bi].title); };
  blocksEl.addEventListener('toggle', (e) => {
    const d = e.target; if (!d.matches) return;
    if (d.matches('[data-eq]')) { if (d.open) openEq.add(d.dataset.eq); else openEq.delete(d.dataset.eq); }
    if (d.matches('[data-adv]')) { if (d.open) openAdv.add(d.dataset.adv); else openAdv.delete(d.dataset.adv); }
  }, true);
  const move = (arr, i, j) => { if (j < 0 || j >= arr.length) return; const [x] = arr.splice(i, 1); arr.splice(j, 0, x); };
  blocksEl.addEventListener('click', (e) => {
    const m = M();
    const btn = e.target.closest('button'); if (!btn) return;
    if (btn.dataset.addrow != null) {
      const bi = +btn.dataset.addrow; m.blocks[bi].rows.push(newRow(bi)); save(); renderMenu();
      const rows = blocksEl.querySelectorAll(`.wk-blk[data-b="${bi}"] .wk-r`); rows[rows.length - 1].scrollIntoView({ block: 'nearest' });
      return;
    }
    if (btn.dataset.bact) {
      const bi = +btn.closest('.wk-blk').dataset.b;
      if (btn.dataset.bact === 'save') {
        if (!m.blocks[bi].rows.length) { toast('這一段還是空的'); return; }
        const name = prompt('常用組的名字', m.blocks[bi].title); if (!name) return;
        S.lib.push({ name, rows: JSON.parse(JSON.stringify(m.blocks[bi].rows)) }); save(); renderMenu(); renderMine(); toast(`已存成常用組：${name}`); return;
      }
      if (btn.dataset.bact === 'del') { if (m.blocks[bi].rows.length && !confirm(`刪除「${m.blocks[bi].title}」整段？`)) return; m.blocks.splice(bi, 1); }
      else move(m.blocks, bi, bi + (btn.dataset.bact === 'up' ? -1 : 1));
      openEq.clear(); openAdv.clear(); save(); renderMenu(); return;
    }
    const li = btn.closest('.wk-r'); if (!li) return;
    const bi = +li.dataset.b, ri = +li.dataset.r, rows = m.blocks[bi].rows, row = rows[ri];
    if (btn.dataset.apply != null) { row.restAuto = true; syncRest(li, row); save(); refreshRow(li, row); totals(); return; }
    if (btn.dataset.eqk) {
      const k = btn.dataset.eqk; row.equip = row.equip || [];
      row.equip = row.equip.includes(k) ? row.equip.filter(x => x !== k) : row.equip.concat(k);
      save(); replaceRow(li); return;
    }
    const a = btn.dataset.act;
    if (a === 'save') {
      const name = prompt('常用組的名字', rowHead(row)); if (!name) return;
      S.lib.push({ name, rows: [JSON.parse(JSON.stringify(row))] }); save(); renderMenu(); renderMine(); toast(`已存成常用組：${name}`); return;
    }
    if (a === 'del') rows.splice(ri, 1);
    else if (a === 'dup') rows.splice(ri + 1, 0, JSON.parse(JSON.stringify(row)));
    else if (a === 'up' || a === 'down') {
      const j = ri + (a === 'up' ? -1 : 1);
      if (j >= 0 && j < rows.length) move(rows, ri, j);
      else if (j < 0 && bi > 0) { rows.splice(ri, 1); m.blocks[bi - 1].rows.push(row); } // 移到上一段末尾
      else if (j >= rows.length && bi < m.blocks.length - 1) { rows.splice(ri, 1); m.blocks[bi + 1].rows.unshift(row); }
    }
    openEq.clear(); openAdv.clear(); save(); renderMenu();
  });

  /* ---------- ⑥ 清單 ---------- */
  function sumBits(row) {
    const so = row.restMode === 'sendoff' && row.sendoff > 0;
    return [rowInt(row), so ? `每 ${fmt0(row.sendoff)} 出發` : row.rest ? '每趟休 ' + fmt0(row.rest) : '', (row.sets || 1) > 1 && row.setRest ? '組間休 ' + fmt0(row.setRest) : '',
      stepText(row), brokenText(row), rowEquip(row), row.note || ''].filter(Boolean);
  }
  // 總量統計：依泳式、游法、強度加總距離
  function volStats(rows) {
    const tot = rows.reduce((a, r) => a + rowDist(r), 0) || 1;
    const group = (keyFn) => { const o = {}; rows.forEach(r => { const k = keyFn(r); o[k] = (o[k] || 0) + rowDist(r); }); return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, Math.round(v * 100 / tot)]); };
    return [['泳式', group(r => SZH[r.stroke])], ['游法', group(r => MODES[r.mode])], ['強度', group(r => (NO_AUTO[r.mode] && r.int !== 'custom' ? INTS.none : r.int === 'custom' && r.intLabel ? r.intLabel : INTS[r.int]))]];
  }
  function renderSum() {
    const m = M();
    const blocks = m.blocks.filter(b => b.rows.length);
    if (!blocks.length) { $('[data-wk-sum]').innerHTML = '<p class="muted">課表還是空的。</p>'; return; }
    let n = 0;
    $('[data-wk-sum]').innerHTML = `<p class="wk-sum-t">${esc(m.name || '課表')}<span>${esc($('[data-wk-total]').textContent)}</span></p>` + blocks.map(b =>
      `<div class="wk-sum-b"><p class="wk-sum-h">${esc(b.title)}<span>${blockDist(b)} m</span></p><ol>` +
      b.rows.map(r => { n += 1; const bits = sumBits(r); return `<li><i>${n}</i><div><b>${esc(rowHead(r))}</b>${bits.length ? `<span>${esc(bits.join(' · '))}</span>` : ''}</div></li>`; }).join('') + '</ol></div>').join('')
      + '<div class="wk-vol">' + volStats(m.blocks.flatMap(b => b.rows)).map(([lab, g]) => `<p><em>${lab}</em>${g.map(([k, v, pc]) => `<span>${esc(k)} <b>${v} m</b> ${pc}%</span>`).join('')}</p>`).join('') + '</div>';
  }
  function sumText() {
    const m = M();
    const out = [m.name || '課表'];
    m.blocks.filter(b => b.rows.length).forEach(b => {
      out.push('', `【${b.title}】${blockDist(b)} m`);
      b.rows.forEach(r => { const bits = sumBits(r); out.push(rowHead(r) + (bits.length ? '  ' + bits.join(' · ') : '')); });
    });
    out.push('', $('[data-wk-total]').textContent);
    volStats(m.blocks.flatMap(b => b.rows)).forEach(([lab, g]) => out.push(`${lab}：` + g.map(([k, v, pc]) => `${k} ${v} m（${pc}%）`).join('、')));
    return out.join('\n');
  }
  $('[data-wk-copy]').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(sumText()); b.textContent = '已複製'; } catch (_) { b.textContent = '瀏覽器不允許複製'; }
    setTimeout(() => { b.textContent = '複製成文字'; }, 2000);
  });
  // 列印：把清單複製到 body 最外層，列印時只顯示它（放在原位會被外殼版面的定位與隱藏規則影響）
  $('[data-wk-print]').addEventListener('click', () => {
    let pr = document.getElementById('wk-print');
    if (!pr) { pr = document.createElement('div'); pr.id = 'wk-print'; pr.className = 'wk-sumwrap'; document.body.appendChild(pr); }
    pr.innerHTML = $('[data-wk-sum]').innerHTML;
    document.body.classList.add('wk-printing');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('wk-printing'));
  // 分享連結：整份課表（連同用到的自訂 drill、器材）壓縮後放進網址 #m=…；對方打開就能匯入，目標秒數用對方自己的成績算
  const b64u = (bytes) => { let s = ''; bytes.forEach(c => { s += String.fromCharCode(c); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  async function pack(obj) {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (window.CompressionStream) return 'z' + b64u(new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()));
    return 'j' + b64u(raw);
  }
  async function unpack(s) {
    const bytes = unb64u(s.slice(1));
    const buf = s[0] === 'z' ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer() : bytes;
    return JSON.parse(new TextDecoder().decode(buf));
  }
  $('[data-wk-share]').addEventListener('click', async () => {
    const m = M(), rows = m.blocks.flatMap(b => b.rows);
    const ids = new Set(rows.map(r => r.drill).filter(x => x && x.startsWith('my:')));
    const eqs = new Set(rows.flatMap(r => r.equip || []).filter(k => k.startsWith('x:')));
    // 成績不存、對方也沒有你的成績：把目前算得出的目標秒數固定成自訂秒數，對方打開就能直接跑
    const frozen = JSON.parse(JSON.stringify(m));
    frozen.blocks.forEach(b => b.rows.forEach(r => {
      r.restAuto = false;
      if (r.int === 'custom' || r.int === 'none' || NO_AUTO[r.mode]) return;
      const tg = targetOf(r);
      if (tg && tg.t) { r.intLabel = rowInt(r).replace(/\s*目標.*$/, ''); r.target = +tg.t.toFixed(2); r.int = 'custom'; }
    }));
    const url = location.href.split('#')[0] + '#m=' + await pack({ v: 1, menu: frozen, drills: S.myDrills.filter(d => ids.has('my:' + d.id)), equip: [...eqs].map(k => k.slice(2)) });
    if (navigator.share) { try { await navigator.share({ title: m.name, url }); return; } catch (_) { /* 取消分享就改成複製 */ } }
    try { await navigator.clipboard.writeText(url); toast('分享連結已複製'); } catch (_) { prompt('複製這個連結：', url); }
  });
  async function importShared() {
    const h = location.hash;
    if (!h.startsWith('#m=')) return;
    history.replaceState(null, '', location.pathname + location.search);
    try {
      const d = await unpack(h.slice(3));
      if (!d || !d.menu || !Array.isArray(d.menu.blocks)) throw new Error('bad');
      if (!confirm(`匯入分享的課表「${d.menu.name || '課表'}」？目標秒數會用你自己在 ① 填的成績算。`)) return;
      (d.drills || []).forEach(x => { if (!S.myDrills.some(y => y.id === x.id)) S.myDrills.push(x); });
      (d.equip || []).forEach(n => { if (!S.myEquip.includes(n)) S.myEquip.push(n); });
      d.menu.blocks.forEach(b => b.rows.forEach(normRow));
      S.menus.push(d.menu); S.cur = S.menus.length - 1;
      save(); renderMenu(); renderMine(); toast(`已匯入：${d.menu.name || '課表'}`);
      $('#wk-sum') && document.getElementById('wk-sum').scrollIntoView();
    } catch (_) { toast('這個分享連結讀不出來'); }
  }

  /* ---------- ⑦ 我的 drill 與器材 ---------- */
  let draftEq = [];
  function renderMine() {
    $('[data-wk-deq]').innerHTML = allEquip().map(k => `<button type="button" class="wk-chip" aria-pressed="${draftEq.includes(k)}" data-deqk="${esc(k)}">${esc(eqName(k))}</button>`).join('');
    $('[data-wk-dlist]').innerHTML = S.myDrills.map((d, i) => `<li><span><b>${esc(d.name)}</b>${d.stroke !== 'any' ? '・' + SZH[d.stroke] : ''}${d.cue ? '<br>' + esc(d.cue) : ''}${(d.equip || []).length ? '<br>器材：' + esc(d.equip.map(eqName).join('、')) : ''}</span><button type="button" class="wk-del" data-ddel="${i}" aria-label="刪除 ${esc(d.name)}">✕</button></li>`).join('') || '<li class="muted">還沒有自訂 drill。</li>';
    $('[data-wk-llist]').innerHTML = S.lib.map((x, i) => `<li><span><b>${esc(x.name)}</b><br>${esc(x.rows.map(rowHead).join('；'))}</span><button type="button" class="wk-del" data-ldel="${i}" aria-label="刪除 ${esc(x.name)}">✕</button></li>`).join('') || '<li class="muted">還沒有常用組。在課表的一列按「存成常用」，或一段按「存整段」。</li>';
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
    save(); renderMine(); renderMenu(); toast(`已新增 drill：${name}`);
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
  $('[data-wk-llist]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ldel]'); if (!b) return;
    if (!confirm(`刪除常用組「${S.lib[+b.dataset.ldel].name}」？`)) return;
    S.lib.splice(+b.dataset.ldel, 1); save(); renderMine(); renderMenu();
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

  /* ---------- 語音報讀 ---------- */
  const sayT = (x) => { x = Math.round(x * 10) / 10; if (x < 60) return `${x} 秒`; const m = Math.floor(x / 60), s = Math.round(x - m * 60); return s ? `${m} 分 ${s} 秒` : `${m} 分鐘`; };
  function say(text) {
    if (!S.voice || !window.speechSynthesis) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-TW'; speechSynthesis.speak(u); } catch (_) { /* 不支援語音就只有嗶聲 */ }
  }
  const sayRep = (st) => {
    const d = st.row.mode === 'drill' ? drillOf(st.row.drill) : null;
    const mode = st.row.mode === 'swim' ? '' : st.row.mode === 'drill' ? ' drill' + (d ? ' ' + d.name : '') : ' ' + MODES[st.row.mode];
    return `${st.segD} 公尺 ${SZH[st.row.stroke]}${mode}${st.target ? `，目標 ${sayT(st.target)}` : ''}`;
  };

  /* ---------- 計時器：整份課表逐列、逐組、逐趟（含分段）跑 ---------- */
  const T = root.parentElement.querySelector('[data-wk-timer]');
  const tq = (s) => T.querySelector(s);
  let seq = [], idx = 0, phase = 'ready', t0 = 0, paused = 0, pausedAt = 0, beeped = {}, timer = null, log = [], repT0 = 0;
  let adj = new Map(); // 臨場調整：row → {t: 目標秒數加減, r: 休息／出發間隔加減}；只影響這次計時，不改存好的課表
  let rowIdx = new Map(), lastHi = -1;

  function build() {
    seq = [];
    M().blocks.forEach(b => b.rows.forEach(row => {
      const tg = targetOf(row), base = tg && tg.t ? tg.t : null;
      const sets = row.sets || 1, so = row.restMode === 'sendoff' && row.sendoff > 0, segs = segsOf(row);
      for (let s = 1; s <= sets; s++) {
        for (let r = 1; r <= row.reps; r++) {
          const k = row.stepCycle > 0 ? (r - 1) % row.stepCycle : r - 1;
          const dlt = row.stepOn && row.stepOn !== 'none' ? (+row.stepSec || 0) * k : 0;
          const target = base != null ? Math.max(1, base + (row.stepOn === 'target' ? dlt : 0)) : null;
          const sendoff = so ? Math.max(5, row.sendoff + (row.stepOn === 'sendoff' ? dlt : 0)) : null;
          for (let g = 1; g <= segs; g++) {
            const segD = g < segs ? row.brokenEvery : row.dist - row.brokenEvery * (segs - 1);
            seq.push({ kind: 'swim', b, row, s, r, g, segs, segD, first: g === 1, target: target != null ? target * segD / row.dist : null, sendoff: g === segs ? sendoff : null });
            if (g < segs && row.brokenRest > 0) seq.push({ kind: 'rest', b, row, sec: row.brokenRest, broken: true });
          }
          if (r === row.reps && s < sets) { if (row.setRest > 0) seq.push({ kind: 'rest', b, row, sec: row.setRest, setBreak: true }); }
          else if (so) seq.push({ kind: 'rest', b, row, sec: 0, dyn: true, sendoff });
          else { const sec = Math.max(0, row.rest + (row.stepOn === 'rest' ? dlt : 0)); if (sec > 0) seq.push({ kind: 'rest', b, row, sec }); }
        }
      }
    }));
    while (seq.length && seq[seq.length - 1].kind === 'rest') seq.pop(); // 最後一趟之後不休息
  }
  const now = () => performance.now() / 1000;
  const elapsed = () => (pausedAt ? pausedAt : now()) - t0 - paused;
  const begin = (p) => { phase = p; t0 = now(); paused = 0; pausedAt = 0; beeped = {}; };
  const nextSwim = (i) => { for (let j = i; j < seq.length; j++) if (seq[j].kind === 'swim') return seq[j]; return null; };
  const swimLine = (st) => `${rowHead(st.row)}（${(st.row.sets || 1) > 1 ? `第 ${st.s}/${st.row.sets} 組・` : ''}第 ${st.r}/${st.row.reps} 趟${st.segs > 1 ? `・第 ${st.g}/${st.segs} 段` : ''}）`;
  const drillLine = (row) => {
    const d = row.mode === 'drill' ? drillOf(row.drill) : null;
    return [d && d.cue, rowEquip(row) && '器材：' + rowEquip(row), row.note].filter(Boolean).join('　');
  };
  const adjText = (row) => {
    const a = adj.get(row); if (!a) return '';
    const bits = [];
    if (a.t) bits.push(`目標 ${a.t > 0 ? '+' : '−'}${Math.abs(a.t)} 秒`);
    if (a.r) bits.push(`${row.restMode === 'sendoff' ? '出發間隔' : '休息'} ${a.r > 0 ? '+' : '−'}${Math.abs(a.r)} 秒`);
    return bits.length ? '這一列已調整：' + bits.join('、') + '（只影響這次）' : '';
  };
  function renderSide() {
    const items = []; rowIdx = new Map();
    M().blocks.forEach(b => b.rows.forEach(r => { rowIdx.set(r, items.length); const x = [rowInt(r), sumBits(r)[1]].filter(Boolean).join(' · '); items.push(`<li data-k="${items.length}"><span>${esc(b.title)}</span><b>${esc(rowHead(r))}</b>${x ? `<i>${esc(x)}</i>` : ''}</li>`); }));
    tq('[data-wk-t-list]').innerHTML = items.join(''); lastHi = -1;
  }
  function highlight() {
    const c = seq[idx]; if (!c) return;
    const k = rowIdx.get(c.row); if (k === lastHi) return; lastHi = k;
    tq('[data-adj="r:10"]').parentElement.querySelector('span').textContent = c.row.restMode === 'sendoff' ? '出發' : '休息';
    tq('[data-wk-t-list]').querySelectorAll('li').forEach(li => { const on = +li.dataset.k === k; li.classList.toggle('is-now', on); if (on) li.scrollIntoView({ block: 'nearest' }); });
  }

  function nextStep() {
    idx = phase === 'ready' ? 0 : idx + 1;
    // 出發間隔：休息＝下一次出發時間 − 已經過的時間；已經過了就直接出發
    while (idx < seq.length && seq[idx].kind === 'rest' && seq[idx].dyn) {
      seq[idx].sec = seq[idx].sendoff - (now() - repT0);
      if (seq[idx].sec > 0.3) break;
      idx += 1;
    }
    if (idx >= seq.length) { finish(); return; }
    const cur = seq[idx];
    begin(cur.kind);
    if (cur.kind === 'swim') { SND.go(); if (cur.first) repT0 = now(); }
    else if (!cur.broken && cur.sec >= 6) { const nx = nextSwim(idx + 1); if (nx) say(`${nx.row !== cur.row ? '換下一組。' : '下一趟，'}${sayRep(nx)}`); }
  }
  function wall(auto) {
    if (phase !== 'swim') return;
    const cur = seq[idx];
    log.push({ where: `${cur.b.title}・${rowHead(cur.row)} ${(cur.row.sets || 1) > 1 ? `第 ${cur.s} 組` : ''}第 ${cur.r} 趟${cur.segs > 1 ? `第 ${cur.g} 段` : ''}`, target: cur.target, actual: auto ? null : elapsed() });
    renderLog();
    nextStep();
  }
  function adjust(kind, d) {
    if (phase === 'done' || !seq.length) return;
    const row = (seq[idx] || seq[0]).row;
    let changed = false;
    for (let j = idx; j < seq.length; j++) {
      const x = seq[j]; if (x.row !== row) continue;
      if (kind === 't' && x.kind === 'swim' && x.target != null) { x.target = Math.max(1, x.target + d * (x.segD / row.dist)); changed = true; }
      if (kind === 'r') {
        if (x.kind === 'swim' && x.sendoff != null) { x.sendoff = Math.max(5, x.sendoff + d); changed = true; }
        if (x.kind === 'rest' && !x.broken) { if (x.dyn) x.sendoff = Math.max(5, x.sendoff + d); x.sec = Math.max(0, x.sec + d); changed = true; }
      }
    }
    const v = tq('[data-wk-t-adjv]');
    if (!changed) { v.textContent = kind === 't' ? '這一列沒有目標秒數可調。' : '這一列後面沒有休息可調。'; return; }
    const a = adj.get(row) || { t: 0, r: 0 };
    a[kind] += d; adj.set(row, a);
    if (phase === 'swim' && kind === 't' && seq[idx].target > elapsed()) beeped.t = 0;
    if (phase === 'rest' && kind === 'r') { const left = seq[idx].sec - elapsed(); [1, 2, 3].forEach(n => { if (left > n) delete beeped['r' + n]; }); }
    v.textContent = adjText(row);
    frame();
  }
  const logLine = (x) => (x.actual == null ? `${x.where}：（未按到牆）` : x.target == null ? `${x.where}：${fmt(x.actual)}` : `${x.where}：${fmt(x.actual)}（目標 ${fmt(x.target)}，${x.actual - x.target <= 0 ? '' : '+'}${(x.actual - x.target).toFixed(1)}）`);
  function renderLog() {
    tq('[data-wk-t-log]').innerHTML = log.slice().reverse().slice(0, 6).map(x => {
      if (x.actual == null) return `<li>${esc(x.where)}<span>（未按到牆）</span></li>`;
      if (x.target == null) return `<li>${esc(x.where)}<span>${fmt(x.actual)}</span></li>`;
      const d = x.actual - x.target;
      return `<li>${esc(x.where)}<span class="${d <= 0 ? 'is-ok' : 'is-slow'}">${fmt(x.actual)}（${d <= 0 ? '' : '+'}${d.toFixed(1)}）</span></li>`;
    }).join('');
  }
  function finish() {
    phase = 'done'; clearInterval(timer); SND.done(); say('課表完成');
    tq('[data-wk-t-phase]').textContent = '完成';
    tq('[data-wk-t-row]').textContent = M().name || '';
    const aimed = log.filter(x => x.actual != null && x.target != null), hit = aimed.filter(x => x.actual <= x.target).length;
    tq('[data-wk-t-clock]').textContent = aimed.length ? `${hit}/${aimed.length}` : '✓';
    tq('[data-wk-t-sub]').textContent = aimed.length ? '趟達到目標秒數' : '課表跑完了';
    const changed = [...adj.entries()].filter(([, a]) => a.t || a.r).map(([row]) => `${rowHead(row)}：${adjText(row).replace('這一列已調整：', '').replace('（只影響這次）', '')}`);
    tq('[data-wk-t-drill]').textContent = changed.length ? '這次臨場調整過：' + changed.join('；') : '';
    tq('[data-wk-t-adjv]').textContent = '';
    tq('[data-wk-wall]').hidden = true;
    tq('[data-wk-t-copy]').hidden = !log.length;
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  function frame() {
    if (pausedAt || phase === 'done') return;
    highlight();
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
      let txt;
      if (cur.target == null) { txt = '沒有目標秒數，到牆按一下'; ck.classList.remove('is-over'); }
      else {
        const over = e - cur.target;
        txt = over < 0 ? `目標 ${fmt(cur.target)}（還有 ${fmt(-over)}）` : `目標 ${fmt(cur.target)} 已到`;
        ck.classList.toggle('is-over', over >= 0);
        if (over >= 0 && !beeped.t) { beeped.t = 1; SND.target(); if (S.autorest) { wall(true); return; } }
      }
      if (cur.sendoff != null) {
        const left = cur.sendoff - (now() - repT0);
        txt += `　下次出發 ${fmt0(Math.max(0, Math.ceil(left)))}`;
        [3, 2, 1].forEach(n => { if (left <= n && !beeped['s' + n]) { beeped['s' + n] = 1; SND.tick(); } });
        if (left <= 0) { wall(true); return; } // 出發時間到了還沒按到牆：照出發間隔直接下一趟
      }
      sub.textContent = txt;
    } else if (phase === 'rest') {
      const left = cur.sec - e, nx = nextSwim(idx + 1);
      ph.textContent = cur.broken ? '分段休息' : cur.setBreak ? '組間休息' : cur.dyn ? '等出發' : '休息';
      ck.textContent = fmt0(Math.max(0, Math.ceil(left))); ck.classList.remove('is-over');
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
    log = []; adj = new Map(); renderLog(); renderSide(); idx = 0;
    tq('[data-wk-t-adjv]').textContent = ''; tq('[data-wk-t-copy]').hidden = true;
    T.hidden = false; document.body.classList.add('wk-running');
    tq('[data-wk-pause]').textContent = '暫停';
    begin('ready');
    say(`準備。第一趟，${sayRep(seq[0])}`);
    clearInterval(timer); timer = setInterval(frame, 100); frame();
  }
  function closeTimer() {
    clearInterval(timer); phase = 'done'; T.hidden = true; document.body.classList.remove('wk-running');
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (_) { /* 無 */ }
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  tq('[data-wk-wall]').addEventListener('click', () => wall(false));
  tq('[data-wk-stop]').addEventListener('click', closeTimer);
  tq('[data-wk-skip]').addEventListener('click', () => { if (phase === 'swim') wall(true); else if (phase !== 'done') nextStep(); });
  tq('[data-wk-pause]').addEventListener('click', (ev) => {
    if (phase === 'done') return;
    if (pausedAt) { const dp = now() - pausedAt; paused += dp; repT0 += dp; pausedAt = 0; ev.target.textContent = '暫停'; }
    else { pausedAt = now(); ev.target.textContent = '繼續'; }
  });
  tq('[data-wk-t-copy]').addEventListener('click', async (ev) => {
    const text = [`${M().name || '課表'}　${new Date().toLocaleString('zh-TW')}`].concat(log.map(logLine)).join('\n');
    try { await navigator.clipboard.writeText(text); ev.target.textContent = '已複製'; } catch (_) { prompt('複製這次結果：', text); }
    setTimeout(() => { ev.target.textContent = '複製這次結果'; }, 2000);
  });
  T.querySelectorAll('[data-adj]').forEach(b => b.addEventListener('click', () => { const [k, d] = b.dataset.adj.split(':'); adjust(k, +d); }));
  document.addEventListener('visibilitychange', () => { if (!T.hidden && document.visibilityState === 'visible') holdScreen(); });

  /* ---------- 輸入與初始化 ---------- */
  const refresh = () => {
    Object.keys(cssCache).forEach(k => delete cssCache[k]);
    renderCss(); renderPz(); renderSprint();
    M().blocks.forEach(b => b.rows.forEach(r => { if (r.restAuto) autoRest(r, b.title); })); // 成績變了，自動帶的出發間隔跟著變
    renderMenu();
  };
  const course = $('[data-wk-course]'); course.value = S.course;
  course.addEventListener('change', () => { S.course = course.value; save(); });
  root.querySelectorAll('[data-wk-pb]').forEach(tf => {
    const [s, d] = tf.dataset.wkPb.split(':');
    setTF(tf, parseT(S.pb[s][d]));
    tf.addEventListener('input', () => { S.pb[s][d] = readTF(tf); save(); refresh(); });

  });
  $('[data-wk-css]').addEventListener('click', (e) => {
    const zs = e.target.closest('[data-zs]');
    if (zs) { S.zstroke = zs.dataset.zs; save(); renderCss(); renderPz(); return; }
    const b = e.target.closest('[data-zadd]'); if (!b) return;
    const [int, d] = b.dataset.zadd.split(':');
    const t = int === 'thr' ? TYPE.threshold : int === 'easy' ? TYPE.aerobic_easy : null;
    addMain({ reps: 4, dist: +d, stroke: S.zstroke, int, rest: t ? r5((t.rest_s.min + t.rest_s.max) / 2) : 0, restAuto: true });
  });
  $('[data-wk-sstroke]').addEventListener('change', (e) => { S.sstroke = e.target.value; save(); renderSprint(); });
  $('[data-wk-sdist]').addEventListener('change', (e) => { S.sdist = e.target.value; save(); renderSprint(); });
  $('[data-wk-pct]').addEventListener('input', (e) => { S.pct = +e.target.value; save(); renderSprint(); });
  $('[data-wk-menus]').addEventListener('change', (e) => { S.cur = +e.target.value; openEq.clear(); openAdv.clear(); save(); renderMenu(); });
  $('[data-wk-mname]').addEventListener('input', (e) => { M().name = e.target.value.trim() || '未命名'; save(); renderSum(); });
  $('[data-wk-mname]').addEventListener('change', () => { $('[data-wk-menus]').options[S.cur].textContent = M().name; });
  $('[data-wk-mnew]').addEventListener('click', () => { S.menus.push(newMenu('新課表 ' + (S.menus.length + 1))); S.cur = S.menus.length - 1; openEq.clear(); openAdv.clear(); save(); renderMenu(); });
  $('[data-wk-mdup]').addEventListener('click', () => { const c = JSON.parse(JSON.stringify(M())); c.name += '（複製）'; S.menus.push(c); S.cur = S.menus.length - 1; save(); renderMenu(); });
  $('[data-wk-mdel]').addEventListener('click', () => {
    if (!confirm(`刪除課表「${M().name}」？`)) return;
    S.menus.splice(S.cur, 1); if (!S.menus.length) S.menus.push(newMenu('今天的課表')); S.cur = 0; openEq.clear(); openAdv.clear(); save(); renderMenu();
  });
  $('[data-wk-addblk]').addEventListener('click', () => { M().blocks.push({ title: '新的一段', rows: [] }); save(); renderMenu(); });
  $('[data-wk-start]').addEventListener('click', openTimer);
  const ar = $('[data-wk-autorest]'); ar.checked = S.autorest !== false;
  ar.addEventListener('change', () => { S.autorest = ar.checked; save(); });
  const vc = $('[data-wk-voice]'); vc.checked = S.voice !== false;
  vc.addEventListener('change', () => { S.voice = vc.checked; save(); if (vc.checked) say('語音報讀開啟'); });
  initPz();
  renderCss(); renderPz(); renderSprint(); renderMenu(); renderMine();
  importShared();
})();
