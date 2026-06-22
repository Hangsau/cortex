/* vortex.js — Vortex 各頁互動（泳式 master-detail + 資料庫 + ADM 標準）
 * 全部操作 server 端已渲染的 DOM，不含任何 inline 資料。
 * 觸發條件：
 *   - .vx-stroke-wrap     → 泳式 master-detail（面板切換、hash 路由、rail 展開、卡片篩選）
 *   - [data-vx-db]        → 跨泳式資料庫（依需求找 + 三類資料 tab + 篩選/搜尋）
 *   - [data-vx-adm-std]   → ADM 技術標準（泳式篩選 + 搜尋）
 * 無 JS 時 <noscript> 會把所有面板攤開，仍可閱讀。
 */
(function () {
  'use strict';

  // ── 共用：localStorage 讀過標記（給 vortex home 首頁 vx-toc-row 顯示小圓點）
  // 用 path 作 key，避免「technica」這類非唯一 slug 衝突
  function pagePath() {
    return location.pathname.replace(/\/$/, '') || '/';
  }
  function markRead() {
    if (!window.localStorage) return;
    try {
      var raw = localStorage.getItem('vx-read');
      var obj = raw ? JSON.parse(raw) : {};
      obj[pagePath()] = Date.now();
      localStorage.setItem('vx-read', JSON.stringify(obj));
    } catch (e) { /* localStorage 不可用就靜默 */ }
  }

  // ── 泳式頁 master-detail ──
  var root = document.querySelector('.vx-stroke-wrap');
  if (root) {
    var panels = Array.prototype.slice.call(root.querySelectorAll('.vx-panel'));
    var navlinks = Array.prototype.slice.call(root.querySelectorAll('[data-target]'));
    if (panels.length) {
      var order = panels.map(function (p) { return p.id; });

      // 密集階層側欄：當前分支展開（只在 .vx-rail--collapsible 啟用）
      var collapsibleRail = root.querySelector('.vx-rail--collapsible');
      var railThemes = collapsibleRail
        ? Array.prototype.slice.call(collapsibleRail.querySelectorAll('.vx-rail-theme'))
        : [];

      function syncRailExpand(activeId) {
        if (!railThemes.length) return;
        var activeKey = null;
        for (var i = 0; i < navlinks.length; i++) {
          if (navlinks[i].getAttribute('data-target') === activeId) {
            activeKey = navlinks[i].getAttribute('data-theme');
            break;
          }
        }
        railThemes.forEach(function (themeEl) {
          var on = themeEl.getAttribute('data-theme') === activeKey;
          themeEl.classList.toggle('is-expanded', on);
          var head = themeEl.querySelector('[data-theme-toggle]');
          if (head) head.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
      }

      function panelById(id) {
        for (var i = 0; i < panels.length; i++) {
          if (panels[i].id === id) return panels[i];
        }
        return null;
      }

      function activate(id, push) {
        var target = panelById(id) || panels[0];
        id = target.id;

        panels.forEach(function (p) { p.classList.toggle('is-active', p === target); });
        navlinks.forEach(function (n) {
          n.classList.toggle('is-active', n.getAttribute('data-target') === id);
        });
        syncRailExpand(id);

        if (push) {
          if (location.hash.slice(1) !== id) {
            history.pushState({ vx: id }, '', '#' + id);
          }
        }

        // 切面板後內容區回到頂部，避免上一面板的捲動位置殘留
        var panelsBox = root.querySelector('.vx-panels');
        if (panelsBox) {
          var top = panelsBox.getBoundingClientRect().top + window.pageYOffset - 12;
          if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'smooth' });
        }

        // 記錄「這一頁被讀過」（給首頁 vx-toc-row 顯示小圓點）
        markRead();
      }

      // rail 連結 / 概覽路徑卡 / 上一動作 下一動作
      navlinks.forEach(function (n) {
        n.addEventListener('click', function (e) {
          e.preventDefault();
          var id = n.getAttribute('data-target');
          if (id) activate(id, true);
        });
      });

      // 主題標題：點一下展開／收合該主題（讓使用者先看概念再選），不切換面板
      railThemes.forEach(function (themeEl) {
        var head = themeEl.querySelector('[data-theme-toggle]');
        if (!head) return;
        head.addEventListener('click', function () {
          var on = themeEl.classList.toggle('is-expanded');
          head.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
      });

      // 上一頁 / 下一頁瀏覽器按鈕
      window.addEventListener('popstate', function () {
        var id = location.hash.slice(1);
        if (id) activate(id, false);
        else activate(order[0], false);
      });

      // 初始：依 hash 開對應面板，否則開概覽
      var initial = location.hash.slice(1);
      activate(initial && panelById(initial) ? initial : order[0], false);

      // ── 卡片分類篩選（誤區 / 深入機制 面板） ──
      root.querySelectorAll('.vx-filters').forEach(function (bar) {
        var scope = bar.closest('.vx-panel');
        if (!scope) return;
        var cards = Array.prototype.slice.call(scope.querySelectorAll('.vx-card'));
        var chips = Array.prototype.slice.call(bar.querySelectorAll('.vx-chip'));

        chips.forEach(function (chip) {
          chip.addEventListener('click', function () {
            var cat = chip.getAttribute('data-cat');
            chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
            cards.forEach(function (card) {
              var show = cat === 'all' || card.getAttribute('data-cat') === cat;
              card.classList.toggle('is-hidden', !show);
            });
          });
        });
      });

      // ── 練習庫多軸篩選（環節 × 水感階段，AND 組合） ──
      root.querySelectorAll('.vx-drill-filters').forEach(function (wrap) {
        var scope = wrap.closest('.vx-panel');
        if (!scope) return;
        var cards = Array.prototype.slice.call(scope.querySelectorAll('.vx-drillcard'));
        var bars = Array.prototype.slice.call(wrap.querySelectorAll('.vx-filterbar'));
        var active = {};
        bars.forEach(function (bar) { active[bar.getAttribute('data-axis')] = 'all'; });

        function apply() {
          cards.forEach(function (card) {
            var show = true;
            bars.forEach(function (bar) {
              var axis = bar.getAttribute('data-axis');
              var val = active[axis];
              if (val === 'all') return;
              var cardVal = card.getAttribute('data-' + axis) || '';
              if (cardVal.split(' ').indexOf(val) === -1) show = false;
            });
            card.classList.toggle('is-hidden', !show);
          });
        }

        bars.forEach(function (bar) {
          var axis = bar.getAttribute('data-axis');
          var chips = Array.prototype.slice.call(bar.querySelectorAll('.vx-chip'));
          chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
              active[axis] = chip.getAttribute('data-val');
              chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
              apply();
            });
          });
        });
      });
    }
  }

  // ── 跨泳式資料庫（database 頁）：依需求找 + 三類資料 tab + 篩選/搜尋 ──
  var db = document.querySelector('[data-vx-db]');
  if (db) {
    // Zone 1：依需求找練習（環節 × 階段 × 泳式，AND 組合）
    var needs = document.getElementById('vxNeeds');
    if (needs) {
      var needsBars = Array.prototype.slice.call(needs.querySelectorAll('.vx-filterbar'));
      var needsCards = Array.prototype.slice.call(needs.querySelectorAll('.vx-drillcard'));
      var countEl = document.getElementById('vxNeedsCount');
      var needsActive = {};
      needsBars.forEach(function (bar) { needsActive[bar.getAttribute('data-axis')] = 'all'; });

      function applyNeeds() {
        var shown = 0;
        needsCards.forEach(function (card) {
          var show = true;
          needsBars.forEach(function (bar) {
            var axis = bar.getAttribute('data-axis');
            var val = needsActive[axis];
            if (val === 'all') return;
            var cd = (card.getAttribute('data-' + axis) || '').split(' ');
            if (cd.indexOf(val) === -1) show = false;
          });
          card.classList.toggle('is-hidden', !show);
          if (show) shown++;
        });
        if (countEl) countEl.textContent = '共 ' + shown + ' 個練習';
      }

      needsBars.forEach(function (bar) {
        var axis = bar.getAttribute('data-axis');
        var chips = Array.prototype.slice.call(bar.querySelectorAll('.vx-chip'));
        chips.forEach(function (chip) {
          chip.addEventListener('click', function () {
            needsActive[axis] = chip.getAttribute('data-val');
            chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
            applyNeeds();
          });
        });
      });
      applyNeeds();
    }

    // Zone 2：三類資料 tab + 泳式篩選 + 搜尋
    var tabs = document.getElementById('vxdbTabs');
    var dbInput = document.getElementById('vxdbInput');
    if (tabs && dbInput) {
      var dbPanels = Array.prototype.slice.call(document.querySelectorAll('.vx-db-panel'));
      var tabBtns = Array.prototype.slice.call(tabs.querySelectorAll('.vx-db-tab'));

      function activePanel() { return document.querySelector('.vx-db-panel.is-active'); }

      function applyDbFilters() {
        var panel = activePanel(); if (!panel) return;
        var sChip = panel.querySelector('.vx-chip.is-active');
        var s = sChip ? sChip.getAttribute('data-s') : 'all';
        var q = (dbInput.value || '').trim().toLowerCase();
        panel.querySelectorAll('.vx-card').forEach(function (card) {
          var sd = (card.getAttribute('data-s') || '').split(' ');
          var okS = s === 'all' || sd.indexOf(s) !== -1 || sd.indexOf('common') !== -1;
          var okQ = !q || (card.getAttribute('data-text') || '').indexOf(q) !== -1;
          card.classList.toggle('is-hidden', !(okS && okQ));
        });
      }

      tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-tab');
          tabBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
          dbPanels.forEach(function (p) { p.classList.toggle('is-active', p.id === 'db-' + id); });
          applyDbFilters();
        });
      });

      document.querySelectorAll('.vx-db-panel .vx-filters').forEach(function (bar) {
        bar.addEventListener('click', function (e) {
          var chip = e.target.closest('.vx-chip'); if (!chip) return;
          bar.querySelectorAll('.vx-chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
          applyDbFilters();
        });
      });

      var t;
      dbInput.addEventListener('input', function () { clearTimeout(t); t = setTimeout(applyDbFilters, 110); });
    }

    // database 頁有兩個 zone（依需求找 + 三類資料），都讀過才有意義
    markRead();
  }

  // ── 查資料頁（全站撈取）：選類型 → 選泳式 → 搜尋，預設空白不堆一頁 ──
  var find = document.querySelector('[data-vx-find]');
  if (find) {
    var typeBar = find.querySelector('[data-axis="type"]');
    var sBar = find.querySelector('[data-axis="s"]');
    var catBar = document.getElementById('vxFindCatBar');
    var catChips = document.getElementById('vxFindCatChips');
    var fInput = document.getElementById('vxFindInput');
    var fResults = document.getElementById('vxFindResults');
    var fCount = document.getElementById('vxFindCount');
    var fEmpty = document.getElementById('vxFindEmpty');
    var fCards = Array.prototype.slice.call(fResults.querySelectorAll('.vx-find-card'));
    var fType = null;
    var fS = 'all';
    var fCat = 'all';
    var fT;

    function passTSQ(card, q) {
      if (card.getAttribute('data-type') !== fType) return false;
      var sd = (card.getAttribute('data-s') || '').split(' ');
      var okS = fS === 'all' || sd.indexOf(fS) !== -1 || sd.indexOf('common') !== -1;
      if (!okS) return false;
      return !q || (card.getAttribute('data-text') || '').indexOf(q) !== -1;
    }

    // 選定類型後，依當前泳式撈出該類型底下的「次分類」，動態生成 ③ chip
    function buildCats() {
      fCat = 'all';
      if (!fType) { catBar.hidden = true; catChips.innerHTML = ''; return; }
      var q = (fInput.value || '').trim().toLowerCase();
      var seen = {}, order = [];
      fCards.forEach(function (card) {
        if (!passTSQ(card, q)) return;
        var c = card.getAttribute('data-cat') || '';
        if (c && !seen[c]) { seen[c] = true; order.push({ c: c, l: card.getAttribute('data-catlabel') || c }); }
      });
      if (order.length < 2) { catBar.hidden = true; catChips.innerHTML = ''; return; }
      var html = '<button class="vx-chip is-active" type="button" data-val="all">全部</button>';
      order.forEach(function (o) {
        html += '<button class="vx-chip" type="button" data-val="' + o.c.replace(/"/g, '') + '">' + o.l + '</button>';
      });
      catChips.innerHTML = html;
      catBar.hidden = false;
    }

    function applyFind() {
      var q = (fInput.value || '').trim().toLowerCase();
      var hasSel = fType || q;
      fEmpty.hidden = !!hasSel;
      fResults.hidden = !hasSel;
      if (!hasSel) { fCount.hidden = true; return; }
      var shown = 0;
      fCards.forEach(function (card) {
        var okType = !fType || card.getAttribute('data-type') === fType;
        var sd = (card.getAttribute('data-s') || '').split(' ');
        var okS = fS === 'all' || sd.indexOf(fS) !== -1 || sd.indexOf('common') !== -1;
        var okCat = fCat === 'all' || (card.getAttribute('data-cat') || '') === fCat;
        var okQ = !q || (card.getAttribute('data-text') || '').indexOf(q) !== -1;
        var show = okType && okS && okCat && okQ;
        card.classList.toggle('is-hidden', !show);
        if (show) shown++;
      });
      fCount.hidden = false;
      fCount.textContent = '撈出 ' + shown + ' 筆' + (fType ? '' : '（跨全站）');
    }

    typeBar.querySelectorAll('.vx-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var v = chip.getAttribute('data-val');
        if (fType === v) { fType = null; chip.classList.remove('is-active'); }
        else {
          fType = v;
          typeBar.querySelectorAll('.vx-chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        }
        buildCats();
        applyFind();
      });
    });

    sBar.querySelectorAll('.vx-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        fS = chip.getAttribute('data-val');
        sBar.querySelectorAll('.vx-chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        buildCats();
        applyFind();
      });
    });

    // ③ 細分 chip 是動態生成的，用事件委派
    catBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.vx-chip'); if (!chip) return;
      fCat = chip.getAttribute('data-val');
      catChips.querySelectorAll('.vx-chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      applyFind();
    });

    fInput.addEventListener('input', function () { clearTimeout(fT); fT = setTimeout(applyFind, 110); });
    applyFind();
    markRead();
  }

  // ── ADM 技術標準頁：泳式篩選 + 搜尋 ──
  var admStd = document.querySelector('[data-vx-adm-std]');
  if (admStd) {
    var stdPanel = document.getElementById('adm-std');
    var stdInput = document.getElementById('vxAdmInput');
    if (stdPanel && stdInput) {
      var stdBar = stdPanel.querySelector('.vx-filters');
      function applyStdFilters() {
        var sChip = stdBar.querySelector('.vx-chip.is-active');
        var s = sChip ? sChip.getAttribute('data-s') : 'all';
        var q = (stdInput.value || '').trim().toLowerCase();
        stdPanel.querySelectorAll('.vx-card').forEach(function (card) {
          var sd = card.getAttribute('data-s') || '';
          var okS = s === 'all' || sd === s;
          var okQ = !q || (card.getAttribute('data-text') || '').indexOf(q) !== -1;
          card.classList.toggle('is-hidden', !(okS && okQ));
        });
      }
      stdBar.addEventListener('click', function (e) {
        var chip = e.target.closest('.vx-chip'); if (!chip) return;
        stdBar.querySelectorAll('.vx-chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        applyStdFilters();
      });
      var t2;
      stdInput.addEventListener('input', function () { clearTimeout(t2); t2 = setTimeout(applyStdFilters, 110); });
    }
  }

  // ── READ 模式（一條讀下來）：頂部進度條 + 脊椎當前章高亮 ──
  var readRoot = document.querySelector('.vx-read');
  if (readRoot) {
    var bar = document.querySelector('#vxReadProgress span');
    var article = readRoot.querySelector('.vx-read-article');

    // 進度條：依文章捲動百分比填寬
    function updateProgress() {
      if (!bar || !article) return;
      var rect = article.getBoundingClientRect();
      var total = article.offsetHeight - window.innerHeight;
      var scrolled = -rect.top;
      var pct = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      bar.style.width = (pct * 100).toFixed(1) + '%';
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { updateProgress(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    // 脊椎高亮：IntersectionObserver 找當前可見章節
    var spyLinks = Array.prototype.slice.call(
      readRoot.querySelectorAll('.vx-read-toc a[data-spy]')
    );
    if (spyLinks.length && 'IntersectionObserver' in window) {
      var linkFor = {};
      spyLinks.forEach(function (a) { linkFor[a.getAttribute('data-spy')] = a; });
      var visible = {};

      function highlight() {
        var current = null, top = Infinity;
        Object.keys(visible).forEach(function (id) {
          if (visible[id] != null && visible[id] < top) { top = visible[id]; current = id; }
        });
        spyLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('data-spy') === current);
        });
      }

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var id = e.target.id;
          if (e.isIntersecting) visible[id] = e.boundingClientRect.top;
          else delete visible[id];
        });
        highlight();
      }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

      spyLinks.forEach(function (a) {
        var sec = document.getElementById(a.getAttribute('data-spy'));
        if (sec) io.observe(sec);
      });
    }

    markRead();
  }
})();