/* Vortex 心理層 · 一條讀下來（scrollytelling 脊椎旅程）
   只在 .vx-jrn 頁啟動；與 vortex.js（.vx-stroke-wrap）互不干擾。
   無 JS 時頁面仍全可讀（內容皆 server-render，details 為原生）。 */
(function () {
  var root = document.querySelector('.vx-jrn');
  if (!root) return;

  var STORE = 'vx-jrn-psych';
  var sections = Array.prototype.slice.call(root.querySelectorAll('[data-ch]'));
  if (!sections.length) return;

  var chip = document.getElementById('vx-jrn-chip');
  var dots = Array.prototype.slice.call(document.querySelectorAll('#vx-jrn-dots .vx-jrn-dot'));
  var fab  = document.getElementById('vx-jrn-fab');

  var current = null;

  function sectionByCh(ch) {
    for (var i = 0; i < sections.length; i++) {
      if (+sections[i].getAttribute('data-ch') === ch) return sections[i];
    }
    return null;
  }

  function setCurrent(sec) {
    if (!sec || sec === current) return;
    current = sec;
    var ch = +sec.getAttribute('data-ch');
    var name = sec.getAttribute('data-name') || '';
    var ls = +sec.getAttribute('data-lstart');
    var le = +sec.getAttribute('data-lend');

    if (chip) {
      if (ch === 0) chip.textContent = '序章';
      else if (ch === 9) chip.textContent = '尾聲';
      else chip.textContent = '第 ' + ch + ' 章 · ' + name;
    }

    dots.forEach(function (d) {
      var l = +d.getAttribute('data-l');
      d.classList.toggle('is-on', l >= ls && l <= le);
    });

    if (fab) {
      if (ch === 0) {
        fab.hidden = false; fab.setAttribute('href', '#ch-1'); fab.textContent = '開始讀 · 第 1 章 →';
      } else if (ch >= 1 && ch <= 7) {
        var nx = sectionByCh(ch + 1);
        fab.hidden = false; fab.setAttribute('href', '#ch-' + (ch + 1));
        fab.textContent = '下一章：' + (nx ? nx.getAttribute('data-name') : '') + ' →';
      } else if (ch === 8) {
        fab.hidden = false; fab.setAttribute('href', '#end'); fab.textContent = '讀尾聲 →';
      } else {
        fab.hidden = true;
      }
    }

    if (ch >= 1 && ch <= 8) {
      try { localStorage.setItem(STORE, JSON.stringify({ ch: ch, name: name })); } catch (e) {}
    }
  }

  /* 當前章 = 最後一個「頂緣已越過視窗 32% 線」的區段。
     鎖在區段層級（非概念），所以 details 展開撐高不會讓判定跳動。 */
  var LINE = 0.32;
  function compute() {
    var line = window.innerHeight * LINE;
    var pick = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) pick = sections[i];
      else break;
    }
    setCurrent(pick);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { compute(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ── 接著讀（上次位置） ── */
  var resume = document.getElementById('vx-jrn-resume');
  var resumeName = document.getElementById('vx-jrn-resume-name');
  var resumeGo = document.getElementById('vx-jrn-resume-go');
  var resumeX = document.getElementById('vx-jrn-resume-x');
  if (resume && (!location.hash || location.hash === '#start')) {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (saved && saved.ch >= 1 && saved.ch <= 8 && window.scrollY < 240) {
        if (resumeName) resumeName.textContent = '第 ' + saved.ch + ' 章 · ' + (saved.name || '');
        if (resumeGo) resumeGo.setAttribute('href', '#ch-' + saved.ch);
        resume.hidden = false;
      }
    } catch (e) {}
  }
  if (resumeGo) resumeGo.addEventListener('click', function () { resume.hidden = true; });
  if (resumeX) resumeX.addEventListener('click', function () {
    resume.hidden = true;
    try { localStorage.removeItem(STORE); } catch (e) {}
  });

  /* ── 章節地圖開合 ── */
  var mapBtn = document.getElementById('vx-jrn-mapbtn');
  var map = document.getElementById('vx-jrn-map');
  function closeMap() { if (map) map.hidden = true; if (mapBtn) mapBtn.setAttribute('aria-expanded', 'false'); }
  function openMap() { if (map) map.hidden = false; if (mapBtn) mapBtn.setAttribute('aria-expanded', 'true'); }
  if (mapBtn && map) {
    mapBtn.addEventListener('click', function () { map.hidden ? openMap() : closeMap(); });
    map.addEventListener('click', function (e) {
      if (e.target.closest('.vx-jrn-map-item')) closeMap();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMap(); });
  }

  compute();
})();
