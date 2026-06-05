(function () {
  if (typeof STROKES === 'undefined' || !Array.isArray(STROKES)) return;

  let curStroke = null, curMove = null;

  const $ = id => document.getElementById(id);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // drill chip：名稱對得上 drill DB 就連過去，對不上退回純文字 chip
  function drillChip(name) {
    const ids = (typeof DRILL_IDS !== 'undefined') ? DRILL_IDS : {};
    const id = ids[name];
    if (id && typeof DRILLS_URL !== 'undefined') {
      return '<a class="vxs-chip vxs-chip--link" href="' + esc(DRILLS_URL) + '#drill-' + encodeURIComponent(id) + '">' + esc(name) + '</a>';
    }
    return '<span class="vxs-chip">' + esc(name) + '</span>';
  }

  // 側欄泳式 tabs
  const tabs = $('vxsTabs');
  STROKES.forEach(s => {
    const b = document.createElement('button');
    b.textContent = s.name;
    b.id = 'vxs-tab-' + s.key;
    b.type = 'button';
    b.onclick = () => selectStroke(s.key);
    tabs.appendChild(b);
  });

  $('vxsOvBtn').onclick = showOverview;

  function clearViews() {
    ['vxsOverview', 'vxsWelcome', 'vxsDetail'].forEach(id => $(id).classList.add('vxs-hidden'));
  }
  function setStrokeTabActive(key) {
    document.querySelectorAll('.vxs-tabs button').forEach(b => b.classList.remove('active'));
    const t = $('vxs-tab-' + key);
    if (t) t.classList.add('active');
  }
  function setMoveActive(n) {
    document.querySelectorAll('.vxs-navlist li').forEach(li => li.classList.remove('active'));
    const li = $('vxs-nav-' + n);
    if (li) li.classList.add('active');
  }
  function closeMobileNav() {
    if (window.matchMedia('(max-width:760px)').matches) $('vxsNavbox').removeAttribute('open');
  }

  function renderRailMoves(s) {
    const nav = $('vxsNavlist');
    nav.innerHTML = '';
    if (!s) { nav.innerHTML = '<li class="vxs-rail-empty">此式整理中</li>'; return; }
    s.moves.forEach(m => {
      const li = document.createElement('li');
      li.id = 'vxs-nav-' + m.n;
      li.innerHTML = '<button type="button"><span class="vxs-num">' + m.n + '</span><span class="vxs-nm">' + m.name + '</span></button>';
      li.querySelector('button').onclick = () => openMove(m.n);
      nav.appendChild(li);
    });
  }

  function showOverview() {
    clearViews(); curStroke = null; curMove = null;
    setStrokeTabActive(''); $('vxsOvBtn').classList.add('active');
    renderRailMoves(null);
    const ov = $('vxsOverview');
    let html = '<div class="vxs-ov-title">感知地圖</div><div class="vxs-ov-sub">Perception Map · 各式 × 感知時刻</div>' +
      '<p class="vxs-ov-hint">想大概看 → 在這頁掃；想細看 → 點任一格跳進去</p>';
    STROKES.forEach(s => {
      html += '<div class="vxs-ov-stroke"><div class="vxs-ov-stroke-head">' +
        '<button class="vxs-ov-stroke-name" type="button" data-key="' + s.key + '">' + s.name + '</button>' +
        '<span class="vxs-ov-stroke-en">' + s.en + '</span></div>';
      html += '<div class="vxs-ov-grid">' + s.moves.map(m =>
        '<button class="vxs-ov-cell" type="button" data-key="' + s.key + '" data-n="' + m.n + '">' +
        '<span class="vxs-num">' + m.n + '</span>' +
        '<span><span class="vxs-nm">' + m.name + '</span><span class="vxs-one">' + (m.one || '') + '</span></span>' +
        '</button>').join('') + '</div>';
      html += '</div>';
    });
    ov.innerHTML = html;
    ov.querySelectorAll('.vxs-ov-stroke-name').forEach(b => b.onclick = () => selectStroke(b.dataset.key));
    ov.querySelectorAll('.vxs-ov-cell').forEach(b => b.onclick = () => { selectStroke(b.dataset.key); openMove(parseInt(b.dataset.n, 10)); });
    ov.classList.remove('vxs-hidden'); closeMobileNav(); window.scrollTo(0, 0);
  }

  function selectStroke(key) {
    const s = STROKES.find(x => x.key === key);
    if (!s) return;
    curStroke = key; curMove = null;
    $('vxsOvBtn').classList.remove('active'); setStrokeTabActive(key);
    renderRailMoves(s);
    clearViews();
    const w = $('vxsWelcome');
    w.innerHTML = '<div class="vxs-welcome-title">' + s.name + '</div><div class="vxs-welcome-sub">' + s.en + '</div>' +
      '<p class="vxs-premise">' + (s.premise || '') + '</p><p class="vxs-welcome-hint">← 從左邊挑一個感知時刻</p>';
    w.classList.remove('vxs-hidden'); closeMobileNav(); window.scrollTo(0, 0);
  }

  function openMove(n) {
    const s = STROKES.find(x => x.key === curStroke);
    if (!s) return;
    const m = s.moves.find(x => x.n === n);
    if (!m) return;
    curMove = n; setMoveActive(n);
    $('vxsOvBtn').classList.remove('active');
    const d = $('vxsDetail');
    let body = '';
    if (m.physical) body += '<div class="vxs-block"><p class="vxs-block-label">長什麼樣 <span class="vxs-cert">🔵</span></p><p>' + m.physical + '</p></div>';
    if (m.boundary) body += '<div class="vxs-block vxs-sticky-note"><p class="vxs-block-label"><span class="vxs-warn">⚠</span> 感知問題，還是身體限制？ <span class="vxs-cert">🔵</span></p><p>' + m.boundary + '</p></div>';
    if (m.drills && m.drills.length) body += '<div class="vxs-block"><p class="vxs-block-label">練這個動作</p><div class="vxs-chips">' + m.drills.map(drillChip).join('') + '</div></div>';
    if (m.cue_bad) body += '<div class="vxs-block"><p class="vxs-block-label">這句常見口令是錯的</p>' +
      '<div class="vxs-cue-bad"><span class="vxs-x">✗</span><span>「' + m.cue_bad + '」</span></div>' +
      (m.cue_why ? '<p class="vxs-cue-why">' + m.cue_why + '</p>' : '') +
      (m.cue_good ? '<div class="vxs-cue-good"><span class="vxs-v">✓</span><span>「' + m.cue_good + '」</span></div>' : '') + '</div>';
    if (m.lnote) body += '<div class="vxs-block"><p class="vxs-block-label">在發展序列上的位置</p><p><span class="vxs-ldot">●</span> ' + m.lnote + '</p></div>';

    const prev = s.moves[n - 2], next = s.moves[n];
    const pn = '<div class="vxs-prevnext">' +
      (prev ? '<button type="button" data-n="' + prev.n + '"><span class="vxs-pn-dir">← 上一個</span><span class="vxs-pn-name">' + prev.name + '</span></button>' : '<span></span>') +
      (next ? '<button type="button" class="vxs-right" data-n="' + next.n + '"><span class="vxs-pn-dir">下一個 →</span><span class="vxs-pn-name">' + next.name + '</span></button>' : '<span></span>') + '</div>';

    d.innerHTML = '<div class="vxs-m-head"><h1 class="vxs-m-title">' + m.name + '</h1><span class="vxs-m-meta">' + s.name + ' · ' + m.n + '/' + s.moves.length + (m.l ? ' · <span class="vxs-m-l">' + m.l + '</span>' : '') + '</span></div>' + body + pn;
    d.querySelectorAll('.vxs-prevnext button').forEach(b => b.onclick = () => openMove(parseInt(b.dataset.n, 10)));
    clearViews(); d.classList.remove('vxs-hidden'); closeMobileNav(); window.scrollTo(0, 0);
  }

  // 進入頁面：落在當前泳式
  if (INIT_STROKE && STROKES.some(s => s.key === INIT_STROKE)) {
    selectStroke(INIT_STROKE);
  } else {
    showOverview();
  }
})();
