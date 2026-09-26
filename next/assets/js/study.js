/* 閱讀陪伴：對照閱讀插入、小節進度、繼續讀、今天讀一節（Claude 手寫，2026-09-26）
   設計原則（給容易拖延的讀者）：開始的門檻要低（每節標分鐘數、一鍵從沒讀的那節開始）、
   進度看得見（打勾、進度條）、完成有回饋（輕提示）、不製造罪惡感（不做連續天數、不催）。
   全部資料只存在本機瀏覽器 localStorage；讀不到儲存空間時一切照常可讀。 */
(() => {
  'use strict';
  const KEY = 'cortex-study-v1';
  const CPM = 450; // 中文閱讀速度（字／分鐘），只用來估算分鐘數

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) { /* 無儲存空間時不記錄 */ } };
  const state = Object.assign({ read: {}, last: null, days: {} }, load());
  const today = () => new Date().toISOString().slice(0, 10);
  const base = document.documentElement.dataset.base || '/';

  /* ---------- 1. 對照閱讀：把 <template data-xl-for> 插到錨點 ---------- */
  document.querySelectorAll('template[data-xl-for]').forEach(tpl => {
    const target = document.getElementById(tpl.dataset.xlFor);
    if (!target) return;
    const node = tpl.content.cloneNode(true);
    if (/^H[1-6]$/.test(target.tagName)) {
      const after = target.nextElementSibling && target.nextElementSibling.classList.contains('st-meta') ? target.nextElementSibling : target;
      after.after(node);
    } else {
      target.append(node);
    }
  });

  /* ---------- 2. 閱讀頁：切小節、估分鐘、記進度 ---------- */
  const article = document.querySelector('[data-study]');
  if (article) {
    const kind = article.dataset.study; // reader | cscs
    const path = location.pathname;
    let units = [];
    if (kind === 'reader') {
      const hs = [...article.querySelectorAll('.lc-body > h2[id]')];
      units = hs.map((h, i) => {
        let len = 0; let el = h.nextElementSibling;
        while (el && el !== hs[i + 1]) { len += (el.textContent || '').length; el = el.nextElementSibling; }
        return { id: h.id, el: h, end: hs[i + 1] || article.querySelector('.lc-body').lastElementChild, title: h.textContent.trim(), len };
      });
    } else if (kind === 'cscs') {
      units = [...article.querySelectorAll('.ck-item[id]')].map(it => ({
        id: it.id, el: it, end: it, title: (it.querySelector('.ck-q') || it).textContent.trim(), len: (it.textContent || '').length,
      }));
    }
    const keyOf = (u) => path + '#' + u.id;
    const mins = (u) => Math.max(1, Math.round(u.len / CPM));
    const isRead = (u) => !!state.read[keyOf(u)];

    // 小節標題旁：分鐘數與讀過的勾
    if (kind === 'reader') {
      units.forEach(u => {
        const m = document.createElement('p');
        m.className = 'st-meta';
        m.innerHTML = `<span class="st-min">約 ${mins(u)} 分鐘</span><span class="st-done" aria-label="已讀">✓ 讀過了</span>`;
        u.el.after(m);
        u.meta = m;
      });
    }

    // 章首：本章進度列＋「從沒讀的那節開始」
    const bar = document.createElement('div');
    bar.className = 'st-bar';
    const head = article.querySelector('.lc-head');
    if (head && units.length) head.after(bar);
    const label = kind === 'reader' ? '節' : '條';

    const nextUnread = () => units.find(u => !isRead(u));
    const render = () => {
      const done = units.filter(isRead).length;
      const left = units.filter(u => !isRead(u));
      const leftMin = left.reduce((s, u) => s + mins(u), 0);
      const nx = nextUnread();
      bar.innerHTML = `
        <p class="st-count"><b>${done}</b> / ${units.length} ${label}${left.length ? `<span class="muted">　還有約 ${leftMin} 分鐘</span>` : '<span class="muted">　這章讀完了</span>'}</p>
        <div class="st-track" role="progressbar" aria-valuemin="0" aria-valuemax="${units.length}" aria-valuenow="${done}"><span style-width="${done}"></span></div>
        ${nx ? `<a class="st-go" href="#${nx.id}">${done ? '從還沒讀的那一' + label + '接著讀' : '從第一' + label + '開始'}<span class="muted">（約 ${mins(nx)} 分鐘）</span></a>` : ''}`;
      const fill = bar.querySelector('.st-track > span');
      if (fill) fill.style.width = (units.length ? done / units.length * 100 : 0) + '%';
      units.forEach(u => {
        const r = isRead(u);
        if (u.meta) u.meta.classList.toggle('is-read', r);
        if (kind === 'cscs') u.el.classList.toggle('is-read', r);
        document.querySelectorAll(`.rail a[href="#${CSS.escape(u.id)}"]`).forEach(a => a.classList.toggle('is-read', r));
      });
    };

    // 小提示：讀完一節時出現，2.5 秒後淡出
    const toast = document.createElement('p');
    toast.className = 'st-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
    let toastTimer;
    const cheer = (u) => {
      const n = state.days[today()] || 0;
      const nx = nextUnread();
      toast.textContent = `讀完 1 ${label} ✓ 今天第 ${n} ${label}` + (nx ? `　下一${label}約 ${mins(nx)} 分鐘` : '　這章讀完了');
      toast.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2500);
    };

    const markRead = (u) => {
      if (isRead(u)) return;
      state.read[keyOf(u)] = Date.now();
      state.days[today()] = (state.days[today()] || 0) + 1;
      save(state); render(); remember(true); cheer(u);
    };

    // 讀完判定：小節的結尾捲到畫面上方 30% 以上，且這一節在畫面上停留過至少分鐘數的 1/4
    const seen = new Map();
    if ('IntersectionObserver' in window && units.length) {
      const vis = new IntersectionObserver(es => es.forEach(e => {
        const u = units.find(x => x.el === e.target);
        if (u && e.isIntersecting && !seen.has(u.id)) seen.set(u.id, Date.now());
      }), { threshold: 0 });
      units.forEach(u => vis.observe(u.el));
      const pass = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting || e.boundingClientRect.top > 0) return;
        const u = units.find(x => x.end === e.target);
        if (!u) return;
        const t0 = seen.get(u.id);
        if (t0 && Date.now() - t0 >= mins(u) * 60000 / 4) markRead(u);
      }), { rootMargin: '0px 0px -70% 0px' });
      units.forEach(u => pass.observe(u.end));
    }

    // 記住讀到哪：目前在畫面上的那一節
    const series = article.dataset.seriesTitle || '';
    const chapter = article.dataset.chapterTitle || document.title;
    let lastSave = 0;
    const remember = (force) => {
      const now = Date.now();
      if (force !== true && now - lastSave < 3000) return;
      lastSave = now;
      const cur = [...units].reverse().find(u => u.el.getBoundingClientRect().top < window.innerHeight * 0.4) || units[0];
      const nx = nextUnread();
      state.last = {
        path, series, chapter, at: now, group: article.dataset.seriesGroup || '',
        section: cur ? cur.title : '', href: cur ? path + '#' + cur.id : path,
        next: nx ? { href: path + '#' + nx.id, title: nx.title, min: mins(nx) } : null,
        next_chapter: article.dataset.nextHref || '', next_chapter_title: article.dataset.nextTitle || '',
      };
      save(state);
    };
    window.addEventListener('scroll', remember, { passive: true });
    remember();
    render();
  }

  /* ---------- 3. 系列首頁與書房：每章／每本的進度 ---------- */
  const countUnder = (prefix) => Object.keys(state.read).filter(k => k.startsWith(prefix)).length;
  document.querySelectorAll('[data-progress-path]').forEach(el => {
    const total = +el.dataset.progressUnits || 0;
    if (!total) return;
    const done = Math.min(total, countUnder(el.dataset.progressPath));
    if (!done) return;
    const box = document.createElement('span');
    box.className = 'st-mini';
    box.innerHTML = `<span class="st-mini-track"><span></span></span><span class="st-mini-n">${done === total ? '讀完了' : `${done} / ${total}`}</span>`;
    box.querySelector('.st-mini-track > span').style.width = (done / total * 100) + '%';
    (el.querySelector('[data-progress-slot]') || el).append(box);
  });

  /* ---------- 4. 書房首頁：繼續讀／今天只讀一節 ---------- */
  const resume = document.querySelector('[data-resume]');
  if (resume && state.last && state.last.href) {
    const L = state.last;
    const week = Object.entries(state.days).filter(([d]) => (Date.now() - new Date(d)) < 7 * 864e5).reduce((s, [, n]) => s + n, 0);
    const go = L.next ? L.next : (L.next_chapter ? { href: L.next_chapter, title: L.next_chapter_title, min: null } : null);
    if (L.group) resume.classList.add('series-' + L.group);
    resume.innerHTML = `
      <p class="kicker">接著讀</p>
      <a class="rs-main" href="${L.href}"><span class="rs-series">${L.series}</span><span class="rs-title">${L.chapter}</span><span class="rs-sec">上次讀到：${L.section}</span></a>
      ${go ? `<a class="rs-one" href="${go.href}">今天只讀一節就好：${go.title}${go.min ? `<span class="muted">（約 ${go.min} 分鐘）</span>` : ''}</a>` : ''}
      ${week ? `<p class="rs-week muted">這一週讀了 ${week} 節。</p>` : ''}`;
    resume.hidden = false;
  }
})();

/* ---------- 5. 系列首頁「今天試這一個」、書房「不知道從哪開始」 ---------- */
(() => {
  'use strict';
  const box = document.querySelector('[data-daily]');
  if (box) {
    let list = [];
    try { list = JSON.parse(box.querySelector('script').textContent); } catch (_) { list = []; }
    if (list.length) {
      const d = new Date().toISOString().slice(0, 10);
      let h = 0; for (const c of d + location.pathname) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      const e = list[h % list.length];
      const base = document.querySelector('.site-name').getAttribute('href');
      box.innerHTML = `<p class="kicker">今天試這一個</p><a class="ls-daily-a" href="${base}${e.path}"><span class="ls-daily-t">${e.title}</span><span class="ls-daily-d">${e.desc}</span></a><p class="muted">每天換一個。讀完就算今天有進度了。</p>`;
      box.hidden = false;
    }
  }
  const starter = document.querySelector('[data-starter]');
  if (starter) {
    let has = false;
    try { const s = JSON.parse(localStorage.getItem('cortex-study-v1')); has = !!(s && s.last); } catch (_) { has = false; }
    if (has) starter.hidden = true;
  }
})();
