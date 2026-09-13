'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('C:/claudehome/tools/node_modules/playwright');
const root = path.resolve(__dirname, '../../..');
const base = process.env.READER_URL || 'http://127.0.0.1:8768/cortex/';
const shots = path.resolve(root, '../../tmp/book-translation-gait/screenshots');
const chapters = ['kinesiology/ch15', 'basic-biomechanics/ch17'];
const originals = [['cycle', 'weight-acceptance', 'swing', 'gait-measurement'], ['gait-events', 'measurements', 'moments', 'power']];
const reference = ['kinesiology/ch14', 'basic-biomechanics/ch09'];
const checks = [], check = (name, pass, detail) => checks.push({name, pass:Boolean(pass), detail});
const anchors = chapter => [...fs.readFileSync(path.join(root, 'content/library', chapter, 'index.md'), 'utf8')
  .matchAll(/^## .+ \{#([a-z0-9-]+)\}/gm)].map(m=>m[1]);
const styles = page => page.evaluate(() => {
  const result = {};
  for (const selector of ['.rd-page', '.rd-prose > p', '.rd-prose > h2', '.rd-rail']) {
    const style=getComputedStyle(document.querySelector(selector));
    result[selector]=Object.fromEntries(['fontFamily','fontSize','lineHeight','color','backgroundColor'].map(p=>[p,style[p]]));
  }
  return result;
});
(async()=>{
  fs.mkdirSync(shots,{recursive:true});
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:320,height:1000}});
    const errors=[], targets=new Map(), prose=new Map();
    page.on('pageerror',e=>errors.push(e.message));
    for (const [i,chapter] of chapters.entries()) {
      check(chapter+' HTTP',(await page.goto(base+'library/'+chapter+'/')).status()===200);
      await page.locator('#rd-font-size').selectOption('22');
      const expected=anchors(chapter);
      const ids=await page.locator('.rd-prose > h2').evaluateAll(es=>es.map(e=>e.id));
      check(chapter+' full canonical heading order',JSON.stringify(ids)===JSON.stringify(expected),ids.length);
      check(chapter+' original four anchors',originals[i].every(id=>ids.includes(id)));
      prose.set(chapter,await page.locator('.rd-prose > p').allTextContents());
      for(const href of await page.locator('.rd-prose a[href*="/library/"]').evaluateAll(es=>es.map(e=>e.href))) {
        if(new URL(href).hash) targets.set(href,chapter);
      }
      check(chapter+' mobile TOC closed',await page.locator('.rd-rail details').getAttribute('open')===null);
      await page.locator('.rd-rail summary').click();
      for(const anchor of [...new Set([...originals[i],expected[Math.floor(expected.length/2)],expected.at(-1)])]) {
        await page.locator('.rd-rail a[href="#'+anchor+'"]').click();
        await page.waitForFunction(id=>{const y=document.getElementById(id).getBoundingClientRect().top;return y>=50&&y<300;},anchor);
        check(chapter+' TOC landing '+anchor,new URL(page.url()).hash==='#'+anchor);
      }
      for(const width of [320,390,1360]) {
        await page.setViewportSize({width,height:1000});
        for(const theme of ['paper','night']) {
          await page.goto(base+'library/'+reference[i]+'/');
          await page.locator('#rd-color').selectOption(theme);
          const expectedStyle=await styles(page);
          await page.goto(base+'library/'+chapter+'/');
          check(chapter+' unchanged reader styles '+width+theme,JSON.stringify(await styles(page))===JSON.stringify(expectedStyle));
          check(chapter+' font22 fits '+width+theme,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
          if(width===320) {
            await page.locator('#'+expected[Math.floor(expected.length/3)]).scrollIntoViewIfNeeded();
            await page.screenshot({path:path.join(shots,chapter.replace('/','-')+'-'+theme+'.png')});
          }
          if(width===1360&&theme==='paper') await page.screenshot({path:path.join(shots,chapter.replace('/','-')+'-desktop.png')});
        }
      }
      await page.setViewportSize({width:320,height:1000});
    }
    for(const [href,source] of targets) {
      check('cross-link HTTP '+href,(await page.request.get(href)).status()===200);
      await page.goto(base+'library/'+source+'/');
      const target=new URL(href),anchor=target.hash;
      await page.locator('.rd-prose a[href$="'+target.pathname+anchor+'"]').first().click();
      await page.waitForFunction(id=>{const y=document.querySelector(id)?.getBoundingClientRect().top;return y>=50&&y<300;},anchor);
      check('cross-link landing '+target.pathname+anchor,await page.locator(anchor).count()===1);
    }
    const ctx=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:1000}});
    const plain=await ctx.newPage();
    for(const chapter of chapters) {
      await plain.goto(base+'library/'+chapter+'/');
      check(chapter+' no-JS full headings',JSON.stringify(await plain.locator('.rd-prose > h2').evaluateAll(es=>es.map(e=>e.id)))===JSON.stringify(anchors(chapter)));
      check(chapter+' no-JS full paragraphs',JSON.stringify(await plain.locator('.rd-prose > p').allTextContents())===JSON.stringify(prose.get(chapter)));
      check(chapter+' no-JS fits',await plain.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    await ctx.close();
    check('no runtime errors',errors.length===0,errors);
  }finally{await browser.close();}
  const report={checked_at:new Date().toISOString(),base,checks,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length};
  fs.writeFileSync(path.join(__dirname,'browser-checks.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,failed:report.failed,failures:checks.filter(c=>!c.pass)}));
  if(report.failed) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
