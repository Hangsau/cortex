// 章節頁版型迴歸閘：先開 `hugo server`，再 `node tools/audit.js`（需 npm i playwright）。
// 存在理由：重新設計最容易退化成「換配色」，這裡的斷言全部是數值，改壞了會 FAIL。
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const URL = 'http://localhost:1313/cortex/library/essentials-of-strength-training/ch22/';

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

  await browser.close();

  let bad = 0;
  for (const r of out) {
    if (!r.pass) bad++;
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
  }
  console.log(`\n${out.length - bad}/${out.length} 通過`);
  process.exit(bad ? 1 : 0);
})();
