# Natural lip-sync driver for Remotion faces.
# Output per 30 fps frame and speaker: one mouth state 0 closed,1 FV,2 OO,3 EE,4 L,5 OH,6 AH (one real mouth, never blended).
# Openness is calibrated to the mouth-opening distribution measured from the ElevenLabs/MiniMax
# lip-sync clips of Episode 4 (Emily: lsCE, Professor: lsC3): quantile-mapped, mouth leads audio ~40 ms.
import os, sys, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import forced_align as _fa
_fa.BAND, _fa.BANDS, _fa.PEN = 45, 90, 0.01  # approved lip-sync alignment window (Episode 4 tests)
from forced_align import env, tokens, dtw
from lipsync_audio import VMAP
# usage: python3 lipsync_drive.py [cfg.json] [out visnat.json]   (defaults: the 2D composition in the Remotion project)
CFG = sys.argv[1] if len(sys.argv) > 1 else os.path.join(EP_SRC, 'cfg.json')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(EP_SRC, 'visnat.json')
FPS_IN, FPS = 100, 30
# relative jaw opening per phoneme (1 = widest "ah")
OPEN = {**{p: 1.0 for p in 'AA AE AY AW'.split()}, 'AH': 0.8, **{p: 0.75 for p in 'AO OW OY'.split()},
        **{p: 0.6 for p in 'EH EY ER'.split()}, **{p: 0.45 for p in 'IH IY UH'.split()}, 'UW': 0.4, 'W': 0.3,
        **{p: 0.35 for p in 'L N R Y NG HH DH TH'.split()}, **{p: 0.25 for p in 'S Z SH ZH CH JH'.split()},
        **{p: 0.18 for p in 'F V'.split()}, **{p: 0.28 for p in 'T D K G'.split()}, **{p: 0.0 for p in 'M B P'.split()}}
CAL = {'S': os.path.join(LIPSYNC, 'emily', 'calibration.json'), 'P': os.path.join(LIPSYNC, 'professor', 'calibration.json')}
def natural(who):
    d = json.load(open(CAL[who])); o, e = np.array(d['o']), np.array(d['e'])
    return np.sort(o[e > 0.12])
def follow(x, up, down, fps):
    y = np.zeros_like(x); ku, kd = 1 - np.exp(-1 / (up * fps)), 1 - np.exp(-1 / (down * fps))
    for i in range(1, len(x)): y[i] = y[i - 1] + (x[i] - y[i - 1]) * (ku if x[i] > y[i - 1] else kd)
    return y
def line_track(path, words):
    a = env(path); T = tokens(words); P = dtw(T, a); tok = [T[i] for i in P]
    n = len(a); o = np.zeros(n); sh = np.full(n, -1)
    for j, t in enumerate(tok):
        p = t[0]
        if p in ('SIL', 'GAP'): continue
        o[j] = OPEN.get(p, 0.35) * (0.45 + 0.55 * min(1.0, a[j]))
        sh[j] = VMAP.get(p, -1)
    return o, sh, a, [t[0] for t in tok]
def compute(who, x, shp_w, ph, N):
    OPENNESS = [0, 1, 2, 3, 4, 5, 6]
    VOW = set('AA AE AH AY AW AO OW OY EH EY ER IH IY UH UW'.split())
    spk = x > 0.01
    nat = natural(who); r = np.argsort(np.argsort(x[spk])) / max(1, spk.sum() - 1)
    y = x.copy(); y[spk] = np.interp(r, np.linspace(0, 1, len(nat)), nat); y[~spk] = 0
    lead = 4
    # speech rate (syllables/s) from vowel onsets, +-0.4 s window
    on = np.zeros(len(x))
    for i in range(1, len(ph)):
        if ph[i] in VOW and ph[i - 1] != ph[i]: on[i] = 1
    rate = np.convolve(on, np.ones(80), 'same') / 0.8
    # openness follower: faster speech -> slower, smaller movements (real mouths under-articulate)
    yf = np.zeros_like(y)
    for i in range(1, len(y)):
        fast = min(1, max(0, (rate[i] - 3.5) / 2.5))  # 0 slow/medium .. 1 fast (>=6 syl/s)
        up, dn = 0.03 + 0.03 * fast, 0.05 + 0.04 * fast
        k = 1 - np.exp(-1 / ((up if y[i] > yf[i - 1] else dn) * FPS_IN))
        yf[i] = yf[i - 1] + (y[i] - yf[i - 1]) * k
    yf = np.concatenate([yf[lead:], np.zeros(lead)]); s = np.concatenate([shp_w[lead:], np.full(lead, -1)])
    ph2 = list(ph[lead:]) + ['SIL'] * lead; rate = np.concatenate([rate[lead:], np.zeros(lead)])
    st = []; rt = []
    for f in range(N):
        i = min(len(yf) - 1, int(f * FPS_IN / FPS)); j = min(len(yf) - 1, i + 3)
        o = float(yf[i:j + 1].mean()); w = s[i:j + 1]; w = w[w >= 0]
        sc = int(np.bincount(w).argmax()) if len(w) else -1
        bil = any(p in ('M', 'B', 'P') for p in ph2[i:j + 1])
        if who == 'S':  # Emily: frozen (approved in test 3)
            if o < 0.08 or (bil and o < 0.3): v = 0
            elif sc == 4: v = 1
            elif sc == 3: v = 2
            elif sc == 2: v = 5 if o >= 0.45 else 2
            elif sc == 1: v = 3 if o >= 0.2 else 1
            elif sc == 0: v = 6 if o >= 0.7 else (4 if o >= 0.3 else 1)
            else: v = 4 if o >= 0.3 else 1
        else:  # Professor: the moustache hides small mouths, so voiced sounds always get a visibly open mouth
            vow = any(p in VOW for p in ph2[i:j + 1])
            if bil and o < 0.35: v = 0
            elif o < 0.06 and not vow: v = 0
            elif sc == 4: v = 1
            elif sc == 3: v = 2
            elif sc == 2: v = 5 if o >= 0.3 else 2
            elif sc == 1: v = 3
            elif sc == 0: v = 6 if o >= 0.6 else 4
            else: v = 4 if (o >= 0.15 or vow) else 3
        st.append(v); rt.append(float(rate[i]))
    st = np.array(st)
    # minimum hold depends on speed: fast 3 frames (100 ms), slow/medium 2 frames.
    # closures (state 0) between words are always allowed to hit for 2 frames.
    changed = True
    while changed:
        changed = False; f = 0
        while f < N:
            g = f
            while g + 1 < N and st[g + 1] == st[f]: g += 1
            need = 3 if rt[f] >= 5 else 2
            if g - f + 1 < need and f > 0 and not (st[f] == 0 and g - f + 1 >= 2):
                if who == 'P':
                    # never let a short open syllable be swallowed by a closed/tiny mouth:
                    # merge into whichever neighbour is more open
                    nxt = st[g + 1] if g + 1 < N else st[f - 1]
                    rep = max(st[f - 1], nxt, key=lambda q: OPENNESS[q])
                    if OPENNESS[st[f]] > OPENNESS[rep] and st[f - 1] in (0, 1): rep = st[f]; st[f - 1] = st[f]
                    st[f:g + 1] = rep
                else:
                    st[f:g + 1] = st[f - 1]
                changed = True
            f = g + 1

    return st, rt

def main():
    C = json.load(open(CFG)); W = json.load(open(WORK + '/words.json'))
    N = int(C['total'] * FPS) + 2
    raw = {w: np.zeros(int(C['total'] * FPS_IN) + 200) for w in 'PS'}
    shp = {w: np.full(int(C['total'] * FPS_IN) + 200, -1) for w in 'PS'}
    phn = {w: ['SIL'] * (int(C['total'] * FPS_IN) + 200) for w in 'PS'}
    for k, l in C['lines'].items():
        sp = [x for x in W[k] if not x['raw'].startswith('[')]
        o, sh, a, ph = line_track(f'{WORK}/in/{k}.mp3', sp)
        for q in range(len(ph)):
            if f0_ := int(round(l['t0'] * FPS_IN)) + q < len(phn[l['who']]): pass
        F0 = int(round(l['t0'] * FPS_IN)); phn[l['who']][F0:F0 + len(ph)] = ph[:max(0, len(phn[l['who']]) - F0)]
        f0 = int(round(l['t0'] * FPS_IN)); m = min(len(o), len(raw[l['who']]) - f0)
        raw[l['who']][f0:f0 + m] = np.maximum(raw[l['who']][f0:f0 + m], o[:m]); s = shp[l['who']]
        s[f0:f0 + m] = np.where(sh[:m] >= 0, sh[:m], s[f0:f0 + m])
    out = {}
    # States: 0 closed, 1 FV (lips parted, teeth), 2 OO (pucker), 3 EE (teeth), 4 L (half open),
    #         5 OH (round open), 6 AH (wide). Only REAL drawn mouths, one per frame -> no ghosting.
    OPENNESS = [0, 1, 2, 3, 4, 5, 6]
    VOW = set('AA AE AH AY AW AO OW OY EH EY ER IH IY UH UW'.split())
    for who in 'PS':
        x = raw[who]
        st, rt = compute(who, x, shp[who], phn[who], N)
        out[who] = [int(v) for v in st]
        u, c = np.unique(st[np.array([q > 0.01 for q in np.interp(np.arange(N) * FPS_IN / FPS, np.arange(len(x)), x)])], return_counts=True)
        print(who, 'state share while speaking', {['closed','FV','OO','EE','L','OH','AH'][a]: round(b / c.sum(), 2) for a, b in zip(u, c)},
              'rate p50/p90', np.round(np.percentile(np.array(rt)[np.array(rt) > 0], [50, 90]), 1))
    json.dump({'fps': FPS, 'S': ['closed', 'FV', 'OO', 'EE', 'L', 'OH', 'AH'], 'w': out}, open(OUT, 'w'), separators=(',', ':'))
main()
