#!/usr/bin/env python3
# Word timings for every voice line: $PIPZO_WORK/in/<ID>.mp3 + episode.json -> $PIPZO_WORK/words.json
# Uses faster-whisper (CPU, free) for word timestamps, then keeps the SCRIPT's words (episode.json text),
# so captions always show the exact script and never a mis-heard word. forced_align.py refines the times afterwards.
#   pip install faster-whisper
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, re
from faster_whisper import WhisperModel

SPEC = json.load(open(os.path.join(WORK, 'episode.json')))
model = WhisperModel(os.environ.get('PIPZO_WHISPER', 'small.en'), device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
out, report = {}, []
for it in SPEC['lines']:
    if 'id' not in it: continue
    i = it['id']; script = it['text'].replace('—', ' ').split()
    segs, _ = model.transcribe(os.path.join(WORK, 'in', f'{i}.mp3'), word_timestamps=True, language='en', beam_size=5)
    heard = [w for s in segs for w in s.words]
    # map the script words onto the heard words in order (same count: one to one; otherwise spread by position)
    words = []
    if len(heard) == len(script):
        words = [dict(raw=sw, t0=round(h.start, 3), t1=round(h.end, 3)) for sw, h in zip(script, heard)]
    elif heard:
        t0, t1 = heard[0].start, heard[-1].end; n = len(script)
        for k, sw in enumerate(script):
            h = heard[min(len(heard) - 1, round(k * (len(heard) - 1) / max(1, n - 1)))]
            words.append(dict(raw=sw, t0=round(h.start, 3), t1=round(h.end, 3)))
        report.append(f'{i}: heard {len(heard)} words, script has {n} (times spread; forced_align.py corrects them)')
    match = sum(norm(a) == norm(b.word) for a, b in zip(script, heard)) / max(1, len(script))
    if match < 0.8: report.append(f'CHECK {i}: only {match:.0%} of words match the script. Listen to it; re-voice if it says something else.')
    out[i] = words
json.dump(out, open(os.path.join(WORK, 'words.json'), 'w'), indent=0)
print(f'words.json: {len(out)} lines'); [print(r) for r in report]
