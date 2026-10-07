/* Shared-lane departure sheets. No storage, personal PB reads or timer mutations. */
(() => {
  'use strict';
  const defaults = { purpose: '', task: '自由式・無器材', pool: 25, distance: 100, reps: 6, gap: 5, minRest: 20, maxRest: 35, buffer: 5, interval: '', minutes: '', mode: 'blocks', regroup: true };
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
    for (const [key, label, min, max, optional] of [
      ['reps', '趟數', 1, 200], ['gap', '人與人出發間隔', 1, 60], ['minRest', '至少休息', 0, 3600],
      ['maxRest', '最多休息', 0, 3600, true], ['buffer', '整理／換批時間', 0, 600], ['minutes', '可用分鐘', 1, 240, true],
    ]) c[key] = number(c[key], label, min, max, optional);
    if (c.maxRest != null && c.maxRest < c.minRest) throw new Error('最多休息不能少於至少休息。');
    if (!['blocks', 'rotation'].includes(c.mode)) throw new Error('請選擇分批方式。');
    c.regroup = c.regroup === true;
    if (c.interval !== '' && c.interval != null) {
      c.interval = parseTime(c.interval);
      if (c.interval == null || c.interval <= 0 || c.interval > 7200) throw new Error('共同週期請填秒數或分:秒，例如 125 或 2:05（最多 120 分鐘）。');
    } else c.interval = null;
    if (!Array.isArray(c.people) || !c.people.length || c.people.length > 24) throw new Error('請輸入 1–24 人的名單。工具人數上限不是水道容量建議。');
    c.people = c.people.map((p, index) => {
      const name = String(p.name || '').trim().slice(0, 40) || `泳者 ${index + 1}`, time = parseTime(p.time);
      if (time == null || time <= 0 || time > 7200) throw new Error(`${name}：請填這段 ${c.distance} m 的完成時間，例如 1:30 或 90（最多 120 分鐘）。`);
      return { name, time, index, batch: number(p.batch, `${name}的批次`, 1, 24) };
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
      notes.push('逐趟輪流：前一批全部到牆並整理後，下一批才出發；等其他批的時間已計入休息。');
    } else {
      groups.forEach(g => {
        g.interval = c.interval ?? round5(g.low);
        const travel = Math.max(...g.people.map(p => p.time));
        if (c.reps > 1 && g.interval < travel) throw new Error(`第 ${g.id} 批有人在下次出發前游不完；共同週期至少要 ${fmt(travel)}，再依目的留休息。`);
        if (c.reps > 1 && c.regroup && g.interval < g.finish + c.buffer) throw new Error(`第 ${g.id} 批到齊並整理需要 ${fmt(g.finish + c.buffer)}；請延長共同週期或調整到齊設定。`);
        g.start = start;
        start += (c.reps - 1) * g.interval + g.finish + c.buffer;
      });
      if (groups.length > 1) notes.push('分時段：這批做完全部趟數再換下一批。其他批等待期間不在同一道慢游，等候位置與暖身由現場安排。');
    }
    for (const g of groups) {
      for (const p of g.people) {
        p.first = g.start + p.offset;
        p.next = c.reps > 1 ? p.first + g.interval : null;
        p.last = p.first + (c.reps - 1) * g.interval + p.time;
        p.rest = c.reps > 1 ? g.interval - p.time : null;
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
    if (c.reps === 1) notes.push('每人只有一趟，沒有下一趟出發或趟間休息；表內以「—」顯示。');
    if (!c.regroup && c.mode === 'blocks' && c.reps > 1) notes.push('未要求每趟全員到齊，前後趟可能同時在水中；這張表不檢查跨趟交通，請先確認繞圈與轉身位置。');
    notes.push('時間以本次參考速度估算；訓練效果、同時下水人數與實際動線仍需現場判斷。');
    return { config: c, groups, finish, nextBlock, warnings, notes };
  }
  if (typeof module === 'object' && module.exports) module.exports = { calculate, suggestGroups, parseTime, fmt };
  if (typeof document === 'undefined') return;
  const section = document.querySelector('[data-lane]'); if (!section) return;
  const root = document.querySelector('[data-wk]'), $ = s => section.querySelector(s), field = key => $(`[data-lane-field="${key}"]`);
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const form = $('[data-lane-form]'), peopleBox = $('[data-lane-people]');
  let result = null, text = '', revision = 0, reference = '';
  const referenceKey = () => ['pool', 'distance', 'task'].map(k => field(k).value).join('\n');
  function invalidate(message = '設定已更新，請重新計算出發表。') {
    result = null; text = ''; revision += 1;
    $('[data-lane-output]').replaceChildren(); $('[data-lane-export]').hidden = true; $('[data-lane-fallback]').hidden = true;
    $('[data-lane-copy-text]').value = ''; $('[data-lane-error]').hidden = true; $('[data-lane-status]').textContent = message;
  }
  function error(message) { $('[data-lane-error]').textContent = message; $('[data-lane-error]').hidden = false; }
  function addPerson(name = '', time = '', batchId = 1) {
    if (peopleBox.children.length >= 24) { error('最多輸入 24 人；實際同時下水人數請依現場條件安排。'); return; }
    const row = document.createElement('div'); row.className = 'wk-lane-person'; row.dataset.lanePerson = '';
    row.innerHTML = `<label class="wk-field"><span>姓名或代號</span><input type="text" maxlength="40" data-person-field="name" value="${esc(name)}" placeholder="可留空"></label><label class="wk-field"><span>這段完成時間</span><input type="text" inputmode="decimal" maxlength="12" data-person-field="time" value="${esc(time)}" placeholder="分:秒或秒數"></label><label class="wk-field"><span>批次</span><input type="number" min="1" max="24" data-person-field="batch" value="${batchId}"></label><button type="button" class="wk-btn" data-lane-remove>移除</button>`;
    peopleBox.append(row); $('[data-lane-add]').disabled = peopleBox.children.length >= 24;
  }
  function raw() {
    const values = Object.fromEntries(Object.keys(defaults).map(k => [k, k === 'regroup' ? field(k).checked : field(k).value]));
    values.people = [...peopleBox.children].map(row => Object.fromEntries(['name', 'time', 'batch'].map(k => [k, row.querySelector(`[data-person-field="${k}"]`).value])));
    return values;
  }
  function clearReference() {
    if (reference === referenceKey()) return;
    peopleBox.querySelectorAll('[data-person-field="time"]').forEach(el => { el.value = ''; });
    reference = referenceKey();
    $('[data-lane-distance-label]').textContent = `${field('distance').value || '—'} m`;
    invalidate('池長、距離或游法已改，請重新填每人的參考時間。');
  }
  function render(r) {
    const c = r.config;
    $('[data-lane-status]').textContent = r.warnings.length ? '已算出參考表，但有條件需要調整，請看下方提示。' : '已算出出發表，請核對名單與現場動線。';
    $('[data-lane-output]').innerHTML = `<div class="wk-goal-preview"><h3>${esc(c.purpose)}</h3><p>${esc(c.task)} · ${c.pool} m 池 · 每人 ${c.reps} × ${c.distance} m（${c.reps * c.distance} m）</p><p data-lane-summary>${c.people.length} 人／${r.groups.length} 批；最後一人 ${fmt(r.finish)} 到牆，含整理後約 ${fmt(r.nextBlock)} 可換下一段。</p><p>以下時間從這一段開始起算，不是時鐘的現在時間。</p>${r.warnings.length ? `<div class="wk-warn"><b>需要調整</b><ul>${r.warnings.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}</div>` + r.groups.map(g => `<section class="wk-lane-batch"><h3>第 ${g.id} 批 · ${g.people.length} 人${c.reps > 1 ? ` · 每 ${fmt(g.interval)} 出發` : ' · 單趟'}</h3><p>這批 ${fmt(g.start)} 開始，最後一人 ${fmt(g.end)} 完成。</p><div class="wk-tablewrap" tabindex="0" role="region" aria-label="第 ${g.id} 批出發表，可左右捲動"><table class="wk-table"><caption>第 ${g.id} 批出發順序與時間</caption><thead><tr><th scope="col">順序／泳者</th><th scope="col">本趟時間</th><th scope="col">第一趟出發</th><th scope="col">下一趟出發</th><th scope="col">每趟休息</th><th scope="col">最後到牆</th></tr></thead><tbody>${g.people.map((p, i) => `<tr><th scope="row">${i + 1}. ${esc(p.name)}</th><td>${fmt(p.time)}</td><td>${fmt(p.first)}</td><td>${fmt(p.next)}</td><td>${fmt(p.rest)}</td><td>${fmt(p.last)}</td></tr>`).join('')}</tbody></table></div></section>`).join('') + `<ul class="wk-note">${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
    text = [
      `${c.purpose}｜${c.task}`, `${c.pool} m 池；每人 ${c.reps} × ${c.distance} m，共 ${c.reps * c.distance} m`,
      `人間隔 ${c.gap} 秒；${c.mode === 'rotation' ? '逐趟輪流；每批到齊換批' : `這批做完全部趟數再換批；${c.regroup ? '每趟到齊' : '可跨趟流動'}`}；整理／換批 ${c.buffer} 秒`,
      `時間從此段開始起算。最後一人 ${fmt(r.finish)} 到牆，${fmt(r.nextBlock)} 可換段。`,
      ...r.warnings.map(w => '需要調整：' + w),
      ...r.groups.flatMap(g => [`\n第 ${g.id} 批${c.reps > 1 ? `，每 ${fmt(g.interval)} 出發` : '，單趟'}`, ...g.people.map((p, i) => `${i + 1}. ${p.name}｜游 ${fmt(p.time)}｜首趟 ${fmt(p.first)}｜次趟 ${fmt(p.next)}｜休 ${fmt(p.rest)}｜最後到牆 ${fmt(p.last)}`)]),
      ...r.notes,
    ].join('\n');
    $('[data-lane-export]').hidden = false;
  }
  form.addEventListener('input', () => invalidate());
  form.addEventListener('change', () => { invalidate(); clearReference(); });
  form.addEventListener('submit', e => {
    e.preventDefault(); clearReference(); invalidate('');
    try { result = calculate(raw()); render(result); } catch (e) { error(e.message); }
  });
  section.addEventListener('click', async e => {
    const btn = e.target.closest('button'); if (!btn) return;
    if (btn.hasAttribute('data-lane-add')) { invalidate(); addPerson(); }
    else if (btn.hasAttribute('data-lane-remove')) { btn.closest('[data-lane-person]').remove(); $('[data-lane-add]').disabled = false; invalidate(); }
    else if (btn.hasAttribute('data-lane-example')) {
      for (const [k, v] of Object.entries({ ...defaults, purpose: '穩定有氧・四人示範', minutes: 20 })) { if (k === 'regroup') field(k).checked = v; else field(k).value = v; }
      peopleBox.replaceChildren(); ['A', 'B', 'C', 'D'].forEach((n, i) => addPerson(n, fmt(90 + i * 5)));
      reference = referenceKey(); $('[data-lane-distance-label]').textContent = '100 m';
      $('[data-lane-context]').textContent = '這是計算示範，請換成今天的實際名單、時間與休息需求。'; invalidate('示範已載入，可直接計算，或先修改。');
    } else if (btn.hasAttribute('data-lane-import')) importRecommendation();
    else if (btn.hasAttribute('data-lane-group')) {
      clearReference(); invalidate('');
      try {
        const assignments = suggestGroups(raw()); assignments.forEach(a => { peopleBox.children[a.index].querySelector('[data-person-field="batch"]').value = a.batch; });
        $('[data-lane-status]').textContent = '已依同批休息條件建議分批；可手動修改批次，再計算實際出發與等待時間。';
      } catch (e) { error(e.message); }
    } else if (btn.hasAttribute('data-lane-copy') && result) {
      const current = revision, value = text;
      try { await navigator.clipboard.writeText(value); if (current === revision) $('[data-lane-status]').textContent = '出發表已複製。'; }
      catch (_) { if (current === revision) { $('[data-lane-fallback]').hidden = false; $('[data-lane-copy-text]').value = value; $('[data-lane-copy-text]').focus(); $('[data-lane-copy-text]').select(); $('[data-lane-status]').textContent = '請從下方文字框選取並複製。'; } }
    }
  });
  function importRecommendation() {
    const x = root.workout?.recommendation?.();
    if (!x) { error('請手動填入這次的目的、距離與趟數。'); return; }
    field('purpose').value = x.name; field('task').value = `${x.strokeLabel}・完整游・無器材`;
    field('distance').value = x.row.dist; field('reps').value = x.row.reps;
    field('minRest').value = x.row.rest; field('maxRest').value = ''; field('interval').value = '';
    clearReference(); invalidate('已帶入單組組型，請填每人的參考時間並確認休息範圍。');
    $('[data-lane-context]').textContent = (x.row.sets > 1 ? `原推薦是 ${x.row.sets} 組 × ${x.row.reps} 趟，組間休息 ${fmt(x.row.setRest)}；本表先算其中 1 組，其他組與組間時間請手動安排。` : `已帶入 ${x.row.reps} × ${x.row.dist} m；每人的時間請用今天這個任務的表現。`) + ' 每趟至少休息沿用推薦值，最多休息請依現場需要填寫。';
  }
  root.addEventListener('click', e => { if (e.target.closest('[data-wk-goal-lane]')) { importRecommendation(); location.hash = 'wk-lane'; section.focus(); section.scrollIntoView(); } });
  for (let i = 0; i < 4; i++) addPerson();
  reference = referenceKey();
})();
