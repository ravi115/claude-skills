#!/usr/bin/env python3
# Turn an episode voice table into the two files tts-kaggle.sh and postprocess.py need.
#   episode-lines.txt  (one row per line:  ID | Voice | Text   e.g.  P02 | PB-urgent-warm | We're building ...)
#   -> lines.txt  (Voice | Text, in order, for tts-kaggle.sh)   and   ids.txt  (ID per row, same order)
# usage: python3 make_lines.py episode-lines.txt [outdir]
import json, os, sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(src))
refs = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'kaggle-dataset', 'refs.json')))
lines, ids, bad = [], [], []
for n, row in enumerate(open(src, encoding='utf-8'), 1):
    row = row.strip()
    if not row or row.startswith('#'): continue
    parts = [p.strip() for p in row.split('|', 2)]
    if len(parts) != 3: bad.append(f'row {n}: needs ID | Voice | Text'); continue
    i, v, t = parts
    if v not in refs: bad.append(f'row {n}: unknown voice {v!r} (see voices.md)')
    if '|' in t: bad.append(f'row {n}: text may not contain |')
    ids.append(i); lines.append(f'{v} | {t}')
if bad: sys.exit('ERROR\n' + '\n'.join(bad))
open(os.path.join(out, 'lines.txt'), 'w').write('\n'.join(lines) + '\n'); open(os.path.join(out, 'ids.txt'), 'w').write('\n'.join(ids) + '\n')
print(f'{len(ids)} lines -> lines.txt + ids.txt in {out}')
