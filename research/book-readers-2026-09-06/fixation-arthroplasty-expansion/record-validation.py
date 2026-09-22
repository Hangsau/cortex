"""Record source scope, accepted browser checks and unchanged reader contracts."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
BASELINE = '75923b9bf0c236fddf3bb54420c9144a93d3f541'


def previous(path):
    return subprocess.check_output(['git', 'show', f'{BASELINE}:{path}'], cwd=ROOT).decode('utf-8').replace('\r\n', '\n')


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def counts(text):
    body = text.split('---', 2)[2]
    return {'sections': len(re.findall(r'^## ', body, re.M)),
            'chinese_characters': len(re.findall(r'[\u4e00-\u9fff]', body))}


chapters = []
for number in [15, 16]:
    path = f'content/library/basic-biomechanics/ch{number}/index.md'
    old, new = previous(path), (ROOT / path).read_text(encoding='utf-8')
    anchors = lambda t: set(re.findall(r'^## .+ \{#([a-z0-9-]+)\}', t, re.M))
    assert anchors(old) <= anchors(new)
    chapters.append({'path': path, 'before': counts(old), 'after': counts(new),
                     'original_anchors_preserved': True, 'sha256': digest(new)})

unchanged = []
paths = ['layouts/library/reading-book.html', 'layouts/library/reading-chapter.html',
         'layouts/library/reading-topics.html', 'static/css/reading.css', 'static/js/reading.js',
         'data/reading/books.json']
paths += [p.relative_to(ROOT).as_posix() for slug in ['kinesiology', 'basic-biomechanics']
          for p in (ROOT / 'content/library' / slug).glob('ch*/index.md')
          if p.relative_to(ROOT).as_posix() not in {c['path'] for c in chapters}]
for path in paths:
    new = (ROOT / path).read_text(encoding='utf-8')
    assert previous(path) == new, path
    unchanged.append({'path': path, 'sha256': digest(new)})

browser = json.loads((HERE / 'browser-checks.json').read_text(encoding='utf-8'))
reader = json.loads((ROOT.parent.parent / 'tmp/book-reader-review/browser-results.json').read_text(encoding='utf-8'))
reading = json.loads((HERE.parent / 'reading-validation.json').read_text(encoding='utf-8'))
assert browser['failed'] == reader['failed'] == 0
assert not reading['errors']

arithmetic = {
    'gap_strain_percent': [.1 / 2 * 100, .1 / .5 * 100],
    'parallel_device_load_fractions': [3 / 4, 1 / 2],
    'plate_I_cm4': [.5 * 1.8**3 / 12, 1.8 * .5**3 / 12],
    'plate_I_ratio': (.5 * 1.8**3) / (1.8 * .5**3),
    'thicker_plate_EI_ratio': .5 * 1.25**3,
    'equal_stiffness_thickness_ratio': 2**(1 / 3),
    'large_vs_four_independent_rods_EI_ratio': 2**4 / 4,
    'hip_muscle_forces_N': [600 * .1 / .05, 600 * .1 / .04, 600 * .08 / .04],
    'single_limb_cycles_per_year': 10438 / 2 * 365,
    'conditions': 'Uniform axial gap; equal-displacement linear springs; equal material/length/support for beam comparisons except explicitly halved E; independent solid rods, not a composite section; fixed hip model lever arms; regular alternating steps extrapolated to 365 days. No clinical threshold.'
}

report = {
    'checked_at': datetime.now(timezone.utc).isoformat(), 'baseline': BASELINE,
    'chapters': chapters, 'unchanged_files': unchanged,
    'source_review': {
        'book': 'nordin', 'source_id': 'src.nordin-frankel-2012',
        'main_body_pages': [[413, 419], [421, 438]],
        'original_png_pages_viewed': [415, 417, 419, 422, 423, 429, 431, 434, 435, 436, 437],
        'profile': 'textual_interpretive', 'full_translation': False,
        'all_cited_studies_fulltext_reviewed': False,
        'external_abstracts': [
            {'id': 'src.bergmann-2001', 'url': 'https://pubmed.ncbi.nlm.nih.gov/11410170/', 'scope': 'Sample and walking/stair hip-force comparison'},
            {'id': 'src.shakoor-2002', 'url': 'https://pubmed.ncbi.nlm.nih.gov/12483722/', 'scope': 'Noncognate subsequent replacement laterality, not risk versus unoperated controls'},
            {'id': 'src.silva-2002', 'url': 'https://pubmed.ncbi.nlm.nih.gov/12216021/', 'scope': '33 patients, 1.9 million cycles/year, pedometer under-recording'},
            {'id': 'src.heinlein-2009', 'url': 'https://pubmed.ncbi.nlm.nih.gov/19285767/', 'abstract_retrieval': 'Europe PMC REST core record EXT_ID:19285767 after empty PubMed open', 'scope': 'Two subjects; 6 and 10 months; force component statistics and task-specific changes'},
            {'id': 'src.mundermann-2008', 'url': 'https://onlinelibrary.wiley.com/doi/abs/10.1002/jor.20655', 'scope': 'Activity-specific load/angle/cycle categories; did not verify textbook 3.5-8 BW attribution'},
            {'id': 'src.berger-1998', 'url': 'https://pubmed.ncbi.nlm.nih.gov/9917679/', 'scope': 'Combined tibial plus femoral component rotation; selected complication/control groups'}
        ],
        'decisions': 'RUN.md; selected high-impact claims and source discrepancies, not an exhaustive claim database'
    },
    'validation': {
        'reading': reading, 'hugo_pages': 172,
        'reader_audit': {k: reader[k] for k in ['passed', 'failed']},
        'original_server': {'restart_cycles': 2, 'passed': 18},
        'chapter_browser': {k: browser[k] for k in ['passed', 'failed']},
        'manually_viewed_screenshots': [f'basic-biomechanics-ch{n}-{v}.png' for n in [15, 16] for v in ['paper', 'night', 'desktop']],
        'semantic_limit': 'Structural/browser checks do not establish medical truth; source scope and semantic review are separately recorded.'
    },
    'editor_arithmetic': arithmetic,
    'delegation': 'Main agent only.',
    'completion_scope': 'All 33 main chapters now expanded as chapter guides; not a complete sentence-by-sentence translation, appendices or all-source fulltext audit.'
}
(HERE / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'chapters': chapters, 'reading': reading, 'chapter_browser': report['validation']['chapter_browser']}, ensure_ascii=False))
