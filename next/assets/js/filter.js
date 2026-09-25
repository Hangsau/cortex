// Cortex next — list 集合清單頁篩選（W7）。defer 載入，無相依。
(function () {
  var articles = document.querySelectorAll('article[data-list]');
  if (!articles.length) return;

  articles.forEach(function (article) {
    var list = article.querySelector('ol.items');
    var empty = article.querySelector('.empty');
    var countEl = article.querySelector('.count-n');
    var buttons = article.querySelectorAll('.filters button[data-filter]');
    if (!list || !buttons.length) return;

    var items = list.querySelectorAll('li');

    // 從 URL 讀初始狀態
    var params = new URLSearchParams(window.location.search);
    var state = { stroke: '', category: '', equip: '' };

    buttons.forEach(function (btn) {
      var dim = btn.getAttribute('data-filter');
      var val = btn.getAttribute('data-value') || '';
      if (!Object.prototype.hasOwnProperty.call(state, dim)) return;
      if (params.has(dim)) {
        var p = params.get(dim);
        if (p === val) {
          // 命中；把該按鈕設為按下、組內其他取消
          buttons.forEach(function (other) {
            if (other.getAttribute('data-filter') === dim) {
              other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
            }
          });
          state[dim] = val;
        }
      }
    });

    function apply() {
      var visible = 0;
      items.forEach(function (li) {
        var ok = true;
        if (state.stroke) {
          var ds = (li.getAttribute('data-stroke') || '').split(/\s+/);
          if (ds.indexOf(state.stroke) === -1) ok = false;
        }
        if (ok && state.category) {
          if ((li.getAttribute('data-category') || '') !== state.category) ok = false;
        }
        if (ok && state.equip) {
          if ((li.getAttribute('data-equip') || '') !== state.equip) ok = false;
        }
        if (ok) {
          li.hidden = false;
          visible++;
        } else {
          li.hidden = true;
        }
      });
      if (countEl) countEl.textContent = String(visible);
      if (empty) {
        if (visible === 0) empty.removeAttribute('hidden');
        else empty.setAttribute('hidden', '');
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dim = btn.getAttribute('data-filter');
        var val = btn.getAttribute('data-value') || '';
        if (!Object.prototype.hasOwnProperty.call(state, dim)) return;
        // 同維度單選
        buttons.forEach(function (other) {
          if (other.getAttribute('data-filter') === dim) {
            other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
          }
        });
        state[dim] = val;

        // 寫入網址
        var url = new URL(window.location.href);
        var p = url.searchParams;
        Object.keys(state).forEach(function (k) {
          if (state[k]) p.set(k, state[k]);
          else p.delete(k);
        });
        var qs = p.toString();
        var newUrl = url.pathname + (qs ? '?' + qs : '') + url.hash;
        window.history.replaceState({}, '', newUrl);

        apply();
      });
    });

    apply();
  });
})();
