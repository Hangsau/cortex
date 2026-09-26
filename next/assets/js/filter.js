/* 集合清單篩選（Claude 改寫為通用版，2026-09-26；原 W7 版只支援泳式／類別／器材三軸）。
   - 按鈕：button[data-filter=<維度>][data-value=<值>][aria-pressed]，值為空字串代表「全部」
   - 項目：li[data-<維度>]，多值以空白分隔；同一維度單選、不同維度取交集
   - 狀態寫進網址 query（?stroke=free&level=L3），載入時讀回；無 JS 時全部可見 */
(function () {
  'use strict';
  var root = document.querySelector('[data-list]');
  if (!root) return;
  var buttons = Array.prototype.slice.call(root.querySelectorAll('button[data-filter]'));
  var items = Array.prototype.slice.call(root.querySelectorAll('ol.items > li'));
  var countEl = root.querySelector('[data-count], .count-n');
  var emptyEl = root.querySelector('.empty');
  var state = {};

  function apply() {
    var shown = 0;
    items.forEach(function (li) {
      var ok = Object.keys(state).every(function (dim) {
        var want = state[dim];
        if (!want) return true;
        return (li.getAttribute('data-' + dim) || '').split(/\s+/).indexOf(want) !== -1;
      });
      li.hidden = !ok;
      if (ok) shown++;
    });
    if (countEl) countEl.textContent = shown;
    if (emptyEl) emptyEl.hidden = shown !== 0;
    buttons.forEach(function (b) {
      var dim = b.getAttribute('data-filter');
      b.setAttribute('aria-pressed', String((state[dim] || '') === (b.getAttribute('data-value') || '')));
    });
    var q = new URLSearchParams();
    Object.keys(state).forEach(function (k) { if (state[k]) q.set(k, state[k]); });
    var qs = q.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    var more = root.querySelector('details.more-filters');
    if (more) {
      var n = Array.prototype.filter.call(more.querySelectorAll('button[data-filter]'), function (b) {
        return b.getAttribute('aria-pressed') === 'true' && b.getAttribute('data-value');
      }).length;
      var badge = more.querySelector('[data-more-count]');
      if (badge) badge.textContent = n ? '（已選 ' + n + '）' : '';
    }
  }

  buttons.forEach(function (b) {
    var dim = b.getAttribute('data-filter');
    if (!(dim in state)) state[dim] = '';
    b.addEventListener('click', function () {
      state[dim] = b.getAttribute('data-value') || '';
      apply();
    });
  });
  var params = new URLSearchParams(location.search);
  Object.keys(state).forEach(function (dim) {
    var v = params.get(dim);
    if (v && buttons.some(function (b) { return b.getAttribute('data-filter') === dim && b.getAttribute('data-value') === v; })) {
      state[dim] = v;
      var more = root.querySelector('details.more-filters');
      if (more && more.querySelector('button[data-filter="' + dim + '"]')) more.open = true;
    }
  });
  apply();
})();
