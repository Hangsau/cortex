/* cscs-quiz.js — 選擇題練習頁
   題目按章分檔（/cscs-quiz/chNN.json），選哪章才抓哪章。
   選項每次抽到都重排：原始 yaml 幾乎每題都把正解寫在第一個，
   照原序出等於答案永遠是 A；固定順序也會練成記位置而不是記內容。
   作答紀錄存 localStorage，只用來支援「只練錯過的／沒做過的」。 */
(function () {
  var root = document.getElementById('cq');
  if (!root) return;

  var idxEl = document.getElementById('cqIndex');
  var CHAPTERS = JSON.parse(idxEl.textContent);
  var BY_ID = {};
  CHAPTERS.forEach(function (c) { BY_ID[c.id] = c; });

  var STORE_KEY = 'cscs-quiz-v1';
  var NOTE = document.getElementById('cqNote').textContent;
  var cache = {};                 // chapterID -> payload
  var state = { count: 10, scope: 'all', ch: null, queue: [], at: 0, log: [] };

  var el = {
    setup: document.getElementById('cqSetup'),
    run: document.getElementById('cqRun'),
    done: document.getElementById('cqDone'),
    chs: document.getElementById('cqChs'),
    note: document.getElementById('cqNote'),
    prog: document.getElementById('cqProg'),
    loc: document.getElementById('cqLoc'),
    stem: document.getElementById('cqStem'),
    answers: document.getElementById('cqAnswers'),
    after: document.getElementById('cqAfter'),
    verdict: document.getElementById('cqVerdict'),
    why: document.getElementById('cqWhy'),
    src: document.getElementById('cqSrc'),
    next: document.getElementById('cqNext'),
    score: document.getElementById('cqScore'),
    recap: document.getElementById('cqRecap')
  };

  /* ---- 本機紀錄 ---- */
  function readLog() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeLog(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* 無痕模式寫不進去，不擋作答 */ }
  }
  function record(id, ok) {
    var data = readLog();
    var row = data[id] || { r: 0, w: 0 };
    if (ok) row.r += 1; else row.w += 1;
    data[id] = row;
    writeLog(data);
  }

  /* ---- 工具 ---- */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function show(which) {
    el.setup.hidden = which !== 'setup';
    el.run.hidden = which !== 'run';
    el.done.hidden = which !== 'done';
    // 作答時收掉頁首：手機上標題加導言吃掉三分之一畫面，題目會被推到摺線下
    root.parentNode.classList.toggle('is-answering', which !== 'setup');
  }

  /* ---- 出題 ---- */
  function pick(payload) {
    var log = readLog();
    var pool = payload.questions.filter(function (q) {
      var row = log[q.id];
      if (state.scope === 'wrong') return row && row.w > 0;
      if (state.scope === 'fresh') return !row;
      return true;
    });
    shuffle(pool);
    if (state.count > 0) pool = pool.slice(0, state.count);
    return pool.map(function (q) {
      var order = shuffle(q.opts.map(function (_, i) { return i; }));
      return {
        id: q.id, item: q.item, stem: q.stem, loc: q.loc,
        opts: order.map(function (i) { return q.opts[i]; }),
        why: order.map(function (i) { return q.why[i]; }),
        correct: order.indexOf(q.correct)
      };
    });
  }

  function start(chId) {
    var meta = BY_ID[chId];
    var go = function (payload) {
      cache[chId] = payload;
      var queue = pick(payload);
      if (!queue.length) {
        el.note.textContent = state.scope === 'wrong'
          ? meta.title + '：這一章還沒有答錯過的題目。'
          : meta.title + '：這一章的題目都做過了，換「全部」可以再練一次。';
        return;
      }
      state.ch = chId;
      state.queue = queue;
      state.at = 0;
      state.log = [];
      show('run');
      render();
      window.scrollTo(0, 0);
    };
    if (cache[chId]) { go(cache[chId]); return; }
    el.note.textContent = '載入' + meta.title + '…';
    fetch(meta.json)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (payload) { el.note.textContent = NOTE; go(payload); })
      .catch(function () { el.note.textContent = '題目載入失敗，請重新整理再試一次。'; });
  }

  /* ---- 畫面 ---- */
  function render() {
    var q = state.queue[state.at];
    el.prog.textContent = (state.at + 1) + ' / ' + state.queue.length;
    el.loc.textContent = q.loc || '';
    el.stem.textContent = q.stem;
    el.after.hidden = true;
    el.answers.textContent = '';

    q.opts.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cq-opt';
      var k = document.createElement('span');
      k.className = 'cq-opt-k';
      k.textContent = String.fromCharCode(65 + i);
      var t = document.createElement('span');
      t.className = 'cq-opt-t';
      t.textContent = text;
      b.appendChild(k);
      b.appendChild(t);
      b.addEventListener('click', function () { answer(i); });
      el.answers.appendChild(b);
    });
  }

  function answer(chosen) {
    var q = state.queue[state.at];
    var ok = chosen === q.correct;
    var btns = el.answers.querySelectorAll('.cq-opt');

    Array.prototype.forEach.call(btns, function (b, i) {
      b.disabled = true;
      if (i === q.correct) b.classList.add('is-ok');
      else if (i === chosen) b.classList.add('is-ng');
      else b.classList.add('is-dim');
    });

    el.verdict.className = 'cq-verdict ' + (ok ? 'is-ok' : 'is-ng');
    el.verdict.textContent = ok
      ? '✓ 答對'
      : '✗ 答錯，正解是 ' + String.fromCharCode(65 + q.correct);

    el.why.textContent = '';
    q.why.forEach(function (why, i) {
      if (i === q.correct || !why) return;
      var p = document.createElement('p');
      var b = document.createElement('b');
      b.textContent = String.fromCharCode(65 + i) + ' ';
      p.appendChild(b);
      p.appendChild(document.createTextNode(why));
      el.why.appendChild(p);
    });

    el.src.href = BY_ID[state.ch].url + '#' + q.item;
    el.next.textContent = state.at + 1 < state.queue.length ? '下一題' : '看結果';
    el.after.hidden = false;
    el.next.focus();

    state.log.push({ q: q, ok: ok });
    record(q.id, ok);
  }

  function next() {
    if (state.at + 1 < state.queue.length) {
      state.at += 1;
      render();
      window.scrollTo(0, 0);
      return;
    }
    finish();
  }

  function finish() {
    var right = state.log.filter(function (r) { return r.ok; }).length;
    var total = state.log.length;
    el.score.textContent = BY_ID[state.ch].title + '　' + right + ' / ' + total + '　'
                         + Math.round(right / total * 100) + '%';
    el.recap.textContent = '';
    state.log.filter(function (r) { return !r.ok; }).forEach(function (r) {
      var a = document.createElement('a');
      a.className = 'cq-recap-i';
      a.href = BY_ID[state.ch].url + '#' + r.q.item;
      var b = document.createElement('b');
      b.textContent = r.q.stem;
      a.appendChild(b);
      a.appendChild(document.createElement('br'));
      a.appendChild(document.createTextNode('正解：' + r.q.opts[r.q.correct]));
      el.recap.appendChild(a);
    });
    if (!el.recap.children.length) {
      var p = document.createElement('p');
      p.className = 'cq-note';
      p.textContent = '這一輪全對。';
      el.recap.appendChild(p);
    }
    show('done');
    window.scrollTo(0, 0);
  }

  /* ---- 事件 ---- */
  el.chs.addEventListener('click', function (e) {
    var b = e.target.closest('.cq-ch');
    if (b) start(b.dataset.ch);
  });
  document.getElementById('cqRandom').addEventListener('click', function () {
    start(CHAPTERS[Math.floor(Math.random() * CHAPTERS.length)].id);
  });
  el.next.addEventListener('click', next);
  document.getElementById('cqQuit').addEventListener('click', function () {
    show('setup'); el.note.textContent = NOTE;
  });
  document.getElementById('cqBack').addEventListener('click', function () {
    show('setup'); el.note.textContent = NOTE;
  });
  document.getElementById('cqAgain').addEventListener('click', function () {
    start(state.ch);
  });
  document.getElementById('cqReset').addEventListener('click', function () {
    writeLog({});
    el.note.textContent = '本機作答紀錄已清除。';
  });

  Array.prototype.forEach.call(root.querySelectorAll('[data-count]'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(root.querySelectorAll('[data-count]'), function (o) {
        o.classList.toggle('is-on', o === b);
      });
      state.count = parseInt(b.dataset.count, 10);
    });
  });
  Array.prototype.forEach.call(root.querySelectorAll('[data-scope]'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(root.querySelectorAll('[data-scope]'), function (o) {
        o.classList.toggle('is-on', o === b);
      });
      state.scope = b.dataset.scope;
    });
  });

  // 手機以外用鍵盤作答：1/2/3 選項，Enter 下一題
  document.addEventListener('keydown', function (e) {
    if (el.run.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!el.after.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
      return;
    }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= state.queue[state.at].opts.length) { e.preventDefault(); answer(n - 1); }
  });
})();
