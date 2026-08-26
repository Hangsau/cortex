// Cortex 首頁迴歸閘。
// 先開 `hugo server --renderToMemory`，再執行：
//   PLAYWRIGHT_PATH=<playwright path> node tools/home_audit.js
// 可選：HOME_AUDIT_SHOTS=<dir> 產出 desktop / mobile 截圖供人眼巡檢。
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const BASE_URL = process.env.HOME_URL || 'http://localhost:1313/cortex/';
const SHOT_DIR = process.env.HOME_AUDIT_SHOTS || '';
const RELATIVE_ROUTES = [
  'library/essentials-of-strength-training/',
  'library/essentials-of-strength-training/concepts/',
  'vortex/',
  'vortex/drills/',
  'vortex/instructional/',
  'vortex/technica/',
  'vortex/levels/',
  'vortex/injuries/',
  'vortex/adm/',
  'library/mind-for-numbers/',
  'library/mind-for-numbers/toolkit/',
  'library/uncommon-sense-teaching/',
  'library/uncommon-sense-teaching/handbook/',
  'library/uncommon-sense-teaching/strategies/',
  'temperament/',
  'library/',
];

function parseRGB(value) {
  const parts = String(value).match(/[\d.]+/g);
  if (!parts || parts.length < 3) return null;
  return parts.slice(0, 3).map(Number);
}

function luminance(rgb) {
  const values = rgb.map(value => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrast(foreground, background) {
  const fg = parseRGB(foreground);
  const bg = parseRGB(background);
  if (!fg || !bg) return 0;
  const [high, low] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

function seconds(value) {
  if (value.endsWith('ms')) return parseFloat(value) / 1000;
  return parseFloat(value) || 0;
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const check = (name, pass, detail = '') => results.push({ name, pass, detail });

  const homeData = fs.readFileSync(path.join(__dirname, '..', 'data', 'home.yaml'), 'utf8');
  const colors = [...homeData.matchAll(/^\s+color:\s+"([^"]+)"\s*$/gm)].map(match => match[1]);
  const urls = [...homeData.matchAll(/^\s+url:\s+"([^"]+)"\s*$/gm)].map(match => match[1]);
  const badColors = colors.filter(value => !/^#[0-9A-Fa-f]{6}$/.test(value));
  const badUrls = urls.filter(value =>
    !/^[a-z0-9][a-z0-9/-]*\/$/.test(value)
    || value.includes('//')
    || value.includes('..')
  );
  check('home.yaml 拒絕格式外色碼與 URL',
    colors.length === 4 && urls.length === 22 && badColors.length === 0 && badUrls.length === 0,
    [
      colors.length !== 4 ? `colors:${colors.length}` : '',
      urls.length !== 22 ? `urls:${urls.length}` : '',
      ...badColors.map(value => `color:${value}`),
      ...badUrls.map(value => `url:${value}`),
    ].filter(Boolean).join(', '));

  if (SHOT_DIR) fs.mkdirSync(SHOT_DIR, { recursive: true });

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    window.__homeCLS = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__homeCLS += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  if (SHOT_DIR) {
    await page.screenshot({
      path: path.join(SHOT_DIR, 'home-1280x900.png'),
      fullPage: true,
    });
  }

  const expectedPaths = RELATIVE_ROUTES.map(route => new URL(route, BASE_URL).pathname).sort();
  const structure = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('.home-page h1, .home-page h2, .home-page h3')];
    const headingLevels = headings.map(heading => Number(heading.tagName.slice(1)));
    const anchors = [...document.querySelectorAll('.home-page a')];
    const canonicalAnchors = [...document.querySelectorAll(
      '.home-primary-link, .home-secondary-link, .home-footer-link'
    )];
    const quickAnchors = [...document.querySelectorAll('.home-quick')];
    const pathCounts = {};
    for (const anchor of anchors) {
      const route = new URL(anchor.href).pathname;
      pathCounts[route] = (pathCounts[route] || 0) + 1;
    }
    const canonicalPathCounts = {};
    for (const anchor of canonicalAnchors) {
      const route = new URL(anchor.href).pathname;
      canonicalPathCounts[route] = (canonicalPathCounts[route] || 0) + 1;
    }
    return {
      h1Count: document.querySelectorAll('.home-page h1').length,
      h1Text: document.querySelector('.home-page h1')?.textContent.trim() || '',
      headingLevels,
      quickCount: document.querySelectorAll('.home-quick').length,
      domainCount: document.querySelectorAll('.home-domain').length,
      detailsCount: document.querySelectorAll('.home-secondary').length,
      openDetails: document.querySelectorAll('.home-secondary[open]').length,
      pathCounts,
      canonicalPathCounts,
      quickPaths: quickAnchors.map(anchor => new URL(anchor.href).pathname),
      anchorCount: anchors.length,
      inlineStyleCount: document.querySelectorAll('.home-page [style]').length,
      scriptCount: document.querySelectorAll('.home-page script').length,
      cls: window.__homeCLS || 0,
      pageRatio: document.querySelector('.home-page').scrollHeight / innerHeight,
    };
  });

  const actualPaths = Object.keys(structure.pathCounts).sort();
  const canonicalPaths = Object.keys(structure.canonicalPathCounts).sort();
  const missingPaths = expectedPaths.filter(route => !canonicalPaths.includes(route));
  const unknownCanonical = canonicalPaths.filter(route => !expectedPaths.includes(route));
  const repeatedCanonical = Object.entries(structure.canonicalPathCounts)
    .filter(([, count]) => count !== 1);
  const unknownPaths = actualPaths.filter(route => !expectedPaths.includes(route));
  const badDuplicate = Object.entries(structure.pathCounts)
    .filter(([, count]) => count < 1 || count > 2);
  const quickPathsValid = structure.quickPaths.length === 6
    && new Set(structure.quickPaths).size === 6
    && structure.quickPaths.every(route => expectedPaths.includes(route));
  const headingSkip = structure.headingLevels.some((level, index, all) =>
    index > 0 && level > all[index - 1] + 1
  );

  check('首頁只有一個 h1', structure.h1Count === 1, String(structure.h1Count));
  check('h1 不重複 nav 的 Cortex 字標', structure.h1Text !== 'Cortex', structure.h1Text);
  check('標題層級不跳級', !headingSkip, structure.headingLevels.join('→'));
  check('首屏是 6 個不重複的 canonical 任務捷徑',
    structure.quickCount === 6 && quickPathsValid, String(structure.quickCount));
  check('四個領域完整渲染', structure.domainCount === 4, String(structure.domainCount));
  check('次要入口預設全部收合', structure.detailsCount === 3 && structure.openDetails === 0,
    `${structure.openDetails}/${structure.detailsCount} 展開`);
  check('16 個 canonical 目的地各自只定義一次',
    missingPaths.length === 0 && unknownCanonical.length === 0 && repeatedCanonical.length === 0,
    [
      ...missingPaths.map(route => `missing:${route}`),
      ...unknownCanonical.map(route => `unknown:${route}`),
      ...repeatedCanonical.map(([route, count]) => `repeat:${route}×${count}`),
    ].join(', '));
  check('首頁沒有規格外目的地', unknownPaths.length === 0,
    unknownPaths.join(', '));
  check('捷徑最多只與 canonical 入口重複一次', badDuplicate.length === 0,
    badDuplicate.map(([route, count]) => `${route}×${count}`).join(', '));
  check('首頁沒有 style attribute', structure.inlineStyleCount === 0,
    String(structure.inlineStyleCount));
  check('首頁沒有 JavaScript', structure.scriptCount === 0, String(structure.scriptCount));
  check('字型載入後 CLS ≤ 0.1', structure.cls <= 0.1, structure.cls.toFixed(3));

  const colorPairs = await page.evaluate(() => {
    const selectors = [
      '.home-hero h1',
      '.home-hero-lede',
      '.home-quick-name',
      '.home-quick-note',
      '.home-index-heading > p',
      '.home-domain-lede',
      '.home-domain-spec',
      '.home-primary-name',
      '.home-primary-note',
      '.home-secondary-name',
      '.home-secondary-note',
    ];
    function backgroundFor(element) {
      let current = element;
      while (current) {
        const color = getComputedStyle(current).backgroundColor;
        const alpha = color.match(/[\d.]+/g)?.[3];
        if (!color.startsWith('rgba') || Number(alpha) > 0) return color;
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    }
    return selectors.map(selector => {
      const element = document.querySelector(selector);
      if (!element) return { selector, missing: true };
      const style = getComputedStyle(element);
      return {
        selector,
        missing: false,
        foreground: style.color,
        background: backgroundFor(element),
        fontSize: parseFloat(style.fontSize),
        fontWeight: parseInt(style.fontWeight, 10) || 400,
      };
    });
  });

  const badTextContrast = colorPairs.filter(pair => {
    if (pair.missing) return true;
    const large = pair.fontSize >= 24 || (pair.fontSize >= 18.67 && pair.fontWeight >= 700);
    return contrast(pair.foreground, pair.background) < (large ? 3 : 4.5);
  });
  check('代表性文字全部達 WCAG AA', badTextContrast.length === 0,
    badTextContrast.map(pair => pair.selector).join(', '));

  const typography = await page.evaluate(() => {
    const selectors = ['.home-hero-lede', '.home-domain-lede'];
    const samples = selectors.map(selector => {
      const style = getComputedStyle(document.querySelector(selector));
      return {
        selector,
        size: parseFloat(style.fontSize),
        lineHeight: parseFloat(style.lineHeight),
      };
    });
    const fontSizes = [...new Set(
      [...document.querySelectorAll('.home-page *')]
        .filter(element => [...element.childNodes].some(node =>
          node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        ))
        .map(element => parseFloat(getComputedStyle(element).fontSize))
    )].sort((a, b) => a - b);
    return { samples, fontSizes };
  });
  const badBodyType = typography.samples.filter(item =>
    item.size < 16 || item.lineHeight / item.size < 1.7
  );
  check('CJK 內文 ≥16px、行高 ≥1.7，且全頁字級不超過四種',
    badBodyType.length === 0 && typography.fontSizes.length <= 4,
    [
      ...badBodyType.map(item => `${item.selector}:${item.size}/${item.lineHeight}`),
      `sizes:${typography.fontSizes.join('/')}`,
    ].join(', '));

  const linkResults = [];
  for (const route of expectedPaths) {
    const response = await page.request.get(new URL(route, BASE_URL).href);
    linkResults.push({ route, status: response.status(), ok: response.ok() });
  }
  const deadLinks = linkResults.filter(item => !item.ok);
  check('16 個站內目的地全部可回應', deadLinks.length === 0,
    deadLinks.map(item => `${item.route}:${item.status}`).join(', '));

  const summaries = page.locator('.home-secondary summary');
  for (let index = 0; index < await summaries.count(); index++) {
    await summaries.nth(index).click();
  }
  const detailState = await page.evaluate(() => ({
    allOpen: [...document.querySelectorAll('.home-secondary')].every(detail => detail.open),
    nestedDetails: document.querySelectorAll('.home-secondary .home-secondary').length,
    secondaryLinks: document.querySelectorAll('.home-secondary-link').length,
  }));
  check('原生 details 可展開全部次要入口',
    detailState.allOpen && detailState.nestedDetails === 0 && detailState.secondaryLinks === 10,
    `${detailState.secondaryLinks} links`);

  const targetSizes = await page.evaluate(() =>
    [...document.querySelectorAll('.home-page a, .home-page summary')]
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map(element => {
        const rect = element.getBoundingClientRect();
        return {
          text: (element.textContent || '').trim().slice(0, 24),
          width: rect.width,
          height: rect.height,
        };
      })
  );
  const smallTargets = targetSizes.filter(target => target.width < 24 || target.height < 24);
  check('首頁可見點擊目標皆 ≥24×24px', smallTargets.length === 0,
    smallTargets.map(target => `${target.text}:${Math.round(target.width)}×${Math.round(target.height)}`).join(', '));

  await page.evaluate(() => document.activeElement?.blur());
  const focusResults = [];
  const seenInteractive = new Set();
  for (let index = 0; index < 40; index++) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const active = document.activeElement;
      const all = [...document.querySelectorAll('a, summary')];
      const itemIndex = all.indexOf(active);
      if (!active || !active.closest('.home-page')) return { inHome: false, itemIndex };
      const style = getComputedStyle(active);
      let parent = active;
      let background = 'rgba(0, 0, 0, 0)';
      while (parent) {
        background = getComputedStyle(parent).backgroundColor;
        const alpha = background.match(/[\d.]+/g)?.[3];
        if (!background.startsWith('rgba') || Number(alpha) > 0) break;
        parent = parent.parentElement;
      }
      return {
        inHome: true,
        itemIndex,
        text: (active.textContent || '').trim().slice(0, 24),
        outlineWidth: parseFloat(style.outlineWidth),
        outlineColor: style.outlineColor,
        background,
      };
    });
    if (state.inHome && !seenInteractive.has(state.itemIndex)) {
      seenInteractive.add(state.itemIndex);
      focusResults.push(state);
    }
    if (seenInteractive.size === 25) break;
  }
  const badFocus = focusResults.filter(item =>
    item.outlineWidth < 2 || contrast(item.outlineColor, item.background) < 3
  );
  check('25 個首頁互動元件皆有可見 focus ring',
    seenInteractive.size === 25 && badFocus.length === 0,
    `${seenInteractive.size}/25；${badFocus.map(item => item.text).join(', ')}`);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedDuration = await page.$eval('.home-secondary-mark', element =>
    getComputedStyle(element, '::after').transitionDuration
  );
  check('prefers-reduced-motion 會停用轉場', seconds(reducedDuration) <= 0.001,
    reducedDuration);
  await page.close();

  async function auditViewport(width, height, filename) {
    const viewportPage = await browser.newPage({ viewport: { width, height } });
    await viewportPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await viewportPage.evaluate(() => document.fonts.ready);
    const metrics = await viewportPage.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      pageRatio: document.querySelector('.home-page').scrollHeight / innerHeight,
      heroQuickVisible: [...document.querySelectorAll('.home-quick')].every(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && rect.width > 0 && rect.height >= 24;
      }),
    }));
    if (SHOT_DIR) {
      await viewportPage.screenshot({
        path: path.join(SHOT_DIR, filename),
        fullPage: true,
      });
    }
    await viewportPage.close();
    return metrics;
  }

  const tablet = await auditViewport(768, 900, 'home-768x900.png');
  const mobile = await auditViewport(390, 844, 'home-390x844.png');
  const zoom400 = await auditViewport(320, 800, 'home-320x800.png');
  for (const [label, metrics] of [
    ['768px', tablet],
    ['390px', mobile],
    ['320px', zoom400],
  ]) {
    check(`${label} 無水平溢出`, !metrics.overflow,
      `${metrics.width}/${metrics.viewport}`);
    check(`${label} 六個常用任務仍可見`, metrics.heroQuickVisible, '');
  }
  check('390px 首頁主要內容不超過三個 viewport', mobile.pageRatio <= 3,
    mobile.pageRatio.toFixed(2));
  check('320px／400% zoom 主要內容不超過三個 viewport', zoom400.pageRatio <= 3,
    zoom400.pageRatio.toFixed(2));

  await browser.close();

  let failures = 0;
  for (const result of results) {
    if (!result.pass) failures++;
    console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
  }
  console.log(`\n${results.length - failures}/${results.length} 通過`);
  process.exit(failures ? 1 : 0);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
