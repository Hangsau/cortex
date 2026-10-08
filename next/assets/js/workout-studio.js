/* A focused workspace over workout.js. Editing, pace rules, storage and the timer
   stay in the shared engine; this file owns navigation and presentation only. */
(() => {
  'use strict';
  const root = document.querySelector('[data-wk-studio]');
  if (!root || !root.workout) return;
  const api = root.workout, $ = s => root.querySelector(s);
  const sections = Object.fromEntries([...root.querySelectorAll(':scope > section')].map(el => [el.id, el]));
  root.querySelector('.lc-head').remove();
  root.querySelector('.wk-steps').remove();
  const sources = root.querySelector('.t-legend');
  const shell = document.createElement('div');
  shell.className = 'ws-shell';
  shell.innerHTML = `
    <header class="ws-hero">
      <div><p class="ws-eyebrow">一堂課，從一個目標開始</p><h1>今天，游得有方向。</h1><p class="ws-lead">排好節奏，帶著課表下水。</p></div>
      <div class="ws-hero-side"><span class="ws-version">排課與間歇計時</span><p data-ws-save role="status">已儲存在此瀏覽器</p></div>
    </header>
    <nav class="ws-tabs" role="tablist" aria-label="排課工作台">
      <button id="ws-tab-pace" role="tab" aria-controls="ws-panel-pace" aria-selected="true" data-ws-tab="pace"><span>01</span> 成績與建議</button>
      <button id="ws-tab-plan" role="tab" aria-controls="ws-panel-plan" aria-selected="false" tabindex="-1" data-ws-tab="plan"><span>02</span> 排課</button>
      <button id="ws-tab-library" role="tab" aria-controls="ws-panel-library" aria-selected="false" tabindex="-1" data-ws-tab="library"><span>03</span> 練習庫</button>
      <button id="ws-tab-review" role="tab" aria-controls="ws-panel-review" aria-selected="false" tabindex="-1" data-ws-tab="review"><span>04</span> 課表與說明</button>
    </nav>
    <div class="ws-layout">
      <div class="ws-panels">
        <section id="ws-panel-pace" role="tabpanel" aria-labelledby="ws-tab-pace" tabindex="0"><div class="ws-intro"><div><h2 data-ws-pace-title>今天想練什麼？</h2><p data-ws-pace-intro>依目的選主課，或依賽事安排一週。填入成績後，就能帶出配速。</p></div></div>
          <div class="ws-training-modes" role="group" aria-label="訓練對象"><button type="button" class="wk-btn" data-ws-mode="personal" aria-pressed="true">個人訓練</button><button type="button" class="wk-btn" data-ws-mode="group" aria-pressed="false">團體訓練</button></div>
          <div data-ws-mode-panel="personal"><div data-ws-slot="pace"></div></div><div data-ws-mode-panel="group" hidden><div data-ws-slot="group"></div></div>
        </section>
        <section id="ws-panel-plan" role="tabpanel" aria-labelledby="ws-tab-plan" tabindex="0" hidden>
          <div class="ws-intro"><div><h2>今天的課表</h2><p>從暖身到緩和，把每一段排成自己的節奏。</p></div><div class="ws-entry-actions"><button class="ws-quiet" type="button" data-ws-recommend>依目的選主課 ↗</button><button class="ws-quiet" type="button" data-ws-lane>多人共用水道 ↗</button><button class="ws-quiet" type="button" data-ws-sample>試用示範課表 ↗</button></div></div>
          <p class="ws-copy-note" data-ws-import></p><div data-ws-slot="plan"></div>
        </section>
        <section id="ws-panel-library" role="tabpanel" aria-labelledby="ws-tab-library" tabindex="0" hidden><div class="ws-intro"><div><h2>你的練習工具箱</h2><p>收好常用的練習、器材與組型，下次直接拿來用。</p></div></div><div data-ws-slot="library"></div></section>
        <section id="ws-panel-review" role="tabpanel" aria-labelledby="ws-tab-review" tabindex="0" hidden><div class="ws-intro"><div><h2>把這堂課帶到池邊</h2><p>確認安排，列印或分享，也替訓練留下目的。</p></div></div><div data-ws-slot="review"></div>
          <section class="ws-brief"><p class="ws-eyebrow">課表說明</p><h3>知道為什麼，也知道怎麼調整。</h3><p data-ws-goal-text></p>
            <div class="ws-brief-grid"><div><b>訓練目的</b><p>這堂課想改善什麼？每一段如何接上目標？</p></div><div><b>安排理由與優點</b><p>為什麼選這個順序、距離、趟數與休息？哪些仍需確認？</p></div><div><b>調整條件</b><p>哪些表現值得觀察？什麼情況下該縮短、放慢或改課？</p></div></div>
            <p class="ws-muted">先把課表與目標複製給你慣用的 AI，請它整理以上內容。目前這裡不會自動呼叫 AI。</p>
            <div class="ws-brief-actions"><button type="button" class="wk-btn wk-btn--main" data-ws-ai>複製給 AI</button><button type="button" class="wk-btn" data-ws-export>下載課表資料</button></div>
            <p data-ws-export-status role="status"></p>
          </section>
        </section>
      </div>
      <aside class="ws-aside" aria-label="課表總覽">
        <section class="ws-overview"><p class="ws-eyebrow">這一堂的全貌</p><p class="ws-distance"><strong data-ws-distance>0</strong><span>m</span></p>
          <div class="ws-stat-pair"><div><b data-ws-minutes>0</b><span>預估分鐘</span></div><div><b data-ws-count>0</b><span>訓練項目</span></div></div>
          <svg class="ws-volume" viewBox="0 0 300 12" role="img" aria-label="各段距離比例" data-ws-volume></svg><ol class="ws-block-totals" data-ws-block-totals></ol>
          <p class="ws-estimate">時間依目標與休息估算；沒有目標的項目使用估計配速。</p>
        </section>
        <section class="ws-intent"><label for="ws-intent">這堂課想練什麼？</label><textarea id="ws-intent" rows="3" maxlength="2000" placeholder="例如：累的時候，仍能維持每一下划水的品質。" data-ws-intent></textarea><p>留下目標，排課與回顧都更有方向。</p></section>
        <p class="ws-local-note">課表存在這台裝置的瀏覽器；用分享連結帶到其他裝置。</p>
      </aside>
    </div>
    <footer class="ws-bottom"><div><strong data-ws-bottom-distance>0 m</strong><span data-ws-bottom-time>還沒有訓練項目</span></div><div class="ws-bottom-actions"><button type="button" class="ws-preview" data-ws-preview>預覽課表</button><button type="button" class="ws-start" data-ws-start>開始計時 <span aria-hidden="true">↗</span></button></div></footer>
    <dialog class="ws-copy-dialog" data-ws-copy-dialog><h2>課表與 AI 提問</h2><p>選取下方內容，複製後貼到你慣用的 AI。</p><textarea readonly aria-label="給 AI 的課表內容" data-ws-copy-text></textarea><button type="button" class="wk-btn" data-ws-copy-close>關閉</button></dialog>`;
  root.prepend(shell);
  const attach = (id, panel, title) => {
    const el = sections[id];
    if (title) el.querySelector('h2').textContent = title;
    $(`[data-ws-slot="${panel}"]`).appendChild(el);
  };
  attach('wk-menu', 'plan', '編排課表');
  attach('wk-goals', 'pace', '依訓練目的選主課');
  attach('wk-lane', 'group', '團體成績與主課');
  attach('wk-pb', 'pace', '個人成績');
  attach('wk-css', 'pace', 'CSS 與有氧配速');
  attach('wk-pz', 'pace', '依賽事日期安排一週');
  attach('wk-sprint', 'pace', '衝刺換算');
  attach('wk-mine', 'library', '我的 drill 與器材');
  attach('wk-sum', 'review', '課表清單');
  const nameField = $('.wk-menubar .wk-grow'); nameField.hidden = true;
  const rename = document.createElement('button'); rename.type = 'button'; rename.className = 'ws-rename'; rename.dataset.wsRename = ''; rename.textContent = '重新命名'; rename.setAttribute('aria-expanded', 'false');
  $('.wk-menubar').insertBefore(rename, nameField);
  const sourceDetails = document.createElement('details');
  sourceDetails.className = 'ws-sources';
  sourceDetails.innerHTML = '<summary>查看計算依據與資料保存方式</summary>';
  sourceDetails.append(sources); $('[data-ws-mode-panel="personal"]').append(sourceDetails);
  let active = 'pace', trainingMode = 'personal', lastCount = api.snapshot().count, dragged = null;
  function saveStatus() {
    const saved = api.snapshot().saved, group = active === 'pace' && trainingMode === 'group';
    $('[data-ws-save]').textContent = group ? '團體名單僅保留於本次頁面' : saved ? '已儲存在此瀏覽器' : '目前無法儲存，請先下載課表';
    $('[data-ws-save]').classList.toggle('is-error', !group && !saved);
  }
  function showMode(mode) {
    if (!['personal', 'group'].includes(mode)) return;
    trainingMode = mode;
    root.querySelectorAll('[data-ws-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.wsMode === mode)));
    root.querySelectorAll('[data-ws-mode-panel]').forEach(panel => { panel.hidden = panel.dataset.wsModePanel !== mode; });
    root.classList.toggle('ws-group-mode', active === 'pace' && mode === 'group');
    $('[data-ws-pace-title]').textContent = mode === 'group' ? '一起練，各有適合的配速。' : '今天想練什麼？';
    $('[data-ws-pace-intro]').textContent = mode === 'group' ? '選主課、填每人的成績，再決定固定休息或共同包干。' : '依目的選主課，或依賽事安排一週。填入成績後，就能帶出配速。';
    saveStatus();
  }
  function showTab(name, focus = false) {
    if (!$(`[data-ws-tab="${name}"]`)) return;
    active = name;
    root.querySelectorAll('[data-ws-tab]').forEach(btn => { const on = btn.dataset.wsTab === name; btn.setAttribute('aria-selected', String(on)); btn.tabIndex = on ? 0 : -1; });
    root.querySelectorAll('.ws-panels > section').forEach(el => { el.hidden = el.id !== 'ws-panel-' + name; });
    root.classList.toggle('ws-group-mode', name === 'pace' && trainingMode === 'group');
    saveStatus();
    if (focus) $('#ws-tab-' + name).focus();
  }
  $('.ws-tabs').addEventListener('keydown', e => {
    const tabs = [...root.querySelectorAll('[data-ws-tab]')], current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    const index = e.key === 'ArrowRight' ? (current + 1) % tabs.length : e.key === 'ArrowLeft' ? (current + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
    if (index >= 0) { e.preventDefault(); showTab(tabs[index].dataset.wsTab, true); }
  });
  function update() {
    const s = api.snapshot(), nf = n => n.toLocaleString('zh-TW');
    if (s.count !== lastCount && active === 'pace') showTab('plan');
    lastCount = s.count;
    $('[data-ws-distance]').textContent = nf(s.distance);
    $('[data-ws-minutes]').textContent = Math.round(s.seconds / 60);
    $('[data-ws-count]').textContent = s.count;
    $('[data-ws-bottom-distance]').textContent = nf(s.distance) + ' m';
    $('[data-ws-bottom-time]').textContent = s.count ? `${s.count} 個項目 · 約 ${Math.round(s.seconds / 60)} 分鐘` : '從一個訓練項目開始';
    $('[data-ws-start]').disabled = !s.count;
    $('[data-ws-ai]').disabled = !s.count;
    $('[data-ws-export]').disabled = !s.count;
    saveStatus();
    $('[data-ws-import]').textContent = s.imported ? '已保留原版與試用版課表；可從課表選單切換。' : '';
    if (document.activeElement !== $('[data-ws-intent]')) $('[data-ws-intent]').value = s.menu.intent || '';
    $('[data-ws-goal-text]').textContent = s.menu.intent || '還沒寫下這堂課的目標。可以先在「這堂課想練什麼？」記下一句話。';
    const list = $('[data-ws-block-totals]'), svg = $('[data-ws-volume]');
    list.replaceChildren(); svg.replaceChildren();
    let start = 0;
    s.blocks.forEach((b, i) => {
      const item = document.createElement('li'); item.className = 'ws-tone-' + i % 4;
      const title = document.createElement('span'); title.textContent = b.title || '未命名';
      const dist = document.createElement('b'); dist.textContent = nf(b.distance) + ' m'; item.append(title, dist); list.append(item);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const width = s.distance ? b.distance / s.distance * 300 : 300 / Math.max(1, s.blocks.length);
      rect.setAttribute('x', start); rect.setAttribute('width', width); rect.setAttribute('height', 12); rect.setAttribute('class', 'ws-tone-' + i % 4);
      svg.append(rect); start += width;
    });
  }
  function closeEditor() {
    const dialog = $('[data-ws-editor]');
    if (!dialog) return;
    const editing = !!dialog.querySelector('.wk-r--edit');
    dialog.close();
    if (editing) api.finishEdit();
    const target = $('[data-ws-add]') || $('[data-wk-mname]'); if (target) target.focus();
  }
  function openComposer(bi) {
    showTab('plan'); api.add(bi);
    const dialog = $('[data-ws-editor]');
    if (dialog && !dialog.open) dialog.showModal();
  }
  function enhance() {
    const blocks = $('[data-wk-blocks]');
    const compose = blocks.querySelector('[data-wk-compose]'), edit = blocks.querySelector('.wk-r--edit');
    const dialog = document.createElement('dialog'); dialog.className = 'ws-editor'; dialog.dataset.wsEditor = '';
    dialog.setAttribute('aria-labelledby', 'ws-editor-title');
    dialog.innerHTML = `<header class="ws-editor-head"><div><p class="ws-eyebrow">訓練項目</p><h2 id="ws-editor-title">${edit ? '調整這個項目' : '加入一個項目'}</h2></div><button type="button" data-ws-close aria-label="關閉項目編輯">×</button></header>`;
    if (edit) {
      const placeholder = document.createElement('li'); placeholder.className = 'ws-editing-placeholder'; placeholder.textContent = '正在調整這個項目…'; edit.before(placeholder);
      const list = document.createElement('ol'); list.className = 'wk-rows'; list.append(edit); dialog.append(list);
      compose.hidden = true;
    } else dialog.append(compose);
    blocks.append(dialog);
    dialog.addEventListener('cancel', e => { e.preventDefault(); closeEditor(); });
    if (edit) dialog.showModal();
    blocks.querySelectorAll('.wk-blk').forEach((block, bi) => {
      const badge = document.createElement('span'); badge.className = 'ws-block-index ws-tone-' + bi % 4; badge.textContent = String(bi + 1).padStart(2, '0'); block.querySelector('.wk-blk-h').prepend(badge);
      const actions = block.querySelector('.wk-blk-h > .wk-r-act'), more = document.createElement('details');
      more.className = 'ws-options'; more.innerHTML = '<summary aria-label="段落操作">•••</summary><div class="ws-options-panel"></div>'; more.querySelector('div').append(actions); block.querySelector('.wk-blk-h').append(more);
      const add = document.createElement('button'); add.type = 'button'; add.className = 'ws-add'; add.dataset.wsAdd = bi;
      add.innerHTML = '＋<span class="ws-add-label"> 新增項目</span>'; add.setAttribute('aria-label', '在這一段新增項目');
      more.before(add); more.querySelector('.ws-options-panel').append(block.querySelector('.wk-ins'));
    });
    blocks.querySelectorAll('.wk-r--sum').forEach(li => {
      li.setAttribute('data-ws-draggable', '');
      const handle = document.createElement('button'); handle.className = 'ws-drag'; handle.type = 'button'; handle.draggable = true; handle.textContent = '⠿'; handle.setAttribute('aria-label', '拖曳排序；也可使用上下移按鈕');
      li.prepend(handle);
      const actions = li.querySelector('.wk-r-act');
      ['down', 'up'].forEach(act => { const btn = document.createElement('button'); btn.type = 'button'; btn.dataset.act = act; btn.className = 'ws-move'; btn.textContent = act === 'up' ? '↑' : '↓'; btn.setAttribute('aria-label', act === 'up' ? '項目往上移' : '項目往下移'); actions.prepend(btn); });
    });
  }
  root.addEventListener('workout:change', update);
  root.addEventListener('workout:recommendation-added', () => showTab('plan'));
  root.addEventListener('workout:group-requested', () => { showTab('pace'); showMode('group'); });
  root.addEventListener('workout:render', enhance);
  root.addEventListener('workout:saved', saveStatus);
  $('[data-ws-intent]').addEventListener('input', e => { api.setIntent(e.target.value); $('[data-ws-goal-text]').textContent = e.target.value; });
  root.addEventListener('click', async e => {
    const btn = e.target.closest('button'); if (!btn) return;
    if (btn.dataset.wsTab) showTab(btn.dataset.wsTab);
    else if (btn.dataset.wsMode) showMode(btn.dataset.wsMode);
    else if (btn.hasAttribute('data-ws-rename')) { nameField.hidden = !nameField.hidden; btn.setAttribute('aria-expanded', String(!nameField.hidden)); btn.textContent = nameField.hidden ? '重新命名' : '收起名稱'; if (!nameField.hidden) $('[data-wk-mname]').focus(); }
    else if (btn.hasAttribute('data-ws-preview')) { showTab('review'); $('#ws-panel-review').focus(); window.scrollTo({ top: 0, behavior: 'auto' }); }
    else if (btn.hasAttribute('data-ws-start')) $('[data-wk-start]').click();
    else if (btn.hasAttribute('data-ws-add')) openComposer(+btn.dataset.wsAdd);
    else if (btn.hasAttribute('data-ws-close')) closeEditor();
    else if (btn.hasAttribute('data-ws-sample')) { api.sample(); showTab('plan'); }
    else if (btn.hasAttribute('data-ws-recommend')) { showTab('pace'); showMode('personal'); $('#wk-goals').focus(); $('#wk-goals').scrollIntoView(); }
    else if (btn.hasAttribute('data-ws-lane')) { showTab('pace'); showMode('group'); $('#wk-lane').focus(); $('#wk-lane').scrollIntoView(); }
    else if (btn.hasAttribute('data-ws-ai')) {
      const prompt = `請根據以下游泳課表與使用者目標，以繁體中文整理：\n1. 這堂課的目的與各段的角色。\n2. 順序、距離、趟數、配速與休息的安排理由。\n3. 預期優點、適用條件及可能的取捨；不要保證效果。\n4. 需要觀察的指標與調整／退出條件。\n5. 缺少的資訊與需要先問的問題。\n\n請區分「課表已知事實」、「所附規則的內容」與「你的推論」。不要虛構研究、來源或使用者狀況。沒有目標秒數的項目不要自行補出配速。逐趟變化、分段休息、組間休息與項目間休息是不同設定；rowRest=null 沿用每趟設定，0 直接接下一項，整堂最後不再休息。若安排無法支持目標，直接指出；不要為每份課表硬找優點。所有修改先提出建議，不要把原課表改寫成已確認的處方。\n\n${JSON.stringify(api.brief(), null, 2)}`;
      try { await navigator.clipboard.writeText(prompt); $('[data-ws-export-status]').textContent = '已複製課表與提問，可以貼到你慣用的 AI。'; }
      catch (_) { $('[data-ws-copy-text]').value = prompt; $('[data-ws-copy-dialog]').showModal(); $('[data-ws-copy-text]').select(); }
    } else if (btn.hasAttribute('data-ws-copy-close')) $('[data-ws-copy-dialog]').close();
    else if (btn.hasAttribute('data-ws-export')) {
      const link = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(api.brief(), null, 2)], { type: 'application/json' }));
      link.href = url; link.download = 'vortex-workout.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('[data-ws-export-status]').textContent = '已下載課表資料，可保存或交給其他工具使用。';
    }
  });
  root.addEventListener('dragstart', e => {
    const handle = e.target.closest('.ws-drag'), li = handle && handle.closest('[data-ws-draggable]'); if (!li) return;
    dragged = { b: +li.dataset.b, r: +li.dataset.r }; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', JSON.stringify(dragged)); li.classList.add('is-dragging');
  });
  root.addEventListener('dragover', e => { if (dragged && e.target.closest('.wk-blk')) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } });
  root.addEventListener('drop', e => {
    const block = e.target.closest('.wk-blk'); if (!dragged || !block) return;
    e.preventDefault(); const li = e.target.closest('[data-ws-draggable]'), bi = +block.dataset.b;
    const dest = li ? +li.dataset.r + (e.clientY > li.getBoundingClientRect().top + li.offsetHeight / 2 ? 1 : 0) : api.snapshot().menu.blocks[bi].rows.length;
    api.moveRow(dragged.b, dragged.r, bi, dest); dragged = null;
  });
  root.addEventListener('dragend', () => { dragged = null; root.querySelectorAll('.is-dragging').forEach(el => el.classList.remove('is-dragging')); });
  function followHash() {
    const groups = { 'wk-menu': 'plan', 'wk-goals': 'pace', 'wk-lane': 'pace', 'wk-lane-help': 'pace', 'wk-pb': 'pace', 'wk-css': 'pace', 'wk-pz': 'pace', 'wk-sprint': 'pace', 'wk-mine': 'library', 'wk-sum': 'review' };
    const hash = location.hash.slice(1), target = groups[hash];
    if (target) { showTab(target); if (target === 'pace') showMode(['wk-lane', 'wk-lane-help'].includes(hash) ? 'group' : 'personal'); }
  }
  window.addEventListener('hashchange', followHash);
  update(); enhance(); followHash(); root.classList.add('ws-ready');
})();
