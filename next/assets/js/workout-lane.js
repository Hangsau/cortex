/* Shared-lane departure sheets. No storage, personal PB reads or timer mutations. */
(() => {
  'use strict';
  const defaults = { purpose: '', task: '自由式・無器材', pool: 25, distance: 100, sets: 1, reps: 6, setRest: 0, gap: 5, minRest: 20, maxRest: 35, buffer: 5, interval: '', minutes: '', timing: 'sendoff', mode: 'blocks', regroup: true };
  const round5 = n => Math.ceil((n - 1e-9) / 5) * 5;
  const fmt = n => {
    if (n == null) return '—';
    const ticks = Math.round(n * 10), minutes = Math.floor(ticks / 600), seconds = (ticks % 600) / 10;
    return `${minutes}:${String(seconds < 10 ? '0' : '')}${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}`;
  };
  function parseTime(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const s = String(value).trim().replace(/\s*秒$/, '');
    if (/^\d+(?:\.\d)?$/.test(s)) return Number(s);
    const match = s.match(/^(\d{1,3}):([0-5]\d(?:\.\d)?)$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }
  function number(value, label, min, max, optional = false) {
    if (optional && (value === '' || value == null)) return null;
    if (value === '' || value == null || !/^\d+$/.test(String(value)) || !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`${label}請填 ${min}–${max} 的整數。`);
    return Number(value);
  }
  function normalize(raw) {
    const c = { ...defaults, ...raw };
    c.purpose = String(c.purpose || '').trim().slice(0, 120);
    c.task = String(c.task || '').trim().slice(0, 120);
    if (!c.purpose || !c.task) throw new Error('請填這一段的訓練目的，以及泳式、游法與器材。');
    c.pool = number(c.pool, '池長', 25, 50);
    if (![25, 50].includes(c.pool)) throw new Error('請選 25 m 或 50 m 池。');
    c.distance = number(c.distance, '單趟距離', c.pool, 1500);
    if (c.distance % c.pool) throw new Error(`單趟距離要是 ${c.pool} m 的完整池長倍數。`);
    if (c.timing === 'rest') c.maxRest = '';
    for (const [key, label, min, max, optional] of [
      ['sets', '組數', 1, 20], ['reps', '趟數', 1, 200], ['setRest', '組間休息', 0, 3600], ['gap', '人與人出發間隔', 1, 60], ['minRest', '至少休息', 0, 3600],
      ['maxRest', '最多休息', 0, 3600, true], ['buffer', '整理／換批時間', 0, 600], ['minutes', '可用分鐘', 1, 240, true],
    ]) c[key] = number(c[key], label, min, max, optional);
    if (c.maxRest != null && c.maxRest < c.minRest) throw new Error('最多休息不能少於至少休息。');
    if (!['blocks', 'rotation'].includes(c.mode)) throw new Error('請選擇分批方式。');
    if (!['sendoff', 'rest'].includes(c.timing)) throw new Error('請選固定休息或共同包干。');
    if (c.timing === 'rest' && c.mode !== 'blocks') throw new Error('固定休息請用整批完成後換批；逐趟輪流的等待會改變每人休息。');
    c.regroup = c.regroup === true && c.timing !== 'rest';
    if (c.timing === 'rest') c.interval = '';
    if (c.interval !== '' && c.interval != null) {
      c.interval = parseTime(c.interval);
      if (c.interval == null || c.interval <= 0 || c.interval > 7200) throw new Error('共同週期請填秒數或分:秒，例如 125 或 2:05（最多 120 分鐘）。');
    } else c.interval = null;
    if (!Array.isArray(c.people) || !c.people.length || c.people.length > 24) throw new Error('請輸入 1–24 人的名單。工具人數上限不是水道容量建議。');
    c.people = c.people.map((p, index) => {
      const name = String(p.name || '').trim().slice(0, 40) || `泳者 ${index + 1}`, time = parseTime(p.time);
      if (time == null || time <= 0 || time > 7200) throw new Error(`${name}：請填這段 ${c.distance} m 的完成時間，例如 1:30 或 90（最多 120 分鐘）。`);
      return { name, time, index, basis: String(p.basis || '手動參考時間').slice(0, 300), batch: number(p.batch, `${name}的批次`, 1, 24) };
    });
    return c;
  }
  function batch(c, members, id) {
    const people = members.slice().sort((a, b) => a.time - b.time || a.index - b.index).map((p, index) => ({ ...p, offset: index * c.gap }));
    const finish = Math.max(...people.map(p => p.offset + p.time));
    const low = Math.max(...people.map(p => p.time + c.minRest), c.regroup ? finish + c.buffer : 0);
    const high = c.maxRest == null ? Infinity : Math.min(...people.map(p => p.time + c.maxRest));
    return { id, people, finish, low, high };
  }
  function suggestGroups(raw) {
    const c = normalize(raw), groups = [];
    if (c.timing === 'rest') throw new Error('固定休息不需要用休息交集分批；請依速度與水道動線手動指定批次。');
    for (const person of c.people.slice().sort((a, b) => a.time - b.time || a.index - b.index)) {
      const current = groups.at(-1), candidate = batch(c, [...(current || []), person], groups.length || 1);
      const period = c.interval ?? round5(candidate.low);
      if (current && period >= candidate.low && period <= candidate.high) current.push(person);
      else groups.push([person]);
    }
    return groups.flatMap((people, index) => people.map(p => ({ index: p.index, batch: index + 1 })));
  }
  function calculate(raw) {
    const c = normalize(raw), grouped = new Map(), warnings = [], notes = [];
    c.people.forEach(p => { if (!grouped.has(p.batch)) grouped.set(p.batch, []); grouped.get(p.batch).push(p); });
    const groups = [...grouped].sort((a, b) => a[0] - b[0]).map(([id, people]) => batch(c, people, id));
    let start = 0;
    if (c.mode === 'rotation') {
      groups.forEach(g => { g.start = start; start += g.finish + c.buffer; });
      const minimum = Math.max(start, ...c.people.map(p => p.time + c.minRest));
      const period = c.interval ?? round5(minimum);
      if (c.reps > 1 && period < start) throw new Error(`逐趟輪流至少要 ${fmt(start)} 才輪完並整理好；請延長共同週期或調整批次。`);
      groups.forEach(g => { g.interval = period; });
      const span = (c.reps - 1) * period + Math.max(...groups.map(g => g.start + g.finish));
      groups.forEach(g => { g.setStride = span + Math.max(c.setRest, c.buffer); });
      notes.push('逐趟輪流：前一批全部到牆並整理後，下一批才出發；等其他批的時間已計入休息。');
    } else {
      groups.forEach(g => {
        g.interval = c.timing === 'rest' ? null : c.interval ?? round5(g.low);
        const travel = Math.max(...g.people.map(p => p.time));
        if (c.timing === 'sendoff' && c.reps > 1 && g.interval < travel) throw new Error(`第 ${g.id} 批有人在下次出發前游不完；共同週期至少要 ${fmt(travel)}，再依目的留休息。`);
        if (c.timing === 'sendoff' && c.reps > 1 && c.regroup && g.interval < g.finish + c.buffer) throw new Error(`第 ${g.id} 批到齊並整理需要 ${fmt(g.finish + c.buffer)}；請延長共同週期或調整到齊設定。`);
        g.start = start;
        const span = Math.max(...g.people.map(p => p.offset + (c.reps - 1) * (g.interval ?? p.time + c.minRest) + p.time));
        g.setStride = span + Math.max(c.setRest, c.buffer);
        start += (c.sets - 1) * g.setStride + span + c.buffer;
      });
      if (groups.length > 1) notes.push('分時段：這批做完全部趟數再換下一批。其他批等待期間不在同一道慢游，等候位置與暖身由現場安排。');
    }
    for (const g of groups) {
      for (const p of g.people) {
        p.period = g.interval ?? p.time + c.minRest;
        p.first = g.start + p.offset;
        p.next = c.reps > 1 ? p.first + p.period : c.sets > 1 ? p.first + g.setStride : null;
        p.last = p.first + (c.sets - 1) * g.setStride + (c.reps - 1) * p.period + p.time;
        p.rest = c.reps > 1 ? p.period - p.time : null;
        p.setRest = c.sets > 1 ? g.setStride - (c.reps - 1) * p.period - p.time : null;
        if (p.rest != null && (p.rest < c.minRest - 1e-9 || (c.maxRest != null && p.rest > c.maxRest + 1e-9))) warnings.push(`第 ${g.id} 批 ${p.name}實際休息 ${fmt(p.rest)}，超出設定的 ${c.minRest} 秒${c.maxRest == null ? '以上' : `至 ${c.maxRest} 秒`}；請改週期、分批或休息條件。`);
      }
      g.end = Math.max(...g.people.map(p => p.last));
      if (c.distance >= 2 * c.pool && g.people.length > 1) {
        const firstReturn = g.people[0].time * 2 * c.pool / c.distance;
        if (g.people.at(-1).offset >= firstReturn) warnings.push(`第 ${g.id} 批首位估計返牆時，隊尾可能還沒出發；請縮小同批人數或調整組型。`);
        let catching = false;
        g.people.forEach((a, i) => g.people.slice(i + 1).forEach(b => {
          const t = Math.min(a.offset + a.time, b.offset + b.time);
          if (t > b.offset && (t - a.offset) * c.distance / a.time - (t - b.offset) * c.distance / b.time >= 2 * c.pool) catching = true;
        }));
        if (catching) warnings.push(`依均速估算，第 ${g.id} 批可能在單趟內追及；請縮短距離或重新分批，再看現場動線。`);
      }
    }
    const finish = Math.max(...groups.map(g => g.end)), nextBlock = finish + c.buffer;
    if (c.minutes != null && nextBlock > c.minutes * 60) warnings.push(`完成並整理需約 ${fmt(nextBlock)}，超過這一段可用的 ${c.minutes} 分鐘；請減少趟數、調整批次或增加時間。`);
    if ((c.distance / c.pool) % 2) notes.push('單趟為奇數個池長，下一趟從對岸出發；換批位置、器材與等待位置請一起安排。');
    if (c.reps === 1 && c.sets === 1) notes.push('每人只有一趟，沒有下一趟出發或趟間休息；表內以「—」顯示。');
    if (c.sets > 1) notes.push(`每組全員完成後休 ${c.setRest} 秒再開始下一組，至少留 ${c.buffer} 秒整理；每人的實際組間休息已含等待。`);
    if (c.timing === 'rest') notes.push(`固定休息：每人實際到牆後休 ${c.minRest} 秒再出發。表內後續時間是假設維持目標速度的預估，現場以到牆時間起算；前後趟可能同時在水中。`);
    if (!c.regroup && c.mode === 'blocks' && c.reps > 1) notes.push('未要求每趟全員到齊，前後趟可能同時在水中；這張表不檢查跨趟交通，請先確認繞圈與轉身位置。');
    notes.push('時間以本次參考速度估算；訓練效果、同時下水人數與實際動線仍需現場判斷。');
    return { config: c, groups, finish, nextBlock, warnings, notes };
  }
  if (typeof module === 'object' && module.exports) module.exports = { calculate, suggestGroups, parseTime, fmt };
  if (typeof document === 'undefined') return;
  const section = document.querySelector('[data-lane]'); if (!section) return;
  const root = document.querySelector('[data-wk]'), api = root.workout;
  if (!api?.groupOptions) return;
  const $ = s => section.querySelector(s), field = key => $(`[data-lane-field="${key}"]`), choiceField = key => $(`[data-lane-choice="${key}"]`);
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const options = api.groupOptions(), form = $('[data-lane-form]'), peopleBox = $('[data-lane-people]');
  let result = null, text = '', revision = 0, reference = '', pbReference = '';
  const choice = () => Object.fromEntries(['key', 'stroke', 'size', 'event'].map(k => [k, choiceField(k).value]));
  const stroke = () => options.strokes.find(x => x.key === choiceField('stroke').value);
  const standardTask = () => `${stroke().name}・完整游・無器材`;
  const referenceKey = () => ['pool', 'distance', 'task'].map(k => field(k).value).join('\n');
  const pbKey = () => [field('pool').value, choiceField('stroke').value, field('task').value].join('\n');
  const personField = (row, key) => row.querySelector(`[data-person-field="${key}"]`);
  function invalidate(message = '設定已更新，請重新計算目標與出發表。') {
    result = null; text = ''; revision += 1;
    $('[data-lane-output]').replaceChildren(); $('[data-lane-export]').hidden = true; $('[data-lane-fallback]').hidden = true;
    $('[data-lane-copy-text]').value = ''; $('[data-lane-error]').hidden = true; $('[data-lane-status]').textContent = message;
  }
  function error(message) { $('[data-lane-error]').textContent = message; $('[data-lane-error]').hidden = false; }
  function clearTarget(row, message = '填成績後按下方按鈕計算。') {
    personField(row, 'time').value = ''; delete row.dataset.basis;
    row.querySelector('[data-person-basis]').textContent = message;
  }
  function scoreFields(row, clear = false) {
    const box = row.querySelector('[data-person-pbs]');
    const saved = clear ? {} : Object.fromEntries([...box.querySelectorAll('input')].map(el => [el.dataset.personPb, el.value]));
    const preferred = ['aerobic_easy', 'steady', 'threshold'].includes(choice().key) ? [200, 400] : choice().key === 'race_pace' ? [+choice().event] : [100, 50, 25];
    const distances = [...new Set([...preferred, ...stroke().distances])].filter(d => stroke().distances.includes(d));
    box.innerHTML = distances.map(d => `<label class="wk-field"><span>${d} m 成績</span><input type="text" inputmode="decimal" maxlength="12" data-person-pb="${d}" value="${esc(saved[d] || '')}" placeholder="分:秒或秒數"></label>`).join('');
    row.querySelector('[data-person-condition]').textContent = `${field('pool').value} m 池 · ${field('task').value}。只填實際游過的距離。`;
  }
  function syncSource(row) {
    const measured = personField(row, 'source').value === 'pb';
    personField(row, 'time').readOnly = measured;
    personField(row, 'time').placeholder = measured ? '填成績後計算' : '例如 1:30';
    row.querySelector('[data-person-scores]').hidden = !measured;
    if (!measured) { row.dataset.basis = '手動目標／參考時間'; row.querySelector('[data-person-basis]').textContent = '使用你填入的秒數，可依今天狀態調整。'; }
  }
  function addPerson(name = '', time = '', batchId = 1, source = 'pb') {
    if (peopleBox.children.length >= 24) { error('最多輸入 24 人；實際同時下水人數請依現場條件安排。'); return; }
    const row = document.createElement('div'); row.className = 'wk-lane-person'; row.dataset.lanePerson = '';
    row.innerHTML = `<label class="wk-field"><span>姓名或代號</span><input type="text" maxlength="40" data-person-field="name" value="${esc(name)}" placeholder="可留空"></label>
      <label class="wk-field"><span>目標來源</span><select data-person-field="source"><option value="pb">依自己的成績</option><option value="manual">手動秒數</option></select></label>
      <label class="wk-field"><span>目標／參考秒數</span><input type="text" inputmode="decimal" maxlength="12" data-person-field="time" value="${esc(time)}"></label>
      <label class="wk-field"><span>批次</span><input type="number" min="1" max="24" data-person-field="batch" value="${batchId}"></label>
      <button type="button" class="wk-btn" data-lane-remove>移除</button>
      <p class="wk-note wk-lane-wide" data-person-basis></p>
      <details class="wk-goal-details wk-lane-wide" data-person-scores><summary>輸入／修改這位泳者的成績</summary><p class="wk-note" data-person-condition></p><div class="wk-lane-pbs" data-person-pbs></div></details>`;
    personField(row, 'source').value = source;
    peopleBox.append(row); scoreFields(row); syncSource(row);
    $('[data-lane-add]').disabled = peopleBox.children.length >= 24;
  }
  function raw() {
    const values = Object.fromEntries(Object.keys(defaults).map(k => [k, k === 'regroup' ? field(k).checked : field(k).value]));
    if (values.timing === 'rest') { values.mode = 'blocks'; values.maxRest = ''; values.interval = ''; }
    values.people = [...peopleBox.children].map(row => ({ ...Object.fromEntries(['name', 'time', 'batch'].map(k => [k, personField(row, k).value])), basis: row.dataset.basis }));
    return values;
  }
  function clearReference() {
    if (reference === referenceKey() && pbReference === pbKey()) return;
    const clearScores = pbReference !== pbKey();
    [...peopleBox.children].forEach(row => { clearTarget(row, clearScores ? '條件已改，請填這個泳式／池長／器材條件的成績。' : '距離已改，請重新計算或填入目標。'); scoreFields(row, clearScores); });
    reference = referenceKey(); pbReference = pbKey();
    $('[data-lane-distance-label]').textContent = `${field('distance').value || '—'} m`;
    invalidate('條件已更新；成績推算者可重新計算，手動目標請重新確認。');
  }
  function resolveTargets() {
    const messages = [], distance = Number(field('distance').value);
    [...peopleBox.children].forEach((row, i) => {
      if (personField(row, 'source').value !== 'pb') return;
      const name = personField(row, 'name').value.trim() || `泳者 ${i + 1}`, bests = {};
      try {
        if (field('task').value.trim() !== standardTask()) throw new Error('這是器材或自訂游法，請改用手動目標，避免套用無器材成績。');
        row.querySelectorAll('[data-person-pb]').forEach(el => {
          if (!el.value.trim()) return;
          bests[el.dataset.personPb] = el.value.trim();
        });
        const x = api.groupRecommendation(choice(), { [stroke().key]: bests }, distance);
        if (!(x.target > 0) || !Number.isFinite(x.target)) throw new Error(x.missing || '成績不足，請補成績或改用手動秒數。');
        personField(row, 'time').value = fmt(Math.round(x.target * 10) / 10);
        row.dataset.basis = `成績推算：${x.basis}`;
        row.querySelector('[data-person-basis]').textContent = `${x.basis}。組型建議每趟休 ${fmt(x.row.rest)}；本表依上方這次的休息設定安排。`;
      } catch (e) { clearTarget(row, e.message); messages.push(`${name}：${e.message}`); }
    });
    if (messages.length) throw new Error(messages.join('；'));
  }
  function updateEvents() {
    const selected = choiceField('event').value || '100';
    choiceField('event').innerHTML = stroke().distances.filter(d => d >= 50).map(d => `<option value="${d}">${d} m</option>`).join('');
    choiceField('event').value = stroke().distances.includes(+selected) ? selected : '100';
    $('[data-lane-race]').hidden = choiceField('key').value !== 'race_pace';
  }
  function applyTemplate() {
    updateEvents();
    const x = api.groupRecommendation(choice(), {}), r = x.row;
    for (const [k, v] of Object.entries({ purpose: x.name, task: standardTask(), distance: r.dist, sets: r.sets, reps: r.reps, setRest: r.setRest, minRest: r.rest, maxRest: '', interval: '' })) field(k).value = v;
    clearReference();
    [...peopleBox.children].forEach(row => { clearTarget(row); scoreFields(row); });
    $('[data-lane-context]').textContent = `已帶入 ${r.sets} 組 × ${r.reps} 趟 × ${r.dist} m；每趟建議休 ${fmt(r.rest)}${r.sets > 1 ? `，組間休 ${fmt(r.setRest)}` : ''}。可修改份量，再依每人的成績推算目標。`;
    invalidate('主課已更新，請填或確認每人的成績，再計算。');
  }
  function syncTiming() {
    const fixed = field('timing').value === 'rest';
    section.querySelectorAll('[data-lane-sendoff-only]').forEach(el => { el.hidden = fixed; });
    $('[data-lane-group]').disabled = fixed;
    $('[data-lane-rest-label]').textContent = fixed ? '每人到牆後休息（秒）' : '每趟至少休息（秒）';
  }
  function render(r) {
    const c = r.config, volume = c.sets * c.reps * c.distance;
    $('[data-lane-status]').textContent = r.warnings.length ? '已算出參考表，但有條件需要調整，請看下方提示。' : '已算出目標與出發表，請核對名單與現場動線。';
    $('[data-lane-output]').innerHTML = `<div class="wk-goal-preview"><h3>${esc(c.purpose)}</h3><p>${esc(c.task)} · ${c.pool} m 池 · 每人 ${c.sets} 組 × ${c.reps} × ${c.distance} m（${volume} m）</p><p>${c.timing === 'rest' ? `固定休息 ${fmt(c.minRest)}；後續出發依目標游速預估，現場從實際到牆起算。` : `共同包干；以每人至少休 ${fmt(c.minRest)}${c.maxRest == null ? '' : `、最多休 ${fmt(c.maxRest)}`} 為這次條件。`}</p><p data-lane-summary>${c.people.length} 人／${r.groups.length} 批；最後一人 ${fmt(r.finish)} 到牆，含整理後約 ${fmt(r.nextBlock)} 可換下一段。</p><p>以下時間從這一段開始起算，不是時鐘的現在時間。</p>${r.warnings.length ? `<div class="wk-warn"><b>需要調整</b><ul>${r.warnings.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}</div>` + r.groups.map(g => `
      <section class="wk-lane-batch"><h3>第 ${g.id} 批 · ${g.people.length} 人 · ${c.reps > 1 ? c.timing === 'rest' ? `每趟休 ${fmt(c.minRest)}` : `每 ${fmt(g.interval)} 出發` : '每組一趟'}</h3>
      <p>這批 ${fmt(g.start)} 開始，最後一人 ${fmt(g.end)} 完成。${c.sets > 1 ? `下一組首位 ${fmt(g.start + g.setStride)} 出發。` : ''}</p>
      <div class="wk-tablewrap" tabindex="0" role="region" aria-label="第 ${g.id} 批出發表，可左右捲動"><table class="wk-table"><caption>第 ${g.id} 批目標與出發表（可左右滑動）</caption><thead><tr><th scope="col">順序／泳者</th><th scope="col">目標秒數</th><th scope="col">每趟休息</th><th scope="col">${c.timing === 'rest' ? '預估週期' : '包干週期'}</th><th scope="col">首趟出發</th><th scope="col">下一次出發</th>${c.sets > 1 ? '<th scope="col">實際組間休息</th>' : ''}<th scope="col">最後到牆</th></tr></thead><tbody>${g.people.map((p, i) => `<tr><th scope="row">${i + 1}. ${esc(p.name)}</th><td>${fmt(p.time)}</td><td>${fmt(p.rest)}</td><td>${c.reps > 1 ? fmt(p.period) : '—'}</td><td>${fmt(p.first)}</td><td>${fmt(p.next)}</td>${c.sets > 1 ? `<td>${fmt(p.setRest)}</td>` : ''}<td>${fmt(p.last)}</td></tr>`).join('')}</tbody></table></div>
      <details class="wk-goal-details"><summary>每人目標的計算依據</summary><ul>${g.people.map(p => `<li>${esc(p.name)}：${esc(p.basis)}</li>`).join('')}</ul></details></section>`).join('') + `<ul class="wk-note">${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
    text = [
      `${c.purpose}｜${c.task}`, `${c.pool} m 池；每人 ${c.sets} 組 × ${c.reps} × ${c.distance} m，共 ${volume} m`,
      c.timing === 'rest' ? `固定休息 ${fmt(c.minRest)}；表內時間依目標游速預估，現場從實際到牆起算。` : `共同包干；每趟至少休 ${fmt(c.minRest)}${c.maxRest == null ? '' : `，最多休 ${fmt(c.maxRest)}`}。`,
      `人間隔 ${c.gap} 秒；${c.mode === 'rotation' ? '逐趟輪流；每批到齊換批' : '這批做完全部組再換批'}；組間到齊後休 ${fmt(c.setRest)}，整理／換批 ${c.buffer} 秒`,
      `時間從此段開始起算。最後一人 ${fmt(r.finish)} 到牆，${fmt(r.nextBlock)} 可換段。`,
      ...r.warnings.map(w => '需要調整：' + w),
      ...r.groups.flatMap(g => [`\n第 ${g.id} 批${g.interval != null && c.reps > 1 ? `，每 ${fmt(g.interval)} 出發` : ''}${c.sets > 1 ? `，下一組首位 ${fmt(g.start + g.setStride)}` : ''}`, ...g.people.map((p, i) => `${i + 1}. ${p.name}｜目標 ${fmt(p.time)}｜休 ${fmt(p.rest)}｜週期 ${c.reps > 1 ? fmt(p.period) : '—'}｜首趟 ${fmt(p.first)}｜次趟 ${fmt(p.next)}${c.sets > 1 ? `｜組間休 ${fmt(p.setRest)}` : ''}｜最後到牆 ${fmt(p.last)}\n依據：${p.basis}`)]),
      ...r.notes,
    ].join('\n');
    $('[data-lane-export]').hidden = false;
  }
  form.addEventListener('input', e => {
    const row = e.target.closest('[data-lane-person]');
    if (row && e.target.matches('[data-person-pb]')) clearTarget(row, '成績已更新，請重新計算目標。');
    invalidate();
  });
  form.addEventListener('change', e => {
    if (e.target.matches('[data-lane-choice]')) { applyTemplate(); return; }
    if (e.target.matches('[data-person-field="source"]')) { const row = e.target.closest('[data-lane-person]'); if (e.target.value === 'pb') clearTarget(row); syncSource(row); }
    syncTiming(); invalidate(); clearReference();
  });
  form.addEventListener('submit', e => {
    e.preventDefault(); clearReference(); invalidate('');
    try { resolveTargets(); result = calculate(raw()); render(result); } catch (e) { error(e.message); }
  });
  function importRecommendation() {
    const x = api.recommendation();
    ['key', 'stroke', 'size'].forEach(k => { choiceField(k).value = x.choice[k]; }); updateEvents(); choiceField('event').value = x.choice.event;
    applyTemplate();
  }
  section.addEventListener('click', async e => {
    const btn = e.target.closest('button'); if (!btn) return;
    if (btn.hasAttribute('data-lane-add')) { invalidate(); addPerson(); }
    else if (btn.hasAttribute('data-lane-remove')) { btn.closest('[data-lane-person]').remove(); $('[data-lane-add]').disabled = false; invalidate(); }
    else if (btn.hasAttribute('data-lane-pb-toggle')) {
      const details = [...peopleBox.querySelectorAll('[data-person-scores]')].filter(el => !el.hidden), open = details.some(el => !el.open);
      details.forEach(el => { el.open = open; }); btn.textContent = open ? '收起成績欄位' : '展開所有人的成績';
    } else if (btn.hasAttribute('data-lane-example')) {
      choiceField('key').value = 'steady'; choiceField('stroke').value = 'free'; updateEvents();
      for (const [k, v] of Object.entries({ ...defaults, purpose: '穩定有氧・四人示範', task: standardTask(), minutes: 20 })) { if (k === 'regroup') field(k).checked = v; else field(k).value = v; }
      peopleBox.replaceChildren(); ['A', 'B', 'C', 'D'].forEach((n, i) => addPerson(n, fmt(90 + i * 5), 1, 'manual'));
      reference = referenceKey(); pbReference = pbKey(); $('[data-lane-distance-label]').textContent = '100 m'; syncTiming();
      $('[data-lane-context]').textContent = '這是手動秒數的計算示範；你也可以把每人的目標來源改成「依自己的成績」。'; invalidate('示範已載入，可直接計算，或先修改。');
    } else if (btn.hasAttribute('data-lane-import')) importRecommendation();
    else if (btn.hasAttribute('data-lane-group')) {
      clearReference(); invalidate('');
      try { resolveTargets(); suggestGroups(raw()).forEach(a => { personField(peopleBox.children[a.index], 'batch').value = a.batch; }); $('[data-lane-status]').textContent = '已依同批休息條件建議分批；可手動修改，再計算完整出發表。'; } catch (e) { error(e.message); }
    } else if (btn.hasAttribute('data-lane-copy') && result) {
      const current = revision, value = text;
      try { await navigator.clipboard.writeText(value); if (current === revision) $('[data-lane-status]').textContent = '出發表已複製。'; }
      catch (_) { if (current === revision) { $('[data-lane-fallback]').hidden = false; $('[data-lane-copy-text]').value = value; $('[data-lane-copy-text]').focus(); $('[data-lane-copy-text]').select(); $('[data-lane-status]').textContent = '請從下方文字框選取並複製。'; } }
    }
  });
  root.addEventListener('click', e => { if (e.target.closest('[data-wk-goal-lane]')) { importRecommendation(); root.dispatchEvent(new CustomEvent('workout:group-requested')); location.hash = 'wk-lane'; section.focus(); section.scrollIntoView(); } });
  choiceField('key').innerHTML = options.goals.map(x => `<option value="${x.key}">${esc(x.name)}</option>`).join('');
  choiceField('stroke').innerHTML = options.strokes.map(x => `<option value="${x.key}">${esc(x.name)}</option>`).join('');
  updateEvents();
  for (let i = 0; i < 4; i++) addPerson();
  applyTemplate(); syncTiming();
})();
