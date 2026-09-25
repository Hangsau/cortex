// T2：CSCS 閃卡（手機可作答、鍵盤可用）
(function () {
  var STORAGE_KEY = 'cscs-cards-next-v1';
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
    var idxNode = $('cdIndex');
    if (!idxNode) return;
    var indexData;
    try { indexData = JSON.parse(idxNode.textContent); }
    catch (e) { return; }
    var byId = {};
    indexData.forEach(function (c) { byId[c.id] = c; });
    var state = loadState();
    var run = null;
    var sel = $('cdChapter');
    var shuffleBox = $('cdShuffle');
    var setup = $('cdSetup');
    var runSect = $('cdRun');
    var doneSect = $('cdDone');
    var startBtn = $('cdStart');
    var prog = $('cdProg');
    var cardEl = $('cdCard');
    var tagEl = $('cdTag');
    var front = $('cdFront');
    var back = $('cdBack');
    var flipBtn = $('cdFlip');
    var noBtn = $('cdNo');
    var yesBtn = $('cdYes');
    var quitBtn = $('cdQuit');
    var score = $('cdScore');
    var retryBtn = $('cdRetry');
    var backBtn = $('cdBack');

    function getRec(cid) { return state[cid] || {}; }
    function setRec(cid, k, v) {
      state[cid] = state[cid] || {};
      state[cid][k] = v;
      saveState(state);
    }

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

    startBtn.addEventListener('click', function () {
      var cid = sel.value;
      fetchChapter(cid, function (data) {
        if (!data) { alert('載入閃卡失敗'); return; }
        startSession(cid, data);
      });
    });

    function startSession(cid, data) {
      var all = (data.cards || []).map(function (c) { return Object.assign({}, c); });
      if (!all.length) { alert('本章沒有閃卡'); return; }
      if (shuffleBox.checked) shuffle(all);
      run = {
        cid: cid,
        chapterUrl: byId[cid].url,
        deck: all,
        i: 0,
        okCount: 0,
        ngList: [],
        flipped: false,
        answered: false
      };
      setup.hidden = true;
      doneSect.hidden = true;
      runSect.hidden = false;
      showCard();
    }

    function showCard() {
      var c = run.deck[run.i];
      if (!c) { showDone(); return; }
      prog.textContent = '剩 ' + (run.deck.length - run.i) + ' 張';
      tagEl.textContent = c.tag || '';
      front.textContent = c.q || '';
      back.textContent = c.a || '';
      front.hidden = false;
      back.hidden = true;
      run.flipped = false;
      run.answered = false;
      flipBtn.disabled = false;
      noBtn.disabled = true;
      yesBtn.disabled = true;
      cardEl.classList.remove('is-flipping');
    }

    function flip() {
      if (!run || run.answered) return;
      cardEl.classList.add('is-flipping');
      setTimeout(function () {
        run.flipped = !run.flipped;
        if (run.flipped) {
          front.hidden = true;
          back.hidden = false;
        } else {
          front.hidden = false;
          back.hidden = true;
        }
        cardEl.classList.remove('is-flipping');
        noBtn.disabled = false;
        yesBtn.disabled = false;
      }, 200);
    }

    flipBtn.addEventListener('click', flip);
    cardEl.addEventListener('click', flip);
    cardEl.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flip();
      }
    });

    function mark(isOk) {
      if (!run || !run.flipped || run.answered) return;
      run.answered = true;
      var c = run.deck[run.i];
      if (isOk) {
        run.okCount++;
        setRec(run.cid, c.k, 'ok');
        nextCard();
      } else {
        setRec(run.cid, c.k, 'ng');
        run.ngList.push(c);
        nextCard();
      }
    }
    function nextCard() {
      run.i++;
      if (run.i >= run.deck.length) {
        if (run.ngList.length > 0) {
          // 把「還不熟」放回隊尾，下一輪
          run.deck = run.deck.concat(run.ngList);
          run.ngList = [];
        }
        if (run.i >= run.deck.length) {
          showDone();
          return;
        }
      }
      showCard();
    }
    noBtn.addEventListener('click', function () { mark(false); });
    yesBtn.addEventListener('click', function () { mark(true); });

    function showDone() {
      runSect.hidden = true;
      var total = run.okCount + run.ngList.length;
      var ng = run.ngList.length;
      // 全部都標為記住時 ngList 應為 0
      score.textContent = '本輪記住 ' + run.okCount + ' 張';
      retryBtn.hidden = false;
      doneSect.hidden = false;
    }

    retryBtn.addEventListener('click', function () {
      if (!run) return;
      var cid = run.cid;
      fetchChapter(cid, function (data) {
        if (!data) { alert('載入閃卡失敗'); return; }
        // 只複習被記為 ng 的卡
        var rec = getRec(cid);
        var all = (data.cards || []).map(function (c) { return Object.assign({}, c); });
        var ng = all.filter(function (c) { return rec[c.k] === 'ng'; });
        if (!ng.length) {
          alert('本章沒有被記成「還不熟」的卡片');
          return;
        }
        run = {
          cid: cid,
          chapterUrl: byId[cid].url,
          deck: ng,
          i: 0,
          okCount: 0,
          ngList: [],
          flipped: false,
          answered: false
        };
        setup.hidden = true;
        doneSect.hidden = true;
        runSect.hidden = false;
        showCard();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
