/* temp-quiz.js — 氣質自測計分與結果呈現（T3）
 * 計分邏輯與舊版（static/js/temperament-quiz.js）相同：
 *   - reverse=true：score = 6 - raw；否則 score = raw
 *   - 每維度取平均分
 *   - band：score < band_low → low；score > band_high → high；其餘 mid
 *   - 三型：以 protoDims 順序抽向量，與三個原型做歐氏距離
 *     若最近與次近距離差 < between_threshold → between
 * 結果只放在使用者瀏覽器（localStorage 可選擇寫入）。絕不上傳。
 */
(function () {
  "use strict";

  var root = document.getElementById("tqApp");
  var dataNode = document.getElementById("tq-data");
  if (!root || !dataNode) return;

  var data;
  try { data = JSON.parse(dataNode.textContent); }
  catch (e) { return; }

  var BAND_LOW = parseFloat(root.getAttribute("data-band-low"));
  var BAND_HIGH = parseFloat(root.getAttribute("data-band-high"));
  var BETWEEN = parseFloat(root.getAttribute("data-between"));

  var modeBtns = Array.prototype.slice.call(root.querySelectorAll(".tq-mode-btn"));
  var itemBlocks = Array.prototype.slice.call(root.querySelectorAll(".tq-items"));
  var warn = root.querySelector("#tqWarn");
  var submit = root.querySelector("#tqSubmit");
  var resultBox = root.querySelector("#tqResult");

  var STORAGE_KEY = "cortex-tq-next-v1";
  var BAND_ZH = { low: "低", mid: "中", high: "高" };
  var BAND_CLASS = { low: "tq-band-low", mid: "tq-band-mid", high: "tq-band-high" };
  var mode = "child";

  function activeBlock() {
    for (var i = 0; i < itemBlocks.length; i++) {
      if (itemBlocks[i].getAttribute("data-mode") === mode) return itemBlocks[i];
    }
    return itemBlocks[0];
  }

  function setMode(m) {
    mode = m;
    modeBtns.forEach(function (b) {
      var on = b.getAttribute("data-mode") === m;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    itemBlocks.forEach(function (blk) {
      blk.hidden = blk.getAttribute("data-mode") !== m;
    });
    if (warn) warn.hidden = true;
    if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ""; }
    clearMarks();
  }

  function clearMarks() {
    Array.prototype.slice.call(root.querySelectorAll(".tq-item.is-missing"))
      .forEach(function (el) { el.classList.remove("is-missing"); });
  }

  modeBtns.forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
  });

  root.addEventListener("change", function (e) {
    if (e.target && e.target.type === "radio") {
      var item = e.target.closest(".tq-item");
      if (item) item.classList.remove("is-missing");
    }
  });

  function bandOf(score) {
    if (score < BAND_LOW) return "low";
    if (score > BAND_HIGH) return "high";
    return "mid";
  }

  function dist(a, b) {
    var s = 0;
    for (var i = 0; i < a.length; i++) {
      var d = a[i] - b[i];
      s += d * d;
    }
    return Math.sqrt(s);
  }

  function computeType(dimScore) {
    var vec = data.protoDims.map(function (k) { return dimScore[k]; });
    var ranked = Object.keys(data.prototypes).map(function (key) {
      return { key: key, d: dist(vec, data.prototypes[key]) };
    }).sort(function (x, y) { return x.d - y.d; });

    var nearest = ranked[0];
    var second = ranked[1];
    var between = !!(second && (second.d - nearest.d) < BETWEEN);
    return {
      nearest: nearest.key,
      nearestD: nearest.d,
      second: second ? second.key : null,
      secondD: second ? second.d : null,
      between: between
    };
  }

  function typeResultText(t) {
    var tt = data.typeText;
    if (t.between) {
      var tmpl = mode === "self" ? tt.self_between : tt.between;
      return tmpl
        .replace("{a}", data.typeLabel[t.nearest])
        .replace("{b}", data.typeLabel[t.second]);
    }
    return mode === "self" ? tt["self_" + t.nearest] : tt[t.nearest];
  }

  function mdBold(s) {
    return String(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  function grade() {
    clearMarks();
    var block = activeBlock();
    var items = Array.prototype.slice.call(block.querySelectorAll(".tq-item"));
    var buckets = {};
    var missing = 0;

    items.forEach(function (item) {
      var dim = item.getAttribute("data-dim");
      var reverse = item.getAttribute("data-reverse") === "true";
      var checked = item.querySelector("input[type=radio]:checked");
      if (!checked) {
        missing++;
        item.classList.add("is-missing");
        return;
      }
      var raw = parseInt(checked.value, 10);
      var score = reverse ? (6 - raw) : raw;
      (buckets[dim] = buckets[dim] || []).push(score);
    });

    if (missing > 0) {
      if (warn) warn.hidden = false;
      var firstMissing = block.querySelector(".tq-item.is-missing");
      if (firstMissing) firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
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
    var html = "";

    html += '<div class="tq-type">';
    html += '<div class="tq-h2">' + (mode === "self" ? "成人風格參考" : "三型傾向（參考）") + "</div>";
    html += '<p class="tq-type-text">' + mdBold(typeResultText(typeInfo)) + "</p>";
    html += "</div>";

    html += '<div class="tq-h2 tq-h2--profile">九維度剖面（主要參考）</div>';
    html += '<div class="tq-profile">';
    data.dimMeta.forEach(function (d) {
      var sc = dimScore[d.key];
      if (sc == null) return;
      var band = bandOf(sc);
      var pct = ((sc - 1) / 4) * 100;
      var anchor = (d.no != null) ? ("tq-row-" + d.key) : "";
      html += '<div class="tq-row ' + BAND_CLASS[band] + (anchor ? (" " + anchor) : "") + '">';
      html += '  <div class="tq-row-top">';
      html += '    <a class="tq-dim-name" href="' + d.url + '">' + d.no + ". " + d.name_zh + "</a>";
      html += '    <span class="tq-dim-en muted">' + d.name_en + "</span>";
      html += '    <span class="tq-band-tag">' + BAND_ZH[band] + "</span>";
      html += '    <span class="tq-band-num muted">' + sc.toFixed(2) + "</span>";
      html += "  </div>";
      html += '  <div class="tq-bar" role="img" aria-label="維度分數 ' + sc.toFixed(2) + '">';
      html += '    <span class="tq-bar-track"></span>';
      html += '    <span class="tq-bar-fill" style="left:' + pct.toFixed(1) + '%"></span>';
      html += '    <span class="tq-bar-marker" aria-hidden="true"></span>';
      html += "  </div>";
      var adv = data.advice[d.key] && data.advice[d.key][band] && data.advice[d.key][band][mode];
      if (adv) html += '  <div class="tq-advice read">' + mdBold(adv) + "</div>";
      html += "</div>";
    });
    html += "</div>";

    html += '<p class="tq-foot-note">約 1/3 的孩子不完全屬於任一型——九維度剖面比單一型別更能描述他。氣質會隨時期與情境改變，這只是此刻的一張快照。</p>';
    html += '<div class="tq-actions">';
    html += '  <button type="button" class="tq-redo" id="tqRedo">重新作答</button>';
    html += "</div>";

    resultBox.innerHTML = html;
    resultBox.hidden = false;

    var redo = resultBox.querySelector("#tqRedo");
    if (redo) redo.addEventListener("click", function () {
      resultBox.hidden = true;
      resultBox.innerHTML = "";
      var blk = activeBlock();
      Array.prototype.slice.call(blk.querySelectorAll("input[type=radio]:checked"))
        .forEach(function (r) { r.checked = false; });
      clearMarks();
      blk.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: mode,
        ts: Date.now(),
        dimScore: dimScore,
        type: typeInfo
      }));
    } catch (e) {}

    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (submit) submit.addEventListener("click", grade);

  setMode("child");
})();


