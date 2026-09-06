(() => {
  'use strict';
  const root = document.querySelector('.rd-page');
  if (!root) return;
  const outline = root.querySelector('.rd-rail details');
  if (outline) outline.open = window.matchMedia('(min-width: 801px)').matches;
  const store = {
    read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } },
    write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Reading works without storage. */ } }
  };
  const preferences = store.read('rd-preferences-v1');
  const font = document.querySelector('#rd-font-size');
  const color = document.querySelector('#rd-color');
  const apply = () => {
    if (font) root.dataset.readerSize = font.value;
    if (color) document.body.dataset.readerColor = color.value;
    store.write('rd-preferences-v1', { size: font?.value || '20', color: color?.value || 'paper' });
  };
  if (font && ['18', '20', '22'].includes(preferences?.size)) font.value = preferences.size;
  if (color && ['paper', 'night'].includes(preferences?.color)) color.value = preferences.color;
  if (font || color) { apply(); font?.addEventListener('change', apply); color?.addEventListener('change', apply); }
  const bookmarkKey = `rd-last-v1-${root.dataset.readerBook}`;
  if (root.dataset.readerPath) store.write(bookmarkKey, { path: root.dataset.readerPath, title: root.dataset.readerTitle });
  const resume = root.querySelector('.rd-resume');
  const last = store.read(bookmarkKey);
  if (resume && last && typeof last.path === 'string' && typeof last.title === 'string') {
    const target = [...root.querySelectorAll('.rd-chapter-row h3 a')].find(a => new URL(a.href).pathname === last.path);
    if (target) { resume.href = target.href; resume.textContent = `接續：${target.textContent}`; resume.hidden = false; }
  }
  const query = document.querySelector('#rd-query');
  if (query) {
    const rows = [...document.querySelectorAll('[data-reader-search]')];
    const normalize = text => text.normalize('NFKC').toLocaleLowerCase();
    let aliases = {};
    try { aliases = JSON.parse(root.dataset.readerAliases || '{}'); } catch (_) { /* Search still works without aliases. */ }
    query.form.addEventListener('submit', event => event.preventDefault());
    query.addEventListener('input', () => {
      let input = normalize(query.value.trim());
      Object.entries(aliases).forEach(([alias, target]) => { if (typeof target === 'string') input = input.replaceAll(alias, target); });
      const words = input.split(/\s+/).filter(Boolean);
      let count = 0;
      rows.forEach(row => { row.hidden = !words.every(word => normalize(row.dataset.readerSearch).includes(word)); if (!row.hidden) count++; });
      document.querySelector('#rd-result-count').textContent = words.length ? `找到 ${count} 章` : '依原書順序排列';
      document.querySelector('.rd-no-results').hidden = count !== 0;
    });
  }
  // The private preview server is the only place original pages are available.
  if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
    fetch(new URL('reader-health', new URL('../', document.currentScript?.src || document.querySelector('script[src$="reading.js"]').src)))
      .then(response => response.ok ? response.json() : null)
      .then(health => { if (health?.originals === true) document.querySelectorAll('.rd-local-sources').forEach(el => { el.hidden = false; }); })
      .catch(() => {});
  }
  const links = [...document.querySelectorAll('.rd-rail a[href^="#"]')];
  const sections = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      links.forEach(link => { if (link.hash === `#${visible[0].target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    }, { rootMargin: '-100px 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
  }
  document.querySelectorAll('[data-torque-demo]').forEach(demo => {
    const slider = demo.querySelector('input');
    const output = demo.querySelector('output');
    const force = demo.querySelector('[data-force-arrow]');
    const update = () => { const cm = Number(slider.value); const x = 90 + cm * 8; force.setAttribute('transform', `translate(${x},0)`); output.value = `力臂 ${cm} 公分 × 20 牛頓 = ${(cm / 100 * 20).toFixed(1)} 牛頓米`; };
    slider.addEventListener('input', update); update();
  });
})();
