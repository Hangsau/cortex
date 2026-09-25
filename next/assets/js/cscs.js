// CSCS 章節頁：自測遮罩 / 章內錨點預先展開（首屏預設不遮，等按下 toolbar 按鈕才進入 quiz 模式）。
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var art = document.querySelector('article.ck-chapter');
    if (!art) return;
    var btn = art.querySelector('.ck-quiz-toggle');
    if (!btn) return;

    function applyQuiz() {
      var on = btn.getAttribute('aria-pressed') === 'true';
      art.classList.toggle('is-quiz', on);
    }
    btn.addEventListener('click', function () {
      var next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', next ? 'true' : 'false');
      applyQuiz();
    });

    // 點題目切換單題 reveal
    art.querySelectorAll('.ck-item').forEach(function (item) {
      var q = item.querySelector('.ck-q');
      if (!q) return;
      q.addEventListener('click', function () {
        if (!art.classList.contains('is-quiz')) return;
        item.classList.toggle('is-revealed');
      });
    });

    // 網址帶 #<item id>，若在 quiz 模式要預先展開該 item
    function revealFromHash() {
      var hash = (location.hash || '').slice(1);
      if (!hash) return;
      var tgt = document.getElementById(hash);
      if (tgt && tgt.classList.contains('ck-item')) {
        tgt.classList.add('is-revealed');
      }
    }
    revealFromHash();
    window.addEventListener('hashchange', revealFromHash);
  });
})();
