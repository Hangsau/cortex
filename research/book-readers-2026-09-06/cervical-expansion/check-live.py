"""Compare deployed cervical readers with the accepted local build."""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import re
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[3]
BASE = 'https://hangsau.github.io/cortex/'
PREVIEW = ROOT.parent.parent / 'tmp/musculoskeletal-reader-preview'
# Reuse the established minification-tolerant HTML parser without modifying it.
spec = importlib.util.spec_from_file_location('reader_live', Path(__file__).parent.parent / 'trunk-expansion/check-live.py')
reader_live = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader_live)
Page = reader_live.Page


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--commit', required=True)
    parser.add_argument('--run-url', required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', args.commit):
        parser.error('Supply the full implementation SHA')
    checks, cache = [], {}

    def check(name, passed, detail=None):
        checks.append({'name': name, 'pass': bool(passed), 'detail': detail})

    def fetch(url):
        if url not in cache:
            req = Request(url, headers={'User-Agent': 'Cortex-reader-verification', 'Cache-Control': 'no-cache'})
            with urlopen(req, timeout=30) as response:
                cache[url] = response.read().decode('utf-8')
                check('HTTP ' + url, response.status == 200)
        return cache[url]

    for chapter in ['basic-biomechanics/ch11', 'kinesiology/ch09', 'kinesiology/ch10']:
        relative = 'library/' + chapter + '/'
        url = urljoin(BASE, relative)
        raw = fetch(url)
        live = Page(raw)
        local = Page((PREVIEW / relative / 'index.html').read_text(encoding='utf-8'))
        canonical = (ROOT / 'content' / relative / 'index.md').read_text(encoding='utf-8')
        expected = re.findall(r'^## .+ \{#([a-z0-9-]+)\}', canonical, re.M)
        sources = len(re.findall(r'\{\{<\s+reading-source\b', canonical))
        check(chapter + ' headings in order', live.headings == expected, len(live.headings))
        check(chapter + ' full prose equals accepted local build', live.prose() == local.prose(),
              {'characters': len(live.prose()), 'sha256': hashlib.sha256(live.prose().encode()).hexdigest()})
        check(chapter + ' original source links hidden and no original media',
              len(live.local_sources) == sources > 0 and all(live.local_sources) and
              '127.0.0.1' not in raw and 'resources/books/' not in raw and
              not any('/originals/' in src for src in live.embeds), sources)
        if chapter.startswith('basic'):
            check('new magnification diagram', 'rd-cervical-magnification' in live.classes)
            sliders = [a for a in live.inputs.values() if a.get('type') == 'range']
            check('default magnification slider and disabled no-JS state', len(sliders) == 1 and
                  all(sliders[0].get(k) == v for k, v in {'min': '0', 'max': '40', 'step': '1', 'value': '30'}.items()) and 'disabled' in sliders[0])
            check('default scale calculation', '2.70mm×1.30＝3.51mm' in live.prose())
            check('original four headings', all(a in live.ids for a in ['upper-cervical', 'six-directions', 'stability', 'measurement-context']))
        other = 'kinesiology' if chapter.startswith('basic') else 'basic-biomechanics'
        def cross(links):
            return {urlsplit(urljoin(url, h)).path + '#' + urlsplit(h).fragment for h in links if '/library/' + other + '/' in h and '#' in h}
        check(chapter + ' cross-book links match', cross(live.links) == cross(local.links), len(cross(live.links)))
        for target in sorted(cross(live.links)):
            parts = urlsplit(urljoin(BASE, target))
            check('cross-book anchor ' + target, parts.fragment in Page(fetch(parts._replace(fragment='').geturl())).ids)
    for asset in ['css/reading.css', 'js/reading.js']:
        public = fetch(urljoin(BASE, asset)).replace('\r\n', '\n')
        local = (ROOT / 'static' / asset).read_text(encoding='utf-8').replace('\r\n', '\n')
        check(asset + ' equals accepted local asset', public == local, hashlib.sha256(public.encode()).hexdigest())
    report = {'checked_at': datetime.now(timezone.utc).isoformat(), 'implementation_commit': args.commit,
              'deployment_run_url': args.run_url, 'ci_verification': 'Full SHA and conclusion checked separately with gh run',
              'base': BASE, 'checks': checks, 'passed': sum(c['pass'] for c in checks), 'failed': sum(not c['pass'] for c in checks)}
    Path(__file__).with_name('public-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: report[k] for k in ['checked_at', 'passed', 'failed']}))
    for c in checks:
        if not c['pass']:
            print(json.dumps(c, ensure_ascii=False))
    raise SystemExit(1 if report['failed'] else 0)


if __name__ == '__main__':
    main()
