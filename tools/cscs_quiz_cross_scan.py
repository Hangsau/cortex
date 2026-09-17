# -*- coding: utf-8 -*-
"""跨題掃描：22 道閘全綠之後、人工逐題查證之前跑。

閘門只在「同一題內」與「同一 item 底下」比對，跨 item 的撞考點、
重複的 why_wrong、英文題配中文錯因，四支閘門全都看不到。ch13 靠這支
抓到三組正解字面相似度 1.000 的實質重複，ch14 靠它抓到兩組撞考點。

    python -X utf8 tools/cscs_quiz_cross_scan.py ch15

輸出寫進 C:/claudehome/tmp/<ch>_scan.txt（Windows 主控台是 cp950，
中文直接 print 會炸；一律寫 UTF-8 檔再用編輯器讀）。

相似度是 len(A & B) / min(len(A), len(B))：英文比詞集、中文比字集。
用 min 不用聯集是刻意的——短正解被長正解完全包含時要算 1.000，
那正是「一題把另一題答掉了」的形狀。門檻 0.45／0.55 是報警線不是判決，
短正解（如「靜態拉伸」）的高分多半是子集假陽性，逐條看過再決定。
"""
import io
import re
import sys
from collections import Counter
from itertools import combinations

import yaml

CH = sys.argv[1] if len(sys.argv) > 1 else 'ch14'
WORD = re.compile(r"[a-z0-9']+")
CJK = re.compile(r'[一-鿿]')

d = yaml.safe_load(open('data/cscs/_quiz_bank/%s.yaml' % CH, encoding='utf-8'))
qs = d['questions']
out = []
out.append('題數 %d' % len(qs))
out.append('cognitive %s' % Counter(q['cognitive'] for q in qs))
out.append('lang %s' % Counter(q['lang'] for q in qs))
out.append('dco %s' % Counter(q['dco'] for q in qs))

out.append('')
out.append('-- 同一 item 出多題 --')
for k, v in Counter(q['item'] for q in qs).items():
    if v > 1:
        out.append('%s: %d' % (k, v))

out.append('')
out.append('-- topic 分布 --')
for k, v in Counter(q['item'].split('.')[1] for q in qs).most_common():
    out.append('%s: %d' % (k, v))

out.append('')
out.append('-- 重複 why_wrong 的題 --')
out.append(str([q['id'] for q in qs
                if len({o.get('why_wrong') for o in q['options'] if o.get('why_wrong')}) < 2]))

# G19 的英文分支數空白分詞詞數，中文錯因永遠算 1 個詞卻報「過短」，
# 照字面往長度方向修會白修好幾輪。先在這裡把語言不一致單獨標出來。
out.append('')
out.append('-- en 題含中文（題幹 / why_wrong）--')
for q in qs:
    if q['lang'] != 'en':
        continue
    bad = []
    if CJK.search(q['stem']):
        bad.append('stem')
    for i, o in enumerate(q['options']):
        if o.get('why_wrong') and CJK.search(o['why_wrong']):
            bad.append('opt%d.why_wrong' % (i + 1))
    if bad:
        out.append('%s: %s' % (q['id'], ', '.join(bad)))


def toks(s, lang):
    return set(WORD.findall(s.lower())) if lang == 'en' else set(s)


def key(q):
    return next(o['text'] for o in q['options'] if o.get('correct'))


out.append('')
out.append('-- 正解相似度 >= 0.45 --')
for a, b in combinations(qs, 2):
    if a['lang'] != b['lang']:
        continue
    ta, tb = toks(key(a), a['lang']), toks(key(b), b['lang'])
    ov = len(ta & tb) / min(len(ta), len(tb))
    if ov >= 0.45:
        out.append('%.3f %s | %s' % (ov, a['id'], key(a)))
        out.append('      %s | %s' % (b['id'], key(b)))

out.append('')
out.append('-- 題幹相似度 >= 0.55 --')
for a, b in combinations(qs, 2):
    if a['lang'] != b['lang']:
        continue
    ta, tb = toks(a['stem'], a['lang']), toks(b['stem'], b['lang'])
    ov = len(ta & tb) / min(len(ta), len(tb))
    if ov >= 0.55:
        out.append('%.3f %s' % (ov, a['id']))
        out.append('      %s' % a['stem'])
        out.append('      %s' % b['id'])
        out.append('      %s' % b['stem'])

dest = 'C:/claudehome/tmp/%s_scan.txt' % CH
io.open(dest, 'w', encoding='utf-8').write('\n'.join(out))
print(dest)
