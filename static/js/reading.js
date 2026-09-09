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
  document.querySelectorAll('[data-cervical-magnification]').forEach(demo => {
    const slider = demo.querySelector('input'), output = demo.querySelector('output');
    const update = () => {
      const percent = Number(slider.value), scale = 1 + percent / 100;
      const measured = 2.7 * scale, end = 20 + measured * 60;
      demo.querySelector('[data-image-bar]').setAttribute('d', `M20 146 H${end} M20 136 V156 M${end} 136 V156`);
      demo.querySelector('[data-image-length]').textContent = `影像長度：${measured.toFixed(2)} mm`;
      demo.querySelector('desc').textContent = `實際位移固定為2.70毫米；影像線性放大${percent}%時，影像上量得${measured.toFixed(2)}毫米。兩條線使用相同繪圖比例。`;
      output.value = `放大 ${percent}%：2.70 mm × ${scale.toFixed(2)}＝${measured.toFixed(2)} mm`;
    };
    slider.disabled = false; slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-torque-demo]').forEach(demo => {
    const slider = demo.querySelector('input');
    const output = demo.querySelector('output');
    const force = demo.querySelector('[data-force-arrow]');
    const update = () => { const cm = Number(slider.value); const x = 90 + cm * 8; force.setAttribute('transform', `translate(${x},0)`); output.value = `力臂 ${cm} 公分 × 20 牛頓 = ${(cm / 100 * 20).toFixed(1)} 牛頓米`; };
    slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-shoulder-load]').forEach(demo => {
    const slider = demo.querySelector('input');
    const output = demo.querySelector('output');
    const model = Object.fromEntries(Object.entries(demo.dataset).map(([key, value]) => [key, Number(value)]));
    const update = () => {
      const loadKg = Number(slider.value);
      const bodyWeight = model.bodyMass * model.gravity;
      const moment = model.armFraction * bodyWeight * model.armDistance + loadKg * model.gravity * model.handDistance;
      const muscleForce = moment / model.muscleArm;
      const fraction = muscleForce / bodyWeight;
      demo.querySelector('[data-load-bar]').setAttribute('d', `M30 62 H${30 + fraction * 220}`);
      output.value = `手持 ${loadKg} 公斤 → D 約 ${muscleForce.toFixed(1)} N（${fraction.toFixed(3)} BW）`;
    };
    slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-elbow-load]').forEach(demo => {
    const slider = demo.querySelector('input');
    const output = demo.querySelector('output');
    const update = () => {
      const loadKg = Number(slider.value);
      const handForce = loadKg * 10;
      const muscleForce = (20 * 13 + handForce * 30) / 5;
      const jointForce = muscleForce - 20 - handForce;
      demo.querySelector('[data-hand-force]').setAttribute('visibility', handForce > 0 ? 'visible' : 'hidden');
      demo.querySelector('[data-hand-force-label]').textContent = `P＝${handForce} N`;
      output.value = `手持 ${loadKg} 公斤 → 屈肌 M＝${muscleForce} N；關節 J＝${jointForce} N`;
    };
    slider.disabled = false;
    slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-wrist-components]').forEach(demo => {
    const slider = demo.querySelector('input');
    const output = demo.querySelector('output');
    const update = () => {
      const degrees = Number(slider.value);
      const angle = degrees * Math.PI / 180;
      const normal = 100 * Math.cos(angle), shear = 100 * Math.sin(angle);
      const nx = 150 - 1.2 * normal * Math.sin(angle), ny = 220 - 1.2 * normal * Math.cos(angle);
      const sx = 150 + 1.2 * shear * Math.cos(angle), sy = 220 - 1.2 * shear * Math.sin(angle);
      demo.querySelector('[data-wrist-plane]').setAttribute('d', `M60 ${100 + 90 * Math.tan(angle)} L240 ${100 - 90 * Math.tan(angle)}`);
      demo.querySelector('[data-wrist-normal]').setAttribute('d', `M150 220 L${nx} ${ny}`);
      const shearArrow = demo.querySelector('[data-wrist-shear]');
      shearArrow.setAttribute('d', `M150 220 L${sx} ${sy}`);
      shearArrow.setAttribute('visibility', degrees ? 'visible' : 'hidden');
      const nLabel = demo.querySelector('[data-wrist-normal-label]'), sLabel = demo.querySelector('[data-wrist-shear-label]');
      nLabel.setAttribute('x', (150 + nx) / 2 - 28); nLabel.setAttribute('y', (220 + ny) / 2 + 8);
      sLabel.setAttribute('x', sx + 12); sLabel.setAttribute('y', sy + 10);
      sLabel.setAttribute('visibility', degrees ? 'visible' : 'hidden');
      output.value = `傾角 ${degrees}° → 垂直分量 N＝${normal.toFixed(1)} N；沿面分量 S＝${shear.toFixed(1)} N`;
    };
    slider.disabled = false; slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-lifting-load]').forEach(demo => {
    const slider = demo.querySelector('input'), output = demo.querySelector('output');
    const update = () => {
      const cm = Number(slider.value), x = 40 + cm * 4.6;
      const moment = 520 * 0.13 + 200 * cm / 100;
      const muscle = moment / 0.05, reaction = muscle + 520 + 200;
      demo.querySelector('[data-lift-object]').setAttribute('transform', `translate(${x},0)`);
      demo.querySelector('[data-lift-distance]').setAttribute('d', `M40 203 H${x}`);
      demo.querySelector('[data-lift-distance-label]').textContent = `D3＝${cm} cm`;
      output.value = `力臂 ${cm} cm → 外力矩 ${moment.toFixed(1)} N·m；肌力 MF＝${muscle.toFixed(0)} N；壓縮反作用力 RF＝${reaction.toFixed(0)} N`;
    };
    slider.disabled = false; slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-lumbosacral-load]').forEach(demo => {
    const slider = demo.querySelector('input'), output = demo.querySelector('output');
    const update = () => {
      const degrees = Number(slider.value), angle = degrees * Math.PI / 180;
      const c = Math.cos(angle), s = Math.sin(angle);
      const nx = 150 - 150 * c * s, ny = 110 + 150 * c * c;
      const sx = 150 + 150 * s * c, sy = 110 + 150 * s * s;
      demo.querySelector('[data-sacral-plane]').setAttribute('d', `M${150 - 75 * c} ${110 - 75 * s} L${150 + 75 * c} ${110 + 75 * s}`);
      demo.querySelector('[data-sacral-normal]').setAttribute('d', `M150 110 L${nx} ${ny}`);
      const shear = demo.querySelector('[data-sacral-shear]');
      shear.setAttribute('d', `M150 110 L${sx} ${sy}`);
      shear.setAttribute('visibility', degrees ? 'visible' : 'hidden');
      const nLabel = demo.querySelector('[data-sacral-normal-label]'), sLabel = demo.querySelector('[data-sacral-shear-label]');
      nLabel.setAttribute('x', nx - 23); nLabel.setAttribute('y', ny + 15);
      sLabel.setAttribute('x', sx + 12); sLabel.setAttribute('y', sy + 20);
      sLabel.setAttribute('visibility', degrees ? 'visible' : 'hidden');
      output.value = `傾角 ${degrees}° → 壓縮 C＝${(100 * c).toFixed(1)} N；前向剪力 S＝${(100 * s).toFixed(1)} N`;
    };
    slider.disabled = false; slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-tendon-moments]').forEach(demo => {
    const slider = demo.querySelector('input'), output = demo.querySelector('output');
    const update = () => {
      const force = Number(slider.value);
      const moments = { pip: force * 0.75, mcp: force, wrist: force * 1.25 };
      Object.entries(moments).forEach(([joint, moment], index) => {
        const bar = demo.querySelector(`[data-moment-bar="${joint}"]`);
        bar.setAttribute('d', `M20 ${86 + index * 62} H${20 + moment * 5.5}`);
        bar.setAttribute('visibility', force ? 'visible' : 'hidden');
        demo.querySelector(`[data-moment-value="${joint}"]`).textContent = moment.toFixed(1);
      });
      output.value = `張力 ${force} N → PIP ${moments.pip.toFixed(1)}、MCP ${moments.mcp.toFixed(1)}、手腕 ${moments.wrist.toFixed(1)} N·cm`;
    };
    slider.disabled = false; slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-pulley-excursion]').forEach(demo => {
    const slider = demo.querySelector('input'), output = demo.querySelector('output');
    const update = () => {
      const arm = Number(slider.value), radius = arm * 50, radians = 1.5 / arm;
      const x = 160 + radius * Math.sin(radians), y = 135 - radius * Math.cos(radians);
      demo.querySelector('[data-excursion-circle]').setAttribute('r', radius);
      demo.querySelector('[data-excursion-radius]').setAttribute('d', `M160 135 V${135 - radius}`);
      demo.querySelector('[data-excursion-end]').setAttribute('d', `M160 135 L${x} ${y}`);
      demo.querySelector('[data-excursion-arc]').setAttribute('d', `M160 ${135 - radius} A${radius} ${radius} 0 0 1 ${x} ${y}`);
      demo.querySelector('[data-excursion-r-label]').setAttribute('y', 138 - radius / 2);
      output.value = `力臂 ${arm.toFixed(2)} cm → 轉角 ${(radians * 180 / Math.PI).toFixed(1)}°；若張力 20 N，力矩 ${(20 * arm).toFixed(1)} N·cm`;
    };
    slider.disabled = false; slider.addEventListener('input', update); update();
  });
  document.querySelectorAll('[data-pulley-load]').forEach(demo => {
    const slider = demo.querySelector('input');
    const output = demo.querySelector('output');
    const update = () => {
      const degrees = Number(slider.value), angle = degrees * Math.PI / 180;
      const dx = 80 * Math.cos(angle), dy = 80 * Math.sin(angle);
      const reaction = 20 * Math.sin(angle / 2);
      demo.querySelector('[data-pulley-distal]').setAttribute('d', `M145 165 L${145 + dx} ${165 + dy}`);
      demo.querySelector('[data-pulley-reaction]').setAttribute('d', `M145 165 L${225 - dx} ${165 - dy}`);
      const dLabel = demo.querySelector('[data-pulley-distal-label]'), rLabel = demo.querySelector('[data-pulley-reaction-label]');
      dLabel.setAttribute('x', 160 + dx); dLabel.setAttribute('y', 175 + dy);
      rLabel.setAttribute('x', 236 - dx); rLabel.setAttribute('y', 157 - dy);
      demo.querySelector('[data-pulley-angle-label]').textContent = `屈曲 ${degrees}°；肌腱夾角 ${180 - degrees}°`;
      output.value = `屈曲 ${degrees}° → 約束力 R＝${reaction.toFixed(1)} N（肌腱張力的 ${(reaction / 10).toFixed(2)} 倍）`;
    };
    slider.disabled = false; slider.addEventListener('input', update); update();
  });
})();
