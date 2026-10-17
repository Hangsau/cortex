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
  const studio = root.hasAttribute('data-wk-studio');
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
  const ROW_DEF = { sets: 1, reps: 4, dist: 50, stroke: 'free', mode: 'swim', int: 'none', pct: 95, pbPlus: 0, event: '', target: null, rest: 0, setRest: 0, rowRest: null,
    restMode: 'rest', sendoff: 0, stepOn: 'none', stepSec: -1, stepCycle: 0, brokenEvery: 0, brokenRest: 10, drill: '', equip: [], note: '', restAuto: false,
    stype: '', age: '' }; // stype＝組型（純速／乳酸生成同為衝刺，靠它分休息）；age＝child／older（純速休息依年齡）
  const normRow = (r) => {
    Object.keys(ROW_DEF).forEach(k => { if (r[k] == null) r[k] = Array.isArray(ROW_DEF[k]) ? [] : ROW_DEF[k]; });
    // null 沿用舊版的每趟設定；0 明確表示直接進下一項。
    if (typeof r.rowRest !== 'number' || !Number.isFinite(r.rowRest) || r.rowRest < 0) r.rowRest = null;
    return r;
  };
  const DRILL = Object.fromEntries(V.drills.map(d => [d.id, d]));

  /* ---------- canonical 參數 ---------- */
  const TYPE = Object.fromEntries(PZ.gen.types.map(t => [t.key, t]));
  const INTENT = Object.fromEntries((PZ.intents || []).map(t => [t.key, t]));
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
  const KEY = 'cortex-swim-v3';
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } };
  const savedState = load(KEY);
  // 合併兩個舊入口；舊 key 保留，已開著的舊分頁也不會覆蓋正式版。
  function migrate() {
    const valid = s => s && Array.isArray(s.menus) && s.menus.every(m => m && Array.isArray(m.blocks) && m.blocks.every(b => b && Array.isArray(b.rows)));
    const sources = ['cortex-swim-studio-v1', 'cortex-swim-v2'].map(load).filter(valid);
    if (!sources.length) return null;
    const result = sources[0];
    ['myDrills', 'myEquip', 'lib'].forEach(k => { if (!Array.isArray(result[k])) result[k] = []; });
    sources.slice(1).forEach(source => {
      const remap = new Map();
      (source.myDrills || []).forEach(d => {
        const existing = result.myDrills.find(x => x.id === d.id);
        if (existing && JSON.stringify(existing) === JSON.stringify(d)) return;
        if (existing) {
          let id = String(d.id) + '-legacy';
          while (result.myDrills.some(x => x.id === id)) id += '-1';
          remap.set('my:' + d.id, 'my:' + id); d.id = id;
        }
        result.myDrills.push(d);
      });
      const remapRow = r => { if (remap.has(r.drill)) r.drill = remap.get(r.drill); };
      source.menus.forEach(m => m.blocks.forEach(b => b.rows.forEach(remapRow)));
      (source.lib || []).forEach(item => item.rows.forEach(remapRow));
      for (const k of ['menus', 'lib', 'myEquip']) {
        const signatures = new Set(result[k].map(x => JSON.stringify(x)));
        (source[k] || []).forEach(x => {
          const signature = JSON.stringify(x);
          if (!signatures.has(signature)) {
            if (k === 'menus' && result.menus.some(m => m.name === x.name)) x.name += '（原版保留）';
            result[k].push(x); signatures.add(signature);
          }
        });
      }
    });
    return result;
  }
  const importedState = !savedState ? migrate() : null;
  let savedOk = true;
  const newMenu = (name) => ({ name, blocks: [{ title: '暖身', rows: [] }, { title: 'Drill', rows: [] }, { title: '主課', rows: [] }, { title: '緩和', rows: [] }] });
  const S = Object.assign({
    course: 'scm', pb: {}, zstroke: 'free', sstroke: 'free', sdist: '50', pct: 95, autorest: true,
    menus: [newMenu('今天的課表')], cur: 0, myDrills: [], myEquip: [], lib: [], voice: true, pz: {},
  }, savedState || importedState || {});
  // 成績不存進瀏覽器：每次開頁都是乾淨的空白成績（2026-09-27 使用者要求：重新整理不要帶上次的秒數）
  S.pb = {};
  STROKES.forEach(s => { S.pb[s.k] = {}; });
  S.pz = Object.assign({ race: '', today: '', mstart: '', sess: '4', who: 'swim', tdist: 'standard', tlevel: 'regular', trp: '', tsplit: '' }, S.pz || {});
  if (!savedState && !importedState) {
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
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, S, { pb: {} }))); savedOk = true; } catch (_) { savedOk = false; }
    root.dispatchEvent(new CustomEvent('workout:saved', { detail: { saved: savedOk } }));
  };
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
  const tfHtml = (attrs, t, dec, label, ph, showZero = false) => `<span class="wk-tf" ${attrs} data-dec="${dec}"><input class="wk-tf-i" type="text" placeholder="${ph || '例 90 或 1:30'}" value="${t === 0 && showZero ? '0' : showT(t, dec)}" aria-label="${label}" autocomplete="off"></span>`;
  const readTF = (el) => parseT(el.querySelector('.wk-tf-i').value.replace(',', '.'));
  const setTF = (el, t) => { el.querySelector('.wk-tf-i').value = showT(t, +el.dataset.dec || 0); };

  /* ---------- 成績與 CSS ---------- */
  const pb = (s, d, bests = S.pb) => parseT(bests[baseStroke(s)] && bests[baseStroke(s)][d]);
  const known = (s, bests = S.pb) => (STROKES.find(x => x.k === s) || { d: [] }).d.map(d => [d, pb(s, d, bests)]).filter(x => x[1]);
  // CSS 擬合不用 25 m：出發／蹬牆占比太大，會扭曲配速—距離關係（canonical 的例子是 100＋200、50＋100）
  const knownCss = (s, bests = S.pb) => known(s, bests).filter(([d]) => d >= 50);
  const cssCache = {};
  function css(s) {
    s = baseStroke(s);
    if (!(s in cssCache)) cssCache[s] = cssCalc(s);
    return cssCache[s];
  }
  function cssCalc(s, bests = S.pb) {
    const t400 = pb(s, 400, bests), t200 = pb(s, 200, bests);
    if (t200 && t400) {
      if (t400 <= t200) return { bad: '400 m 成績比 200 m 還快，請確認。' };
      return { pace: (t400 - t200) / 2, tier: 'tier_a', how: `(${fmt(t400, 2)} − ${fmt(t200, 2)}) ÷ 2` };
    }
    if (t400) return { pace: t400 / 4 / K_FALLBACK, tier: 'tier_b', how: `(${fmt(t400, 2)} ÷ 4) ÷ ${K_FALLBACK}` };
    const k = knownCss(s, bests);
    if (k.length >= 2) {
      const [d1, t1] = k[k.length - 2], [d2, t2] = k[k.length - 1];
      const e = Math.log(t2 / t1) / Math.log(d2 / d1);
      if (!(e > 1)) return { bad: `${d1} m 與 ${d2} m 兩筆成績的配速不合理（長距離配速不該比短距離快），請確認。` };
      const T400 = t2 * Math.pow(400 / d2, e);
      return { pace: T400 / 4 / K_FALLBACK, tier: 'tier_c', how: `用 ${d1} m＋${d2} m 擬合個人指數 ${e.toFixed(3)}，推 400 m ≈ ${fmt(T400)}，再 (T400 ÷ 4) ÷ ${K_FALLBACK}`, short: d2 <= 100 };
    }
    return known(s, bests).length ? { tier: 'tier_d', one: known(s, bests).map(x => x[0]).join('、') } : null;
  }
  // 沒有該距離 PB：用同式較長距離成績平均切段。50 → 25 直接 ÷ 2——跳水比蹬牆快、距離短速度快，兩者大致抵銷
  // （2026-09-27 使用者判斷；曾試過按泳式的教練觀測比例，使用者認為不必修正）
  function baseFor(s, d, bests = S.pb) {
    const own = pb(s, d, bests);
    if (own) return { t: own, src: `${d} m PB` };
    // 優先整除的較長距離（50 ÷ 2）；都不整除（例如 15 m）才用最短的較長距離按比例（使用者 2026-10-18：慢的泳者純速改短距離）
    const ks = known(s, bests), longer = ks.find(([D]) => D > d && D % d === 0) || ks.find(([D]) => D > d);
    if (!longer) return null;
    const [D, T] = longer;
    return { t: T * d / D, split: true, D, T, src: D % d === 0 ? `${D} m 成績 ÷ ${D / d}` : `${D} m 成績 × ${d}/${D}` };
  }
  const hasCss = (s) => { const c = css(s); return !!(c && c.pace); };
  const TIER_LABEL = { tier_a: '實測', tier_b: '估計', tier_c: '外推', tier_d: '自校準' };

  /* ---------- 一列課表的目標秒數（找不到依據就不給，並說缺什麼） ---------- */
  const NO_AUTO = { kick: 1, drill: 1 };
  function targetOf(row, bests) {
    const s = baseStroke(row.stroke);
    if (row.int === 'custom') { const t = parseT(row.target); return t ? { t } : null; }
    if (NO_AUTO[row.mode] || row.int === 'none') return null;
    // 器材改變浮力、推進與節奏：一般成績推出的配速不適用（器材指南「如何調整距離與強度」）
    if ((row.equip || []).length) return { miss: '戴器材不套用一般成績配速，要目標請填自訂秒數' };
    if (row.int === 'sprint') {
      const b = baseFor(s, row.dist, bests);
      return b ? { t: b.t / ((row.pct || 95) / 100), note: b.split ? `由 ${b.src}` : '' } : { miss: `沒有${SZH[s]} ${row.dist} m 或更長距離的成績` };
    }
    if (row.int === 'race') {
      const ev = +row.event, p = ev && pb(s, ev, bests);
      if (!p) return { miss: ev ? `沒有${SZH[s]} ${ev} m 成績` : '選一個比賽距離' };
      return { t: p / (ev / row.dist), note: `${ev} m 配速` };
    }
    if (row.int === 'pbplus') {
      const b = baseFor(s, row.dist, bests);
      return b ? { t: b.t + (+row.pbPlus || 0), note: b.split ? `由 ${b.src}` : '' } : { miss: `沒有${SZH[s]} ${row.dist} m 或更長距離的成績` };
    }
    if (row.int === 'tol') {
      const p = pb(s, 100, bests);
      return p ? { t: p * row.dist / 100 * K_TOL, note: '🟠' } : { miss: `沒有${SZH[s]} 100 m 成績` };
    }
    const c = bests ? cssCalc(s, bests) : css(s);
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
      // 有組型就照組型（慢的泳者乳酸生成可能只有 15 m）；舊列沒有組型才照距離猜
      const t = TYPE[row.stype] && ['velocity', 'lactate_production'].includes(row.stype) ? TYPE[row.stype]
        : row.dist <= TYPE.velocity.distance_m.max ? TYPE.velocity : row.dist <= TYPE.lactate_production.distance_m.max ? TYPE.lactate_production : null;
      const ageR = t && t.key === 'velocity' && t.rest_by_age && t.rest_by_age[row.age];
      if (ageR) return { min: t.rest_s.min, max: t.rest_s.max, mid: ageR.rest_s, why: `純速組 ${t.cert}，${row.age === 'child' ? '12 歲以下' : '13 歲以上'}` };
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
  const rowSec = (row, hasNext) => {
    let sec = 0, repSec = 0;
    // 與計時器共用順序，避免漏算項目間隔或把課表末尾休息算進去。
    rowSteps(row, null, estSec(row), hasNext).forEach(step => {
      if (step.first) repSec = 0;
      const duration = step.kind === 'swim'
        ? (step.sendoff != null ? Math.min(step.target, Math.max(0, step.sendoff - repSec)) : step.target)
        : step.dyn ? Math.max(0, step.sendoff - repSec) : step.sec;
      sec += duration; repSec += duration;
    });
    return sec;
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
  let toastUndo = null;
  // undo 給了就在提示裡放「復原」鍵，停留較久
  const toast = (msg, undo) => {
    toastEl.textContent = msg; toastUndo = undo || null;
    if (undo) { const b = document.createElement('button'); b.type = 'button'; b.className = 'wk-toast-undo'; b.textContent = '復原'; toastEl.append(' ', b); }
    toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; toastUndo = null; }, undo ? 6000 : 2200);
  };
  toastEl.addEventListener('click', (e) => { if (!e.target.closest('.wk-toast-undo') || !toastUndo) return; const f = toastUndo; toastUndo = null; toastEl.hidden = true; clearTimeout(toastT); f(); });

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
  /* 沒有這一式的任何成績＝大概率還沒比過賽，屬一般泳者，訓練方式不同（set-design anchor_tiers.scope_zh，2026-10-15 使用者定）：
     推薦一律不建議距離、趟數、秒數，只放「泳式＋目的」的佔位列讓教練排。只要有一筆成績，照常建議（含 tier_d 自校準）。 */
  const hasPb = (s) => known(baseStroke(s)).length > 0;
  const NO_PB_DIST = 25; // 佔位列 1 × 25 m，數字本身沒有建議意義
  const noPbText = (s) => `沒有${SZH[baseStroke(s)]}成績：距離、趟數、秒數由你排`;
  const coachRow = (stroke, name) => blankRow({ reps: 1, dist: NO_PB_DIST, stroke, int: 'none', rest: 0, note: `${name}・${noPbText(stroke)}（請自行設定）` });
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
  // 期內負荷節律：比例與說明讀 structure.macrocycle.loading_patterns；哪一期對照哪個比例讀 workout_blocks.loading_by_phase
  function pzLoad(P) {
    const ratio = (PZ.loading_by_phase || {})[P.phase];
    const pat = ratio && (PZ.loading || []).find(x => x.ratio === ratio);
    if (!pat) return null;
    const [load, rest] = ratio.split('/')[0].trim().split(':').map(Number);
    const upper = { general_prep: P.macroDays, specific_prep: P.bounds.specific_prep, competition: P.bounds.competition }[P.phase];
    const wk = Math.floor(Math.max(0, upper - P.days) / 7), pos = wk % (load + rest);
    return { ratio, pat, load, rest, wk, pos, recovery: pos >= load };
  }
  // 水下海豚腿段一週排幾堂：劑量每週 per_week.min–max 次，課少時不超過總堂數；減量期取下限
  function uwCount(ph, n) {
    const U = PZ.udk;
    if (!U || ph === 'transition') return 0;
    const c = Math.min(n, Math.max(U.per_week.min, Math.min(U.per_week.max, n - 1)));
    return ph === 'taper' ? Math.min(c, U.per_week.min) : c;
  }
  // 從大週期第一週起算，每 retest_every_weeks 週的最後一週重測
  const uwRetest = (P) => (Math.floor(Math.max(0, P.macroDays - P.days) / 7) + 1) % PZ.udk.retest_every_weeks === 0;
  // 推薦組：組型參數全部取 set_types；取區間中值，並標明
  // 各組型的推薦組（參數全取 set_types，取區間中值）；週課表與單堂推薦共用
  function setBuilders(s, bests = S.pb) {
    // 比賽項目可能多項（使用者 2026-09-27），不在這裡選；賽速組以 25 m 一趟、100 m 賽距 × 5 的量當樣板，項目在課表列裡選
    // 項目預設：有 100 m 成績用 100，否則用最短的一筆 ≥50 m 成績；都沒有就留空（課表列裡再選）
    const race = (scale, label, selectedEvent) => {
      const have = known(s, bests).map(x => x[0]).filter(d => d >= 50);
      const ev = selectedEvent || (have.includes(100) ? 100 : (have[0] || 100));
      const rep = ev <= 100 ? 25 : 50, mult = ev >= 800 ? 2.5 : ev === 400 ? 4 : 5.5; // race_pace.volume_rule 取中值
      const reps = Math.max(4, Math.round(ev * mult * (scale || 1) / rep));
      return { type: 'race_pace', name: label || '賽速重複', row: { reps, dist: rep, stroke: s, int: 'race', event: selectedEvent || have.length ? String(ev) : '', rest: raceRest(rep) },
        why: `以 ${ev} m 項目計：總量＝${ev} m × ${mult}${scale ? ` × ${scale}` : ''}（既有賽速總量範圍取中值）；可依實際完成情況調整` };
    };
    const thr = () => { const x = TYPE.threshold, d = 200, vol = 2000; return { type: 'threshold', name: '閾值', row: { reps: vol / d, dist: d, stroke: s, int: 'thr', rest: r5((x.rest_s.min + x.rest_s.max) / 2) }, why: `總量取 ${esc(x.volume_rule.replace(/^總量\s*/, ''))} 的下緣` }; };
    const easy = (label) => { const x = TYPE.aerobic_easy; return { type: 'aerobic_easy', name: label || '輕鬆有氧', row: { reps: 3, dist: 400, stroke: s, int: 'easy', rest: r5((x.rest_s.min + x.rest_s.max) / 2) }, why: '量依可用時間調' }; };
    const steady = () => { const x = easy('穩定有氧'); x.row.int = 'steady'; x.why = `配速用 CSS × ${K_STEADY}；份量與休息沿用輕鬆有氧範例，可再調整`; return x; };
    const vel = (sets) => { const x = TYPE.velocity; return { type: 'velocity', name: '純速', row: { sets: sets || x.reps.blocks, reps: 4, dist: x.distance_m.max, stroke: s, int: 'sprint', pct: 100, rest: r5((x.rest_s.min + x.rest_s.max) / 2), setRest: 0 }, why: `每趟 ${x.distance_m.min}–${x.distance_m.max} m，${x.reps.min}–${x.reps.max} 趟分 ${x.reps.blocks} 組；熱身後、還不累時做` }; };
    const prod = () => { const x = TYPE.lactate_production; return { type: 'lactate_production', name: INTENT.lactate_production.name_zh, row: { reps: Math.round((x.reps.min + x.reps.max) / 2), dist: x.distance_m.max, stroke: s, int: 'sprint', pct: 100, rest: r5((x.rest_s.min + x.rest_s.max) / 2) }, why: '趟數與休息取既有建議區間中值；先充分暖身，再維持每趟品質' }; };
    const tol = () => { const x = TYPE.lactate_tolerance; return { type: 'lactate_tolerance', name: '速耐', row: { reps: 5, dist: 100, stroke: s, int: 'tol', rest: 40 }, why: `每趟 ${x.distance_m.min}–${x.distance_m.max} m，${x.reps.min}–${x.reps.max} 趟，休 ${x.rest_s.min}–${x.rest_s.max} 秒；每週最多 ${x.weekly_max} 次` }; };
    const free = () => ({ type: null, name: '輕鬆游', row: { reps: 2, dist: 400, stroke: s, int: 'none', rest: 30 }, why: '過渡期不設目標時間，維持下水頻率' });
    return { race, thr, easy, steady, vel, prod, tol, free };
  }

  /* ---------- 同一種組的多種排法（使用者 2026-10-18） ----------
     組型以每趟秒數定義（canonical set_types.duration_s），距離是依泳者速度算出來的結果：
     候選距離 × 目標秒數 → 只留每趟秒數落在時間窗內的；都落不進（例如沒有成績）才用原本的樣板。
     量：純速照 reps 範圍與分組、乳酸生成／速耐照原本趟數、賽速／閾值／有氧維持原本總量換算趟數。
     純速休息依年齡（rest_by_age，opts.child＝12 歲以下）；年齡不明照 13 歲以上。 */
  const VARIANT_DIST = [10, 12.5, 15, 25, 50, 75, 100, 150, 200, 300, 400, 800];
  const SHORT_TYPES = { velocity: 1, lactate_production: 1, race_pace: 1 }; // 這幾種每趟不超過 50 m
  const VEL_SPLITS = [[2, 4], [2, 5], [1, 6]]; // 純速：總趟數在 reps 6–10 內、可分 2 組
  const VOLUME_TYPES = { race_pace: 1, threshold: 1, aerobic_easy: 1, steady: 1 }; // 維持總量、換算趟數
  const MIN_REPS = 2;
  function velRest(opts) {
    const a = TYPE.velocity.rest_by_age;
    if (!a) return { rest: r5((TYPE.velocity.rest_s.min + TYPE.velocity.rest_s.max) / 2), setRest: null };
    const r = opts && opts.child ? a.child : a.older;
    return { rest: r.rest_s, setRest: r.set_rest_s };
  }
  function setVariants(key, row, bests, opts = {}) {
    const T = TYPE[key === 'steady' ? 'aerobic_easy' : key], win = T && T.duration_s;
    const total = (row.sets || 1) * row.reps * row.dist;
    const secOf = (d) => { const r = { ...row, sets: 1, dist: d }, tg = targetOf(r, bests); return tg && tg.t ? tg.t : estSec(r); };
    const pool = key === 'race_pace' && T.preferred_distances_m ? T.preferred_distances_m : VARIANT_DIST; // 賽速只用原文的 15／25／50
    const dists = pool.filter(d => (SHORT_TYPES[key] ? d <= 50 : d >= 25) && (!VOLUME_TYPES[key] || total / d >= MIN_REPS)
      && (win ? (x => x >= win.min && x <= win.max)(secOf(d)) : d >= 25));
    const vr = key === 'velocity' ? velRest(opts) : null;
    const make = (d, sets, reps) => {
      const r = { dist: d, sets, reps, stype: key };
      if (vr) { r.rest = vr.rest; r.setRest = sets > 1 ? vr.setRest : 0; r.age = opts.child ? 'child' : 'older'; }
      if (key === 'race_pace') r.rest = raceRest(d);
      const sec = secOf(d), count = sets > 1 ? `${sets} 組 × ${reps} × ${d} m` : `${reps} × ${d} m`;
      return { row: r, sec, label: `${count}（每趟約 ${Math.round(sec)} 秒）` };
    };
    const out = [];
    (dists.length ? dists : [row.dist]).forEach(d => {
      if (key === 'velocity') VEL_SPLITS.forEach(([n, k]) => out.push(make(d, n, k)));
      else if (VOLUME_TYPES[key]) out.push(make(d, 1, Math.max(MIN_REPS, Math.round(total / d))));
      else out.push(make(d, row.sets || 1, row.reps));
    });
    // 第一個＝原本樣板的距離（還在時間窗內時），其餘照距離排；沒成績時只有原本樣板
    out.sort((a, b) => (a.row.dist === row.dist ? -1 : 0) - (b.row.dist === row.dist ? -1 : 0) || a.row.dist - b.row.dist);
    out.win = win || null;
    return out;
  }

  /* ---------- 無賽期的主課推薦：沿用同一套配速與組型，不新增計時模式 ---------- */
  const GOAL_BUILDERS = { aerobic_easy: 'easy', steady: 'steady', threshold: 'thr', velocity: 'vel', lactate_production: 'prod', lactate_tolerance: 'tol', race_pace: 'race' };
  const goalName = key => key === 'steady' ? INTS.steady : INTENT[key].name_zh;
  // 只保留本次頁面的選擇；產生的課表沿用既有存檔格式。
  const goalChoice = { key: 'aerobic_easy', stroke: 'free', size: 'standard', event: 100 };
  // 精簡組砍半後的下限：速度類照 set_types 的最少趟數；賽速照 volume_rule 的下緣倍數（≤200 m 賽距 ×5、400 m ×3、800 m 以上 ×2）。
  // 閾值與有氧沒有下限——它們的量本來就「依可用時間」，精簡組就是給時間短的課用。
  const RACE_VOLUME_MIN = (ev) => (ev >= 800 ? 2 : ev === 400 ? 3 : 5);
  function compactFloor(key, row, event) {
    if (key === 'race_pace') { const ev = +row.event || +event; return Math.ceil(ev * RACE_VOLUME_MIN(ev) / row.dist); }
    return TYPE[key] && TYPE[key].reps ? TYPE[key].reps.min : 0;
  }
  function goalSet(choice = goalChoice, bests) {
    const key = choice.key, builder = setBuilders(choice.stroke, bests)[GOAL_BUILDERS[key]];
    const x = key === 'race_pace' ? builder(null, null, choice.event) : builder();
    x.name = goalName(key);
    // 多種排法：choice.variant 選第幾種（抽卡、換一種排法用）；choice.child＝12 歲以下
    const vs = setVariants(key, x.row, bests, choice), vi = ((+choice.variant || 0) % vs.length + vs.length) % vs.length, v = vs[vi];
    Object.assign(x.row, v.row);
    x.variants = vs.map(o => o.label); x.variant = vi;
    if (vs.win) x.why = `每趟約 ${Math.round(v.sec)} 秒（${x.name}每趟 ${vs.win.min}–${vs.win.max} 秒，距離依速度換算）；${x.why}`;
    if (choice.size === 'compact') {
      if (x.row.sets > 1) x.row.sets = Math.ceil(x.row.sets / 2);
      else x.row.reps = Math.max(1, Math.ceil(x.row.reps / 2));
      const sets = x.row.sets || 1, lo = compactFloor(key, x.row, choice.event);
      if (sets * x.row.reps < lo) x.row.reps = Math.ceil(lo / sets); // 砍半不能砍到這種組本身的最少量以下
    }
    // 穩定有氧沒有獨立休息規則；保留這次顯示的範例，避免 autoRest 將它歸零。
    x.row = blankRow(Object.assign({ note: x.name, restAuto: key !== 'steady' }, x.row));
    const target = targetOf(x.row, bests);
    x.row.sendoff = target && target.t ? Math.ceil((target.t + x.row.rest) / RND) * RND : bests ? 0 : Math.ceil((estSec(x.row) + x.row.rest) / RND) * RND;
    // 多組之間仍需完整恢復，不能沿用純速舊樣板的 0 秒；純速用 rest_by_age 的組間（趟間 × 2）
    if (x.row.sets > 1) x.row.setRest = v.row.setRest || x.row.rest;
    return x;
  }
  function renderGoals() {
    const box = $('[data-wk-goal-out]');
    if (!box) return;
    if (isTri()) { renderTriGoals(box); const prep = $('[data-wk-prep]'); if (prep) prep.innerHTML = ''; return; }
    if (!hasPb(goalChoice.stroke)) {
      box.innerHTML = `<div class="wk-goal-preview"><p class="wk-css-k">${esc(SZH[goalChoice.stroke])} · ${esc(goalName(goalChoice.key))}</p>
        <h3>${esc(noPbText(goalChoice.stroke))}</h3><p>還沒有這一式的成績，通常是還沒比過賽的一般泳者，訓練方式不同；這裡不建議組型。到「成績與配速」填一筆成績，就會照成績建議距離、趟數與目標秒數。</p>
        <div class="wk-actions"><button type="button" class="wk-btn wk-btn--main" data-wk-goal-add>加一列給你排</button><button type="button" class="wk-btn" data-wk-goal-new>另建課表</button><button type="button" class="wk-btn" data-wk-goal-lane>用這組安排團體</button></div></div>`;
      renderPrep(); return;
    }
    const key = goalChoice.key, x = goalSet(), row = x.row, type = TYPE[x.type], target = targetOf(row);
    const intent = INTENT[key], purpose = intent ? intent.goal_zh : '以穩定、可維持的節奏累積游泳量。';
    const basis = key === 'steady' ? `CSS × ${K_STEADY}（本站換算）` : type.target_rule;
    const stop = key === 'race_pace' ? '依現場配速與動作決定是否縮減或結束；這裡提供一般賽速組型，沒有自動失敗判定。' : key === 'steady' ? '留意配速與動作能否維持，必要時減量或放慢。' : type.exit;
    box.innerHTML = `<div class="wk-goal-preview"><p class="wk-css-k">${esc(SZH[row.stroke])} · ${esc(x.name)} · ${goalChoice.size === 'compact' ? '精簡組' : '原有組型'}</p>
      <h3>${row.sets > 1 ? `${row.sets} 組 × ` : ''}${row.reps} × ${row.dist} m</h3><p>${esc(purpose)}</p>
      ${x.variants.length > 1 ? `<p class="wk-note">同樣目的有 ${x.variants.length} 種排法（第 ${x.variant + 1} 種）。<button type="button" class="wk-btn" data-wk-goal-vary>換一種排法</button></p>` : ''}
      <dl class="wk-goal-facts"><div><dt>每趟目標</dt><dd>${target && target.t ? `${fmt(target.t)}${target.note ? `（${esc(target.note)}）` : ''}` : '待補成績或自訂秒數'}</dd></div><div><dt>每趟休息</dt><dd>${fmt0(row.rest)}${row.sets > 1 ? `；組間 ${fmt0(row.setRest)}` : ''}</dd></div><div><dt>主課距離</dt><dd>${rowDist(row)} m</dd></div></dl>
      ${!target || !target.t ? `<p class="wk-note">${esc(target && target.miss || '尚未設定目標')}。仍可加入組型；在下方填成績後換算，或在課表內改用自訂秒數。</p>` : ''}
      ${key === 'race_pace' ? '<p class="wk-note">參考的是所選距離的實測成績，不需要賽事日期。用短距離重複熟悉配速，也可搭配其他主課。</p>' : ''}
      ${key === 'lactate_tolerance' ? '<p class="wk-note">這類範例適用於已有規律訓練、能自行控速的泳者；配速與休息屬教練實務起點。</p>' : ''}
      <div class="wk-actions"><button type="button" class="wk-btn wk-btn--main" data-wk-goal-add>加入目前主課</button><button type="button" class="wk-btn" data-wk-goal-new>另建課表</button><button type="button" class="wk-btn" data-wk-goal-lane>用這組安排團體</button></div>
      <details class="wk-goal-details"><summary>配速依據與調整提示</summary><p>配速依據：${esc(basis)}。</p><p>組型參考：${esc(x.why)}。</p><p>調整提示：${esc(stop)}</p><p class="muted">提示供你現場判斷，計時器不會自動判定達標或退出。</p></details></div>`;
    renderPrep();
  }
  /* ---------- 主課前的器材技術準備：器材指南三個實務範例（資料在 workout_blocks.equipment_prep） ---------- */
  const PREP = (PZ.prep && PZ.prep.list) || [];
  const PREP_EQ = [...new Set(PREP.flatMap(t => t.equip))];
  const prepToday = new Set(); // 今天帶了什麼：只在這次開頁有效，不拿全器材清單當成持有
  const prepSets = {};
  let prepOpen = false;
  const prepRest = (t) => r5((t.rest.min + t.rest.max) / 2);
  const prepN = (t) => prepSets[t.id] || t.sets.min;
  // 依實際練習順序展開：每組把 sequence 各段排成一列，計時器就照 A→B→A→B 跑
  function prepRows(t) {
    const n = prepN(t), rows = [];
    for (let k = 0; k < n; k++) t.sequence.forEach(seg => rows.push(blankRow({ reps: 1, dist: seg.dist, stroke: 'free', mode: seg.mode, int: 'none',
      equip: seg.equip.slice(), rest: prepRest(t), note: `${t.title_zh}（第 ${k + 1}/${n} 組）：${seg.note}`, prep: `${t.id}@${t.version}` })));
    return rows;
  }
  function renderPrep() {
    const box = $('[data-wk-prep]'); if (!box || !PREP.length) return;
    const fit = PREP.filter(t => t.goals.includes(goalChoice.key)), usable = fit.filter(t => t.strokes.includes(goalChoice.stroke));
    let html = `<details class="wk-goal-details wk-prep"${prepOpen ? ' open' : ''}><summary>主課前加一段器材技術準備（可選）</summary>
      <p class="muted">${esc(PZ.prep.scope)}器材段不套用一般成績配速；加進課表後都可以改。<a href="${PZ.prep.guide}#lesson">器材使用指南：如何放進一堂課</a></p>
      <p class="wk-css-k">今天帶了</p><div class="wk-chips">${PREP_EQ.map(k => `<button type="button" class="wk-chip" aria-pressed="${prepToday.has(k)}" data-wk-prep-eq="${esc(k)}">${esc(eqName(k))}</button>`).join('')}</div>`;
    if (!usable.length) html += `<p class="muted">${fit.length ? `目前只有自由式的器材準備模板，${esc(SZH[goalChoice.stroke])}主課先照原課。` : '這個目的不預設加器材準備，保留主課的品質與恢復。'}</p>`;
    else html += '<ul class="wk-prep-list">' + usable.map(t => {
      const miss = t.equip.filter(k => !prepToday.has(k)), n = prepN(t), per = t.sequence.reduce((a, s) => a + s.dist, 0);
      const opts = Array.from({ length: t.sets.max - t.sets.min + 1 }, (_, i) => t.sets.min + i).map(v => `<option value="${v}"${v === n ? ' selected' : ''}>${v} 組</option>`).join('');
      return `<li class="wk-prep-item"><p class="wk-day-f">${esc(t.title_zh)}</p>
        <ol class="wk-prep-seq">${t.sequence.map(s => `<li>${s.dist} m ${esc(s.note)}</li>`).join('')}</ol>
        <p class="muted">${esc(t.rest_note_zh)}${esc(t.cue_zh)}${esc(t.stop_zh || '')}</p>
        <div class="wk-row"><label class="wk-field"><span>組數</span><select data-wk-prep-sets="${esc(t.id)}">${opts}</select></label></div>
        <p>新增 <b>${per * n} m</b>（${n} 組 × ${per} m），每段休 ${prepRest(t)} 秒</p>
        ${miss.length ? `<p><span class="wk-miss">需要${esc(miss.map(eqName).join('、'))}：先在上面點「今天帶了」</span></p>` : ''}
        <div class="wk-actions"><button type="button" class="wk-btn" data-wk-prep-add="${esc(t.id)}"${miss.length ? ' disabled' : ''}>加進 drill 段</button><a href="${PZ.prep.guide}#${esc(t.anchor)}">${esc(eqName(t.equip[0]))}怎麼用</a></div></li>`;
    }).join('') + '</ul>';
    box.innerHTML = html + '</details>';
  }
  function addPrep(id) {
    const t = PREP.find(x => x.id === id);
    if (!t || t.equip.some(k => !prepToday.has(k))) return;
    const m = M();
    let blk = m.blocks.find(b => b.title === 'Drill');
    if (!blk) { blk = { title: 'Drill', rows: [] }; const i = m.blocks.findIndex(b => b.title === '主課'); m.blocks.splice(i < 0 ? m.blocks.length : i, 0, blk); }
    blk.rows.push(...prepRows(t));
    save(); renderMenu(); toast(`已加進 drill 段：${t.title_zh}`);
    root.dispatchEvent(new CustomEvent('workout:recommendation-added'));
    $('#wk-menu').scrollIntoView();
  }
  function initGoals() {
    const section = $('#wk-goals'); if (!section) return;
    $('[data-wk-goal]').innerHTML = Object.keys(GOAL_BUILDERS).map(k => `<option value="${k}">${esc(goalName(k))}</option>`).join('');
    const strokes = STROKES.filter(s => s.k !== 'im');
    $('[data-wk-goal-stroke]').innerHTML = strokes.map(s => `<option value="${s.k}">${esc(s.zh)}</option>`).join('');
    function syncEvent() {
      const dists = strokes.find(s => s.k === goalChoice.stroke).d.filter(d => d >= 50);
      if (!dists.includes(goalChoice.event)) goalChoice.event = 100;
      $('[data-wk-goal-event]').innerHTML = dists.map(d => `<option value="${d}">${d} m</option>`).join('');
      $('[data-wk-goal-event]').value = String(goalChoice.event);
      $('[data-wk-goal-event-field]').hidden = goalChoice.key !== 'race_pace';
    }
    section.addEventListener('change', e => {
      const ps = e.target.closest('[data-wk-prep-sets]');
      if (ps) { const tp = PREP.find(x => x.id === ps.dataset.wkPrepSets), v = +ps.value; if (tp && v >= tp.sets.min && v <= tp.sets.max) prepSets[tp.id] = v; renderPrep(); return; }
      if (e.target.matches('[data-wk-goal]') && Object.hasOwn(GOAL_BUILDERS, e.target.value)) goalChoice.key = e.target.value;
      else if (e.target.matches('[data-wk-goal-stroke]') && strokes.some(s => s.k === e.target.value)) goalChoice.stroke = e.target.value;
      else if (e.target.matches('[data-wk-goal-size]') && ['compact', 'standard'].includes(e.target.value)) goalChoice.size = e.target.value;
      else if (e.target.matches('[data-wk-goal-event]') && +e.target.value >= 50 && strokes.find(s => s.k === goalChoice.stroke).d.includes(+e.target.value)) goalChoice.event = +e.target.value;
      else return;
      goalChoice.variant = 0; syncEvent(); renderGoals();
    });
    section.addEventListener('toggle', e => { if (e.target.matches('.wk-prep')) prepOpen = e.target.open; }, true);
    section.addEventListener('click', e => {
      if (e.target.closest('[data-wk-goal-vary]')) { goalChoice.variant = (+goalChoice.variant || 0) + 1; renderGoals(); const b = root.querySelector('[data-wk-goal-vary]'); if (b) b.focus(); return; }
      const chip = e.target.closest('[data-wk-prep-eq]');
      if (chip) { const k = chip.dataset.wkPrepEq; if (PREP_EQ.includes(k)) { if (prepToday.has(k)) prepToday.delete(k); else prepToday.add(k); } renderPrep(); root.querySelector(`[data-wk-prep-eq="${k}"]`).focus(); return; }
      const pa = e.target.closest('[data-wk-prep-add]');
      if (pa) { addPrep(pa.dataset.wkPrepAdd); return; }
      const tg = e.target.closest('[data-wk-tri-goal]');
      if (tg) { if (TRI_GOALS.includes(tg.dataset.wkTriGoal)) triGoal = tg.dataset.wkTriGoal; renderGoals(); root.querySelector(`[data-wk-tri-goal="${triGoal}"]`).focus(); return; }
      const ta = e.target.closest('[data-wk-tri-add], [data-wk-tri-new]');
      if (ta) { addTriGoal(ta.hasAttribute('data-wk-tri-new')); return; }
      const btn = e.target.closest('[data-wk-goal-add], [data-wk-goal-new]'); if (!btn) return;
      const x = goalSet();
      if (!hasPb(goalChoice.stroke)) x.row = coachRow(goalChoice.stroke, x.name);
      if (btn.hasAttribute('data-wk-goal-new')) {
        const m = newMenu(`${SZH[goalChoice.stroke]}・${x.name}`);
        m.intent = INTENT[goalChoice.key] ? INTENT[goalChoice.key].goal_zh : '以穩定、可維持的節奏累積游泳量。';
        m.blocks.find(b => b.title === '主課').rows.push(x.row);
        S.menus.push(m); S.cur = S.menus.length - 1;
        openEq.clear(); openAdv.clear(); save(); renderMenu(); toast(`已建立課表：${m.name}`);
      } else addMain(x.row, x.name);
      root.dispatchEvent(new CustomEvent('workout:recommendation-added'));
      $('#wk-menu').scrollIntoView();
    });
    syncEvent(); renderGoals();
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
    const days = WEEK_SLOTS[n].map(sl => {
      if (sl === 'Q') return Object.assign({ slot: 'Q' }, qualityDay(ph, q++, B));
      if (sl === 'T') return { slot: 'T', focus: '閾值有氧', sets: [B.thr()] };
      if (sl === 'L') return { slot: 'L', focus: '長有氧', sets: [B.easy('長有氧')] };
      const d = { slot: 'E', focus: '輕鬆有氧＋技術（drill 自選）', sets: [B.easy()] };
      if (!obs) { obs = true; d.obs = true; } // 每週一個觀察點，掛在第一堂輕鬆課（weekly_assembly 間隔規則第 4 條）
      return d;
    });
    // 水下段先掛品質課（本來就是高品質、恢復充足的課），再閾值、輕鬆、長有氧
    let uw = uwCount(ph, n);
    ['Q', 'T', 'E', 'L'].forEach(sl => days.forEach(d => { if (uw > 0 && d.slot === sl) { d.uw = true; uw--; } }));
    return days;
  }
  // 水下海豚腿列：休息走 drill 規則，趟數由「每次約幾分鐘」÷（估計每趟秒數＋休息）換算
  function uwRow(retest) {
    const U = PZ.udk;
    const r = blankRow({ reps: 1, dist: 25, stroke: 'fly', mode: 'drill', drill: U.drill, int: 'none', restAuto: true,
      note: (retest ? `這堂先重測：${U.retest_zh} ` : '') + U.row_note_zh });
    autoRest(r, 'Drill');
    r.reps = Math.max(1, Math.round(U.minutes * 60 / (estSec(r) + r.rest)));
    return r;
  }
  // 週課表的組 → 課表列：保留組型的休息（autoRest 只用來補其他欄位）
  function qualityRow(x) {
    const r = blankRow(Object.assign({ note: x.name, restAuto: true }, x.row));
    autoRest(r, '主課'); r.rest = x.row.rest;
    return r;
  }
  function menuFromDay(d, k) {
    const m = newMenu(`第 ${k + 1} 堂・${d.focus}`);
    const main = m.blocks.find(b => b.title === '主課');
    d.sets.forEach(x => main.rows.push(hasPb(S.zstroke) ? qualityRow(x) : coachRow(S.zstroke, x.name)));
    if (d.obs) m.blocks[0].rows.push(blankRow({ reps: 1, dist: 100, stroke: S.zstroke, int: 'none', rest: 60, note: '觀察點：同池長、同出發、同距離計時一趟，和前幾週比' }));
    if (d.uw) m.blocks.find(b => b.title === 'Drill').rows.push(uwRow(d.retest));
    return m;
  }
  /* ---------- 分段主課＋抽泳式（2026-10-15，額外的趣味入口） ----------
     主課＝1–6 段（每段一個目的）× 每段拆成 1–4 輪（每輪一個泳姿）。
     段落：依賽事週期（pzPhase）或自選週期 → 該期品質課的組（qualityDay，與週課表同一份），可在後段加一段副泳式有氧；或自訂目的順序 → goalSet。
     每一輪的泳式用抽的：抽完拿掉（同一輪不重複，抽完再補滿）／抽完放回（可能自自仰）；每輪可固定成某一式。
     整堂總量（選填）：主課可用量＝總量 − 目前課表的暖身／drill／緩和；速度、乳酸、賽速段照組型的量（它們的量不隨時間加），剩下的分給有氧與閾值段。
     泳式的距離上限看成績、不看年齡：某式有成績的最長距離就是那一式的每趟上限（只游過 50、100 蝶的人，蝶式有氧不會排 200）。
     組型、配速、休息全部走既有產生器，不另立公式；只留在這次頁面（總量記在本機），加入課表才寫進存檔。drill 不抽，在課表裡自己選。 */
  const DRAW_ART = (() => { try { return JSON.parse(document.getElementById('wk-draw-art').textContent) || {}; } catch (e) { return {}; } })();
  const DRAW_STROKES = ['free', 'back', 'breast', 'fly'];
  const DRAW_SHORT = { free: '自', back: '仰', breast: '蛙', fly: '蝶' };
  const DRAW_PHASES = ['general_prep', 'specific_prep', 'competition', 'taper', 'transition'];
  const DRAW_MAX = 6;             // 最多幾段
  const DRAW_SPLITS = [1, 2, 3, 4]; // 一段最多拆成四式
  const DRAW_SHUFFLE_MS = 640, DRAW_GAP_MS = 420, DRAW_SETTLE_MS = 240; // 一次抽完：洗牌 4×160ms；每張翻卡間隔；最後一張翻完到結果定稿
  const GACHA_OPEN_MS = 1700, GACHA_READY_MS = 900, GACHA_OUT_MS = 260; // 單抽舞台：落下＋蓄力到爆開；爆開到可收下；收下淡出（與 workout.css 的 wk-g-* 時間軸一致）
  const GACHA_SPARKS = 12, GACHA_BUBBLES = 10; // 爆開的光點數、舞台上升的泡泡數（CSS 依 nth-child 排角度與位置）
  const DRAW_DAYS = [0, 1];       // qualityDay 只分第 1／第 2 堂品質課
  const DRAW_RACE_EVENT = 100;    // 自訂的賽速段：配速參考距離同「依目的選主課」預設
  const DRAW_ART_SIZE = 'width="360" height="480"'; // 卡面 webp 實際尺寸，避免載入位移
  const DRAW_TOTAL_KEY = 'cortex-draw-total', DRAW_TOTAL_MAX = 10000;
  const DRAW_FRAME = 500;         // 課表還沒排暖身／drill／緩和時先抓 100＋300＋100
  // 依時間決定量的組：分主課剩下的量（權重：閾值、穩定有氧是主角，輕鬆有氧是陪襯）；每趟距離從長到短挑，至少 3 趟
  const FLEX_WEIGHT = { threshold: 2, steady: 2, aerobic_easy: 1 };
  const FLEX_DIST = [400, 200, 100], FLEX_MIN_REPS = 3; // set_types：閾值每趟 100–400 m、輕鬆有氧 100 m 起
  const LONG_ROUND_RATIO = 10; // 一輪的量超過該式最長成績距離的 10 倍就提醒可以拆給多式——工具的提醒門檻，不是文獻劑量
  const readTotal = () => { try { const v = +localStorage.getItem(DRAW_TOTAL_KEY); return v > 0 ? v : null; } catch (_) { return null; } };
  // got／locks 以「段.輪」為鍵；bag＝抽完拿掉時這一輪還在籤筒裡的式，輪流一張一張抽也接得上
  const draw = { src: 'cycle', phase: 'general_prep', day: 0, custom: ['velocity', 'threshold', 'aerobic_easy'], size: 'standard', tail: true,
    splits: [], total: readTotal(), pool: new Set(DRAW_STROKES), mode: 'remove', locks: {}, got: {}, bag: null, sig: '', busy: false };
  function drawPhase() {
    if (draw.src === 'phase') return { phase: draw.phase };
    const P = pzPhase();
    return P ? { phase: P.phase, days: P.days } : null;
  }
  // 每一段：name（目的）、key（組型）＋ build(stroke) → { name, row }（標準組型；配速用該式自己的成績與賽距）
  function drawSlots() {
    if (draw.src === 'custom') return draw.custom.map(key => ({ name: goalName(key), key,
      build: s => { const x = goalSet({ key, stroke: s, size: draw.size, event: DRAW_RACE_EVENT }); return { name: x.name, row: x.row }; } }));
    const P = drawPhase();
    if (!P) return [];
    const sets = s => (P.phase === 'transition' ? [setBuilders(s).free()] : qualityDay(P.phase, draw.day, setBuilders(s)).sets);
    const slots = sets('free').map((x0, i) => ({ name: x0.name, key: x0.type || 'aerobic_easy',
      build: s => { const x = sets(s)[i]; return { name: x.name, row: qualityRow(x) }; } }));
    if (draw.tail && P.phase !== 'transition') slots.push({ name: '副泳式有氧', key: 'aerobic_easy', build: s => { const x = setBuilders(s).easy('副泳式有氧'); return { name: x.name, row: qualityRow(x) }; } });
    return slots;
  }
  const drawSplit = (i) => draw.splits[i] || 1;
  const drawRounds = (slots) => slots.flatMap((sl, i) => Array.from({ length: drawSplit(i) }, (_, j) => ({ i, j, id: `${i}.${j}`, sl })));
  const roundLabel = (r) => (drawSplit(r.i) > 1 ? `第 ${r.i + 1} 段第 ${r.j + 1} 輪` : `第 ${r.i + 1} 段`);
  const drawSig = (slots) => slots.map((sl, i) => `${sl.name}×${drawSplit(i)}`).join('|');
  const drawPool = () => DRAW_STROKES.filter(s => draw.pool.has(s));
  const drawFace = (id) => draw.locks[id] || draw.got[id];
  const drawResult = (rounds) => (rounds.length && rounds.every(r => drawFace(r.id)) ? rounds.map(r => drawFace(r.id)) : null);
  const drawNext = (rounds) => rounds.find(r => !drawFace(r.id));
  const drawRound = () => { draw.got = {}; draw.bag = null; };
  const segStrokes = (rounds, i) => rounds.filter(r => r.i === i).map(r => SZH[drawFace(r.id)]).join('、'); // 這一段各輪抽到的式
  // 抽一支籤：放回＝每次從整個籤筒抽；拿掉＝從這一輪剩下的抽，抽空了再全部放回。
  // 拿掉模式下同一段的各輪不重複（「4 式各一輪」就是四式都游到）；籤筒剩下的都已在這段出現過，才從整個籤筒挑這段還沒有的
  function drawPick(rounds, r) {
    const pool = drawPool(), any = a => a[Math.floor(Math.random() * a.length)];
    if (draw.mode === 'replace') return any(pool);
    const locked = rounds.map(x => draw.locks[x.id]).filter(Boolean);
    if (!draw.bag) draw.bag = pool.filter(s => !locked.includes(s)); // 固定的那式先從這一輪拿掉
    if (!draw.bag.length) draw.bag = pool.slice();
    const used = rounds.filter(x => x.i === r.i && x.id !== r.id).map(x => drawFace(x.id)).filter(Boolean);
    const fresh = draw.bag.filter(s => !used.includes(s)), spare = pool.filter(s => !used.includes(s));
    const s = fresh.length ? any(fresh) : spare.length ? any(spare) : any(draw.bag);
    if (draw.bag.includes(s)) draw.bag.splice(draw.bag.indexOf(s), 1);
    return s;
  }
  // 某式有成績的最長距離＝那一式每趟的上限；沒有任何成績就不設限（也算不出目標）
  const strokeCap = (s) => { const k = known(s).map(([d]) => d); return k.length ? Math.max(...k) : Infinity; };
  // 暖身＋drill＋緩和：讀目前課表；還沒排就先抓 DRAW_FRAME
  function drawFrame() {
    const d = M().blocks.filter(b => b.title !== '主課').reduce((a, b) => a + b.rows.reduce((x, r) => x + rowDist(r), 0), 0);
    return d ? { m: d, from: '目前課表' } : { m: DRAW_FRAME, from: '先抓 100＋300＋100' };
  }
  // 量的分配：沒填總量 → 各段照組型；有填 → 固定量的段照組型，剩下的依權重分給有氧／閾值段
  function drawPlan(slots) {
    const base = slots.map(sl => rowDist(sl.build('free').row));
    if (!draw.total) return { vols: base.map(() => null), base };
    const frame = drawFrame(), budget = Math.max(0, draw.total - frame.m);
    const w = slots.map(sl => FLEX_WEIGHT[sl.key] || 0), wsum = w.reduce((a, b) => a + b, 0);
    const fixed = base.reduce((a, v, i) => a + (w[i] ? 0 : v), 0), share = Math.max(0, budget - fixed);
    return { vols: w.map(x => (x && wsum ? share * x / wsum : null)), base, frame, budget, fixed, share, flex: wsum > 0 };
  }
  const sendoffOf = (r) => { const tg = targetOf(r); return Math.ceil(((tg && tg.t ? tg.t : estSec(r)) + r.rest) / RND) * RND; };
  // 一輪的組：同一段的量平均分給各輪；依時間的組重挑每趟距離；超過該式成績上限的距離縮短、總量不變
  function roundBuild(r, s, plan) {
    if (!hasPb(s)) return { name: r.sl.name, row: coachRow(s, r.sl.name), noPb: true };
    const x = r.sl.build(s), row = normRow(JSON.parse(JSON.stringify(x.row))), k = drawSplit(r.i), cap = strokeCap(s);
    if (FLEX_WEIGHT[r.sl.key]) {
      const V = (plan.vols[r.i] != null ? plan.vols[r.i] : rowDist(row)) / k;
      const cand = [row.dist, ...FLEX_DIST].filter(d => d <= cap);
      const d = cand.find(c => V / c >= FLEX_MIN_REPS) || (cand.length ? Math.min(...cand) : Math.min(row.dist, cap));
      Object.assign(row, { sets: 1, setRest: 0, dist: d, reps: Math.max(1, Math.round(V / d)) });
    } else {
      if (k > 1) { const n = (row.sets || 1) * row.reps; Object.assign(row, { sets: 1, setRest: 0, reps: Math.max(1, Math.ceil(n / k)) }); }
      if (row.dist > cap) { const n = (row.sets || 1) * row.reps * row.dist; Object.assign(row, { dist: cap, reps: Math.max(1, Math.round(n / (row.sets || 1) / cap)) }); }
    }
    row.sendoff = sendoffOf(row);
    return { name: x.name, row };
  }
  const drawImg = (k) => (DRAW_ART[k] ? `<img src="${esc(DRAW_ART[k])}" alt="" ${DRAW_ART_SIZE} decoding="async">` : '');
  const cardFace = (s) => `${drawImg(s)}<b>${esc(SZH[s])}</b>`;
  function drawDetail(x) {
    if (x.noPb) return `<p class="wk-draw-set">${esc(noPbText(x.row.stroke))}</p>`;
    const r = x.row, tg = targetOf(r), cap = strokeCap(r.stroke);
    const t = tg && tg.t ? `目標 ${fmt(tg.t)}` : r.int === 'none' ? '不設目標時間' : `${(tg && tg.miss) || '待補成績'}`;
    const long = rowDist(r) > cap * LONG_ROUND_RATIO ? `<p class="wk-note">${esc(SZH[r.stroke])}最長的成績是 ${cap} m，這一輪 ${rowDist(r)} m 偏多；可以把這段拆給多式各一輪。</p>` : '';
    return `<p class="wk-draw-set">${r.sets > 1 ? `${r.sets} 組 × ` : ''}${r.reps} × ${r.dist} m</p><p class="muted">${esc(t)}・休 ${fmt0(r.rest)}</p>${long}`;
  }
  // 還沒翻的卡本身就是按鈕：小朋友輪流點自己那張
  function drawCard(r, built, canPick) {
    const lock = draw.locks[r.id], s = drawFace(r.id), multi = drawSplit(r.i) > 1;
    const inner = `<div class="wk-card-in"><div class="wk-card-back">${drawImg('card-back')}</div><div class="wk-card-face" data-draw-face>${s ? cardFace(s) : ''}</div></div>`;
    return `<li class="wk-card${s ? ` is-up is-${s}` : ''}" data-draw-card="${r.id}">
      <p class="wk-card-k">${multi ? `第 ${r.j + 1} 輪` : `第 ${r.i + 1} 段・${esc(r.sl.name)}`}</p>
      ${!s && canPick ? `<button type="button" class="wk-card-flip" data-draw-pick="${r.id}" aria-label="抽${roundLabel(r)}">${inner}</button>` : `<div class="wk-card-flip">${inner}</div>`}
      <div class="wk-card-out">${built ? drawDetail(built) : ''}</div>
      <label class="wk-field"><span>${multi ? '這一輪' : '這一段'}</span><select data-draw-lock="${r.id}"><option value="">用抽的</option>${DRAW_STROKES.map(k => `<option value="${k}"${k === lock ? ' selected' : ''}>固定${esc(SZH[k])}</option>`).join('')}</select></label></li>`;
  }
  // 一段：標題、約幾公尺、拆成幾式，底下是各輪的卡
  function drawSegHtml(sl, i, rounds, builtOf, plan, canPick) {
    const own = rounds.filter(r => r.i === i), k = drawSplit(i);
    const m = own.every(r => builtOf[r.id]) ? own.reduce((a, r) => a + rowDist(builtOf[r.id].row), 0) : Math.round(plan.vols[i] != null ? plan.vols[i] : plan.base[i]);
    return `<li class="wk-seg"><div class="wk-seg-h"><p class="wk-seg-t">第 ${i + 1} 段・${esc(sl.name)}</p><p class="muted">約 ${m} m</p>
      <label class="wk-field"><span>拆成幾式</span><select data-draw-split="${i}">${DRAW_SPLITS.map(n => `<option value="${n}"${n === k ? ' selected' : ''}>${n === 1 ? '一式游完' : `${n} 式各一輪`}</option>`).join('')}</select></label></div>
      <ol class="wk-deck">${own.map(r => drawCard(r, builtOf[r.id], canPick)).join('')}</ol></li>`;
  }
  const drawChip = (attr, k, isOn, label) => `<button type="button" class="wk-chip" aria-pressed="${isOn}" ${attr}="${k}">${esc(label)}</button>`;
  // 段落來源的說明與欄位：週期（依賽事／自選）或自訂順序
  function drawSourceHtml(P) {
    let html = '';
    if (draw.src === 'cycle') html += P ? `<p>現在是 <b>${PHASE_NAME[P.phase]}</b>${P.days >= 0 ? `，離比賽 ${P.days} 天` : ''}；段落照本期的品質課。</p>`
      : '<p class="wk-note">還沒有比賽日期。先在「依賽事日期安排一週」填日期，或改用「自選週期」「自訂」。</p>';
    if (draw.src !== 'custom') {
      const fields = [];
      if (draw.src === 'phase') fields.push(`<label class="wk-field"><span>週期</span><select data-draw-phase>${DRAW_PHASES.map(k => `<option value="${k}"${k === draw.phase ? ' selected' : ''}>${PHASE_NAME[k]}</option>`).join('')}</select></label>`);
      if (P && P.phase !== 'transition') { const B = setBuilders('free'); fields.push(`<label class="wk-field wk-grow"><span>這週第幾堂品質課</span><select data-draw-day>${DRAW_DAYS.map(k => `<option value="${k}"${k === draw.day ? ' selected' : ''}>第 ${k + 1} 堂：${esc(qualityDay(P.phase, k, B).focus)}</option>`).join('')}</select></label>`); }
      if (fields.length) html += `<div class="wk-row">${fields.join('')}</div>`;
      if (P && P.phase === 'transition') html += '<p class="muted">過渡期只排輕鬆游，不設目標時間。</p>';
      else if (P) html += `<div class="wk-chips">${drawChip('data-draw-tail', 'on', draw.tail, '後段加一段副泳式有氧')}</div>`;
    } else {
      const goalOpts = cur => Object.keys(GOAL_BUILDERS).map(k => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(goalName(k))}</option>`).join('');
      html += `<ol class="wk-draw-order">${draw.custom.map((k, i) => `<li><label class="wk-field wk-grow"><span>第 ${i + 1} 段</span><select data-draw-goal="${i}">${goalOpts(k)}</select></label>
        <button type="button" class="wk-btn" data-draw-move="${i}:-1" aria-label="第 ${i + 1} 段往前"${i ? '' : ' disabled'}>↑</button><button type="button" class="wk-btn" data-draw-move="${i}:1" aria-label="第 ${i + 1} 段往後"${i < draw.custom.length - 1 ? '' : ' disabled'}>↓</button><button type="button" class="wk-btn" data-draw-del="${i}" aria-label="刪除第 ${i + 1} 段"${draw.custom.length > 1 ? '' : ' disabled'}>✕</button></li>`).join('')}</ol>
        <div class="wk-row">${draw.custom.length < DRAW_MAX ? '<button type="button" class="wk-btn" data-draw-addslot>加一段</button>' : ''}<label class="wk-field"><span>參考份量</span><select data-draw-size><option value="standard"${draw.size === 'standard' ? ' selected' : ''}>原有組型</option><option value="compact"${draw.size === 'compact' ? ' selected' : ''}>精簡組</option></select></label></div>`;
    }
    return html;
  }
  // 整堂總量：填了就照它分主課的量，並把算式攤開
  function drawTotalHtml(plan) {
    let html = `<div class="wk-row"><label class="wk-field"><span>整堂總量（m，選填）</span><input type="number" inputmode="numeric" min="0" max="${DRAW_TOTAL_MAX}" step="100" placeholder="例 2100" data-draw-total value="${draw.total || ''}"></label></div>`;
    if (!draw.total) return html + '<p class="muted">沒填就照各組型的原有份量。填了以後，速度、乳酸、賽速段照組型，剩下的量分給有氧與閾值段。</p>';
    html += `<p class="muted">整堂 ${draw.total} m − 暖身＋drill＋緩和 ${plan.frame.m} m（${plan.frame.from}）＝主課約 ${plan.budget} m；速度、乳酸、賽速段 ${plan.fixed} m，${plan.flex ? `其餘約 ${Math.round(plan.share)} m 分給有氧與閾值段。` : '沒有有氧或閾值段可以吸收剩下的量。'}</p>`;
    if (plan.flex && plan.share < FLEX_DIST.at(-1) * FLEX_MIN_REPS) html += '<p class="wk-note">剩給有氧與閾值的量很少：總量可能不夠放下這幾段，或速度段太多。</p>';
    return html;
  }
  function renderDraw() {
    const box = $('[data-wk-draw-body]');
    if (!box || draw.busy) return;
    const act = document.activeElement, keep = act && box.contains(act) ? [...act.attributes].find(a => a.name.startsWith('data-draw-')) : null;
    const slots = drawSlots();
    draw.splits.length = slots.length;
    if (draw.sig !== drawSig(slots)) { drawRound(); draw.sig = drawSig(slots); } // 段落或拆法變了（例如改了賽事日期），這一輪作廢
    const rounds = drawRounds(slots), plan = drawPlan(slots);
    Object.keys(draw.locks).forEach(id => { if (!rounds.some(r => r.id === id)) delete draw.locks[id]; });
    const P = draw.src === 'custom' ? null : drawPhase();
    let html = `<p class="muted">主課分幾段、每段練什麼，由週期或你自己決定；每段可以一式游完，或拆給 2–4 式各一輪，每輪游什麼式用抽的。加進課表後全部都能改，drill 照抽到的泳式在課表裡自己選。</p>
      <p class="wk-css-k">主課段落從哪來</p><div class="wk-chips">${drawChip('data-draw-src', 'cycle', draw.src === 'cycle', '依賽事週期')}${drawChip('data-draw-src', 'phase', draw.src === 'phase', '自選週期')}${drawChip('data-draw-src', 'custom', draw.src === 'custom', '自訂')}</div>` + drawSourceHtml(P);
    if (slots.length) html += drawTotalHtml(plan);
    html += `<p class="wk-css-k">籤筒裡放哪幾式</p><div class="wk-chips">${DRAW_STROKES.map(s => drawChip('data-draw-pool', s, draw.pool.has(s), SZH[s])).join('')}</div>
      <p class="wk-css-k">抽法</p><div class="wk-chips">${drawChip('data-draw-mode', 'remove', draw.mode === 'remove', '抽完拿掉')}${drawChip('data-draw-mode', 'replace', draw.mode === 'replace', '抽完放回')}</div>
      <p class="muted">${draw.mode === 'remove' ? '同一輪不重複；輪數比籤多時，抽完再全部放回。' : '每輪都從整個籤筒抽，可能抽到同一式（例如自自仰）。'}</p>
      <div class="wk-chips">${drawChip('data-draw-sound', 'on', SFX.isOn(), '抽卡音效')}</div>`;
    const res = drawResult(rounds), next = drawNext(rounds), left = rounds.filter(r => !drawFace(r.id)).length;
    if (slots.length) {
      const builtOf = Object.fromEntries(rounds.filter(r => drawFace(r.id)).map(r => [r.id, roundBuild(r, drawFace(r.id), plan)]));
      const blocked = !!next && !drawPool().length;
      const main = res ? '<button type="button" class="wk-btn wk-btn--main" data-draw-again>再抽一輪</button>'
        : `<button type="button" class="wk-btn wk-btn--main" data-draw-go${blocked ? ' disabled' : ''}>抽${roundLabel(next)}</button>${left > 1 ? `<button type="button" class="wk-btn" data-draw-all${blocked ? ' disabled' : ''}>剩下 ${left} 張一次抽完</button>` : ''}`;
      html += `<p class="muted">輪流抽：一人點一張卡，或按「抽…」照順序抽。</p>
        <ol class="wk-segs" data-draw-deck>${slots.map((sl, i) => drawSegHtml(sl, i, rounds, builtOf, plan, !blocked)).join('')}</ol>
        ${blocked ? '<p class="wk-note">籤筒是空的：至少放一式，或把每一輪都設成固定。</p>' : ''}
        <div class="wk-actions">${main}
        <button type="button" class="wk-btn" data-draw-add${res ? '' : ' disabled'}>全部加入目前主課</button><button type="button" class="wk-btn" data-draw-new${res ? '' : ' disabled'}>另建課表</button>
        ${draw.src !== 'custom' ? '<button type="button" class="wk-btn" data-draw-tocustom>用這些段落自訂</button>' : ''}</div>`;
    }
    const live = res ? `抽到：${slots.map((sl, i) => `${sl.name}（${segStrokes(rounds, i)}）`).join(' → ')}`
      : Object.keys(draw.got).length ? `已抽：${rounds.filter(r => draw.got[r.id]).map(r => `${roundLabel(r)}${SZH[draw.got[r.id]]}`).join('、')}；還有 ${left} 張。` : '';
    html += `<p class="wk-draw-live" role="status" data-draw-live>${esc(live)}</p>`;
    box.innerHTML = html;
    const back = keep && box.querySelector(`[${keep.name}="${CSS.escape(keep.value)}"]`);
    if (back && !back.disabled) back.focus();
  }
  /* 抽卡音效：WebAudio 現場合成，不載音檔。時間點對齊舞台時間軸（GACHA_*、workout.css 的 wk-g-*）：
     落下（風聲＋落地咚）→ 蓄力（越來越快的鼓點＋往上爬的音）→ 爆開（亮和弦琶音＋閃爍高音＋水花）→ 蓋章（低音咚）→ 收下（泡泡啵）。
     音效開關只記在這台裝置（瀏覽器儲存失敗就預設開）；跳過蓄力時把已排好的聲音全停掉。 */
  const SFX_KEY = 'cortex-draw-sound';
  const SFX_GAIN = 0.4; // 總音量：池邊手機外放夠聽見，不刺耳
  const SFX_ROLL = { from: 0.13, to: 0.035, ease: 0.82 }; // 蓄力鼓點的起始／最短間隔（秒）與每拍縮短比例
  const SFX_CHORD = [1046.5, 1318.5, 1568, 2093]; // 爆開的大三和弦琶音 C6 E6 G6 C7
  const SFX = (() => {
    let ac = null, out = null, on = true;
    const live = new Set();
    try { on = localStorage.getItem(SFX_KEY) !== 'off'; } catch (_) { /* 讀不到就預設開 */ }
    const ctx = () => {
      if (!on) return null;
      try {
        if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = SFX_GAIN; out.connect(ac.destination); }
        if (ac.state === 'suspended') ac.resume();
        return ac;
      } catch (_) { return null; }
    };
    const keep = (node, t0, t1) => { live.add(node); node.onended = () => { live.delete(node); node.disconnect(); }; node.start(t0); node.stop(t1); };
    const env = (c, t0, dur, vol) => {
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      g.connect(out); return g;
    };
    // 一個音：type 波形，f0→f1 滑音，at 秒後開始
    function tone(type, f0, f1, at, dur, vol) {
      const c = ctx(); if (!c) return;
      const t0 = c.currentTime + at, o = c.createOscillator();
      o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      o.connect(env(c, t0, dur, vol)); keep(o, t0, t0 + dur + 0.02);
    }
    // 一段濾波雜訊：風聲、水花、鼓點
    function hiss(at, dur, vol, f0, f1) {
      const c = ctx(); if (!c) return;
      const t0 = c.currentTime + at, len = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
      for (let k = 0; k < len; k++) data[k] = Math.random() * 2 - 1;
      const src = c.createBufferSource(), bp = c.createBiquadFilter();
      src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      src.connect(bp).connect(env(c, t0, dur, vol)); keep(src, t0, t0 + dur + 0.02);
    }
    return {
      isOn: () => on,
      toggle() { on = !on; try { localStorage.setItem(SFX_KEY, on ? 'on' : 'off'); } catch (_) { /* 只影響下次開頁 */ } if (!on) this.stop(); },
      stop() { live.forEach(n => { try { n.stop(); } catch (_) { /* 已經停了 */ } }); live.clear(); },
      // 卡背落下＋蓄力：一次排好，跳過時 stop() 全部取消
      charge() {
        hiss(0, 0.45, 0.5, 2400, 300); tone('sine', 140, 55, 0.5, 0.22, 0.9);
        const start = GACHA_OPEN_MS / 1000 - 1.15, end = GACHA_OPEN_MS / 1000;
        tone('triangle', 220, 880, start, end - start, 0.18);
        for (let t = start, gap = SFX_ROLL.from, n = 0; t < end; t += gap, gap = Math.max(SFX_ROLL.to, gap * SFX_ROLL.ease), n++) {
          hiss(t, 0.05, 0.35 + 0.4 * (t - start) / (end - start), 1800 + n * 40, 900);
        }
      },
      burst() {
        this.stop();
        hiss(0, 0.6, 0.6, 6000, 1200);
        SFX_CHORD.forEach((f, k) => tone('triangle', f, f, k * 0.07, 0.55, 0.35));
        [2637, 3136, 3520, 4186].forEach((f, k) => tone('sine', f, f * 1.01, 0.3 + k * 0.09, 0.18, 0.12));
        tone('sine', 110, 60, 0.28, 0.25, 0.8); // 名字蓋章
      },
      pop() { tone('sine', 420, 980, 0, 0.09, 0.4); },
      flip() { hiss(0, 0.12, 0.4, 3000, 1200); tone('triangle', 1568, 2093, 0.05, 0.12, 0.18); },
      shuffle() { for (let k = 0; k < 4; k++) hiss(k * 0.16, 0.08, 0.3, 2200, 1400); },
    };
  })();
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 抽完一張（或一次全抽）後：卡片定稿、焦點回到下一個動作
  function drawSettle(popped) {
    draw.busy = false; renderDraw();
    popped.forEach(id => { const li = $(`[data-draw-card="${id}"]`); if (li) li.classList.add('is-pop'); });
    const next = $('[data-draw-go]') || $('[data-draw-again]'); if (next) next.focus();
  }
  // 剩下的一次抽完：洗牌後依序翻開（大人排課用的快速版）
  function runDrawAll() {
    const slots = drawSlots(), rounds = drawRounds(slots);
    if (!rounds.length || draw.busy || !drawNext(rounds)) return;
    const todo = rounds.filter(r => !drawFace(r.id));
    const picks = todo.map(r => (draw.got[r.id] = drawPick(rounds, r)));
    if (reducedMotion()) { drawSettle([]); return; }
    draw.busy = true;
    const box = $('[data-wk-draw-body]'), deck = box.querySelector('[data-draw-deck]');
    box.querySelectorAll('button, select, input').forEach(el => { el.disabled = true; });
    box.querySelector('[data-draw-live]').textContent = '洗牌中…';
    deck.classList.add('is-shuffling'); SFX.shuffle();
    let t = DRAW_SHUFFLE_MS;
    todo.forEach((r, k) => {
      setTimeout(() => {
        const li = deck.querySelector(`[data-draw-card="${r.id}"]`);
        li.querySelector('[data-draw-face]').innerHTML = cardFace(picks[k]);
        li.classList.add('is-up', 'is-pop', `is-${picks[k]}`); SFX.flip();
      }, t);
      t += DRAW_GAP_MS;
    });
    setTimeout(() => drawSettle([]), t + DRAW_SETTLE_MS);
  }
  // 單抽：全螢幕舞台，卡背落下 → 蓄力抖動、光圈與泡泡聚集 → 閃光爆開翻面 → 泳式名蓋章；點一下可跳過蓄力
  function runDrawOne(id) {
    const slots = drawSlots(), rounds = drawRounds(slots), r = rounds.find(x => x.id === id);
    if (draw.busy || !r || drawFace(id) || !drawPool().length) return;
    const s = drawPick(rounds, r), built = roundBuild(r, s, drawPlan(slots));
    draw.got[id] = s;
    if (reducedMotion()) { drawSettle([id]); return; }
    draw.busy = true;
    const st = document.createElement('div');
    st.className = `wk-gacha is-${s}`;
    st.setAttribute('role', 'dialog'); st.setAttribute('aria-modal', 'true'); st.setAttribute('aria-label', `抽${roundLabel(r)}`); st.tabIndex = -1;
    st.innerHTML = gachaHtml(`${roundLabel(r)}・${r.sl.name}`, s, built);
    root.append(st); st.focus(); SFX.charge();
    const ok = st.querySelector('[data-gacha-ok]');
    let stage = 'charge';
    const timers = [];
    const ready = () => { stage = 'ready'; ok.disabled = false; ok.focus(); };
    const open = () => {
      if (stage !== 'charge') return;
      stage = 'open'; timers.forEach(clearTimeout);
      st.classList.add('is-open'); SFX.burst(); st.querySelector('[data-gacha-name]').textContent = `${SZH[s]}！`;
      timers.push(setTimeout(ready, GACHA_READY_MS));
    };
    const close = () => {
      if (stage === 'out') return;
      stage = 'out'; timers.forEach(clearTimeout);
      st.classList.add('is-out'); SFX.pop();
      setTimeout(() => { st.remove(); drawSettle([id]); }, GACHA_OUT_MS);
    };
    st.addEventListener('click', () => (stage === 'charge' ? open() : stage === 'ready' ? close() : null));
    st.addEventListener('keydown', e => {
      if (e.key === 'Escape' || (stage === 'charge' && (e.key === 'Enter' || e.key === ' '))) { e.preventDefault(); if (stage === 'charge') open(); else close(); }
      else if (e.key === 'Tab') { e.preventDefault(); if (!ok.disabled) ok.focus(); } // 舞台上只有「收下」一個可操作的東西
    });
    requestAnimationFrame(() => st.classList.add('is-on'));
    timers.push(setTimeout(open, GACHA_OPEN_MS));
  }
  // 舞台內容：光芒、泡泡、卡（光圈、星光、抖動層、翻面層）、泳式名、組與目標、收下
  const gachaHtml = (title, s, built) => `<div class="wk-gacha-rays"></div><div class="wk-gacha-bubbles">${'<i></i>'.repeat(GACHA_BUBBLES)}</div>
      <p class="wk-gacha-k">${esc(title)}</p>
      <div class="wk-gacha-card"><div class="wk-gacha-glow"></div><div class="wk-gacha-sparks">${'<i></i>'.repeat(GACHA_SPARKS)}</div>
        <div class="wk-gacha-shake"><div class="wk-gacha-in"><div class="wk-gacha-back">${drawImg('card-back')}</div><div class="wk-gacha-face">${drawImg(s)}</div></div></div></div>
      <p class="wk-gacha-name" aria-live="polite" data-gacha-name></p><div class="wk-gacha-out">${drawDetail(built)}</div>
      <button type="button" class="wk-btn wk-btn--main" data-gacha-ok disabled>收下</button><p class="wk-gacha-hint">點一下直接翻開</p><div class="wk-gacha-flash"></div>`;
  function drawAdd(fresh) {
    const slots = drawSlots(), rounds = drawRounds(slots), res = drawResult(rounds);
    if (!res || draw.busy) return;
    const plan = drawPlan(slots), xs = rounds.map((r, k) => roundBuild(r, res[k], plan));
    const label = res.map(s => DRAW_SHORT[s]).join('');
    if (fresh) {
      const m = newMenu(`抽籤・${label}`);
      m.intent = `主課：${slots.map((sl, i) => `${sl.name}（${segStrokes(rounds, i)}）`).join(' → ')}`;
      m.blocks.find(b => b.title === '主課').rows.push(...xs.map(x => x.row));
      S.menus.push(m); S.cur = S.menus.length - 1;
      openEq.clear(); openAdv.clear(); save(); renderMenu(); toast(`已建立課表：${m.name}`);
    } else {
      mainBlock().rows.push(...xs.map(x => x.row));
      save(); renderMenu(); toast(`已加入主課：${label}（${slots.length} 段 ${xs.length} 輪）`);
    }
    root.dispatchEvent(new CustomEvent('workout:recommendation-added'));
    $('#wk-menu').scrollIntoView();
  }
  // 自訂段落搬移或刪除時，拆法與固定泳式跟著段走（舊索引 → 新索引；null＝刪掉）
  function remapSegs(map) {
    const splits = [], locks = {};
    draw.splits.forEach((v, i) => { const n = map(i); if (n != null) splits[n] = v; });
    Object.entries(draw.locks).forEach(([id, v]) => { const [i, j] = id.split('.').map(Number), n = map(i); if (n != null) locks[`${n}.${j}`] = v; });
    draw.splits = splits; draw.locks = locks;
  }
  function initDraw() {
    const el = $('[data-wk-draw]');
    if (!el) return;
    const reset = () => { drawRound(); renderDraw(); };
    el.addEventListener('toggle', () => { if (el.open) renderDraw(); });
    el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled || draw.busy) return;
      const d = b.dataset;
      if (d.drawSrc && ['cycle', 'phase', 'custom'].includes(d.drawSrc)) { draw.src = d.drawSrc; draw.splits = []; draw.locks = {}; reset(); }
      else if (d.drawPool && DRAW_STROKES.includes(d.drawPool)) { if (draw.pool.has(d.drawPool)) draw.pool.delete(d.drawPool); else draw.pool.add(d.drawPool); reset(); }
      else if (d.drawMode && ['remove', 'replace'].includes(d.drawMode)) { draw.mode = d.drawMode; reset(); }
      else if (d.drawTail) { draw.tail = !draw.tail; reset(); }
      else if (d.drawSound) { SFX.toggle(); SFX.pop(); renderDraw(); }
      else if (d.drawMove) {
        const [i, dir] = d.drawMove.split(':').map(Number), j = i + dir;
        if (draw.custom[i] && draw.custom[j]) { [draw.custom[i], draw.custom[j]] = [draw.custom[j], draw.custom[i]]; remapSegs(x => (x === i ? j : x === j ? i : x)); reset(); }
      }
      else if (d.drawDel != null && draw.custom.length > 1 && draw.custom[+d.drawDel]) { const i = +d.drawDel; draw.custom.splice(i, 1); remapSegs(x => (x === i ? null : x > i ? x - 1 : x)); reset(); }
      else if (b.hasAttribute('data-draw-addslot') && draw.custom.length < DRAW_MAX) { draw.custom.push('aerobic_easy'); reset(); }
      else if (b.hasAttribute('data-draw-go')) { const r = drawNext(drawRounds(drawSlots())); if (r) runDrawOne(r.id); }
      else if (d.drawPick != null) runDrawOne(d.drawPick);
      else if (b.hasAttribute('data-draw-all')) runDrawAll();
      else if (b.hasAttribute('data-draw-again')) { reset(); const go = $('[data-draw-go]'); if (go) go.focus(); }
      else if (b.hasAttribute('data-draw-add')) drawAdd(false);
      else if (b.hasAttribute('data-draw-new')) drawAdd(true);
      else if (b.hasAttribute('data-draw-tocustom')) { const slots = drawSlots(); if (slots.length) { draw.custom = slots.map(sl => sl.key); draw.src = 'custom'; reset(); } }
    });
    el.addEventListener('change', e => {
      const t = e.target, d = t.dataset;
      if (draw.busy) return;
      if (t.matches('[data-draw-total]')) { // 量變了不重抽：泳式不變，只重算每輪的趟數
        const v = Math.round(+t.value);
        draw.total = v > 0 ? Math.min(v, DRAW_TOTAL_MAX) : null;
        try { if (draw.total) localStorage.setItem(DRAW_TOTAL_KEY, String(draw.total)); else localStorage.removeItem(DRAW_TOTAL_KEY); } catch (_) { /* 只影響下次開頁 */ }
        renderDraw(); return;
      }
      if (t.matches('[data-draw-phase]') && DRAW_PHASES.includes(t.value)) draw.phase = t.value;
      else if (t.matches('[data-draw-day]') && DRAW_DAYS.includes(+t.value)) draw.day = +t.value;
      else if (t.matches('[data-draw-goal]') && Object.hasOwn(GOAL_BUILDERS, t.value) && draw.custom[+d.drawGoal]) draw.custom[+d.drawGoal] = t.value;
      else if (t.matches('[data-draw-size]') && ['compact', 'standard'].includes(t.value)) draw.size = t.value;
      else if (t.matches('[data-draw-split]') && DRAW_SPLITS.includes(+t.value)) { draw.splits[+d.drawSplit] = +t.value; Object.keys(draw.locks).forEach(id => { if (id.startsWith(`${d.drawSplit}.`)) delete draw.locks[id]; }); }
      else if (t.matches('[data-draw-lock]') && /^\d+\.\d+$/.test(d.drawLock)) { if (DRAW_STROKES.includes(t.value)) draw.locks[d.drawLock] = t.value; else delete draw.locks[d.drawLock]; }
      else return;
      reset();
    });
    // 成績或賽事日期改了，展開中的抽籤區重算目標與段落
    root.addEventListener('change', e => { if (el.open && !el.contains(e.target)) renderDraw(); });
    const follow = () => { if (location.hash === '#wk-draw') el.open = true; };
    window.addEventListener('hashchange', follow);
    follow(); renderDraw();
  }
  /* ---------- 鐵人三項泳段（2026-10-15）：結構全讀 canonical periodization/triathlon.yaml（PZ.tri） ----------
     組型、趟數、休息照來源原文；依賽距調量＝趟數 × scale（Hayes 2018，以標準距離為基準）。
     比賽配速：使用者填的泳段配速優先；沒填時只有 rp_from_css 的賽距暫用 CSS（Swim Smooth 對 1500 m 游泳賽的換算），其餘不給秒數。
     有氧與技術組沿用游泳的 CSS 換算（targetOf 的 steady／easy），鐵人未驗證。沒有出處的份量（每週總量等）不給預設。 */
  const TRI = PZ.tri || null;
  const TRI_STROKE = 'free';
  const CONT_ROUND_M = 50; // 連續長游換算成公尺後的進位單位
  const byKey = (items, key, fallback) => items.find(x => x.key === key) || items.find(x => x.key === fallback);
  const triDist = () => byKey(TRI.race_distances.items, S.pz.tdist, 'standard');
  const triSlot = (k) => TRI.slots.items.find(x => x.key === k);
  // 泳段成績可能超過一小時：接受「時:分:秒」「分:秒」或秒數（parseT 只吃分:秒）
  const parseHms = (x) => {
    const parts = String(x == null ? '' : x).trim().replace(/：/g, ':').split(':');
    if (!parts[0] || parts.length > 3 || parts.some(v => !/^\d+(\.\d+)?$/.test(v))) return null;
    const v = parts.reduce((acc, n) => acc * 60 + +n, 0);
    return v > 0 ? v : null;
  };
  const filled = (x) => String(x || '').trim() !== '';
  // 比賽配速的來源，依序：自填目標配速 → 上次泳段成績換算（實際比賽配速）→ CSS 暫用（只限 rp_from_css 的賽距）
  function triRp() {
    const own = parseT(S.pz.trp), D = triDist();
    if (own) return { t: own, src: '你填的泳段目標配速' };
    if (filled(S.pz.trp)) return { bad: '看不懂填的泳段配速（例 1:45 或 105）' };
    const split = parseHms(S.pz.tsplit);
    if (split) return { t: split / (D.swim_m / 100), src: `上次泳段成績 ÷ ${D.swim_m / 100}；已含抬頭、沒有牆、水況與防寒衣，賽道實際距離不一定準` };
    if (filled(S.pz.tsplit)) return { bad: '看不懂填的泳段成績（例 32:30 或 1:05:00）' };
    if (D.rp_from_css && hasCss(TRI_STROKE)) return { t: css(TRI_STROKE).pace, src: 'CSS 暫用（游泳賽換算，鐵人未驗證）' };
    return null;
  }
  const triPace = () => { const g = triRp(); return g && g.t ? g : null; }; // 可用的比賽配速；看不懂的輸入當作沒有
  // 原文組型的一列 → 課表列；block＝整組重複幾輪（原文 2×[…]），在 triDay 展開
  function triRow(x, scale, rp) {
    const o = { reps: Math.max(1, Math.round(x.reps * scale)), dist: x.dist, stroke: TRI_STROKE, rest: x.rest, note: x.name_zh, int: 'none' };
    if (x.int === 'rp') {
      if (rp) Object.assign(o, { int: 'custom', target: showT(rp.t * x.dist / 100, 1), intLabel: '比賽配速' });
      else o.note += '（填泳段目標配速才有秒數）';
    } else if (x.int === 'steady' || x.int === 'easy') o.int = x.int;
    return blankRow(o);
  }
  function triDay(k) {
    const D = triDist(), rp = triPace();
    // 超級距離：第一堂比賽配速課換成每週至少一次的 10×100（Slaughter 2019）
    const slot = triSlot(D.weekly_10x100 && k === 'rp' ? 'tenx100' : k);
    if (k === 'aerobic') {
      const B = setBuilders(TRI_STROKE), x = B.easy('長有氧');
      const min = slot.continuous_minutes[D.key], c = css(TRI_STROKE);
      const cont = c && c.pace ? Math.round(min * 60 / (c.pace * K_STEADY) * 100 / CONT_ROUND_M) * CONT_ROUND_M : 0; // 分鐘 ÷ 穩定有氧每 100 m 秒數
      return { name: slot.name_zh, note: slot.note_zh, rows: [qualityRow(x)], extra: `改成不停的穩定長游：約 ${min} 分鐘${cont ? `（以穩定有氧配速約 ${cont} m）` : ''}。` };
    }
    const rows = [], scale = slot.key === 'tenx100' ? 1 : D.scale; // 10×100 是原文指定的組，不隨賽距縮放
    const rounds = Math.max(...slot.sets.map(x => x.block || 1));
    for (let r = 0; r < rounds; r++) slot.sets.forEach(x => { if (r < (x.block || 1)) rows.push(triRow(x, scale, rp)); });
    return { name: slot.name_zh, note: slot.note_zh, rows };
  }
  // 有成績或比賽配速才用組型；都沒有＝一般泳者，只給佔位列讓教練排
  const triMainRows = (d) => (hasPb(TRI_STROKE) || triPace() ? d.rows.map(r => JSON.parse(JSON.stringify(r))) : [coachRow(TRI_STROKE, d.name)]);
  function triMenu(d, k) {
    const m = newMenu(`第 ${k + 1} 堂・鐵人${d.name}`);
    m.blocks.find(b => b.title === '主課').rows.push(...triMainRows(d));
    return m;
  }
  const triRowsHtml = (rows) => `<ul>${rows.map(r => { const tg = targetOf(r); return `<li>${esc(rowHead(r))}　${r.int === 'custom' ? '比賽配速 ' : ''}${tg && tg.t ? '目標 ' + fmt(tg.t) : tg && tg.miss ? `<span class="wk-miss">${esc(tg.miss)}</span>` : '不設目標'}　休 ${fmt0(r.rest)}<br><span class="muted">${esc(r.note)}</span></li>`; }).join('')}</ul>`;
  // 「我是游泳／鐵人」決定成績區顯示哪些欄位、選主課給哪一套選項
  const isTri = () => S.pz.who === 'tri' && !!TRI;
  function applyWho() {
    const tri = isTri();
    $('[data-wk-tri]').hidden = !tri;
    root.querySelectorAll('[data-wk-pbset]').forEach(el => { el.hidden = tri && el.dataset.wkPbset !== TRI_STROKE; });
    root.querySelectorAll('[data-wk-goal-swim]').forEach(el => { el.hidden = tri; });
    if (!tri) return;
    const got = triRp();
    $('[data-wk-tri-pace]').innerHTML = got && got.t ? `比賽配速 <b>${fmt(got.t)}</b>／100 m：${esc(got.src)}。` : got && got.bad ? `<span class="wk-miss">${esc(got.bad)}</span>` : `還沒有比賽配速：${triDist().rp_from_css ? '填泳池 200＋400 會暫用 CSS，或填上次泳段成績' : '這個賽距不暫用 CSS，請填上次泳段成績或目標配速'}。`;
  }
  // 選主課的鐵人版：一次出一堂，不需要賽事日期
  const TRI_GOALS = ['rp', 'change', 'skill', 'aerobic'];
  let triGoal = 'rp';
  function renderTriGoals(box) {
    const d = triDay(triGoal), ok = hasPb(TRI_STROKE) || triPace();
    box.innerHTML = `<div class="wk-goal-preview"><p class="wk-css-k">鐵人三項・${esc(triDist().name_zh)}（泳段 ${triDist().swim_m} m）・自由式</p>
      <div class="wk-chips" role="group" aria-label="今天練哪一種">${TRI_GOALS.map(k => `<button type="button" class="wk-chip" aria-pressed="${k === triGoal}" data-wk-tri-goal="${k}">${esc(triSlot(k).name_zh)}</button>`).join('')}</div>
      <h3>${esc(d.name)}</h3>${ok ? triRowsHtml(d.rows) : `<p class="wk-note">${esc(noPbText(TRI_STROKE))}，也沒有比賽配速：這裡不建議組型，加入時是佔位列。</p>`}
      ${d.extra && ok ? `<p>${esc(d.extra)}</p>` : ''}<p class="muted">${esc(d.note)}</p>
      <div class="wk-actions"><button type="button" class="wk-btn wk-btn--main" data-wk-tri-add>加入目前主課</button><button type="button" class="wk-btn" data-wk-tri-new>另建課表</button></div></div>`;
  }
  function addTriGoal(asNew) {
    const d = triDay(triGoal), rows = triMainRows(d);
    if (asNew) {
      const m = newMenu(`鐵人・${d.name}`);
      m.blocks.find(b => b.title === '主課').rows.push(...rows);
      S.menus.push(m); S.cur = S.menus.length - 1;
      save(); renderMenu(); toast(`已建立課表：${m.name}`);
    } else { mainBlock().rows.push(...rows); save(); renderMenu(); toast(`已加入主課：${d.name}`); }
    root.dispatchEvent(new CustomEvent('workout:recommendation-added'));
    $('#wk-menu').scrollIntoView();
  }
  const pzHead = (P) => `<div class="wk-pzhead"><p class="wk-css-k">現在是</p><p class="wk-pz-phase">${PHASE_NAME[P.phase]}</p>
      <p>${P.days >= 0 ? `離比賽 <b>${P.days}</b> 天（約 ${(P.days / 7).toFixed(1)} 週）` : ''}${P.note ? ' ' + esc(P.note) : ''}</p></div>`;
  function renderTri(box, P) {
    const D = triDist(), L = byKey(TRI.levels.items, S.pz.tlevel, 'regular'), got = triRp(), rp = triPace();
    const n = Math.min(6, Math.max(1, +S.pz.sess || 1));
    const week = TRI.week.by_sessions[String(n)].map(triDay);
    const src = (t) => `<p class="muted">${md(t)}</p>`;
    let html = '';
    if (P) html += pzHead(P);
    html += `<div class="wk-box"><h3>${esc(D.name_zh)}（泳段 ${D.swim_m} m）・${esc(L.name_zh)} <span class="wk-cert">${TRI.planner.cert}</span></h3>
      <p>建議每週 <b>${L.sessions}</b> 堂：${esc(L.note_zh)}${+S.pz.sess !== L.sessions ? ` <button type="button" class="wk-btn" data-tri-sess="${L.sessions}">改成每週 ${L.sessions} 堂</button>` : ''}</p>
      ${src(TRI.session_volume.note_zh)}
      <p>比賽配速：${rp ? `<b>${fmt(rp.t)}</b>／100 m（${esc(rp.src)}）` : got && got.bad ? `<span class="wk-miss">${esc(got.bad)}，比賽配速組先不給秒數</span>` : '<span class="wk-miss">沒有可用的比賽配速，比賽配速組不給秒數</span>'}</p>
      ${src(TRI.race_pace.rule_zh)}${src(TRI.race_pace.retest_zh)}
      ${src(TRI.race_distances.scale_note_zh)}</div>`;
    if (P && P.days >= 0 && P.days <= TRI.race_month.open_water_days) html += `<div class="wk-box"><h3>賽前一個月</h3><p>${esc(TRI.race_month.note_zh)}</p></div>`;
    if (P && (P.phase === 'taper' || (P.days >= 0 && P.days <= PZ.taper.max + 7))) html += `<div class="wk-taper"><h3>減量</h3><p>${esc(TRI.taper.note_zh)}</p><ul>
      <li>游泳減量時長 ${PZ.taper.min}–${PZ.taper.max} 天；總量降 ${esc(PZ.taper.vol.typical)}</li><li>${md(PZ.taper.freq)}</li></ul></div>`;
    html += `<h3>這週 ${n} 堂的建議（自由式）</h3><p class="muted">${esc(TRI.week.note_zh)}</p>
      ${hasPb(TRI_STROKE) || rp ? '' : `<p class="wk-note">${esc(noPbText(TRI_STROKE))}，也沒填泳段目標配速：這裡只排每堂的定位，建成課表時主課是佔位列。</p>`}`;
    html += '<ol class="wk-week">' + week.map((d, k) => `<li class="wk-day">
        <div class="wk-day-h"><b>第 ${k + 1} 堂</b><span>${esc(d.name)}</span></div>
        ${triRowsHtml(d.rows)}
        ${d.extra ? `<p>${esc(d.extra)}</p>` : ''}<p class="muted">${esc(d.note)}</p>
        <button type="button" class="wk-add" data-tri-day="${k}">用這堂建立課表</button></li>`).join('') + '</ol>'
      + `<div class="wk-actions"><button type="button" class="wk-btn" data-tri-all>整週建成 ${n} 份課表</button></div>`;
    box.innerHTML = html;
    const add = (list) => { list.forEach(([d, k]) => S.menus.push(triMenu(d, k))); S.cur = S.menus.length - list.length; save(); renderMenu(); toast(list.length > 1 ? `已建立 ${list.length} 份課表，在 ⑤ 的「課表」選單切換` : `已建立課表：${M().name}`); document.getElementById('wk-menu').scrollIntoView(); };
    box.querySelectorAll('[data-tri-day]').forEach(btn => btn.addEventListener('click', () => add([[week[+btn.dataset.triDay], +btn.dataset.triDay]])));
    box.querySelector('[data-tri-all]').addEventListener('click', () => add(week.map((d, k) => [d, k])));
    const ss = box.querySelector('[data-tri-sess]');
    if (ss) ss.addEventListener('click', () => { S.pz.sess = ss.dataset.triSess; $('[data-wk-sess]').value = S.pz.sess; save(); renderPz(); });
  }
  function renderPz() {
    const box = $('[data-wk-pzout]');
    const P = pzPhase();
    applyWho();
    if (isTri()) { renderTri(box, P); return; }
    if (!P) { box.innerHTML = '<p class="muted">填目標賽事日期後開始推算。</p>'; return; }
    const s = S.zstroke;
    const b = P.bounds, tot = Math.max(b.general_prep, P.days, 1);
    const seg = (key, from, to) => `<div class="wk-tl-seg wk-tl-${key}" data-grow="${Math.max(to - from, 0)}"><span>${PHASE_NAME[key]}</span></div>`;
    const pos = P.days < 0 ? 100 : Math.max(0, Math.min(100, 100 * (1 - P.days / tot)));
    let html = pzHead(P);
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
    const L = pzLoad(P);
    if (L) {
      html += `<div class="wk-box"><h3>這週在負荷節律裡的位置 <span class="wk-cert">${esc(L.pat.cert)}</span></h3>
        <p>${PHASE_NAME[P.phase]}第 <b>${L.wk + 1}</b> 週：<b>${L.recovery ? '恢復週' : `負荷週 ${L.pos + 1}／${L.load}`}</b>。這一期對照 ${esc(L.ratio)}（${L.load} 個負荷週接 ${L.rest} 個恢復週；${esc(L.pat.note_zh)}）。</p>
        <p class="muted">${L.recovery ? '恢復週要降多少，書裡沒有給數字：品質課的強度保留，各組趟數自己往下調。' : '負荷週照下面的課做；要不要比上週多一點，看上週的完成品質與恢復。'}書中提醒：${md(String(PZ.loading_note || '').replace(/^🔵\s*/, ''))}</p></div>`;
    }
    if (P.phase === 'taper' || (P.days >= 0 && P.days <= PZ.taper.max + 7)) {
      html += `<div class="wk-taper"><h3>減量怎麼做 🟢</h3><ul>
        <li>時長 ${PZ.taper.min}–${PZ.taper.max} 天：${md(PZ.taper.dur_note)}</li>
        <li>總量降 ${esc(PZ.taper.vol.typical)}（剛完成高量訓練塊降 ${esc(PZ.taper.vol.heavy_pretaper)}）</li>
        <li>${md(PZ.taper.freq)}</li><li>${esc(PZ.taper.by_event.replace(/^🟢\s*/, ''))}</li></ul></div>`;
    }
    const n = Math.min(6, Math.max(1, +S.pz.sess || 1));
    const bud = PZ.budgets.find(x => x.sessions === n);
    const week = weekPlan(P.phase, n);
    const U = PZ.udk, retest = U && uwRetest(P), uwFirst = week.find(d => d.uw);
    if (retest && uwFirst) uwFirst.retest = true;
    if (uwFirst) {
      html += `<div class="wk-box"><h3>${esc(U.title_zh)}：這週 ${week.filter(d => d.uw).length} 堂 <span class="wk-cert">${esc(U.cert)}</span></h3>
        <p>${esc(U.dose_zh)}${P.phase === 'taper' ? esc(U.taper_zh) : ''}</p>
        <p>${retest ? `<b>這週是重測週</b>（排在第 ${week.indexOf(uwFirst) + 1} 堂）：` : '下週重測：'}${esc(U.retest_zh)}</p>
        <p class="wk-note"><b>水下安全：</b>${md(String(U.safety || '').replace(/^🔵\s*/, '').replace(/^因此/, ''))}</p>
        <p class="muted">${esc(U.max_underwater_zh)}${esc(U.turn_test_zh)}</p>
        <p class="muted">出處：<a href="${U.doc_url}">${esc(U.source_zh)}</a>。練法：<a href="${U.drill_url}">比賽配速水下打水</a>。轉身測法依據：<a href="${U.turn_url}">三種轉法比較研究</a>。</p></div>`;
    }
    html += `<h3>這週 ${n} 堂的建議（${SZH[s]}）</h3>
      <p class="muted">照上課順序排，吃力的品質課之間隔一堂輕鬆課。每堂只給主課，暖身、drill、緩和留給你排；泳式跟著 ② 選中的那一式，目標秒數用 ① 的成績算。</p>
      ${hasPb(s) ? '' : `<p class="wk-note">${esc(noPbText(s))}。還沒有這一式成績通常是還沒比過賽的一般泳者，這裡只排每堂的定位；建成課表時主課是佔位列，等你填。</p>`}`;
    if (bud && P.phase !== 'transition') html += `<details class="wk-more"><summary>週組裝規則原文 🔵</summary><p>${md(bud.layout_zh)}</p><p>${md(PZ.spacing).replace(/\n/g, '<br>')}</p></details>`;
    html += '<ol class="wk-week">' + week.map((d, k) => `<li class="wk-day wk-day--${d.slot}">
        <div class="wk-day-h"><b>第 ${k + 1} 堂</b><span>${SLOT_NAME[d.slot]}</span></div>
        <p class="wk-day-f">${esc(d.focus)}</p>
        <ul>${!hasPb(s) ? d.sets.map(x => `<li><b>${esc(x.name)}</b><br><span class="wk-miss">${esc(noPbText(s))}</span></li>`).join('') : d.sets.map(x => { const row = blankRow(x.row), tg = targetOf(row), ty = x.type && TYPE[x.type];
          return `<li><b>${esc(x.name)}</b>${ty ? ` <span class="wk-cert">${ty.cert}</span>` : ''}<br>${esc(rowHead(row))}　${tg && tg.t ? '目標 ' + fmt(tg.t) : tg && tg.miss ? `<span class="wk-miss">${esc(tg.miss)}</span>` : '不設目標'}　休 ${fmt0(row.rest)}<br><span class="muted">${x.why}${ty && ty.exit ? `。退出：${esc(ty.exit)}` : ''}</span></li>`; }).join('')}</ul>
        ${d.obs ? '<p class="muted">這堂放本週的觀察點：熱身後同池長、同出發、同距離計時一趟，和前幾週比。</p>' : ''}
        ${d.uw ? `<p class="muted">＋ ${esc(U.title_zh)}約 ${U.minutes} 分鐘，放在 drill 段${d.retest ? '；這堂先重測' : ''}。</p>` : ''}
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
    if (TRI) {
      $('[data-wk-tdist]').innerHTML = TRI.race_distances.items.map(x => `<option value="${esc(x.key)}">${esc(x.name_zh)}（${x.swim_m} m）</option>`).join('');
      $('[data-wk-tlevel]').innerHTML = TRI.levels.items.map(x => `<option value="${esc(x.key)}">${esc(x.name_zh)}</option>`).join('');
      $('[data-wk-who]').value = S.pz.who; $('[data-wk-tdist]').value = S.pz.tdist; $('[data-wk-tlevel]').value = S.pz.tlevel;
      $('[data-wk-trp]').value = S.pz.trp; $('[data-wk-tsplit]').value = S.pz.tsplit;
      // 鐵人欄位影響成績區、選主課與排一週三處。文字欄打字當下就更新：等到失焦的 change 才重畫，
      // 會把使用者正要點的「建立課表」按鈕換掉、吃掉那一下點擊
      const onTri = (sel, key, evt) => $(sel).addEventListener(evt, (e) => { S.pz[key] = e.target.value; save(); renderPz(); renderGoals(); });
      onTri('[data-wk-who]', 'who', 'change'); onTri('[data-wk-tdist]', 'tdist', 'change'); onTri('[data-wk-tlevel]', 'tlevel', 'change');
      onTri('[data-wk-trp]', 'trp', 'input'); onTri('[data-wk-tsplit]', 'tsplit', 'input');
    } else $('[data-wk-whorow]').hidden = true;
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
  // 編輯方式（2026-09-30 使用者要求）：上方一張「新增一列」表單填好按「加入」；下方課表每列只顯示一行摘要，
  // 按「修改」才在原位展開（同時只開一列），「刪除」可從提示復原。草稿不存檔，重新整理就清掉。
  let draft = null, draftBlk = null, draftDirty = false, editing = null, flash = null;
  function draftBi() {
    const bs = M().blocks;
    let bi = bs.indexOf(draftBlk);
    if (bi < 0) {
      if (!bs.length) { draftBlk = null; return -1; }
      bi = bs.findIndex(b => !b.rows.length);
      if (bi < 0) bi = Math.max(0, bs.findIndex(b => b.title === '主課'));
      draftBlk = bs[bi];
      if (!draftDirty) draft = null;
    }
    if (!draft) { draft = newRow(bi); draftDirty = false; }
    return bi;
  }
  // 換目標段：還沒動過的草稿依新段重帶預設，動過的只重算建議休息
  function retarget(bi) {
    draftBlk = M().blocks[bi];
    if (!draftDirty) draft = null; else autoRest(draft, draftBlk.title);
  }
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
  // kind：'draft'＝上方新增表單、'edit'＝課表裡正在修改的那一列
  function rowHtml(row, bi, ri, kind) {
    const ints = NO_AUTO[row.mode] ? { none: INTS.none, custom: INTS.custom } : INTS;
    if (!ints[row.int]) row.int = 'none';
    const d = drillOf(row.drill);
    const key = kind === 'draft' ? 'd' : bi + '-' + ri;
    const eq = row.equip || [];
    return `<li class="wk-r${kind === 'edit' ? ' wk-r--edit' : ''}" data-b="${bi}" data-r="${ri}">
      ${kind === 'draft' ? `<div class="wk-r-line"><label class="wk-in"><span>加到</span><select data-draftb aria-label="加到哪一段">${M().blocks.map((b, i) => `<option value="${i}"${i === bi ? ' selected' : ''}>${esc(b.title || '未命名')}</option>`).join('')}</select></label></div>` : ''}
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
      <div class="wk-r-line"><span class="wk-in"><span>項目結束後休息</span>${tfHtml('data-tff="rowRest"', row.rowRest, 2, '項目結束後休息', '留空沿用每趟設定', true)}</span></div>
      <p class="wk-hint">這一列全部完成後，休息多久再進下一項。取代最後一趟的休息；可填 90 或 1:30，填 0 直接接下一項，留空沿用每趟設定。課表最後一項不再休息。</p>
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
      ${kind === 'draft' ? '<button type="button" class="wk-btn wk-btn--main wk-r-main" data-act="add">加入</button>' : `<button type="button" class="wk-btn wk-btn--main wk-r-main" data-act="done">完成</button>
      <div class="wk-r-act">
        <button type="button" data-act="up" aria-label="往上移">↑</button><button type="button" data-act="down" aria-label="往下移">↓</button>
        <button type="button" data-act="dup">複製</button><button type="button" data-act="save">存成常用</button><button type="button" data-act="del" aria-label="刪除這一列">刪除</button>
      </div>`}
    </li>`;
  }
  // 課表裡沒在修改的列：一行摘要＋修改／刪除
  function sumRowHtml(row, bi, ri, n) {
    const bits = sumBits(row);
    return `<li class="wk-r wk-r--sum${row === flash ? ' wk-r--new' : ''}" data-b="${bi}" data-r="${ri}">
      <i>${n}</i><div><b>${esc(rowHead(row))}</b>${bits.length ? `<span>${esc(bits.join(' · '))}</span>` : ''}</div>
      <span class="wk-r-act"><button type="button" data-act="edit" aria-label="修改第 ${n} 列">修改</button><button type="button" data-act="del" aria-label="刪除第 ${n} 列">刪除</button></span>
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
    const sec = rows.reduce((a, r, i) => a + rowSec(r, i < rows.length - 1), 0);
    $('[data-wk-total]').textContent = rows.length ? `共 ${dist} m，約 ${Math.round(sec / 60)} 分鐘（有目標的用目標秒數，其餘用輕鬆有氧配速估算）` : '';
    root.querySelectorAll('.wk-blk').forEach(el => { const b = M().blocks[+el.dataset.b]; if (b) el.querySelector('[data-bdist]').textContent = blockDist(b) + ' m'; });
    renderSum();
    root.dispatchEvent(new CustomEvent('workout:change'));
  }
  function renderMenu() {
    const m = M();
    $('[data-wk-menus]').innerHTML = S.menus.map((x, i) => `<option value="${i}"${i === S.cur ? ' selected' : ''}>${esc(x.name || '未命名')}</option>`).join('');
    $('[data-wk-mname]').value = m.name || '';
    const dbi = draftBi();
    let n = 0;
    $('[data-wk-blocks]').innerHTML = `<section class="wk-compose" data-wk-compose><h3>新增一列</h3>${dbi < 0 ? '<p class="muted">這份課表還沒有任何一段，先按下面的「＋ 加一段」。</p>' : `<ol class="wk-rows">${rowHtml(draft, dbi, 'd', 'draft')}</ol>`}</section>`
      + m.blocks.map((b, bi) => `<section class="wk-blk" data-b="${bi}">
      <div class="wk-blk-h">
        <input class="wk-blk-t" type="text" value="${esc(b.title)}" data-bt aria-label="段落名稱">
        <span class="muted" data-bdist></span>
        <span class="wk-r-act"><button type="button" data-bact="up" aria-label="整段往上">↑</button><button type="button" data-bact="down" aria-label="整段往下">↓</button><button type="button" data-bact="save">存整段</button><button type="button" data-bact="del" aria-label="刪除整段">刪除</button></span>
      </div>
      <ol class="wk-rows">${b.rows.map((r, ri) => { n += 1; return r === editing ? rowHtml(r, bi, ri, 'edit') : sumRowHtml(r, bi, ri, n); }).join('')}</ol>
      ${b.rows.length ? '' : '<p class="muted wk-empty">這一段還是空的。</p>'}
      <button type="button" class="wk-addrow" data-target="${bi}"${bi === dbi ? ' hidden' : ''}>＋ 改成加到「${esc(b.title)}」</button>
      <select class="wk-ins" data-ins="${bi}" aria-label="插入常用組">${insOptions()}</select>
    </section>`).join('');
    flash = null;
    totals();
    root.dispatchEvent(new CustomEvent('workout:render'));
  }
  function replaceRow(li) {
    const bi = +li.dataset.b, ri = +li.dataset.r;
    // 展開狀態直接從畫面讀（toggle 事件是非同步的，不能靠它）
    li.querySelectorAll('details[data-eq], details[data-adv]').forEach(d => { const set = d.dataset.eq ? openEq : openAdv, k = d.dataset.eq || d.dataset.adv; if (d.open) set.add(k); else set.delete(k); });
    li.outerHTML = li.dataset.r === 'd' ? rowHtml(draft, bi, 'd', 'draft') : rowHtml(M().blocks[bi].rows[ri], bi, ri, 'edit');
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
  const rowOf = (li) => (li.dataset.r === 'd' ? draft : M().blocks[+li.dataset.b].rows[+li.dataset.r]);
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
      blk.querySelector('[data-target]').textContent = `＋ 改成加到「${el.value}」`;
      const o = blocksEl.querySelector(`[data-draftb] option[value="${blk.dataset.b}"]`); if (o) o.textContent = el.value;
      save(); renderSum(); return;
    }
    const li = el.closest('.wk-r'); if (!li) return;
    const row = rowOf(li);
    const tf = el.closest('.wk-tf');
    if (tf) {
      const f = tf.dataset.tff;
      if (f === 'rowRest') {
        const raw = el.value.trim().replace('：', ':').replace(',', '.');
        const valid = !raw || /^(?:\d+(?:\.\d+)?|\d+:[0-5]?\d(?:\.\d+)?)$/.test(raw);
        const v = raw.includes(':') ? raw.split(':').reduce((m, s) => +m * 60 + +s) : Number(raw);
        el.setCustomValidity(valid && Number.isFinite(v) ? '' : '請填 0 以上的秒數或分:秒，例如 90 或 1:30。');
        el.setAttribute('aria-invalid', String(!el.validity.valid));
        if (!el.validity.valid) return;
        row.rowRest = raw ? v : null;
      } else { const v = readTF(tf); row[f] = f === 'target' ? v : (v || 0); }
      if (f === 'rest' || f === 'sendoff') row.restAuto = false;
    }
    else if (el.tagName === 'INPUT' && el.dataset.f) {
      const f = el.dataset.f;
      if (f === 'note') row.note = el.value;
      else if (FREE_NUM[f]) { if (el.value === '') row[f] = 0; else if (Number.isFinite(+el.value)) row[f] = +el.value; else return; if (f === 'pbPlus') syncRest(li, row); }
      else if (+el.value >= 1) { row[f] = +el.value; if (f === 'dist' || f === 'pct') syncRest(li, row); }
    } else return; // 下拉選單也會觸發 input，交給 change 處理，不能在這裡把草稿標成改過
    if (li.dataset.r === 'd') draftDirty = true;
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
    if (el.matches('[data-draftb]')) { retarget(+el.value); renderMenu(); return; }
    const tf = el.closest('.wk-tf');
    if (tf) return;
    if (el.tagName !== 'SELECT') return;
    const li = el.closest('.wk-r'); if (!li) return;
    const row = rowOf(li), f = el.dataset.f, v = el.value;
    if (li.dataset.r === 'd') draftDirty = true;
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
    if (btn.dataset.target != null) {
      retarget(+btn.dataset.target); renderMenu();
      const c = blocksEl.querySelector('[data-wk-compose]'); c.scrollIntoView({ block: 'start' });
      const f = c.querySelector('[data-f="reps"]'); if (f) f.focus({ preventScroll: true });
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
    const bi = +li.dataset.b, ri = +li.dataset.r, rows = m.blocks[bi].rows, row = rowOf(li);
    if (li.dataset.r === 'd' && (btn.dataset.apply != null || btn.dataset.eqk)) draftDirty = true;
    if (btn.dataset.apply != null) { row.restAuto = true; syncRest(li, row); save(); refreshRow(li, row); totals(); return; }
    if (btn.dataset.eqk) {
      const k = btn.dataset.eqk; row.equip = row.equip || [];
      row.equip = row.equip.includes(k) ? row.equip.filter(x => x !== k) : row.equip.concat(k);
      save(); replaceRow(li); return;
    }
    const a = btn.dataset.act;
    if (!a) return;
    if (a === 'add' || a === 'done' || a === 'save') {
      const interval = li.querySelector('[data-tff="rowRest"] input');
      if (interval && !interval.reportValidity()) return;
    }
    if (a === 'add') {
      const added = JSON.parse(JSON.stringify(draft)), stroke = draft.stroke;
      rows.push(added); flash = added;
      draft = newRow(bi); draft.stroke = stroke; autoRest(draft, m.blocks[bi].title); draftDirty = false;
      openEq.delete('d'); openAdv.delete('d'); save(); renderMenu();
      toast(`已加入「${m.blocks[bi].title}」：${rowHead(added)}`);
      return;
    }
    if (li.dataset.r === 'd') return;
    if (a === 'edit' || a === 'done') {
      editing = a === 'edit' ? row : null; openEq.clear(); openAdv.clear(); renderMenu();
      const at = blocksEl.querySelector(`.wk-blk[data-b="${bi}"] .wk-r[data-r="${ri}"]`);
      if (at) { at.scrollIntoView({ block: 'nearest' }); if (a === 'done') at.querySelector('button').focus({ preventScroll: true }); }
      return;
    }
    if (a === 'del') {
      rows.splice(ri, 1); if (editing === row) editing = null;
      openEq.clear(); openAdv.clear(); save(); renderMenu();
      toast(`已刪除：${rowHead(row)}`, () => { rows.splice(Math.min(ri, rows.length), 0, row); flash = row; save(); renderMenu(); });
      return;
    }
    if (a === 'save') {
      const name = prompt('常用組的名字', rowHead(row)); if (!name) return;
      S.lib.push({ name, rows: [JSON.parse(JSON.stringify(row))] }); save(); renderMenu(); renderMine(); toast(`已存成常用組：${name}`); return;
    }
    if (a === 'dup') rows.splice(ri + 1, 0, JSON.parse(JSON.stringify(row)));
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
      row.rowRest != null ? '項目結束後休 ' + fmt0(row.rowRest) : '', stepText(row), brokenText(row), rowEquip(row), row.note || ''].filter(Boolean);
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
  let ac = null, audioResume = null, audioEpoch = 0;
  const playingTones = new Set();
  const audioStatus = message => document.querySelectorAll('[data-wk-audio-status]').forEach(el => { el.textContent = message; });
  const cancelSpeech = () => { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (_) { /* 無語音 API */ } };
  function stopTones() {
    audioEpoch += 1;
    playingTones.forEach(o => { try { o.stop(); o.disconnect(); } catch (_) { /* 已結束 */ } });
    playingTones.clear();
  }
  // 被中斷（來電、通知、誤觸叫出其他聲音）後每 2 秒自動重試，計時器開著才試；恢復了就停
  let audioRetry = null;
  function watchAudio() {
    if (audioRetry) return;
    audioRetry = setInterval(() => {
      const shown = [...document.querySelectorAll('[data-wk-timer]')].some(t => !t.hidden);
      if (!shown || (ac && ac.state === 'running')) { clearInterval(audioRetry); audioRetry = null; return; }
      resumeAudio();
    }, 2000);
  }
  const markAudio = (ok) => document.querySelectorAll('[data-wk-timer]').forEach(t => t.classList.toggle('is-mute', !ok));
  function resumeAudio(recreate = false) {
    // iPhone 的靜音模式預設會讓網頁音效無聲；設成 playback 讓提示音照響（只有支援的瀏覽器有這個設定）
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (_) { /* 不支援 */ }
    if (recreate) {
      stopTones(); const old = ac; ac = null; audioResume = null;
      if (old) { old.onstatechange = null; try { Promise.resolve(old.close()).catch(() => {}); } catch (_) { /* 已關閉 */ } }
    }
    try {
      if (!ac || ac.state === 'closed') {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const context = ac;
        context.onstatechange = () => {
          if (ac !== context) return;
          if (context.state !== 'running') { stopTones(); watchAudio(); }
          markAudio(context.state === 'running');
          audioStatus(context.state === 'running' ? '提示音已啟用，請用測試音確認裝置音量。' : '提示音中斷，正在自動恢復；碰一下畫面也會恢復。若一直沒聲音，可能是其他程式占用聲音或手機切成靜音。');
        };
      }
      const context = ac;
      if (context.state === 'running') return Promise.resolve(true);
      if (audioResume && audioResume.context === context) return audioResume.promise;
      audioStatus('提示音尚未啟用；若沒有聲音，請按「測試／恢復提示音」。');
      const promise = Promise.resolve(context.resume()).then(() => {
        if (ac !== context) return false;
        const ready = context.state === 'running';
        markAudio(ready); if (!ready) watchAudio();
        audioStatus(ready ? '提示音已啟用，請用測試音確認裝置音量。' : '提示音仍中斷，請按「測試／恢復提示音」。');
        return ready;
      }).catch(() => {
        if (ac === context) audioStatus('提示音無法啟用，請按「測試／恢復提示音」並確認裝置音量。');
        return false;
      }).finally(() => { if (audioResume && audioResume.promise === promise) audioResume = null; });
      audioResume = { context, promise }; return promise;
    } catch (_) {
      audioStatus('這個瀏覽器目前無法播放提示音；計時仍可使用，請以畫面確認。');
      return Promise.resolve(false);
    }
  }
  const tone = (freq, ms, at = 0) => {
    // 不把過期嗶聲排在暫停的音訊時鐘上，避免恢復後一起補播。
    if (!ac || ac.state !== 'running') { resumeAudio(); return; }
    try {
      ms = Math.max(ms, 40);
      const t0 = ac.currentTime + at + 0.01, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01);
      g.gain.setValueAtTime(0.35, t0 + ms / 1000 - 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
      o.onended = () => { playingTones.delete(o); o.disconnect(); g.disconnect(); };
      playingTones.add(o);
      o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + ms / 1000 + 0.02);
    } catch (_) { audioStatus('裝置無法播放提示音，請按「測試／恢復提示音」。'); }
  };
  const vib = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) { /* 不支援就略過 */ } };
  const SND = {
    tick: () => { cancelSpeech(); stopTones(); tone(880, 120); vib(80); }, // 倒數 3、2、1 優先於報讀
    go: () => { cancelSpeech(); stopTones(); tone(1320, 600); vib(400); }, // 出發
    target: () => { tone(660, 180); tone(660, 180, 0.28); vib([150, 100, 150]); }, // 到達目標秒數
    done: () => { tone(990, 250); tone(1320, 250, 0.3); tone(1760, 500, 0.6); },
  };
  let wake = null;
  const holdScreen = async () => {
    if (wake && !wake.released) return;
    try { wake = await navigator.wakeLock.request('screen'); } catch (_) { wake = null; }
  };

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
  let seq = [], idx = 0, phase = 'ready', t0 = 0, paused = 0, pausedAt = null, beeped = {}, timer = null, log = [], repT0 = 0;
  let adj = new Map(); // 臨場調整：row → {t: 目標, r: 休息／出發間隔, b: 項目間隔} 秒數加減；不改存好的課表
  let rowIdx = new Map(), lastHi = -1;
  let runMenu = null, undoSteps = [], edits = [];
  let startAt = 0; // 準備倒數完從 seq 的哪一步出發（從頭＝0；「這一趟重來」「從某一趟開始」會改）
  const liveDialog = tq('[data-wk-live]'), jumpDialog = tq('[data-wk-jump]');

  function rowSteps(row, b, base, hasNext) {
    const steps = [];
    const sets = row.sets || 1, so = row.restMode === 'sendoff' && row.sendoff > 0, segs = segsOf(row);
    for (let s = 1; s <= sets; s++) {
      for (let r = 1; r <= row.reps; r++) {
        const k = row.stepCycle > 0 ? (r - 1) % row.stepCycle : r - 1;
        const dlt = row.stepOn && row.stepOn !== 'none' ? (+row.stepSec || 0) * k : 0;
        const target = base != null ? Math.max(1, base + (row.stepOn === 'target' ? dlt : 0)) : null;
        const sendoff = so ? Math.max(5, row.sendoff + (row.stepOn === 'sendoff' ? dlt : 0)) : null;
        for (let g = 1; g <= segs; g++) {
          const segD = g < segs ? row.brokenEvery : row.dist - row.brokenEvery * (segs - 1);
          steps.push({ kind: 'swim', b, row, s, r, g, segs, segD, first: g === 1, target: target != null ? target * segD / row.dist : null, sendoff: g === segs ? sendoff : null });
          if (g < segs && row.brokenRest > 0) steps.push({ kind: 'rest', b, row, s, r, g, sec: row.brokenRest, broken: true });
        }
        const rowBreak = r === row.reps && s === sets;
        if (rowBreak && !hasNext) continue;
        const position = { b, row, s, r, g: segs, kind: 'rest' };
        if (rowBreak && row.rowRest != null) { if (row.rowRest > 0) steps.push({ ...position, sec: row.rowRest, rowBreak: true }); }
        else if (r === row.reps && s < sets) { if (row.setRest > 0) steps.push({ ...position, sec: row.setRest, setBreak: true }); }
        else if (so) steps.push({ ...position, sec: 0, dyn: true, sendoff, rowBreak });
        else { const sec = Math.max(0, row.rest + (row.stepOn === 'rest' ? dlt : 0)); if (sec > 0) steps.push({ ...position, sec, rowBreak }); }
      }
    }
    return steps;
  }
  function build() {
    const rows = runMenu.blocks.flatMap(b => b.rows.map(row => ({ b, row })));
    seq = rows.flatMap(({ b, row }, i) => {
      const tg = targetOf(row);
      return rowSteps(row, b, tg && tg.t ? tg.t : null, i < rows.length - 1);
    });
  }
  const now = () => performance.now() / 1000;
  const elapsed = () => (pausedAt != null ? pausedAt : now()) - t0 - paused;
  const begin = (p) => { phase = p; t0 = now(); paused = 0; pausedAt = null; beeped = {}; };
  const repElapsed = () => (pausedAt != null ? pausedAt : now()) - repT0;
  const pauseTimer = () => {
    if (pausedAt == null && phase !== 'done') pausedAt = now();
    cancelSpeech(); stopTones(); vib(0);
    tq('[data-wk-pause]').textContent = '繼續';
  };
  function syncControls() {
    const done = phase === 'done', last = undoSteps[undoSteps.length - 1];
    tq('[data-wk-undo]').disabled = !last;
    tq('[data-wk-undo]').textContent = last ? '撤銷' + last.label : '撤銷上次操作';
    ['[data-wk-skip]', '[data-wk-pause]', '[data-wk-live-open]'].forEach(s => { tq(s).disabled = done; });
    T.querySelectorAll('[data-adj]').forEach(b => { b.disabled = done; });
    tq('[data-wk-pause]').textContent = pausedAt != null ? '繼續' : '暫停';
  }
  function remember(label) {
    // 一次 clone 才能保留 seq、menu 與 Map 之間的 row 參照。
    undoSteps.push({ label, state: structuredClone({ runMenu, seq, idx, phase, log, adj, edits, startAt, e: elapsed(), re: repElapsed(), beeped }) });
    if (undoSteps.length > 10) undoSteps.shift();
    syncControls();
  }
  function undoTimer() {
    const last = undoSteps.pop(); if (!last) return;
    ({ runMenu, seq, idx, phase, log, adj, edits, startAt, beeped } = last.state);
    t0 = now() - last.state.e; repT0 = now() - last.state.re; paused = 0; pausedAt = now();
    tq('[data-wk-t-copy]').hidden = true;
    tq('[data-wk-t-adjv]').textContent = adjText(seq[idx].row);
    tq('[data-wk-t-notice]').textContent = `已撤銷${last.label}，回到操作前並暫停；操作後的紀錄也已撤回。按「繼續」再出發。`;
    pauseTimer(); renderLog(); renderSide(); syncControls(); frame(true); holdScreen();
    clearInterval(timer); timer = setInterval(frame, 100);
  }
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
    if (a.b) bits.push(`項目間隔 ${a.b > 0 ? '+' : '−'}${Math.abs(a.b)} 秒`);
    return bits.length ? '這一列已調整：' + bits.join('、') + '（只影響這次）' : '';
  };
  function renderSide() {
    const items = []; rowIdx = new Map();
    runMenu.blocks.forEach(b => b.rows.forEach(r => { rowIdx.set(r, items.length); const x = sumBits(r).join(' · '); items.push(`<li data-k="${items.length}"><span>${esc(b.title)}</span><b>${esc(rowHead(r))}</b>${x ? `<i>${esc(x)}</i>` : ''}</li>`); }));
    tq('[data-wk-t-list]').innerHTML = items.join(''); lastHi = -1;
  }
  function highlight() {
    const c = seq[idx]; if (!c) return;
    tq('[data-adj="r:10"]').parentElement.querySelector('span').textContent = phase === 'rest' && c.rowBreak ? '項目間隔' : c.row.restMode === 'sendoff' ? '出發' : '休息';
    const k = rowIdx.get(c.row); if (k === lastHi) return; lastHi = k;
    tq('[data-wk-t-list]').querySelectorAll('li').forEach(li => { const on = +li.dataset.k === k; li.classList.toggle('is-now', on); if (on) li.scrollIntoView({ block: 'nearest' }); });
  }

  function nextStep() {
    const wasPaused = pausedAt != null, re = repElapsed(), priorCues = beeped, fromReady = phase === 'ready';
    idx = fromReady ? startAt : idx + 1;
    // 出發間隔：休息＝下一次出發時間 − 已經過的時間；已經過了就直接出發
    while (idx < seq.length && seq[idx].kind === 'rest' && seq[idx].dyn) {
      seq[idx].sec = seq[idx].sendoff - re;
      if (seq[idx].sec > 0.3) break;
      idx += 1;
    }
    if (idx >= seq.length) { finish(); return; }
    const cur = seq[idx];
    begin(cur.kind);
    // 包干在「游」與「等出發」之間仍是同一個出發點，已播過的秒數不能重播。
    if (cur.dyn) [1, 2, 3].forEach(n => { if (priorCues['d' + n]) beeped['d' + n] = 1; });
    repT0 = now() - re;
    if (cur.kind === 'swim') { if (!wasPaused) SND.go(); if (cur.first || fromReady) repT0 = now(); }
    else if (!wasPaused && !cur.broken && cur.sec >= 6) { const nx = nextSwim(idx + 1); if (nx) say(`${nx.row !== cur.row ? '換下一項。' : '下一趟，'}${sayRep(nx)}`); }
    if (wasPaused) pauseTimer();
    syncControls();
  }
  function wall(auto, skipped = false) {
    if (phase !== 'swim') return;
    const cur = seq[idx];
    log.push({ where: `${cur.b.title}・${rowHead(cur.row)} ${(cur.row.sets || 1) > 1 ? `第 ${cur.s} 組` : ''}第 ${cur.r} 趟${cur.segs > 1 ? `第 ${cur.g} 段` : ''}`, target: cur.target, actual: auto ? null : elapsed(), skipped });
    renderLog();
    nextStep();
  }
  function adjust(kind, d) {
    if (phase === 'done' || !seq.length) return;
    const row = (seq[idx] || seq[0]).row;
    if (kind === 'r' && phase === 'rest' && seq[idx].rowBreak) kind = 'b';
    let changed = false;
    remember('調秒');
    for (let j = idx; j < seq.length; j++) {
      const x = seq[j]; if (x.row !== row) continue;
      if (kind === 't' && x.kind === 'swim' && x.target != null) { x.target = Math.max(1, x.target + d * (x.segD / row.dist)); changed = true; }
      if (kind === 'r') {
        if (x.kind === 'swim' && x.sendoff != null) { x.sendoff = Math.max(5, x.sendoff + d); changed = true; }
        if (x.kind === 'rest' && !x.broken && (!x.rowBreak || row.rowRest == null)) { if (x.dyn) x.sendoff = Math.max(5, x.sendoff + d); x.sec = Math.max(0, x.sec + d); changed = true; }
      }
      if (kind === 'b' && x.kind === 'rest' && x.rowBreak) { x.sec = Math.max(0, x.sec + d); changed = true; }
    }
    const v = tq('[data-wk-t-adjv]');
    if (!changed) { undoSteps.pop(); syncControls(); v.textContent = kind === 't' ? '這一列沒有目標秒數可調。' : '這一列後面沒有休息可調。'; return; }
    const a = adj.get(row) || { t: 0, r: 0, b: 0 };
    a[kind] += d; adj.set(row, a);
    if (phase === 'swim' && kind === 't' && seq[idx].target > elapsed()) beeped.t = 0;
    const countdownLeft = phase === 'rest' && (kind === 'r' || kind === 'b') ? seq[idx].sec - elapsed()
      : phase === 'swim' && kind === 'r' && seq[idx].sendoff != null ? seq[idx].sendoff - repElapsed() : null;
    if (countdownLeft != null) [1, 2, 3].forEach(n => { if (countdownLeft > n) delete beeped['d' + n]; });
    v.textContent = adjText(row);
    frame(true);
  }
  const logLine = (x) => (x.actual == null ? `${x.where}：（${x.skipped ? '手動跳過' : '未按到牆'}）` : x.target == null ? `${x.where}：${fmt(x.actual)}` : `${x.where}：${fmt(x.actual)}（目標 ${fmt(x.target)}，${x.actual - x.target <= 0 ? '' : '+'}${(x.actual - x.target).toFixed(1)}）`);
  function renderLog() {
    tq('[data-wk-t-log]').innerHTML = log.slice().reverse().slice(0, 6).map(x => {
      if (x.actual == null) return `<li>${esc(x.where)}<span>（${x.skipped ? '手動跳過' : '未按到牆'}）</span></li>`;
      if (x.target == null) return `<li>${esc(x.where)}<span>${fmt(x.actual)}</span></li>`;
      const d = x.actual - x.target;
      return `<li>${esc(x.where)}<span class="${d <= 0 ? 'is-ok' : 'is-slow'}">${fmt(x.actual)}（${d <= 0 ? '' : '+'}${d.toFixed(1)}）</span></li>`;
    }).join('');
  }
  function finish() {
    const audible = pausedAt == null;
    phase = 'done'; clearInterval(timer); stopTones(); cancelSpeech();
    if (audible) { SND.done(); say('課表完成'); }
    tq('[data-wk-t-phase]').textContent = '完成';
    tq('[data-wk-t-row]').textContent = runMenu.name || '';
    const aimed = log.filter(x => x.actual != null && x.target != null), hit = aimed.filter(x => x.actual <= x.target).length;
    tq('[data-wk-t-clock]').textContent = aimed.length ? `${hit}/${aimed.length}` : '✓';
    tq('[data-wk-t-sub]').textContent = aimed.length ? '趟達到目標秒數' : '課表跑完了';
    const changed = [...adj.entries()].filter(([, a]) => a.t || a.r || a.b).map(([row]) => `${rowHead(row)}：${adjText(row).replace('這一列已調整：', '').replace('（只影響這次）', '')}`);
    tq('[data-wk-t-drill]').textContent = changed.length || edits.length ? '這次臨場調整過：' + edits.concat(changed).join('；') : '';
    tq('[data-wk-t-adjv]').textContent = '';
    tq('[data-wk-wall]').hidden = true;
    tq('[data-wk-t-copy]').hidden = !log.length;
    syncControls();
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  function departureCountdown(left) {
    // 只播目前剩下的那一秒；延遲畫面或短休息不補播已過的 3、2、1。
    const n = Math.ceil(left - 1e-7);
    if (left > 0 && n >= 1 && n <= 3 && !beeped['d' + n]) { beeped['d' + n] = 1; SND.tick(); }
  }
  function frame(renderPaused = false) {
    if ((pausedAt != null && !renderPaused) || phase === 'done') return;
    const running = pausedAt == null;
    highlight();
    const e = elapsed();
    const cur = seq[idx];
    const where = tq('[data-wk-t-where]'), rowEl = tq('[data-wk-t-row]'), ph = tq('[data-wk-t-phase]'), ck = tq('[data-wk-t-clock]'), sub = tq('[data-wk-t-sub]'), dr = tq('[data-wk-t-drill]');
    tq('[data-wk-wall]').hidden = phase !== 'swim';
    if (phase === 'ready') {
      const left = 10 - e, first = seq[startAt];
      ph.textContent = running ? '準備' : '準備 · 已暫停'; ck.textContent = fmt0(Math.max(0, Math.ceil(left))); ck.classList.remove('is-over');
      where.textContent = first.b.title; rowEl.textContent = swimLine(first);
      sub.textContent = first.target ? `${startAt ? '這一趟' : '第一趟'}目標 ${fmt(first.target)}` : '這一列沒有目標秒數，到牆按一下';
      dr.textContent = drillLine(first.row);
      if (running) departureCountdown(left);
      if (running && left <= 0) nextStep();
      return;
    }
    where.textContent = cur.b.title;
    if (phase === 'swim') {
      rowEl.textContent = swimLine(cur); dr.textContent = drillLine(cur.row);
      ph.textContent = running ? '游' : '游 · 已暫停'; ck.textContent = fmt(e);
      let txt;
      if (cur.target == null) { txt = '沒有目標秒數，到牆按一下'; ck.classList.remove('is-over'); }
      else {
        const over = e - cur.target;
        txt = over < 0 ? `目標 ${fmt(cur.target)}（還有 ${fmt(-over)}）` : `目標 ${fmt(cur.target)} 已到`;
        ck.classList.toggle('is-over', over >= 0);
        if (running && over >= 0 && !beeped.t) { beeped.t = 1; SND.target(); if (S.autorest) { wall(true); return; } }
      }
      if (cur.sendoff != null) {
        const left = cur.sendoff - repElapsed();
        const following = seq[idx + 1], departs = following && (following.kind === 'swim' || following.dyn);
        txt += `　${departs ? '下次出發' : '本趟週期'} ${fmt0(Math.max(0, Math.ceil(left)))}`;
        if (running && departs) departureCountdown(left);
        if (running && left <= 0) { wall(true); return; } // 出發時間到了還沒按到牆：照出發間隔直接下一趟
      }
      sub.textContent = txt;
    } else if (phase === 'rest') {
      const left = cur.sec - e, nx = nextSwim(idx + 1);
      ph.textContent = cur.rowBreak ? '項目間休息' : cur.broken ? '分段休息' : cur.setBreak ? '組間休息' : cur.dyn ? '等出發' : '休息';
      if (!running) ph.textContent += ' · 已暫停';
      ck.textContent = fmt0(Math.max(0, Math.ceil(left))); ck.classList.remove('is-over');
      rowEl.textContent = nx ? (cur.rowBreak ? '下一項：' : '下一趟：') + swimLine(nx) : '';
      sub.textContent = nx && nx.target ? `目標 ${fmt(nx.target)}` : '';
      dr.textContent = nx ? (nx.row !== cur.row ? '換下一列　' : '') + drillLine(nx.row) : '';
      if (running) departureCountdown(left);
      if (running && left <= 0) nextStep();
    }
  }
  function openTimer() {
    runMenu = structuredClone(M());
    build();
    if (!seq.length) { alert('課表是空的，先加一列。'); return; }
    cancelSpeech(); stopTones(); resumeAudio(); // 在使用者按下的當下啟用音訊。
    holdScreen();
    log = []; adj = new Map(); undoSteps = []; edits = []; renderLog(); renderSide(); idx = 0; startAt = 0;
    tq('[data-wk-t-notice]').textContent = '';
    tq('[data-wk-t-adjv]').textContent = ''; tq('[data-wk-t-copy]').hidden = true;
    T.hidden = false; document.body.classList.add('wk-running');
    tq('[data-wk-pause]').textContent = '暫停';
    begin('ready');
    repT0 = now(); syncControls();
    say(`準備。第一趟，${sayRep(seq[0])}`);
    clearInterval(timer); timer = setInterval(frame, 100); frame();
  }
  function closeTimer() {
    tq('[data-wk-lockover]').hidden = true;
    if (liveDialog.open) liveDialog.close();
    if (jumpDialog.open) jumpDialog.close();
    clearInterval(timer); phase = 'done'; T.hidden = true; document.body.classList.remove('wk-running');
    cancelSpeech(); stopTones(); vib(0);
    if (wake) { wake.release().catch(() => {}); wake = null; }
  }
  tq('[data-wk-wall]').addEventListener('click', () => { if (phase === 'swim') { remember('到牆'); wall(false); frame(true); } });
  tq('[data-wk-stop]').addEventListener('click', closeTimer);
  tq('[data-wk-skip]').addEventListener('click', () => {
    if (phase === 'done') return;
    remember('跳過');
    if (phase === 'swim') wall(true, true); else nextStep();
    tq('[data-wk-t-notice]').textContent = '誤按可用「撤銷跳過」回復；可逐步撤銷最近 10 次操作。';
    frame(true);
  });
  tq('[data-wk-undo]').addEventListener('click', undoTimer);
  // 中途出狀況：回到某一趟的開頭，重新 10 秒準備倒數再出發。之前記下的秒數保留，可以撤銷。
  const repStart = (k) => { const x = seq[k]; return seq.findIndex(y => y.kind === 'swim' && y.row === x.row && y.s === x.s && y.r === x.r); };
  function jumpTo(k, label) {
    remember(label);
    if (phase === 'done') { clearInterval(timer); timer = setInterval(frame, 100); holdScreen(); tq('[data-wk-t-copy]').hidden = true; tq('[data-wk-stop]').textContent = '結束'; }
    cancelSpeech(); stopTones(); vib(0);
    startAt = k; idx = k; begin('ready'); repT0 = now();
    tq('[data-wk-pause]').textContent = '暫停';
    tq('[data-wk-t-drill]').textContent = '';
    tq('[data-wk-t-adjv]').textContent = adjText(seq[k].row);
    tq('[data-wk-t-notice]').textContent = `從「${seq[k].b.title}・${swimLine(seq[k])}」重新開始，10 秒後出發。之前的紀錄保留；按錯可以撤銷。`;
    say(`準備。${sayRep(seq[k])}`);
    syncControls(); frame(true);
  }
  tq('[data-wk-redo]').addEventListener('click', () => {
    // 正在游：這一趟；休息中：剛游完的那一趟；準備倒數中：重新倒數
    let k = idx;
    if (phase === 'ready') k = startAt;
    else { while (k > 0 && seq[k].kind !== 'swim') k -= 1; if (seq[k].kind !== 'swim') return; k = repStart(k); }
    jumpTo(k, '重來');
  });
  const jumpRows = () => { const out = []; seq.forEach((x, i) => { if (x.kind === 'swim' && (x.g || 1) === 1) { let r = out.find(o => o.row === x.row); if (!r) out.push(r = { row: x.row, b: x.b, steps: [] }); r.steps.push(i); } }); return out; };
  function fillJumpReps(sel) {
    const r = jumpRows()[+tq('[data-wk-jump-row]').value];
    tq('[data-wk-jump-rep]').innerHTML = r.steps.map(i => { const x = seq[i]; return `<option value="${i}"${i === sel ? ' selected' : ''}>${(x.row.sets || 1) > 1 ? `第 ${x.s} 組・` : ''}第 ${x.r} 趟${x.target ? `（目標 ${fmt(x.target)}）` : ''}</option>`; }).join('');
  }
  tq('[data-wk-jump-open]').addEventListener('click', () => {
    pauseTimer(); frame(true);
    const rows = jumpRows();
    let cur = phase === 'ready' ? startAt : idx; while (cur > 0 && seq[cur].kind !== 'swim') cur -= 1;
    const curStart = seq[cur] && seq[cur].kind === 'swim' ? repStart(cur) : rows[0].steps[0];
    const ri = Math.max(0, rows.findIndex(r => r.steps.includes(curStart)));
    tq('[data-wk-jump-row]').innerHTML = rows.map((r, i) => `<option value="${i}"${i === ri ? ' selected' : ''}>${i + 1}. ${esc(r.b.title)} · ${esc(rowHead(r.row))}</option>`).join('');
    fillJumpReps(curStart); jumpDialog.showModal();
  });
  tq('[data-wk-jump-row]').addEventListener('change', () => fillJumpReps(-1));
  tq('[data-wk-jump-cancel]').addEventListener('click', () => { jumpDialog.close(); tq('[data-wk-t-notice]').textContent = '計時保持暫停。確認後按「繼續」。'; });
  jumpDialog.addEventListener('cancel', e => { e.preventDefault(); jumpDialog.close(); });
  tq('[data-wk-jump-form]').addEventListener('submit', e => { e.preventDefault(); const k = +tq('[data-wk-jump-rep]').value; jumpDialog.close(); jumpTo(k, '跳到'); });
  tq('[data-wk-pause]').addEventListener('click', (ev) => {
    if (phase === 'done') return;
    if (pausedAt != null) { resumeAudio(); const dp = now() - pausedAt; paused += dp; repT0 += dp; pausedAt = null; ev.target.textContent = '暫停'; tq('[data-wk-t-notice]').textContent = ''; }
    else pauseTimer();
    frame(true);
  });
  const liveRows = () => runMenu.blocks.flatMap(b => b.rows.map(row => ({ b, row })));
  const liveField = k => liveDialog.querySelector(`[data-live="${k}"]`);
  let liveTargetValue = '';
  function fillLiveForm() {
    const { row } = liveRows()[+tq('[data-wk-live-row]').value];
    const current = phase !== 'ready' && seq[idx].row === row ? seq[idx] : null;
    const a = adj.get(row) || { t: 0, r: 0, b: 0 }, tg = targetOf(row);
    const input = (key, label, value, attrs = '') => `<label class="wk-live-field">${label}<input data-live="${key}" value="${esc(value == null ? '' : value)}" ${attrs}></label>`;
    const select = (key, label, value, options) => `<label class="wk-live-field">${label}<select data-live="${key}">${Object.entries(options).map(([k, v]) => `<option value="${esc(k)}"${k === value ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`;
    const time = (key, label, value) => input(key, label, value == null ? '' : value === 0 ? '0' : showT(value, 2), 'type="text" placeholder="秒或分:秒" autocomplete="off"');
    tq('[data-wk-live-progress]').textContent = current
      ? `目前第 ${current.s} 組、第 ${current.r} 趟${phase === 'rest' ? '後的休息' : current.segs > 1 ? `、第 ${current.g} 段` : ''}。組數至少 ${current.s}，每組趟數至少 ${current.r}；前面紀錄保留。`
      : '這個項目尚未開始，可以調整整個項目。';
    tq('[data-wk-live-fields]').innerHTML = [
      input('sets', '這項總組數', row.sets, `type="number" inputmode="numeric" min="${current ? current.s : 1}" max="20"`),
      input('reps', '每組總趟數', row.reps, `type="number" inputmode="numeric" min="${current ? current.r : 1}" max="99"`),
      input('dist', '每趟距離（m）', row.dist, 'type="number" inputmode="numeric" min="10" max="3000"'),
      select('stroke', '泳式', row.stroke, SZH), select('mode', '游法', row.mode, MODES),
      time('target', '目標秒數（留白不設）', tg && tg.t ? Math.max(1, tg.t + a.t) : null),
      select('restMode', '間歇方式', row.restMode, { rest: '每趟休息', sendoff: '固定出發間隔' }),
      time('rest', '每趟休息', Math.max(0, row.rest + a.r)),
      time('sendoff', '出發間隔', row.sendoff > 0 ? Math.max(5, row.sendoff + a.r) : 0),
      time('setRest', '組間休息', row.setRest > 0 ? Math.max(0, row.setRest + a.r) : 0),
      time('rowRest', '項目間休息（留白沿用）', row.rowRest == null ? (a.b && current && current.rowBreak ? current.sec : null) : Math.max(0, row.rowRest + a.b)),
      select('drill', 'Drill 動作', row.drill, { '': '未選擇', ...Object.fromEntries(V.drills.map(d => [d.id, d.n])), ...Object.fromEntries(S.myDrills.map(d => ['my:' + d.id, d.name])) }),
      `<label class="wk-live-field wk-live-wide">備註／動作提醒<textarea data-live="note" rows="2" maxlength="2000">${esc(row.note)}</textarea></label>`,
    ].join('');
    liveTargetValue = liveField('target').value;
    tq('[data-wk-live-error]').textContent = '';
  }
  tq('[data-wk-live-open]').addEventListener('click', () => {
    if (phase === 'done') return;
    pauseTimer(); frame(true);
    const available = new Set(seq.slice(idx).map(st => st.row));
    tq('[data-wk-live-row]').innerHTML = liveRows().map(({ b, row }, i) => available.has(row)
      ? `<option value="${i}">${i + 1}. ${esc(b.title)} · ${esc(rowHead(row))}</option>` : '').join('');
    fillLiveForm(); liveDialog.showModal();
  });
  tq('[data-wk-live-row]').addEventListener('change', fillLiveForm);
  function closeLiveForm() {
    liveDialog.close();
    tq('[data-wk-t-notice]').textContent = '計時保持暫停。確認後按「繼續」。';
    tq('[data-wk-live-open]').focus();
  }
  tq('[data-wk-live-cancel]').addEventListener('click', closeLiveForm);
  liveDialog.addEventListener('cancel', e => { e.preventDefault(); closeLiveForm(); });
  tq('[data-wk-live-form]').noValidate = true;
  tq('[data-wk-live-form]').addEventListener('submit', e => {
    e.preventDefault();
    const { b, row } = liveRows()[+tq('[data-wk-live-row]').value];
    const current = phase !== 'ready' && seq[idx].row === row ? seq[idx] : null;
    let invalidField = null;
    const invalid = (key, message) => { invalidField = liveField(key); throw new Error(message); };
    try {
      const number = (key, min, max, label) => {
        const n = Number(liveField(key).value);
        if (!Number.isInteger(n) || n < min || n > max) invalid(key, `${label}請填 ${min}–${max} 的整數。`);
        return n;
      };
      const time = (key, optional = false) => {
        const raw = liveField(key).value.trim().replace('：', ':');
        if (optional && !raw) return null;
        if (!/^\d+(?:\.\d+)?$/.test(raw) && !/^\d+:[0-5]?\d(?:\.\d+)?$/.test(raw)) invalid(key, '時間請填非負秒數或分:秒，例如 30、1:30。');
        const parts = raw.split(':'), value = parts.length === 2 ? +parts[0] * 60 + +parts[1] : +raw;
        if (!Number.isFinite(value) || value > 86400) invalid(key, '時間請填 0–86400 秒。');
        return value;
      };
      const values = { sets: number('sets', current ? current.s : 1, 20, '總組數'), reps: number('reps', current ? current.r : 1, 99, '每組趟數'), dist: number('dist', 10, 3000, '距離'),
        rest: time('rest'), setRest: time('setRest'), sendoff: time('sendoff'), rowRest: time('rowRest', true), restAuto: false,
        stroke: liveField('stroke').value, mode: liveField('mode').value, restMode: liveField('restMode').value, drill: liveField('drill').value, note: liveField('note').value.slice(0, 2000) };
      if (!Object.hasOwn(SZH, values.stroke) || !Object.hasOwn(MODES, values.mode) || !['rest', 'sendoff'].includes(values.restMode)) invalid('stroke', '請選擇有效的泳式、游法與間歇方式。');
      const target = time('target', true);
      if (target !== null && target < 1) invalid('target', '目標至少 1 秒；不設目標請留白。');
      if (values.restMode === 'sendoff' && values.sendoff < 5) invalid('sendoff', '出發間隔至少 5 秒。');
      if (current && row.brokenEvery > 0 && (current.kind === 'swim' || current.broken)) {
        const doneDistance = row.brokenEvery * (current.g - (current.kind === 'swim' ? 1 : 0));
        if (values.dist <= doneDistance) invalid('dist', `距離需大於這一趟已完成的 ${doneDistance} m。`);
      }
      const a = adj.get(row);
      if (liveField('target').value !== liveTargetValue || (a && a.t)) Object.assign(values, { int: target == null ? 'none' : 'custom', target, intLabel: '' });
      const before = rowHead(row), priorAdjustment = adjText(row);
      remember('課表修改');
      Object.assign(row, values); adj.delete(row);
      const start = seq.findIndex((st, i) => i >= idx && st.row === row);
      let end = start; while (end < seq.length && seq[end].row === row) end++;
      const rows = liveRows(), tg = targetOf(row);
      let replacement = rowSteps(row, b, tg && tg.t ? tg.t : null, rows.findIndex(x => x.row === row) < rows.length - 1);
      const compare = (x, y) => x.s - y.s || x.r - y.r || x.g - y.g || (x.kind === 'rest' ? 1 : 0) - (y.kind === 'rest' ? 1 : 0);
      if (current) replacement = replacement.filter(st => compare(st, current) >= 0);
      const sameStep = !current || (replacement.length && compare(replacement[0], current) === 0);
      seq = seq.slice(0, start).concat(replacement, seq.slice(end));
      if (priorAdjustment) edits.push(before + '：' + priorAdjustment);
      edits.push(`臨場修改：${before} → ${rowHead(row)}；${sumBits(row).join('；')}`);
      if (current) {
        if (idx >= seq.length) finish();
        else if (sameStep) {
          phase = seq[idx].kind;
          if (seq[idx].dyn) seq[idx].sec = Math.max(0, seq[idx].sendoff - (repElapsed() - elapsed()));
          beeped = {};
        } else {
          const re = repElapsed(); begin(seq[idx].kind); repT0 = seq[idx].first ? now() : now() - re; pauseTimer();
          if (seq[idx].dyn) seq[idx].sec = Math.max(0, seq[idx].sendoff - re);
        }
      }
      liveDialog.close(); renderSide(); syncControls(); frame(true);
      tq('[data-wk-t-adjv]').textContent = '';
      tq('[data-wk-t-notice]').textContent = phase === 'done' ? '後續趟數已調整，這次訓練完成；可撤銷課表修改。' : '已套用到目前與後續進度，保持暫停；已完成紀錄保留。按「繼續」接著練，也可撤銷修改。';
      tq('[data-wk-undo]').focus();
    } catch (error) {
      tq('[data-wk-live-error]').textContent = error.message;
      if (invalidField) invalidField.focus();
    }
  });
  tq('[data-wk-t-copy]').addEventListener('click', async (ev) => {
    const changed = [...adj.entries()].map(([row]) => `${rowHead(row)}：${adjText(row)}`);
    const text = [`${runMenu.name || '課表'}　${new Date().toLocaleString('zh-TW')}`].concat(log.map(logLine), edits, changed).join('\n');
    try { await navigator.clipboard.writeText(text); ev.target.textContent = '已複製'; } catch (_) { prompt('複製這次結果：', text); }
    setTimeout(() => { ev.target.textContent = '複製這次結果'; }, 2000);
  });
  T.querySelectorAll('[data-adj]').forEach(b => b.addEventListener('click', () => { const [k, d] = b.dataset.adj.split(':'); adjust(k, +d); }));
  document.querySelectorAll('[data-wk-audio-test]').forEach(button => button.addEventListener('click', () => {
    cancelSpeech();
    const ready = resumeAudio(true), epoch = audioEpoch;
    ready.then(ok => { if (ok && epoch === audioEpoch) { tone(880, 120); tone(1320, 450, 0.35); } });
  }));
  document.addEventListener('visibilitychange', () => {
    if (!T.hidden && document.visibilityState === 'visible') { holdScreen(); resumeAudio(); }
  });
  // 碰到計時器任何地方（含鎖定遮罩）都順便恢復聲音：手機只允許在使用者碰觸時重新啟用音效
  T.addEventListener('pointerdown', () => { if (!ac || ac.state !== 'running') resumeAudio(); }, true);
  // 鎖定畫面：池邊手濕、水滴會誤觸；鎖定後所有按鈕都按不到，長按遮罩 2 秒解鎖
  const lockOver = tq('[data-wk-lockover]');
  let lockHold = null;
  const setLock = (on) => { lockOver.hidden = !on; lockOver.classList.remove('is-holding'); clearTimeout(lockHold); lockHold = null; if (!on) tq('[data-wk-lock]').focus(); };
  tq('[data-wk-lock]').addEventListener('click', () => setLock(true));
  lockOver.addEventListener('pointerdown', (e) => { e.preventDefault(); lockOver.classList.add('is-holding'); clearTimeout(lockHold); lockHold = setTimeout(() => setLock(false), 2000); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => lockOver.addEventListener(ev, () => { lockOver.classList.remove('is-holding'); clearTimeout(lockHold); lockHold = null; }));
  lockOver.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------- 輸入與初始化 ---------- */
  const refresh = () => {
    Object.keys(cssCache).forEach(k => delete cssCache[k]);
    renderCss(); renderPz(); renderSprint(); renderGoals();
    M().blocks.forEach(b => b.rows.forEach(r => { if (r.restAuto) autoRest(r, b.title); })); // 成績變了，自動帶的出發間隔跟著變
    renderMenu();
  };
  /* 教練後台（swim-coach）帶學生成績過來：#pb=<base64url JSON {v:1,name,course,who,pb:{式:{距離:秒}}}>。
     只填這次開頁的成績，照舊不存進瀏覽器；名字只在網址 # 後面，不會送到伺服器。 */
  function importPb() {
    const h = location.hash;
    if (!h.startsWith('#pb=')) return null;
    history.replaceState(null, '', location.pathname + location.search);
    try {
      const raw = atob(h.slice(4).replace(/-/g, '+').replace(/_/g, '/'));
      const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(raw, c => c.charCodeAt(0))));
      if (!d || d.v !== 1 || !d.pb || typeof d.pb !== 'object') throw new Error('bad');
      STROKES.forEach(st => {
        S.pb[st.k] = {};
        const src = d.pb[st.k] || {};
        st.d.forEach(dist => { const t = +src[dist]; if (t > 0 && t < 36000) S.pb[st.k][dist] = t; });
      });
      if (d.course === 'scm' || d.course === 'lcm') S.course = d.course;
      if (d.who === 'swim' || d.who === 'tri') S.pz.who = d.who;
      return d.name ? String(d.name).slice(0, 50) : '學生';
    } catch (_) { return false; }
  }
  const pbFrom = importPb();
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
  vc.addEventListener('change', () => { S.voice = vc.checked; save(); if (vc.checked) say('語音報讀開啟'); else cancelSpeech(); });
  // 工作台只透過這個介面操作同一套課表與計時邏輯；資料輸出可交給日後的 AI 服務。
  if (studio) {
    root.workout = Object.freeze({
      recommendation() {
        const x = goalSet();
        return { name: x.name, strokeLabel: SZH[x.row.stroke], choice: { ...goalChoice }, row: JSON.parse(JSON.stringify(x.row)) };
      },
      groupOptions() {
        return { goals: Object.keys(GOAL_BUILDERS).map(key => ({ key, name: goalName(key) })), strokes: STROKES.filter(x => x.k !== 'im').map(x => ({ key: x.k, name: x.zh, distances: x.d.slice() })) };
      },
      groupRecommendation(choice, bests = {}, distance) {
        if (!choice || !Object.hasOwn(GOAL_BUILDERS, choice.key) || !STROKES.some(s => s.k === choice.stroke && s.k !== 'im') || !['compact', 'standard'].includes(choice.size)) throw new Error('請選擇有效的主課、泳式與份量。');
        const event = Number(choice.event);
        if (!STROKES.find(s => s.k === choice.stroke).d.includes(event) || event < 50) throw new Error('請選擇有效的賽速參考距離。');
        const scores = {};
        for (const d of STROKES.find(s => s.k === choice.stroke).d) {
          const raw = String(bests?.[choice.stroke]?.[d] ?? '').trim().replace('：', ':');
          if (!raw) continue;
          const seconds = parseT(raw);
          if (!/^(?:\d+(?:\.\d{1,2})?|\d{1,3}:[0-5]\d(?:\.\d{1,2})?)$/.test(raw) || seconds == null || seconds > 7200) throw new Error(`${d} m 成績請填有效的分:秒或秒數（最多 120 分鐘）。`);
          scores[d] = seconds;
        }
        bests = { [choice.stroke]: scores };
        const x = goalSet({ ...choice, event }, bests), row = x.row;
        if (distance != null) {
          if (!Number.isInteger(distance) || distance < 25 || distance > 1500) throw new Error('請填有效的單趟距離。');
          row.dist = distance;
        }
        const target = targetOf(row, bests), c = ['easy', 'steady', 'thr'].includes(row.int) ? cssCalc(row.stroke, bests) : null;
        row.sendoff = target && target.t ? Math.ceil((target.t + row.rest) / RND) * RND : 0;
        const rule = choice.key === 'steady' ? `CSS × ${K_STEADY}（本站換算）` : TYPE[x.type].target_rule;
        const basis = c && c.pace ? `${rule}；CSS ${fmt(c.pace)}／100 m（${TIER_LABEL[c.tier]}）；${c.how}` : `${rule}${target && target.note && target.note !== '🟠' ? `；${target.note}` : ''}`;
        return { name: x.name, strokeLabel: SZH[row.stroke], row: JSON.parse(JSON.stringify(row)), target: target && target.t || null, basis, missing: target && target.miss || (!target ? '請填足夠的成績，或改填手動目標。' : ''), sendoff: target && target.t ? Math.ceil((target.t + row.rest) / RND) * RND : null };
      },
      snapshot() {
        const rows = M().blocks.flatMap(b => b.rows);
        return JSON.parse(JSON.stringify({ menu: M(), saved: savedOk, imported: !!importedState,
          distance: rows.reduce((n, r) => n + rowDist(r), 0),
          seconds: rows.reduce((n, r, i) => n + rowSec(r, i < rows.length - 1), 0), count: rows.length,
          blocks: M().blocks.map(b => ({ title: b.title, distance: blockDist(b), count: b.rows.length })) }));
      },
      add(bi) { editing = null; retarget(bi); renderMenu(); },
      finishEdit() { editing = null; renderMenu(); },
      moveRow(fromBlock, fromRow, toBlock, toRow) {
        const src = M().blocks[fromBlock], dest = M().blocks[toBlock];
        if (!src || !dest || !src.rows[fromRow] || !Number.isInteger(toRow) || toRow < 0 || toRow > dest.rows.length) return false;
        if (src === dest && fromRow < toRow) toRow -= 1;
        const [r] = src.rows.splice(fromRow, 1); dest.rows.splice(toRow, 0, r);
        editing = null; save(); renderMenu(); return true;
      },
      setIntent(value) { M().intent = String(value).slice(0, 2000); save(); },
      sample() {
        const m = newMenu('介面示範・1200 m');
        m.intent = '用這份示範試試新增、排序與項目間休息；正式訓練前請依自己的目標修改。';
        m.blocks[0].rows.push(blankRow({ reps: 1, dist: 200, rest: 0, rowRest: 30, note: '輕鬆游，記下今天的感覺' }));
        m.blocks[1].rows.push(blankRow({ reps: 4, dist: 50, rest: 20, rowRest: 60, note: '先選一個今天想練的技術' }));
        m.blocks[2].rows.push(blankRow({ reps: 6, dist: 100, rest: 30, rowRest: 60, note: '依自己的成績與目標設定配速' }));
        m.blocks[3].rows.push(blankRow({ reps: 1, dist: 200, rest: 0, note: '放鬆游，回顧今天的完成情況' }));
        S.menus.push(m); S.cur = S.menus.length - 1; editing = null; draftDirty = false; save(); renderMenu();
      },
      brief() {
        const snapshot = this.snapshot();
        return {
          schemaVersion: 1, kind: 'vortex.workout.brief', language: 'zh-Hant',
          course: S.course, goal: M().intent || null,
          summary: { distanceM: snapshot.distance, estimatedSeconds: snapshot.seconds, items: snapshot.count },
          menu: JSON.parse(JSON.stringify(M())),
          items: M().blocks.flatMap((b, bi) => b.rows.map((r, ri) => {
            const target = targetOf(r), type = ({ thr: 'threshold', easy: 'aerobic_easy', tol: 'lactate_tolerance', race: 'race_pace' })[r.int];
            return { block: bi, row: ri, label: rowHead(r), description: sumBits(r).join('；'),
              targetSeconds: target && target.t || null, targetBasis: target && (target.note || target.miss) || (r.int === 'custom' ? '使用者自訂' : null),
              rule: type ? { key: type, exit: TYPE[type].exit || null, certainty: TYPE[type].cert || null } : null };
          })),
          missingContext: ['尚未提供訓練年資、近期負荷、身體狀態與前後課安排；不可自行假設。'],
          source: { title: 'Vortex 週期化・課表設計', url: new URL('../periodization/', location.href.split('#')[0]).href },
        };
      },
    });
  }
  initPz();
  initGoals();
  initDraw();
  renderCss(); renderPz(); renderSprint(); renderMenu(); renderMine();
  importShared();
  if (pbFrom) toast(`已帶入「${pbFrom}」的成績（只在這次開頁有效）`);
  else if (pbFrom === false) toast('這個成績連結讀不出來');
})();
