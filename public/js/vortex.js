/* vortex.js — 泳式頁 master-detail 互動
 * 全部操作 server 端已渲染的 DOM，不含任何 inline 資料。
 * 功能：面板就地切換、hash 路由、上一頁可回、rail active 狀態、卡片分類篩選。
 * 無 JS 時 <noscript> 會把所有面板攤開，仍可閱讀。
 */
(function () {
  'use strict';

  var root = document.querySelector('.vx-stroke-wrap');
  if (!root) return;

  var panels = Array.prototype.slice.call(root.querySelectorAll('.vx-panel'));
  var navlinks = Array.prototype.slice.call(root.querySelectorAll('[data-target]'));
  if (!panels.length) return;

  var order = panels.map(function (p) { return p.id; });

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
  }

  // rail 連結 / 概覽路徑卡 / 上一動作 下一動作
  navlinks.forEach(function (n) {
    n.addEventListener('click', function (e) {
      e.preventDefault();
      var id = n.getAttribute('data-target');
      if (id) activate(id, true);
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
})();
