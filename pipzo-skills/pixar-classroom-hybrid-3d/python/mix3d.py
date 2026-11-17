#!/usr/bin/env python3
# 3D mixer v2 (sound design approved on LLM-GPT2 Episode 5). Writes $PIPZO_WORK/build/mix.wav (-14 LUFS), a copy at
# public/ep3d/mix.wav (the template plays it, so the Lambda render has sound), and stems build/stem_music.wav, stem_fx.wav.
#
# Reads build/audio_plan.json (build_episode3d.py), src/ep3d/cfg.json (words, push, pull, follow, stations) and
# episode.json ("score", "sfx", and an optional "sfx" on each station model). Every sound is synthesized by sfxkit.py.
#
# Layers:
#   1. voices
#   2. MUSIC that never stops: one mood per story section from "score" (tense, curious, uplift, serious, wonder, warm,
#      outro), 0.6 s crossfades, ducked -10 dB under every word, fading under the closing sting
#   3. AUTOMATIC sounds every episode gets: hook hit on the first frame; handoff IN = riser into the push + whoosh
#      through the board + impact + shimmer as the world appears; handoff BACK = whoosh out + warm ping + soft hit as
#      the frame lands on the board; pedestal rise + wood knock as the top lands; a pop for every floating object;
#      footsteps on every walk; a blip on the Follow pulse; the closing sting; classroom room tone
#   4. SCRIPT sounds from "sfx" (word-cued) and each model's own "sfx" (played as it appears)
# Old "sound" cues (tick, ding) still play; old "bed"/"lift" are ignored once "score" exists.
import os, sys, re, json, subprocess, shutil, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import *
import sfxkit as K
SR = K.SR
AP = json.load(open(os.path.join(WORK, 'build', 'audio_plan.json'))); CFG = json.load(open(os.path.join(EP_SRC, 'cfg.json')))
SPEC = json.load(open(os.path.join(WORK, 'episode.json')))
T = AP['total']; N = int(T * SR) + SR; tt = np.arange(N) / SR
db = lambda x: 10 ** (x / 20)
def load(p): return np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', p, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']), np.float32).reshape(-1, 2)
def put(buf, a, t, g=0.0):
    i = max(0, int(t * SR)); j = min(len(buf), i + len(a))
    if j > i: buf[i:j] += a[:j - i] * db(g)
clean = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())
PUSH, PULL, FOL = CFG['push'], CFG['pull'], CFG['follow']; LN = CFG['lines']
NAMED = {'start': 0.0, 'push': PUSH['t0'], 'world': PUSH['t1'], 'pull': PULL['t0'], 'board': PULL['t1'], 'follow': FOL['t0'], 'follow_pulse': FOL.get('pulse', FOL['t0'] + 0.8), 'end': T}
def at(ref):
    """'ID' line start | 'ID:end' line end | 'ID:word' word start | 'ID:word:end' word end | named | seconds"""
    if isinstance(ref, (int, float)): return float(ref)
    if ref in NAMED: return NAMED[ref]
    p = ref.split(':'); lid = p[0]
    if lid not in LN: sys.exit(f'ERROR sound time {ref!r}: no line {lid}')
    if len(p) == 1: return LN[lid]['t0']
    if p[1] == 'end': return LN[lid]['t1']
    for w in CFG['words']:
        if w['line'] == lid and clean(w['raw']).startswith(clean(p[1])): return w['t1'] if len(p) > 2 and p[2] == 'end' else w['t0']
    sys.exit(f'ERROR sound time {ref!r}: word {p[1]!r} not in {lid}')

voice = np.zeros((N, 2), np.float32)
for f, a in AP['voices']: put(voice, load(os.path.join(WORK, 'in', f)), a)

# ---------- 2. music ----------
LEVEL = {'tense': -17, 'curious': -21, 'uplift': -20, 'serious': -21, 'wonder': -20, 'warm': -20, 'outro': -21}
score = SPEC.get('score') or [{'at': 'start', 'mood': 'curious'}, {'at': 'world', 'mood': 'wonder'}, {'at': 'board', 'mood': 'warm'}, {'at': 'follow', 'mood': 'outro'}]
if not SPEC.get('score'): print('WARN episode.json has no "score": using the default curious / wonder / warm / outro')
sect = sorted([(at(s['at']), s['mood'], s.get('db', LEVEL[s['mood']])) for s in score])
M = np.zeros((N, 2), np.float32); XF = 0.6
for j, (a, mood, lv) in enumerate(sect):
    b = sect[j + 1][0] if j + 1 < len(sect) else T
    if b - a < 0.3 or mood == 'silence': continue
    m = K.music(mood, b - a + XF); e = np.ones(len(m)); f = int(XF * SR)
    e[:f] = np.linspace(0, 1, f); e[-f:] = np.minimum(e[-f:], np.linspace(1, 0, f)); put(M, m * e[:, None], a - XF / 2, lv)
venv = np.abs(voice).max(1); w = int(0.12 * SR); vs = np.convolve(venv, np.ones(w) / w, 'same')
duck = np.where(vs > 0.02, db(-10), 1.0).astype(np.float32); dw = int(0.3 * SR); duck = np.convolve(duck, np.ones(dw) / dw, 'same')
M *= duck[:, None]; M *= np.clip((T - tt) / 4.0, 0, 1)[:, None]

# ---------- 3. automatic sounds ----------
fx = np.zeros((N, 2), np.float32)
if SPEC.get('hook_hit', True): put(fx, K.impact(), 0.25, -9)
r = K.riser(); put(fx, r, PUSH['t1'] - len(r) / SR, -9)                       # handoff IN
put(fx, K.whoosh(0.9, True), PUSH['t0'], -7); put(fx, K.impact(60), PUSH['t1'] - 0.05, -6); put(fx, K.shimmer(2.2, 660), PUSH['t1'] + 0.1, -14)
put(fx, K.whoosh(1.0, False), PULL['t0'] - 0.1, -8)                           # handoff BACK
put(fx, K.ping(784, 1.8), PULL['t1'] - 0.05, -9); put(fx, K.impact(90), PULL['t1'] - 0.05, -17)
B = AP['box']; stations = CFG['world']['stations']
for k, st in enumerate(stations):
    p0 = CFG['world']['pops'][k]
    if len(st['models']) == 1:                                                 # the pedestal
        put(fx, K.pedestal_rise(), p0 - 0.2, -13); put(fx, K.wood_knock(170), p0 + 1.25, -9)
    for m in st['models']:
        a = m.get('at', p0 + 0.6)
        if len(st['models']) > 1: put(fx, K.whoosh(0.5, True, 500, 7000), a - 0.15, -14); put(fx, K.pop(), a + 0.35, -11)   # Pixar pop
        else: put(fx, K.pop(), a, -14)
for s in CFG['world']['segs']:
    if s[0] == 'walk': put(fx, K.footsteps(4, (s[2] - s[1]) / 4.4), s[1] + 0.1, -20)
put(fx, K.blip(2000), NAMED['follow_pulse'], -12)
for t0 in AP.get('ticks', []): put(fx, K.coin(3000), t0, -20)
for t0 in AP.get('dings', []): put(fx, K.ping(1320), t0, -10)

# ---------- 4. script sounds ----------
def play(c, base=None):
    ty = c['type']; fn = getattr(K, ty, None)
    if fn is None or ty.startswith('music'): sys.exit(f'ERROR sfx type {ty!r}: use one of {K.SFX_TYPES}')
    t0 = (at(c['at']) if 'at' in c else base) + c.get('offset', 0.0)
    if 'to' in c and c.get('every'):                                           # repeat across a range (page flutter)
        b = at(c['to']); q = t0
        while q < b: put(fx, fn(*c.get('args', [])), q, c.get('db', -12)); q += c['every']
        return
    for i in range(c.get('n', 1)): put(fx, fn(*c.get('args', [])), t0 + i * c.get('every', 0.25), c.get('db', -10) - c.get('fade', 0) * i)
for c in SPEC.get('sfx', []): play(c)
for k, st in enumerate(SPEC.get('stations', [])):
    for j, m in enumerate(st['models']):
        for c in (m.get('sfx') or []): play(c if isinstance(c, dict) else {'type': c}, stations[k]['models'][j]['at'] + 0.2)

# ---------- sting + room tone ----------
S = np.zeros((N, 2), np.float32)
if AP.get('sting', True): st = load(os.path.join(MUSIC, 'closing_sting.mp3')); put(S, st, T - len(st) / SR, -11)
rt = load(os.path.join(MUSIC, 'classroom_roomtone.mp3')); R = np.zeros((N, 2), np.float32)
for i in range(0, N, len(rt)): R[i:i + len(rt)] = rt[:N - i]
m0, m1 = AP['mid']; cls = ((tt < m0) | (tt > m1)).astype(np.float32); cw = int(0.8 * SR); cls = np.convolve(cls, np.ones(cw) / cw, 'same')
R *= (cls * db(-32))[:, None]

mix = (voice + M + S + fx + R)[:int(T * SR)]
out = os.path.join(WORK, 'build', 'mix.wav')
enc = lambda a, p, af=[]: subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', *af, '-ar', '48000', p], input=a.astype(np.float32).tobytes(), check=True)
enc(mix, out, ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11'])
for nm, a in (('music', M), ('fx', fx)): enc(a[:int(T * SR)], os.path.join(WORK, 'build', f'stem_{nm}.wav'))
os.makedirs(EP_PUB, exist_ok=True); shutil.copy(out, os.path.join(EP_PUB, 'mix.wav'))
print('mix ->', out, 'and', os.path.join(EP_PUB, 'mix.wav'), f'({T}s)')
print('  score:', ' | '.join(f'{a:.1f}s {m}' for a, m, _ in sect))
