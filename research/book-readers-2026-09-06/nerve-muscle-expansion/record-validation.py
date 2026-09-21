"""Record accepted checks and content invariants for the nerve/muscle batch."""
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
BASELINE = '42eb7aca7752a244817cb4d0dd9aff7f1e4816ef'


def previous(path):
    return subprocess.check_output(['git', 'show', f'{BASELINE}:{path}'], cwd=ROOT).decode('utf-8').replace('\r\n', '\n')


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def counts(text):
    body = text.split('---', 2)[2]
    return {'sections': len(re.findall(r'^## ', body, re.M)),
            'chinese_characters': len(re.findall(r'[\u4e00-\u9fff]', body))}


chapters = []
for number in [5, 6]:
    path = f'content/library/basic-biomechanics/ch{number:02}/index.md'
    old, new = previous(path), (ROOT / path).read_text(encoding='utf-8')
    anchors = lambda t: set(re.findall(r'^## .+ \{#([a-z0-9-]+)\}', t, re.M))
    retained = anchors(old) <= anchors(new)
    assert retained
    chapters.append({'path': path, 'before': counts(old), 'after': counts(new),
                     'original_anchors_preserved': retained, 'sha256': digest(new)})

styles = []
for path in ['layouts/library/reading-book.html', 'layouts/library/reading-chapter.html',
             'layouts/library/reading-topics.html', 'static/css/reading.css', 'static/js/reading.js']:
    new = (ROOT / path).read_text(encoding='utf-8')
    same = previous(path) == new
    assert same, path
    styles.append({'path': path, 'unchanged': same, 'sha256': digest(new)})

catalog_same = previous('data/reading/books.json') == (ROOT / 'data/reading/books.json').read_text(encoding='utf-8')
assert catalog_same
browser = json.loads((HERE / 'browser-checks.json').read_text(encoding='utf-8'))
reader = json.loads((ROOT.parent.parent / 'tmp/book-reader-review/browser-results.json').read_text(encoding='utf-8'))
reading = json.loads((HERE.parent / 'reading-validation.json').read_text(encoding='utf-8'))
assert browser['failed'] == reader['failed'] == 0
assert not reading['errors']

report = {
    'checked_at': datetime.now(timezone.utc).isoformat(), 'baseline': BASELINE,
    'chapters': chapters, 'shared_style_files': styles, 'source_catalog_unchanged': catalog_same,
    'source_review': {
        'book': 'nordin', 'main_body_pages': [[145, 162], [167, 189]],
        'original_png_pages_viewed': [147, 148, 152, 169, 173, 179, 181, 185, 187],
        'profile': 'textual_interpretive', 'full_translation': False,
        'all_cited_studies_fulltext_reviewed': False,
        'external_sources': [
            {'id': 'src.reisman-2009', 'url': 'https://pubmed.ncbi.nlm.nih.gov/19043681/', 'scope': 'Abstract: passive torque and proposed titin/crossbridge contributions; no molecular force partition'},
            {'id': 'src.smerdu-1994', 'url': 'https://pubmed.ncbi.nlm.nih.gov/7545970/', 'scope': 'Abstract: human histochemical IIb and IIx MHC transcripts'},
            {'id': 'src.westerblad-1993', 'url': 'https://pubmed.ncbi.nlm.nih.gov/8397180/', 'scope': 'Abstract: isolated mouse fiber low-frequency fatigue and calcium; not general human fatigue'},
            {'id': 'src.thom-2007', 'url': 'https://pubmed.ncbi.nlm.nih.gov/17530274/', 'scope': 'Abstract: 9 older / 15 younger men, plantarflexor testing and modeled maximum values'}
        ],
        'review_decisions': 'RUN.md: 19 selected high-impact claim rows; not exhaustive pair coverage'
    },
    'validation': {
        'reading': reading, 'hugo_pages': 172,
        'reader_audit': {k: reader[k] for k in ['passed', 'failed']},
        'original_server': {'restart_cycles': 2, 'passed': 18},
        'chapter_browser': {k: browser[k] for k in ['passed', 'failed']},
        'manually_viewed_screenshots': [f'basic-biomechanics-ch{n:02}-{v}.png' for n in [5, 6] for v in ['paper', 'night', 'desktop']],
        'semantic_limit': 'Structural and browser checks do not establish medical or semantic truth; manual decisions and source limits are recorded in RUN.md.'
    },
    'editor_arithmetic': {
        'strain_relative_to_in_situ_percent': (1.385 / 1.110 - 1) * 100,
        'ellipse_area_ratio': 1.5 * (1 / 1.5), 'fiber_pcsa_cm2': 150 / 5,
        'fiber_force_N': 150 / 5 * 20,
        'tendon_force_N': 150 / 5 * 20 * math.cos(math.radians(30)),
        'joint_moment_Nm': 150 / 5 * 20 * math.cos(math.radians(30)) * .04,
        'linear_power_W': 500 * .1, 'rotational_power_W': 50 * 2,
        'mean_force_development_N_per_s': 100 / .05,
        'conditions': 'Illustrative shared strain reference; constant-area ellipse; uniform fiber length and assumed specific tension; 30-degree projection once; fixed moment arm. No individual physiological or safety limit.'
    },
    'delegation': 'Main agent only; no subscription savings claim.'
}
(HERE / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'chapters': chapters, 'reading': reading, 'chapter_browser': report['validation']['chapter_browser']}, ensure_ascii=False))
