/* Rules and training language live in canonical/periodization/decisions.yaml.
 * This interpreter validates inputs, selects the first matching rule, and renders
 * plain text. No persistence, requests, inferred diagnosis, or hidden load score. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') {
    document.querySelectorAll('[data-vx-planner]').forEach(api.mount);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function evaluate(guide, raw) {
    if (guide.schema_version !== 1) throw new Error('資料版本不相容，請使用下方決策表。');
    const planner = guide.planner;
    const input = {};
    const selected = {};
    for (const field of planner.fields) {
      const option = field.options.find(item => item.key === raw[field.key]);
      if (!option) throw new Error('請完成「' + field.label + '」。');
      input[field.key] = option.key;
      selected[field.key] = option;
    }
    for (const key of ['sessions', 'minutes']) {
      const spec = planner.resources[key];
      const value = raw[key];
      if (!/^[0-9]+$/.test(String(value))) throw new Error(spec.label + '請填整數。');
      input[key] = Number(value);
      if (!Number.isSafeInteger(input[key]) || input[key] < spec.min || input[key] > spec.max) {
        throw new Error(spec.label + '需介於 ' + spec.min + ' 與 ' + spec.max + '。');
      }
    }
    input.goal_note = typeof raw.goal_note === 'string' ? raw.goal_note.trim().slice(0, 160) : '';
    const rule = planner.rules.find(item => item.when.every(condition =>
      condition.values.includes(input[condition.field])));
    if (!rule || !Object.prototype.hasOwnProperty.call(planner.cadence, rule.schedule)) {
      throw new Error('目前無法產生安排，請使用下方決策表。');
    }
    const slots = planner.cadence[rule.schedule].slice(0, input.sessions).map(key => {
      const slot = planner.slot_templates[key];
      if (!slot) throw new Error('安排資料不完整，請使用下方決策表。');
      return { key, title: slot.title, text: slot.text };
    });
    return { input, selected, rule, slots };
  }

  function describe(guide, result) {
    const p = guide.planner;
    const { input, selected, rule, slots } = result;
    const sections = [
      { title: '這次的條件', paragraphs: [p.fields.map(f => selected[f.key].label).join(' · '),
        '每週最多 ' + input.sessions + ' 次，每次最多 ' + input.minutes + ' 分鐘（含熱身與收操，不要求練滿）。'] },
      { title: '為什麼先做這件事', paragraphs: [rule.affirmative_conclusion, selected.population.note, selected.event.note] },
      { title: '現在怎麼做', paragraphs: [rule.action] }
    ];
    if (input.goal_note) sections[0].paragraphs.push('本輪目標：' + input.goal_note);
    if (['regular', 'baseline'].includes(rule.schedule)) {
      sections.push({ title: '主重點與維持', paragraphs: [selected.goal.primary, selected.goal.maintenance] });
    }
    if (rule.key === 'progress') {
      sections.push({ title: '若決定推進，只選一項', paragraphs: [selected.goal.progression] });
    }
    if (slots.length) sections.push({ title: '分配到可用的練習機會', paragraphs: [p.scheduling_note], slots });
    const observation = [rule.how_to_identify];
    if (['regular', 'baseline'].includes(rule.schedule)) observation.push(selected.goal.measure);
    sections.push({ title: '觀察什麼', paragraphs: observation });
    sections.push({ title: '何時重看或改變安排', paragraphs: [rule.next] });
    sections.push({ title: '這個判斷的適用範圍', paragraphs: [rule.works_when, '需要重查的情況：' + rule.fails_when, rule.remaining_boundary] });
    if (rule.key !== 'stop') sections.push({ title: '下次可沿用的記錄欄', paragraphs: [guide.monitoring.record] });
    sections.push({ title: '使用說明', paragraphs: [p.provenance_zh, '規則版本 ' + p.version] });
    return sections;
  }

  function toText(guide, result) {
    return [result.rule.title, ...describe(guide, result).map(section =>
      section.title + '\n' + section.paragraphs.join('\n') + (section.slots ? '\n' + section.slots.map((slot, n) =>
        (n + 1) + '. ' + slot.title + '：' + slot.text).join('\n') : ''))].join('\n\n');
  }

  function mount(host) {
    const status = host.querySelector('[data-planner-status]');
    let guide;
    try {
      guide = JSON.parse(host.querySelector('[data-planner-config]').textContent);
      if (guide.schema_version !== 1) throw new Error('version');
    } catch (_) {
      status.textContent = '互動資料暫時無法載入，請使用下方完整決策表。';
      return;
    }
    const form = host.querySelector('form');
    const output = host.querySelector('[data-planner-result]');
    const title = host.querySelector('[data-result-title]');
    const body = host.querySelector('[data-result-body]');
    const fallback = host.querySelector('[data-copy-fallback]');
    let current = null;
    const append = (parent, tag, text, className) => {
      const node = document.createElement(tag);
      node.textContent = text;
      if (className) node.className = className;
      parent.append(node);
      return node;
    };
    function run() {
      if (!form.reportValidity()) return;
      try {
        current = evaluate(guide, Object.fromEntries(new FormData(form)));
        title.textContent = current.rule.title;
        body.replaceChildren();
        for (const section of describe(guide, current)) {
          append(body, 'h4', section.title);
          section.paragraphs.forEach(text => append(body, 'p', text));
          if (section.slots) {
            const list = append(body, 'ol', '', 'vx-planner-slots');
            for (const slot of section.slots) {
              const item = append(list, 'li', '');
              append(item, 'strong', slot.title);
              append(item, 'span', slot.text);
            }
          }
        }
        output.hidden = false;
        fallback.hidden = true;
        fallback.value = '';
        status.textContent = '已依目前條件產生安排。修改欄位後請重新產生。';
        title.focus();
      } catch (error) {
        current = null;
        output.hidden = true;
        status.textContent = error.message;
      }
    }
    function invalidate() {
      if (!current) return;
      current = null;
      output.hidden = true;
      fallback.value = '';
      fallback.hidden = true;
      status.textContent = '條件已變更，請重新產生安排。';
    }
    form.addEventListener('submit', event => { event.preventDefault(); run(); });
    form.addEventListener('input', invalidate);
    form.addEventListener('change', invalidate);
    form.addEventListener('reset', () => {
      current = null;
      output.hidden = true;
      fallback.hidden = true;
      fallback.value = '';
      status.textContent = '已清空選擇。可用時間回到起始值，請依實際情況填寫。';
    });
    host.querySelectorAll('[data-planner-example]').forEach(button => {
      button.hidden = false;
      button.addEventListener('click', () => {
        const example = guide.planner.examples.find(item => item.key === button.dataset.plannerExample);
        if (!example) return;
        for (const [key, value] of Object.entries(example.inputs)) form.elements.namedItem(key).value = String(value);
        form.elements.namedItem('goal_note').value = example.title;
        run();
      });
    });
    host.querySelector('[data-copy-plan]').addEventListener('click', async () => {
      if (!current) return;
      const snapshot = current;
      const text = toText(guide, current);
      try {
        await navigator.clipboard.writeText(text);
        if (current === snapshot) status.textContent = '已複製完整安排，包含條件、觀察欄與調整界線。';
      } catch (_) {
        if (current !== snapshot) return;
        fallback.hidden = false;
        fallback.value = text;
        fallback.focus();
        fallback.select();
        status.textContent = '瀏覽器未允許直接複製，已顯示完整文字；請全選複製。';
      }
    });
    form.hidden = false;
  }
  return { evaluate, describe, toText, mount };
});
