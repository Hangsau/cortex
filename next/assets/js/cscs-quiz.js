// T1：CSCS 選擇題練習（手機可作答）
(function () {
  var STORAGE_KEY = 'cscs-quiz-next-v1';
  var LABELS = ['A', 'B', 'C'];
  function loadState() {
    try { var raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
    catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function $(id) { return document.getElementById(id); }
  function init() {
    var idxNode = $('cqIndex');
    if (!idxNode) return;
    var indexData;
    try { indexData = JSON.parse(idxNode.textContent); }
    catch (e) { return; }
    var byId = {};
    indexData.forEach(function (c) { byId[c.id] = c; });
    var state = loadState();
    var run = null;
    var sel = $('cqChapter');
    var setup = $('cqSetup');
    var runSect = $('cqRun');
    var doneSect = $('cqDone');
    var startBtn = $('cqStart');
    var pills = document.querySelectorAll('.cq-pill');
    var prog = $('cqProg');
    var loc = $('cqLoc');
    var stem = $('cqStem');
    var answers = $('cqAnswers');
    var after = $('cqAfter');
    var verdict = $('cqVerdict');
    var why = $('cqWhy');
    var src = $('cqSrc');
    var nextBtn = $('cqNext');
    var quitBtn = $('cqQuit');
    var score = $('cqScore');
    var recap = $('cqRecap');
    var againBtn = $('cqAgain');
    var backBtn = $('cqBack');
    function getRec(cid) { return state[cid] || {}; }
    function setRec(cid, qid, v) {
      state[cid] = state[cid] || {};
      state[cid][qid] = v;
      saveState(state);
    }
    function currentScope() {
      var on = document.querySelector('.cq-pill.is-on');
      return on ? on.getAttribute('data-scope') : 'all';
    }
    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        pills.forEach(function (x) { x.classList.remove('is-on'); });
        p.classList.add('is-on');
      });
    });
    function backToSetup() {
      runSect.hidden = true;
      doneSect.hidden = true;
      setup.hidden = false;
      run = null;
    }
    quitBtn.addEventListener('click', backToSetup);
    backBtn.addEventListener('click', backToSetup);
    function fetchChapter(cid, cb) {
      var ch = byId[cid];
      if (!ch || !ch.json) { cb(null); return; }
      fetch(ch.json, { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) { cb(data); })
        .catch(function () { cb(null); });
    }
    var params = new URLSearchParams(location.search);
    var pch = params.get('ch');
    var pn = parseInt(params.get('n'), 10) || 0;
    if (pch) {
      if (pch === 'random') pch = indexData[Math.floor(Math.random() * indexData.length)].id;
      if (byId[pch]) {
        sel.value = pch;
        fetchChapter(pch, function (data) { if (data) startSession(pch, data, pn); });
      }
    }
    startBtn.addEventListener('click', function () {
      var cid = sel.value;
      fetchChapter(cid, function (data) {
        if (!data) { alert('載入題庫失敗'); return; }
        startSession(cid, data);
      });
    });
    function startSession(cid, data, limit) {
      var scope = currentScope();
      var rec = getRec(cid);
      var all = data.questions || [];
      var qs = all.filter(function (q) {
        if (scope === 'wrong') return rec[q.id] === 'ng';
        if (scope === 'fresh') return !rec[q.id];
        return true;
      });
      if (!qs.length) {
        setup.hidden = true;
        runSect.hidden = true;
        score.textContent = '本範圍沒有題目（換一個過濾器或先做完一輪）。';
        recap.innerHTML = '';
        againBtn.hidden = true;
        doneSect.hidden = false;
        run = null;
        return;
      }
      if (limit && limit > 0 && qs.length > limit) {
        qs = shuffle(qs.slice()).slice(0, limit);
      }
      run = {
        cid: cid,
        limit: limit || 0,
        chapterUrl: byId[cid].url,
        qs: qs,
        i: 0,
        ok: 0,
        wrong: [],
        answered: false,
        currentOrder: [],
        currentCorrect: 0
      };
      setup.hidden = true;
      doneSect.hidden = true;
      runSect.hidden = false;
      showQuestion();
    }
    function showQuestion() {
      var q = run.qs[run.i];
      prog.textContent = (run.i + 1) + ' / ' + run.qs.length;
      loc.textContent = q.loc || '';
      stem.textContent = q.stem;
      after.hidden = true;
      var order = [0, 1, 2];
      shuffle(order);
      run.currentOrder = order;
      run.currentCorrect = order.indexOf(q.correct);
      run.answered = false;
      answers.innerHTML = '';
      order.forEach(function (orig, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cq-opt';
        btn.setAttribute('data-idx', String(idx));
        var k = document.createElement('span');
        k.className = 'cq-opt-k';
        k.textContent = LABELS[idx];
        var t = document.createElement('span');
        t.className = 'cq-opt-t';
        t.textContent = q.opts[orig] || '';
        btn.appendChild(k);
        btn.appendChild(t);
        btn.addEventListener('click', function () { answer(idx); });
        answers.appendChild(btn);
      });
    }
    function answer(choice) {
      if (!run || run.answered) return;
      run.answered = true;
      var q = run.qs[run.i];
      var correctIdx = run.currentCorrect;
      var isOk = (choice === correctIdx);
      if (isOk) {
        run.ok++;
        setRec(run.cid, q.id, 'ok');
      } else {
        run.wrong.push(q);
        setRec(run.cid, q.id, 'ng');
      }
      var btns = answers.querySelectorAll('.cq-opt');
      btns.forEach(function (b) {
        var idx = parseInt(b.getAttribute('data-idx'), 10);
        if (idx === correctIdx) b.classList.add('is-ok');
        else if (idx === choice && !isOk) b.classList.add('is-ng');
        else b.classList.add('is-dim');
        b.disabled = true;
      });
      verdict.className = 'cq-verdict ' + (isOk ? 'is-ok' : 'is-ng');
      verdict.textContent = isOk ? '答對' : '答錯';
      why.innerHTML = '';
      run.currentOrder.forEach(function (orig, idx) {
        var w = (q.why && q.why[orig]) || '';
        if (!w) return;
        var p = document.createElement('p');
        var b = document.createElement('b');
        b.textContent = LABELS[idx];
        p.appendChild(b);
        p.appendChild(document.createTextNode(w));
        why.appendChild(p);
      });
      if (q.item && run.chapterUrl) {
        src.setAttribute('href', run.chapterUrl + '#' + q.item);
        src.parentNode.hidden = false;
      } else {
        src.parentNode.hidden = true;
      }
      nextBtn.textContent = (run.i + 1 < run.qs.length) ? '下一題' : '看結果';
      after.hidden = false;
    }
    nextBtn.addEventListener('click', function () {
      if (!run || !run.answered) return;
      run.i++;
      if (run.i >= run.qs.length) showDone();
      else showQuestion();
    });
    function showDone() {
      runSect.hidden = true;
      var total = run.qs.length;
      var pct = total ? Math.round(100 * run.ok / total) : 0;
      score.textContent = '本輪 ' + run.ok + ' / ' + total + ' 題答對（' + pct + '%）';
      recap.innerHTML = '';
      run.wrong.forEach(function (q) {
        var a = document.createElement('a');
        a.className = 'cq-recap-i';
        a.href = run.chapterUrl + '#' + (q.item || '');
        var b = document.createElement('b');
        b.textContent = q.item || q.id;
        var s = document.createElement('span');
        s.textContent = q.stem;
        a.appendChild(b);
        a.appendChild(s);
        recap.appendChild(a);
      });
      againBtn.hidden = run.wrong.length === 0;
      doneSect.hidden = false;
    }
    againBtn.addEventListener('click', function () {
      var cid = run ? run.cid : sel.value;
      pills.forEach(function (p) {
        p.classList.toggle('is-on', p.getAttribute('data-scope') === 'wrong');
      });
      fetchChapter(cid, function (data) {
        if (!data) { alert('載入題庫失敗'); return; }
        startSession(cid, data);
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
