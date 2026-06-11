/* temperament-quiz.js — 氣質測驗計分
 * 讀 server 端渲染的題目 DOM + #tq-config（原型 / 建議 / 型別文字）。
 * 輸出：九維度剖面（主）+ 三型傾向（輔）+ 環境配合建議。絕不輸出好壞分數或診斷。
 * 計分規格見 resources/notes/temperament-nine-traits/QUIZ_DESIGN.md。
 */
(function () {
  'use strict';

  var app = document.getElementById('quiz-app');
  var cfgEl = document.getElementById('tq-config');
  if (!app || !cfgEl) return;

  var cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }

  var BAND_LOW = parseFloat(app.getAttribute('data-band-low'));
  var BAND_HIGH = parseFloat(app.getAttribute('data-band-high'));
  var BETWEEN = parseFloat(app.getAttribute('data-between'));

  var modeBtns = Array.prototype.slice.call(app.querySelectorAll('.tq-mode-btn'));
  var itemBlocks = Array.prototype.slice.call(app.querySelectorAll('.tq-items'));
  var warn = app.querySelector('.tq-warn');
  var submit = app.querySelector('.tq-submit');
  var resultBox = app.querySelector('.tq-result');

  var mode = 'child';

  function activeBlock() {
    for (var i = 0; i < itemBlocks.length; i++) {
      if (itemBlocks[i].getAttribute('data-mode') === mode) return itemBlocks[i];
    }
    return itemBlocks[0];
  }

  function setMode(m) {
    mode = m;
    modeBtns.forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-mode') === m);
    });
    itemBlocks.forEach(function (blk) {
      blk.hidden = blk.getAttribute('data-mode') !== m;
    });
    if (warn) warn.hidden = true;
    if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
    clearMarks();
  }

  function clearMarks() {
    Array.prototype.slice.call(app.querySelectorAll('.tq-item.is-missing'))
      .forEach(function (el) { el.classList.remove('is-missing'); });
  }

  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
  });

  // 作答後清掉該題的缺答標記
  app.addEventListener('change', function (e) {
    if (e.target && e.target.type === 'radio') {
      var item = e.target.closest('.tq-item');
      if (item) item.classList.remove('is-missing');
    }
  });

  function bandOf(score) {
    if (score < BAND_LOW) return 'low';
    if (score > BAND_HIGH) return 'high';
    return 'mid';
  }
  var BAND_ZH = { low: '低', mid: '中', high: '高' };

  function dist(a, b) {
    var s = 0;
    for (var i = 0; i < a.length; i++) { var d = a[i] - b[i]; s += d * d; }
    return Math.sqrt(s);
  }

  function computeType(dimScore) {
    var vec = cfg.protoDims.map(function (k) { return dimScore[k]; });
    var ranked = Object.keys(cfg.prototypes).map(function (key) {
      return { key: key, d: dist(vec, cfg.prototypes[key]) };
    }).sort(function (x, y) { return x.d - y.d; });

    var nearest = ranked[0];
    var second = ranked[1];
    var between = second && (second.d - nearest.d) < BETWEEN;
    return { nearest: nearest.key, second: second ? second.key : null, between: between };
  }

  function typeResultText(t) {
    var tt = cfg.typeText;
    if (t.between) {
      var tmpl = mode === 'self' ? tt.self_between : tt.between;
      return tmpl
        .replace('{a}', cfg.typeLabel[t.nearest])
        .replace('{b}', cfg.typeLabel[t.second]);
    }
    return mode === 'self' ? tt['self_' + t.nearest] : tt[t.nearest];
  }

  // 極簡 **粗體** 轉換（型別文字含 **）
  function mdBold(s) {
    return String(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function grade() {
    clearMarks();
    var block = activeBlock();
    var items = Array.prototype.slice.call(block.querySelectorAll('.tq-item'));
    var buckets = {};
    var missing = 0;

    items.forEach(function (item) {
      var dim = item.getAttribute('data-dim');
      var reverse = item.getAttribute('data-reverse') === 'true';
      var checked = item.querySelector('input[type=radio]:checked');
      if (!checked) {
        missing++;
        item.classList.add('is-missing');
        return;
      }
      var raw = parseInt(checked.value, 10);
      var score = reverse ? (6 - raw) : raw;
      (buckets[dim] = buckets[dim] || []).push(score);
    });

    if (missing > 0) {
      if (warn) warn.hidden = false;
      var firstMissing = block.querySelector('.tq-item.is-missing');
      if (firstMissing) firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (warn) warn.hidden = true;

    var dimScore = {};
    Object.keys(buckets).forEach(function (dim) {
      var arr = buckets[dim];
      var sum = arr.reduce(function (a, b) { return a + b; }, 0);
      dimScore[dim] = sum / arr.length;
    });

    render(dimScore, computeType(dimScore));
  }

  function render(dimScore, typeInfo) {
    var html = '';

    // 三型傾向（輔）
    html += '<div class="tq-type">';
    html += '<div class="tq-type-h">' + (mode === 'self' ? '成人風格參考' : '三型傾向（參考）') + '</div>';
    html += '<p class="tq-type-text">' + mdBold(typeResultText(typeInfo)) + '</p>';
    html += '</div>';

    // 九維度剖面（主）
    html += '<div class="tq-profile-h">九維度剖面（主要參考）</div>';
    html += '<div class="tq-profile">';
    cfg.dimMeta.forEach(function (d) {
      var sc = dimScore[d.key];
      if (sc == null) return;
      var band = bandOf(sc);
      var pct = ((sc - 1) / 4) * 100;
      html += '<div class="tq-row tq-band-' + band + '">';
      html += '  <div class="tq-row-top">';
      html += '    <span class="tq-dim-name">' + d.name_zh + '</span>';
      html += '    <span class="tq-band-tag">' + BAND_ZH[band] + '</span>';
      html += '  </div>';
      html += '  <div class="tq-bar"><span class="tq-bar-fill" style="width:' + pct.toFixed(0) + '%"></span></div>';
      var adv = cfg.advice[d.key] && cfg.advice[d.key][band] && cfg.advice[d.key][band][mode];
      if (adv) html += '  <div class="tq-advice">' + adv + '</div>';
      html += '</div>';
    });
    html += '</div>';

    html += '<p class="tq-foot-note">約 1/3 的孩子不完全屬於任一型——九維度剖面比單一型別更能描述他。氣質會隨時期與情境改變，這只是此刻的一張快照。</p>';
    html += '<button type="button" class="tq-redo">重新作答</button>';

    resultBox.innerHTML = html;
    resultBox.hidden = false;

    var redo = resultBox.querySelector('.tq-redo');
    if (redo) redo.addEventListener('click', function () {
      resultBox.hidden = true;
      resultBox.innerHTML = '';
      var block = activeBlock();
      Array.prototype.slice.call(block.querySelectorAll('input[type=radio]:checked'))
        .forEach(function (r) { r.checked = false; });
      clearMarks();
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (submit) submit.addEventListener('click', grade);

  setMode('child');
})();
