#!/usr/bin/env python3
# 3D mixer: reads $PIPZO_WORK/build/audio_plan.json (written by build_episode3d.py) and writes
#   $PIPZO_WORK/build/mix.wav (-14 LUFS) and a copy at public/ep3d/mix.wav, which the template plays, so the
#   Lambda render comes out with sound.
# Layers: voices; the music bed only where episode.json allows it (beds/lifts, never in no-music ranges), ducked
# -7 dB under every spoken word; room tone in the classroom parts only; the box sounds, all placed on the frame
# they belong to (rise peak on the frame the box breaks the floor, a click as the cap lands, a chime as each model
# appears, a soft tick when a model is switched off, a pass-by as they walk on); ticks and dings from the script;
# the closing sting ending on the last frame.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, subprocess, shutil, numpy as np
SR = 48000
P = json.load(open(os.path.join(WORK, 'build', 'audio_plan.json'))); T = P['total']; N = int(T * SR) + SR
def load(p): return np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', p, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']), np.float32).reshape(-1, 2)
def put(buf, a, t, g=1.0):
    i = max(0, int(t * SR)); j = min(len(buf), i + len(a)); buf[i:j] += a[:j - i] * g
db = lambda x: 10 ** (x / 20); tt = np.arange(N) / SR

voice = np.zeros((N, 2), np.float32)
for f, at in P['voices']: put(voice, load(os.path.join(WORK, 'in', f)), at)

# music bed: on only inside bed/lift ranges (lift = louder), 0.6 s fades, cut in no-music ranges, ducked under speech
g = np.zeros(N)
def env(a, b, val, fade=0.6):
    k = np.clip(np.minimum((tt - a) / fade, (b - tt) / fade), 0, 1); return np.maximum(0, k) * val
for a, b, ty in P.get('beds', []): g = np.maximum(g, env(a, b, db(-20) if ty == 'lift' else db(-24)))
for a, b in P.get('quiet', []): g *= 1 - np.clip(np.minimum((tt - a + 0.35) / 0.35, (b + 0.1 - tt) / 0.35), 0, 1)
g *= np.clip((T - tt) / 9.0, 0, 1)                         # make room for the closing sting
bed = load(os.path.join(MUSIC, 'background_bed.mp3')); M = np.zeros((N, 2), np.float32)
for i in range(0, N, len(bed)): M[i:i + len(bed)] = bed[:N - i]
venv = np.abs(voice).max(1); w = int(0.12 * SR); vs = np.convolve(venv, np.ones(w) / w, 'same')
duck = np.where(vs > 0.02, db(-7), 1.0).astype(np.float32); dw = int(0.25 * SR); duck = np.convolve(duck, np.ones(dw) / dw, 'same')
M *= (g * duck)[:, None]

# closing sting, ending on the last frame
S = np.zeros((N, 2), np.float32)
if P.get('sting', True): st = load(os.path.join(MUSIC, 'closing_sting.mp3')); put(S, st, T - len(st) / SR, db(-12))

# box sounds and script cues
fx = np.zeros((N, 2), np.float32)
rise, chime1, chime2, tick, pas = (load(os.path.join(SFX, f)) for f in ('rise1.mp3', 'chime1.mp3', 'chime2.mp3', 'tick1.mp3', 'pass1.mp3'))
RISE_PEAK = 0.26                                            # seconds into rise1.mp3 where its hit peaks (measured)
B = P['box']
for p in B['rise']: put(fx, rise, p + 0.12 - RISE_PEAK, db(-8))   # peak lands as the box's top breaks the floor
for c in B['cap']: put(fx, tick, c, db(-9))                       # the cap settles
for j, m in enumerate(sorted(B['model'])): put(fx, chime1 if j % 2 == 0 else chime2, m, db(-11))   # a model appears
for o in B['off']: put(fx, tick, o, db(-12))                      # a model is switched off
for w in B['walk']: put(fx, pas, w + 0.1, db(-14))                # they walk on, the box sinks
for t0 in P.get('ticks', []): put(fx, tick, t0, db(-12))
for t0 in P.get('dings', []): put(fx, chime1, t0, db(-6))

# room tone only in the classroom parts
rt = load(os.path.join(MUSIC, 'classroom_roomtone.mp3')); R = np.zeros((N, 2), np.float32)
for i in range(0, N, len(rt)): R[i:i + len(rt)] = rt[:N - i]
m0, m1 = P['mid']; cls = ((tt < m0) | (tt > m1)).astype(np.float32); cw = int(0.8 * SR); cls = np.convolve(cls, np.ones(cw) / cw, 'same')
R *= (cls * db(-30))[:, None]

mix = (voice + M + S + fx + R)[:int(T * SR)]
out = os.path.join(WORK, 'build', 'mix.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', out], input=mix.astype(np.float32).tobytes(), check=True)
os.makedirs(EP_PUB, exist_ok=True); shutil.copy(out, os.path.join(EP_PUB, 'mix.wav'))
print('mix ->', out, 'and', os.path.join(EP_PUB, 'mix.wav'), f'({T}s)')
