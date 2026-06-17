/* ════════ 水感發展座標圖 · 互動行為 ════════ */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var grid = document.querySelector('.atlas-grid');
    if (!grid) return; // 無 grid 就不做事（頁面仍可見）

    var nodes = Array.prototype.slice.call(grid.querySelectorAll('.atlas-node'));
    var empties = Array.prototype.slice.call(grid.querySelectorAll('.atlas-cell--empty'));
    var rowHeads = Array.prototype.slice.call(grid.querySelectorAll('.atlas-rowhead'));
    var colHeads = Array.prototype.slice.call(grid.querySelectorAll('.atlas-colhead'));
    var panel = document.querySelector('.atlas-panel');
    var panelBody = panel ? panel.querySelector('.atlas-panel-body') : null;
    var panelClose = panel ? panel.querySelector('.atlas-panel-close') : null;
    var details = document.querySelectorAll('template.atlas-detail');

    var lockedLevel = null;
    var lockedDim = null;
    var tempoTimer = null;
    var tempoIdx = 0;
    var STORAGE_KEY = 'atlas-here';

    /* ── 高亮：套到某 level/dim 的整列整欄 ── */
    function applyHighlight(level, dim) {
      var hotCells = [];
      var dimTargets = nodes.concat(empties);
      for (var i = 0; i < dimTargets.length; i++) {
        var c = dimTargets[i];
        var matchL = level && c.getAttribute('data-level') === level;
        var matchD = dim && c.getAttribute('data-dim') === dim;
        if ((level && matchL) || (dim && matchD)) {
          c.classList.add('is-axis-hot');
          hotCells.push(c);
        } else {
          c.classList.remove('is-axis-hot');
        }
      }
      // 其餘降透明度
      for (var j = 0; j < dimTargets.length; j++) {
        var cell = dimTargets[j];
        if (hotCells.indexOf(cell) === -1) {
          cell.classList.add('is-dim');
        } else {
          cell.classList.remove('is-dim');
        }
      }
      // 表頭同步
      for (var k = 0; k < rowHeads.length; k++) {
        var rh = rowHeads[k];
        if (level && rh.getAttribute('data-level') === level) {
          rh.classList.add('is-axis-hot');
        } else {
          rh.classList.remove('is-axis-hot');
        }
      }
      for (var m = 0; m < colHeads.length; m++) {
        var ch = colHeads[m];
        if (dim && ch.getAttribute('data-dim') === dim) {
          ch.classList.add('is-axis-hot');
        } else {
          ch.classList.remove('is-axis-hot');
        }
      }
    }

    function clearTransientHighlight() {
      // 只清掉 hover 暫態（.is-axis-hot 來自 hover）；不動 .is-locked
      if (lockedLevel || lockedDim) {
        applyHighlight(lockedLevel, lockedDim);
        // 重套 locked（套回被 is-axis-hot 移除的）
        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          var matchL = lockedLevel && n.getAttribute('data-level') === lockedLevel;
          var matchD = lockedDim && n.getAttribute('data-dim') === lockedDim;
          if ((lockedLevel && matchL) || (lockedDim && matchD)) {
            n.classList.add('is-axis-hot');
            n.classList.remove('is-dim');
          }
        }
        for (var j = 0; j < empties.length; j++) {
          var e = empties[j];
          var mL = lockedLevel && e.getAttribute('data-level') === lockedLevel;
          var mD = lockedDim && e.getAttribute('data-dim') === lockedDim;
          if ((lockedLevel && mL) || (lockedDim && mD)) {
            e.classList.add('is-axis-hot');
            e.classList.remove('is-dim');
          }
        }
      } else {
        for (var a = 0; a < nodes.length; a++) {
          nodes[a].classList.remove('is-axis-hot');
          nodes[a].classList.remove('is-dim');
        }
        for (var b = 0; b < empties.length; b++) {
          empties[b].classList.remove('is-axis-hot');
          empties[b].classList.remove('is-dim');
        }
        for (var c2 = 0; c2 < rowHeads.length; c2++) {
          rowHeads[c2].classList.remove('is-axis-hot');
        }
        for (var d2 = 0; d2 < colHeads.length; d2++) {
          colHeads[d2].classList.remove('is-axis-hot');
        }
      }
    }

    /* ── 行為 1：hover 高亮 ── */
    function onNodeEnter(e) {
      var n = e.currentTarget;
      var level = n.getAttribute('data-level');
      var dim = n.getAttribute('data-dim');
      applyHighlight(level, dim);
    }
    function onHeadEnter(e) {
      var h = e.currentTarget;
      if (h.classList.contains('atlas-rowhead')) {
        applyHighlight(h.getAttribute('data-level'), null);
      } else {
        applyHighlight(null, h.getAttribute('data-dim'));
      }
    }
    function onLeave() {
      clearTransientHighlight();
    }

    for (var i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener('mouseenter', onNodeEnter);
      nodes[i].addEventListener('mouseleave', onLeave);
      nodes[i].addEventListener('focus', onNodeEnter);
      nodes[i].addEventListener('blur', onLeave);
    }
    for (var j = 0; j < rowHeads.length; j++) {
      rowHeads[j].addEventListener('mouseenter', onHeadEnter);
      rowHeads[j].addEventListener('mouseleave', onLeave);
    }
    for (var k = 0; k < colHeads.length; k++) {
      colHeads[k].addEventListener('mouseenter', onHeadEnter);
      colHeads[k].addEventListener('mouseleave', onLeave);
    }

    /* ── 行為 3：點擊鎖定列/欄 ── */
    function onRowHeadClick(e) {
      e.preventDefault();
      var lv = e.currentTarget.getAttribute('data-level');
      lockedLevel = (lockedLevel === lv) ? null : lv;
      // 更新 is-locked class
      for (var i = 0; i < rowHeads.length; i++) {
        if (rowHeads[i].getAttribute('data-level') === lockedLevel) {
          rowHeads[i].classList.add('is-locked');
        } else {
          rowHeads[i].classList.remove('is-locked');
        }
      }
      applyHighlight(lockedLevel, lockedDim);
    }
    function onColHeadClick(e) {
      e.preventDefault();
      var d = e.currentTarget.getAttribute('data-dim');
      lockedDim = (lockedDim === d) ? null : d;
      for (var i = 0; i < colHeads.length; i++) {
        if (colHeads[i].getAttribute('data-dim') === lockedDim) {
          colHeads[i].classList.add('is-locked');
        } else {
          colHeads[i].classList.remove('is-locked');
        }
      }
      applyHighlight(lockedLevel, lockedDim);
    }
    for (var rh = 0; rh < rowHeads.length; rh++) {
      rowHeads[rh].addEventListener('click', onRowHeadClick);
    }
    for (var ch = 0; ch < colHeads.length; ch++) {
      colHeads[ch].addEventListener('click', onColHeadClick);
    }

    /* ── 行為 2：點擊節點 → 開面板 ── */
    function stopTempo() {
      if (tempoTimer) {
        clearInterval(tempoTimer);
        tempoTimer = null;
      }
    }
    function startTempo(beats, bpm, bpmLabel) {
      stopTempo();
      tempoIdx = 0;
      var interval = Math.max(40, Math.round(60000 / bpm));
      tempoTimer = setInterval(function () {
        // 先全部關
        for (var i = 0; i < beats.length; i++) {
          beats[i].classList.remove('beat-on');
        }
        beats[tempoIdx % beats.length].classList.add('beat-on');
        tempoIdx++;
      }, interval);
      if (bpmLabel) bpmLabel.textContent = String(bpm);
    }
    function bindTempoInPanel() {
      if (!panelBody) return;
      var range = panelBody.querySelector('.atlas-tempo');
      var bpmLabel = panelBody.querySelector('.atlas-bpm');
      var beats = panelBody.querySelectorAll('.atlas-beats span');
      if (!range || !beats.length) return;
      function apply() {
        var bpm = parseInt(range.value, 10) || 72;
        startTempo(beats, bpm, bpmLabel);
      }
      range.addEventListener('input', apply);
      apply();
    }
    function clearSelection() {
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.remove('is-selected');
      }
    }
    function openPanel(node) {
      if (!panel || !panelBody) return;
      var level = node.getAttribute('data-level');
      var dim = node.getAttribute('data-dim');
      var key = level + '-' + dim;
      var tpl = document.querySelector('template.atlas-detail[data-node="' + key + '"]');
      stopTempo();
      while (panelBody.firstChild) {
        panelBody.removeChild(panelBody.firstChild);
      }
      if (tpl && tpl.content) {
        panelBody.appendChild(tpl.content.cloneNode(true));
      } else {
        var p = document.createElement('p');
        p.textContent = '（此格暫無細節內容）';
        panelBody.appendChild(p);
      }
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      clearSelection();
      node.classList.add('is-selected');
      bindTempoInPanel();
    }
    function closePanel() {
      if (!panel) return;
      stopTempo();
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      clearSelection();
    }
    for (var n = 0; n < nodes.length; n++) {
      nodes[n].addEventListener('click', function (e) {
        // 點 here-dot 時不開面板
        if (e.target.classList && e.target.classList.contains('atlas-here-dot')) return;
        openPanel(e.currentTarget);
      });
    }
    if (panelClose) {
      panelClose.addEventListener('click', closePanel);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closePanel();
      }
    });

    /* ── 行為 5：自我定位（localStorage） ── */
    function readHere() {
      try {
        return window.localStorage.getItem(STORAGE_KEY);
      } catch (err) {
        return null;
      }
    }
    function writeHere(val) {
      try {
        if (val === null) {
          window.localStorage.removeItem(STORAGE_KEY);
        } else {
          window.localStorage.setItem(STORAGE_KEY, val);
        }
      } catch (err) {
        // 忽略（隱私模式或 quota 滿）
      }
    }
    function clearAllHere() {
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.remove('is-here');
      }
    }
    function setHere(key) {
      clearAllHere();
      for (var i = 0; i < nodes.length; i++) {
        var lv = nodes[i].getAttribute('data-level');
        var dm = nodes[i].getAttribute('data-dim');
        if ((lv + '-' + dm) === key) {
          nodes[i].classList.add('is-here');
        }
      }
    }
    grid.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains('atlas-here-dot')) return;
      e.stopPropagation();
      e.preventDefault();
      var node = t.closest('.atlas-node');
      if (!node) return;
      var lv = node.getAttribute('data-level');
      var dm = node.getAttribute('data-dim');
      var key = lv + '-' + dm;
      var current = readHere();
      if (current === key) {
        // 再點一次取消
        writeHere(null);
        node.classList.remove('is-here');
      } else {
        writeHere(key);
        setHere(key);
      }
    });
    // 初始化還原
    var saved = readHere();
    if (saved) setHere(saved);

    // 印出 details 數量供除錯用（無害）
    if (window.console && console.log) {
      console.log('[atlas] details loaded:', details.length);
    }
  });
})();
