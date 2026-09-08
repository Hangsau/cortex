'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('C:/claudehome/tools/node_modules/playwright');
const root = path.resolve(__dirname, '../../..');
const base = process.env.READER_URL || 'http://127.0.0.1:8768/cortex/';
const shots = path.resolve(root, '../../tmp/book-translation-trunk');
const checks = [], check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const chapters = [
  ['kinesiology', ['fixed-end', 'lateral-control', 'rotation', 'head-and-trunk']],
  ['basic-biomechanics', ['segment', 'disc-pressure', 'bending', 'load-context']]
];
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [slug, old] of chapters) {
      check(slug + ' HTTP', (await page.goto(base + 'library/' + slug + '/ch10/')).status() === 200);
      await page.locator('#rd-font-size').selectOption('22');
      const source = fs.readFileSync(path.join(root, 'content/library', slug, 'ch10/index.md'), 'utf8');
      const anchors = [...source.matchAll(/^## .+ \{#([a-z0-9-]+)\}/gm)].map(m => m[1]);
      const ids = await page.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id));
      check(slug + ' all canonical anchors', anchors.length === ids.length && anchors.every(a => ids.includes(a)), ids.length);
      check(slug + ' original anchors preserved', old.every(a => ids.includes(a)));
      check(slug + ' 320px font22 fits', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      check(slug + ' mobile TOC initially closed', await page.locator('.rd-rail details').getAttribute('open') === null);
      await page.locator('.rd-rail summary').click();
      for (const anchor of [old[0], old[2], anchors.at(-1)]) {
        await page.locator('.rd-rail a[href="#' + anchor + '"]').click();
        await page.waitForFunction(id => {
          const y = document.getElementById(id).getBoundingClientRect().top;
          return y >= 50 && y < 300;
        }, anchor, { timeout: 5000 });
        check(slug + ' TOC landing ' + anchor, new URL(page.url()).hash === '#' + anchor);
      }
      await page.locator('#' + old[0]).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(shots, slug + '-mobile.png') });
      const other = slug === 'kinesiology' ? 'basic-biomechanics' : 'kinesiology';
      const hrefs = await page.locator('.rd-prose > p a[href*="/library/' + other + '/"]').evaluateAll(es => es.map(e => e.href));
      check(slug + ' cross-book links precise', hrefs.length >= 6 && hrefs.every(h => new URL(h).hash), hrefs.length);
      const linked = await browser.newPage();
      for (const href of new Set(hrefs)) {
        const response = await linked.request.get(href);
        await linked.goto(href);
        const anchor = new URL(href).hash;
        await linked.waitForFunction(id => {
          const y = document.querySelector(id).getBoundingClientRect().top;
          return y >= 50 && y < 300;
        }, anchor, { timeout: 5000 });
        check(slug + ' cross-book target ' + new URL(href).pathname + anchor,
          response.status() === 200 && await linked.locator(anchor).count() === 1 && new URL(linked.url()).hash === anchor);
      }
      await linked.close();
    }
    for (const [slug, figureClass] of [['kinesiology', 'rd-lifting-load'], ['basic-biomechanics', 'rd-lumbar-resultant']]) {
      await page.goto(base + 'library/' + slug + '/ch10/');
      await page.locator('#rd-font-size').selectOption('22');
      for (const width of [320, 1360]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const theme of ['paper', 'night']) {
          await page.locator('#rd-color').selectOption(theme);
          const figure = page.locator('.' + figureClass);
          check(figureClass + ' fits ' + width + ' ' + theme, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          check(figureClass + ' SVG labels fit ' + width, await figure.locator('svg').evaluate(svg =>
            [...svg.querySelectorAll('text')].every(t => {
              const b = t.getBBox(), v = svg.viewBox.baseVal;
              return b.x >= 0 && b.x + b.width <= v.width && b.y >= 0 && b.y + b.height <= v.height;
            })));
          check(figureClass + ' scaled labels at least14 ' + width, await figure.locator('svg').evaluate(svg =>
            [...svg.querySelectorAll('text')].every(t => parseFloat(getComputedStyle(t).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width >= 14)));
          await figure.screenshot({ path: path.join(shots, figureClass + '-' + width + '-' + theme + '.png') });
        }
      }
    }
    const vector = await page.locator('.rd-lumbar-resultant').evaluate(el => {
      const points = selector => {
        const p = el.querySelector(selector), a = p.getPointAtLength(0), b = p.getPointAtLength(p.getTotalLength());
        return { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, x: b.x-a.x, y: b.y-a.y };
      };
      return { c: points('[data-lumbar-c]'), s: points('[data-lumbar-s]'), r: points('[data-lumbar-r]'), plane: points('[data-lumbar-plane]') };
    });
    const { c, s, r, plane } = vector, theta = 35 * Math.PI / 180;
    const C = 3850 + 650*Math.cos(theta), S = 650*Math.sin(theta), R = Math.hypot(C,S);
    check('C S perpendicular', Math.abs(c.x*s.x+c.y*s.y) < .01, vector);
    check('C S same scale as calculated forces', Math.abs(Math.hypot(c.x,c.y)/.05-C) < .01 && Math.abs(Math.hypot(s.x,s.y)/.05-S) < .01);
    check('R uses vector sum and common origin', Math.abs(c.x+s.x-r.x) < .001 && Math.abs(c.y+s.y-r.y) < .001 && c.a.x===r.a.x && c.a.y===r.a.y && Math.abs(c.b.x-s.a.x)<.001 && Math.abs(c.b.y-s.a.y)<.001);
    check('R magnitude equals4382 and373 resultant', Math.abs(Math.hypot(r.x,r.y)/.05-R) < .01);
    check('C normal to plane S points uphill', Math.abs((c.x*plane.x+c.y*plane.y)/(Math.hypot(c.x,c.y)*Math.hypot(plane.x,plane.y))) < .0001 && s.x < 0 && s.y < 0 && Math.abs(s.x*plane.y-s.y*plane.x) < .02);
    check('net reaction balances muscle and external weight', Math.abs(r.x/.05-3850*Math.sin(theta)) < .01 && Math.abs(r.y/.05+3850*Math.cos(theta)+650) < .01);
    await page.goto(base + 'library/kinesiology/ch10/');
    const demo = page.locator('[data-lifting-load]'), slider = demo.locator('input');
    check('default lifting model reproduced', (await demo.locator('output').textContent()).includes('125.6 N·m；肌力 MF＝2512 N；壓縮反作用力 RF＝3232 N'));
    await slider.press('Home');
    for (let cm=10; cm<=50; cm++) {
      if(cm>10) await slider.press('ArrowRight');
      const M=67.6+2*cm, MF=M/.05, RF=MF+720;
      const values = await demo.evaluate(el => ({
        text: el.querySelector('output').textContent,
        x: el.querySelector('[data-lift-object]').transform.baseVal.consolidate().matrix.e,
        distance: el.querySelector('[data-lift-distance]').getTotalLength()
      }));
      check('lifting keyboard '+cm+'cm formula and geometry',
        values.text.includes('力臂 '+cm+' cm') && values.text.includes(M.toFixed(1)+' N·m') && values.text.includes('MF＝'+MF.toFixed(0)+' N') && values.text.includes('RF＝'+RF.toFixed(0)+' N') && Math.abs(values.x-(40+cm*4.6))<.001 && Math.abs(values.distance-cm*4.6)<.001, values);
    }
    await slider.press('End');
    check('lifting max endpoint', await slider.inputValue()==='50');
    check('accessible label and live output', await slider.getAttribute('id') === await demo.locator('label').getAttribute('for') && await demo.locator('output').getAttribute('aria-live') === 'polite');
    check('keyboard focus visible', await slider.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
    const ctx = await browser.newContext({ javaScriptEnabled:false, viewport:{width:320,height:1000} });
    const plain = await ctx.newPage();
    for(const [slug, cls] of [['kinesiology','rd-lifting-load'],['basic-biomechanics','rd-lumbar-resultant']]) {
      await plain.goto(base+'library/'+slug+'/ch10/');
      const source = fs.readFileSync(path.join(root, 'content/library', slug, 'ch10/index.md'), 'utf8');
      const expected = [...source.matchAll(/^## .+ \{#([a-z0-9-]+)\}/gm)].map(m => m[1]);
      const actual = await plain.locator('.rd-prose > h2').evaluateAll(es => es.map(e => e.id));
      check(slug+' no-JS chapter and diagram', actual.length===expected.length && expected.every(a=>actual.includes(a)) && (await plain.locator('.'+cls+' figcaption').textContent()).length>80);
      check(slug+' no-JS fits',await plain.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      if(slug==='kinesiology') check('no-JS default retained and disabled',await plain.locator('.'+cls+' input').isDisabled() && (await plain.locator('.'+cls+' output').textContent()).includes('MF＝2512 N；壓縮反作用力 RF＝3232 N'));
    }
    await ctx.close();
    check('no runtime errors', errors.length===0, errors);
  } finally { await browser.close(); }
  const report={date:'2026-09-08',base,checks,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length};
  fs.writeFileSync(path.join(__dirname,'browser-checks.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,failed:report.failed,failures:checks.filter(c=>!c.pass)}));
  if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
