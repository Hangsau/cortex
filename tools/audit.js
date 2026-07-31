// 章節頁版型迴歸閘：先開 `hugo server`，再 `node tools/audit.js`（需 npm i playwright）。
// 存在理由：重新設計最容易退化成「換配色」，這裡的斷言全部是數值，改壞了會 FAIL。
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
// 主要指向 ch01：它是補完後的樣板章，深度層（術語／數字／延伸）只有在這裡才驗得到；
// 最後一段另外驗概念索引頁（跨章節閱讀軸）。
const URL = 'http://localhost:1313/cortex/library/essentials-of-strength-training/ch01/';

function lum(rgb) {
  const [r, g, b] = rgb.map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const parse = s => s.match(/\d+/g).slice(0, 3).map(Number);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(URL, { waitUntil: 'networkidle' });

  const html = await page.content();
  const out = [];
  const chk = (name, pass, detail) => out.push({ name, pass, detail });

  chk('3×3 網格已從內容區消失', !/repeat\(3,\s*1fr\)/.test(await page.evaluate(
    () => Array.from(document.styleSheets).flatMap(s => { try { return Array.from(s.cssRules).map(r => r.cssText); } catch { return []; } }).join('')
  )), '');
  chk('showSub / goBack 頁面切換已刪除', !/showSub|goBack/.test(html), '');
  chk('中央重複標題格已刪除', !/cell center|class="cell/.test(html), '');
  chk('黏性目次存在', await page.$$eval('.nb-toc', e => e.length === 1), '');

  const m = await page.evaluate(() => {
    const g = (sel, p) => getComputedStyle(document.querySelector(sel))[p];
    const body = getComputedStyle(document.body).backgroundColor;
    return {
      aSize: g('.nb-a', 'fontSize'), aColor: g('.nb-a', 'color'), aLH: g('.nb-a', 'lineHeight'),
      qSize: g('.nb-q', 'fontSize'), qColor: g('.nb-q', 'color'),
      bodyBg: body,
      measure: document.querySelector('.nb-body').getBoundingClientRect().width,
      modeBox: (() => { const r = document.querySelector('.nb-mode').getBoundingClientRect(); return [r.width, r.height]; })(),
      bulletCount: document.querySelectorAll('.nb-a li').length,
      colorSet: [...new Set([...document.querySelectorAll('[style*="color"]')].map(e => e.getAttribute('style')))].length,
    };
  });

  const bg = parse(m.bodyBg);
  chk('內文字級 ≥16px（鐵則 C）', parseFloat(m.aSize) >= 16, m.aSize);
  chk('內文對比 ≥4.5:1（鐵則 E）', ratio(parse(m.aColor), bg) >= 4.5, ratio(parse(m.aColor), bg).toFixed(2) + ':1');
  chk('標題對比 ≥4.5:1', ratio(parse(m.qColor), bg) >= 4.5, ratio(parse(m.qColor), bg).toFixed(2) + ':1');
  chk('CJK 行高 ≥1.7（鐵則 D）', parseFloat(m.aLH) / parseFloat(m.aSize) >= 1.7, (parseFloat(m.aLH) / parseFloat(m.aSize)).toFixed(2));
  chk('CJK 行長 25–40 字（鐵則 D）', m.measure / parseFloat(m.aSize) >= 25 && m.measure / parseFloat(m.aSize) <= 40, (m.measure / parseFloat(m.aSize)).toFixed(1) + ' 字');
  chk('可點目標 ≥24×24（鐵則 E）', m.modeBox[0] >= 24 && m.modeBox[1] >= 24, m.modeBox.map(Math.round).join('×'));
  chk('「；」已拆成條列', m.bulletCount > 0, m.bulletCount + ' 條');
  chk('layout 內無 inline 色彩硬編', m.colorSet === 0, m.colorSet + ' 處');

  // 深度層（術語／數字／延伸）：使用者列的三個學習障礙，斷言化成數值
  const d = await page.evaluate(() => {
    const txt = e => (e.textContent || '').trim();
    const terms = [...document.querySelectorAll('.nb-term')];
    const hidden = terms.filter(e => {
      const s = getComputedStyle(e);
      return s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0 || e.closest('details');
    }).length;
    const zhLess = terms.filter(e => !e.querySelector('b') || !txt(e.querySelector('b'))).length;
    const gloss = [...document.querySelectorAll('.nb-gloss-en')];
    const emptyGloss = gloss.filter(e => !txt(e)).length;
    const nums = [...document.querySelectorAll('.nb-nums li')];
    const badNums = nums.filter(li => {
      const u = li.querySelector('.nb-num-u'), o = li.querySelector('.nb-num-of');
      return !u || !o || !txt(u) || !txt(o);
    }).length;
    const rels = [...document.querySelectorAll('.nb-rel a')];
    const deadRels = rels.filter(a => {
      const u = new URL(a.href);
      if (u.pathname !== location.pathname) return false;
      return !u.hash || !document.getElementById(decodeURIComponent(u.hash.slice(1)));
    }).length;
    const emptyRels = rels.filter(a => !txt(a)).length;
    return {
      termCount: terms.length, hidden, zhLess,
      glossCount: gloss.length, emptyGloss,
      numCount: nums.length, badNums,
      relCount: rels.length, deadRels, emptyRels,
      openByDefault: document.querySelectorAll('details[open]').length,
      detailCount: document.querySelectorAll('.nb-detail').length,
    };
  });

  chk('術語中英對照常駐可見（不靠 hover / 不藏在 details）',
      d.termCount > 0 && d.hidden === 0, d.termCount + ' 條，' + d.hidden + ' 條被藏');
  chk('每條術語都有中文', d.termCount > 0 && d.zhLess === 0, d.zhLess + ' 條缺中文');
  chk('縮寫在詞條展開後有全稱', d.glossCount > 0 && d.emptyGloss === 0, d.glossCount + ' 條，' + d.emptyGloss + ' 條空白');
  chk('每個數字都有單位與所指', d.numCount > 0 && d.badNums === 0, d.numCount + ' 個，' + d.badNums + ' 個不完整');
  chk('延伸連結全部指得到（同頁錨點）', d.relCount > 0 && d.deadRels === 0, d.relCount + ' 條，' + d.deadRels + ' 條斷鏈');
  chk('延伸連結有可讀標題（非裸 id）', d.relCount > 0 && d.emptyRels === 0, d.emptyRels + ' 條空白');
  chk('細節預設收合（漸進揭露）', d.detailCount > 0 && d.openByDefault === 0, d.detailCount + ' 個，' + d.openByDefault + ' 個預設展開');

  // 模式切換零版面位移（鐵則 I）
  const before = await page.$$eval('.nb-q', els => els.map(e => Math.round(e.getBoundingClientRect().top)));
  await page.click('.nb-mode[data-mode="quiz"]');
  await page.waitForTimeout(250);
  const after = await page.$$eval('.nb-q', els => els.map(e => Math.round(e.getBoundingClientRect().top)));
  chk('遮答切換零版面位移（鐵則 I / CLS）', JSON.stringify(before) === JSON.stringify(after), before.length + ' 個錨點');

  // 遮答後答案不可讀、可點開
  const masked = await page.$eval('.nb-a', e => getComputedStyle(e).color);
  chk('自測模式答案已遮蔽', masked.includes('rgba(0, 0, 0, 0)'), masked);
  await page.click('.nb-a');
  await page.waitForTimeout(150);
  const revealed = await page.$eval('.nb-a', e => getComputedStyle(e).color);
  chk('點擊可揭露答案', !revealed.includes('rgba(0, 0, 0, 0)'), revealed);

  // 鍵盤焦點指示
  await page.keyboard.press('Tab');
  const hasOutline = await page.evaluate(() => {
    const el = document.activeElement;
    const o = getComputedStyle(el).outlineWidth;
    return el && parseFloat(o) > 0;
  });
  chk('鍵盤焦點有可見指示（鐵則 I）', hasOutline, '');

  // 長章節讀到一半，換章 / 回書目不必捲回頁首
  await page.click('.nb-mode[data-mode="read"]');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await page.waitForTimeout(300);
  // 首末章各少一個方向的換章鈕，所以斷言是「畫出來的全都還在」，不是寫死 3
  const midNav = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.nb-toc-up, .nb-toc-step')];
    const seen = els.filter(e => {
      const r = e.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0 && r.width > 0;
    }).length;
    return { total: els.length, seen };
  });
  chk('捲到中段仍可換章 / 回書目（不必回頁首）',
      midNav.total >= 2 && midNav.seen === midNav.total, midNav.seen + '/' + midNav.total + ' 常駐');
  chk('章末有接續導航', await page.$$eval('.nb-end-card', e => e.length >= 1), '');

  // 延伸連結點進去要真的落在那一條上，而且細節已展開——否則使用者只看到一個標題。
  // 用真的 click 而不是 goto：全站 scroll-behavior:smooth 下，「捲到一半又點連結」
  // 才會暴露動畫互搶的落點漂移，goto 驗不出來。
  const anchorId = await page.evaluate(() => {
    const a = [...document.querySelectorAll('.nb-rel a')].find(x => new URL(x.href).pathname === location.pathname);
    a.click();
    return decodeURIComponent(new URL(a.href).hash.slice(1));
  });
  await page.waitForTimeout(900);
  const land = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return { ok: false, why: '找不到目標' };
    const r = el.getBoundingClientRect();
    const d = el.querySelector('details');
    return { top: Math.round(r.top), inView: r.top >= 0 && r.top < innerHeight * 0.6, open: !!(d && d.open) };
  }, anchorId);
  chk('跳到延伸連結會落在該條上', land.inView, anchorId + ' @ ' + land.top + 'px');
  chk('跳過去時細節已展開', land.open, '');

  await page.close();

  // 手機：目次收成橫向膠囊列，換章收成箭頭鈕
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto(URL, { waitUntil: 'networkidle' });
  await mob.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await mob.waitForTimeout(400);
  const m2 = await mob.evaluate(() => {
    const r = document.querySelector('.nb-toc-step[rel=next]').getBoundingClientRect();
    const here = document.querySelector('.nb-toc-list a.is-here');
    const list = document.querySelector('.nb-toc-list');
    let inView = false;
    if (here && list) {
      const hr = here.getBoundingClientRect(), lr = list.getBoundingClientRect();
      inView = hr.left >= lr.left - 1 && hr.right <= lr.right + 1;
    }
    return { w: r.width, h: r.height, top: r.top, inView, ox: document.documentElement.scrollWidth > innerWidth };
  });
  chk('手機換章鈕 ≥24×24（鐵則 E）', m2.w >= 24 && m2.h >= 24, Math.round(m2.w) + '×' + Math.round(m2.h));
  chk('手機換章鈕黏在視窗內', m2.top >= 0 && m2.top < 844, Math.round(m2.top) + 'px');
  chk('手機膠囊列跟隨目前主題', m2.inView, '');
  chk('手機無橫向溢出', !m2.ox, '');

  await mob.close();

  // ---- 概念索引頁：打散章節、照概念讀的那條軸 ----
  const CURL = 'http://localhost:1313/cortex/library/essentials-of-strength-training/concepts/';
  const cp = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await cp.goto(CURL, { waitUntil: 'networkidle' });
  const c = await cp.evaluate(() => {
    const secs = [...document.querySelectorAll('.nb-topic')];
    const spans = secs.map(s => s.querySelectorAll('details').length);
    const links = [...document.querySelectorAll('.nb-hits a')];
    const dead = links.filter(a => {
      const u = new URL(a.href);
      return !u.hash || !/\/ch\d\d\/$/.test(u.pathname);
    }).length;
    return {
      secCount: secs.length,
      tocCount: document.querySelectorAll('.nb-toc [data-toc]').length,
      minSpan: spans.length ? Math.min(...spans) : 0,
      linkCount: links.length,
      dead,
      empty: links.filter(a => !(a.textContent || '').trim()).length,
      open: document.querySelectorAll('details[open]').length,
      ids: secs.map(s => s.id),
    };
  });
  chk('概念索引：側欄與內文條數一致', c.secCount > 0 && c.secCount === c.tocCount,
      c.secCount + ' 條 / 側欄 ' + c.tocCount + ' 條');
  chk('每條概念都橫跨 ≥2 章（單章概念＝把該章抄一遍）', c.minSpan >= 2, '最少 ' + c.minSpan + ' 章');
  chk('概念落點全部指得到章內錨點', c.linkCount > 0 && c.dead === 0, c.linkCount + ' 條，' + c.dead + ' 條斷鏈');
  chk('概念落點有可讀標題（非裸 id）', c.linkCount > 0 && c.empty === 0, c.empty + ' 條空白');
  chk('概念頁預設全收合（漸進揭露）', c.open === 0, c.open + ' 個預設展開');

  // 章節頁的概念標籤必須真的能把人帶到概念頁的那一段
  const cp2 = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await cp2.goto(URL, { waitUntil: 'networkidle' });
  const chips = await cp2.evaluate(() => [...document.querySelectorAll('a.nb-con')].map(a => ({
    hash: decodeURIComponent(new URL(a.href).hash.slice(1)),
    path: new URL(a.href).pathname,
  })));
  await cp2.close();
  const chipOK = chips.length > 0 && chips.every(x => x.path.endsWith('/concepts/') && c.ids.includes(x.hash));
  chk('章節頁概念標籤指得到概念索引', chipOK, chips.length + ' 個標籤');

  await cp.goto(CURL + '#' + (chips[0] || { hash: c.ids[0] }).hash, { waitUntil: 'networkidle' });
  await cp.waitForTimeout(600);
  const cland = await cp.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return { inView: false, open: false };
    const r = el.getBoundingClientRect();
    const d = el.querySelector('details');
    return { top: Math.round(r.top), inView: r.top >= 0 && r.top < innerHeight * 0.6, open: !!(d && d.open) };
  }, (chips[0] || { hash: c.ids[0] }).hash);
  chk('從概念標籤跳過去會落在該概念且首章已展開', cland.inView && cland.open,
      (chips[0] || { hash: c.ids[0] }).hash + ' @ ' + cland.top + 'px');

  await browser.close();

  let bad = 0;
  for (const r of out) {
    if (!r.pass) bad++;
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
  }
  console.log(`\n${out.length - bad}/${out.length} 通過`);
  process.exit(bad ? 1 : 0);
})();
