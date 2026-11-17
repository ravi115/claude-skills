#!/usr/bin/env python3
# Pipzo sound kit v1 (approved on LLM-GPT2 Episode 5): every sound and music cue is synthesized here (numpy only, no downloads, 0 credits).
# Each function returns a stereo float32 array at 48 kHz. Run this file to write every sound to work/sfxkit/ to listen.
import numpy as np, os, sys, subprocess
SR = 48000
rng = np.random.default_rng(7)
T = lambda d: np.arange(int(d * SR)) / SR
def st(x, w=0.0):                      # mono -> stereo with a little width
    x = x.astype(np.float32); d = int(0.0007 * SR * w)
    r = np.concatenate([np.zeros(d, np.float32), x[:len(x) - d]]) if d else x
    return np.stack([x, r], 1)
def band(x, lo, hi):                   # FFT band-pass
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.clip((f - lo * 0.8) / (lo * 0.2 + 1e-9), 0, 1) * np.clip((hi * 1.25 - f) / (hi * 0.25), 0, 1)
    return np.fft.irfft(X * m, len(x))
def env(n, a, d, curve=4.0):           # attack then exponential decay
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-3)); return e
def norm(x, peak=0.9): m = np.abs(x).max(); return x / m * peak if m > 0 else x
def verb(x, tail=1.2, mix=0.25):       # cheap reverb: sum of decaying noise-convolution
    n = int(tail * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 5 / tail); ir = band(ir, 200, 7000)
    y = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n), len(x) + n)
    out = np.concatenate([x, np.zeros(n)]) * (1 - mix) + norm(y, np.abs(x).max()) * mix; return out
def tone(f, d, kind='sine', a=0.005, dec=None, vib=0.0):
    t = T(d); ph = 2 * np.pi * f * t + vib * np.sin(2 * np.pi * 5 * t)
    if kind == 'sine': y = np.sin(ph)
    elif kind == 'tri': y = 2 / np.pi * np.arcsin(np.sin(ph))
    elif kind == 'saw': y = sum(np.sin(ph * k) / k for k in range(1, 12)) * 0.6
    else: y = np.sin(ph)
    return y * env(len(t), a, dec or d)

# ---------- sound effects ----------
def impact(low=70, d=1.6):              # hook / handoff hit: sub drop + noise crack + tail
    t = T(d); f = low * (1 + 2.5 * np.exp(-t * 18)); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    crack = band(rng.standard_normal(len(t)), 900, 9000) * np.exp(-t * 30) * 0.5
    body = band(rng.standard_normal(len(t)), 80, 600) * np.exp(-t * 7) * 0.6
    return st(norm(verb(sub + crack + body, 1.4, 0.3)), 1)
def whoosh(d=0.9, up=True, lo=300, hi=5000):
    t = T(d); n = rng.standard_normal(len(t)); x = np.zeros(len(t)); seg = 1024
    for i in range(0, len(t), seg):    # sweep the band over time
        k = i / len(t); k = k if up else 1 - k; c = lo * (hi / lo) ** k
        x[i:i + seg] = band(n[i:i + seg] if len(n[i:i + seg]) == seg else np.pad(n[i:i + seg], (0, seg - len(n[i:i + seg]))), c * 0.6, c * 1.6)[: len(n[i:i + seg])]
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** (2 if up else 1.2)
    return st(norm(x * e, 0.8), 3)
def riser(d=2.4):                        # tension build before a reveal
    t = T(d); f = 180 * (8 ** (t / d)); y = sum(np.sin(2 * np.pi * np.cumsum(f * m) / SR) / m for m in (1, 1.5, 2.01))
    nz = whoosh(d, True, 400, 9000)[:, 0]
    return st(norm((y * 0.5 + nz * 0.8) * (t / d) ** 2, 0.8), 2)
def book_thud():                        # heavy hardcover landing on wood
    t = T(0.5); f = 95 * (1 + 0.6 * np.exp(-t * 40)); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
    y += band(rng.standard_normal(len(t)), 150, 2500) * np.exp(-t * 45) * 0.8
    y += band(rng.standard_normal(len(t)), 2000, 7000) * np.exp(-t * 90) * 0.25
    return st(norm(verb(y, 0.5, 0.15)))
def paper(d=0.35):                      # page flip / envelope swish
    t = T(d); y = band(rng.standard_normal(len(t)), 1500, 9000) * np.sin(np.pi * t / d) ** 1.5
    y *= 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t))
    return st(norm(y, 0.6), 2)
def ping(f=1320, d=1.4):                # glass / skill-dot ping
    y = tone(f, d, dec=d * 0.6) + 0.35 * tone(f * 2.76, d, dec=d * 0.25) + 0.2 * tone(f * 5.4, d, dec=d * 0.1)
    return st(norm(verb(y, 1.0, 0.3), 0.7), 2)
def coin(f=None):                       # one coin clink
    f = f or rng.uniform(2600, 4200); d = 0.45
    y = sum(tone(f * r, d, dec=d * k) * a for r, k, a in ((1, 0.5, 1), (1.47, 0.3, 0.6), (2.09, 0.2, 0.5), (2.56, 0.12, 0.3)))
    y += band(rng.standard_normal(len(y)), 3000, 10000) * np.exp(-T(d) * 120) * 0.4
    return st(norm(y, 0.6), 1)
def coin_cascade(n=32, dur=1.4):
    out = np.zeros((int((dur + 0.6) * SR), 2), np.float32)
    for i in range(n):
        p = int(dur * (i / n) ** 0.8 * SR); c = coin(); out[p:p + len(c)] += c * rng.uniform(0.35, 0.7)
    return norm(out, 0.8)
def cash_register():                    # price shock "ka-ching"
    a = coin(2900) * 0.6; b = st(norm(tone(2093, 1.2, dec=0.9) + 0.6 * tone(2637, 1.2, dec=0.7) + 0.4 * tone(3136, 1.2, dec=0.6), 0.7))
    clk = st(band(rng.standard_normal(int(0.08 * SR)), 500, 4000) * np.exp(-T(0.08) * 60))
    out = np.zeros((int(1.5 * SR), 2), np.float32); out[:len(clk)] += clk; out[int(0.07 * SR):int(0.07 * SR) + len(a)] += a
    out[int(0.12 * SR):int(0.12 * SR) + len(b)] += b; return norm(out, 0.85)
def shimmer(d=1.8, base=880):           # brain appears / glows: sparkling arpeggio over a soft pad
    t = T(d); out = np.zeros(len(t))
    for i, r in enumerate((1, 1.25, 1.5, 2, 2.5, 3, 4)):
        p = int(i * 0.07 * SR); y = tone(base * r, d - i * 0.07, dec=0.8)[: len(t) - p] * 0.5; out[p:p + len(y)] += y
    pad = sum(np.sin(2 * np.pi * base / 4 * r * t) for r in (1, 1.5, 2)) * np.sin(np.pi * t / d) * 0.3
    return st(norm(verb(out + pad, 1.5, 0.35), 0.7), 3)
def wood_knock(f=180):                  # pedestal cap lands
    t = T(0.3); y = sum(np.sin(2 * np.pi * f * r * t) * np.exp(-t * k) for r, k in ((1, 30), (2.3, 45), (3.9, 70)))
    y += band(rng.standard_normal(len(t)), 400, 3000) * np.exp(-t * 80) * 0.5
    return st(norm(verb(y, 0.4, 0.12), 0.7))
def pedestal_rise(d=1.4):               # wooden pedestal sliding up out of the floor
    t = T(d); y = band(rng.standard_normal(len(t)), 150, 1200) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    y += np.sin(2 * np.pi * np.cumsum(110 + 90 * t / d) / SR) * np.sin(np.pi * t / d) * 0.35
    return st(norm(y, 0.6), 2)
def blip(f=1800):                       # digital download blip
    y = tone(f, 0.12, 'tri', dec=0.08) + tone(f * 1.5, 0.12, 'tri', dec=0.06) * 0.5; return st(norm(y, 0.5))
def building_land(f=110):               # a building lands: stone thud + a bell
    t = T(0.9); y = np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + band(rng.standard_normal(len(t)), 100, 1500) * np.exp(-t * 25) * 0.6
    bell = tone(f * 8, 0.9, dec=0.7) * 0.35 + tone(f * 8 * 2.4, 0.9, dec=0.3) * 0.15
    return st(norm(verb(y + bell, 0.8, 0.25), 0.8), 1)
def footsteps(n=4, gap=0.5):
    out = np.zeros((int((n * gap + 0.4) * SR), 2), np.float32)
    for i in range(n):
        t = T(0.12); y = band(rng.standard_normal(len(t)), 120, 2500) * np.exp(-t * 55) + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 40) * 0.6
        p = int(i * gap * SR); out[p:p + len(t)] += st(norm(y, 0.5))
    return out
def laugh_pop():                        # light comedic "ta-da" for the lunch payoff
    out = np.zeros(int(0.9 * SR))
    for i, f in enumerate((784, 988, 1175, 1568)):
        y = tone(f, 0.5, 'tri', dec=0.3); p = int(i * 0.08 * SR); out[p:p + len(y)] += y[: len(out) - p]
    return st(norm(verb(out, 0.6, 0.2), 0.6), 2)
def deflate():                          # "...it only answers questions?!" let-down slide
    t = T(0.7); f = 420 * (0.45 ** (t / 0.7)); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.01, 0.7, 2)
    return st(norm(y + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * env(len(t), 0.01, 0.7, 3), 0.55))

def pop(f=520):                         # Pixar pop: a quick rising "bloop" with a soft click, as an object arrives
    t = T(0.22); fr = f * (1 + 1.6 * (t / 0.22) ** 0.6); y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t), 0.004, 0.2, 5)
    y += band(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t * 200) * 0.3
    return st(norm(verb(y, 0.4, 0.15), 0.6), 1)
SFX_TYPES = ['impact', 'whoosh', 'riser', 'book_thud', 'paper', 'ping', 'coin', 'coin_cascade', 'cash_register', 'shimmer', 'wood_knock',
             'pedestal_rise', 'blip', 'building_land', 'footsteps', 'laugh_pop', 'deflate', 'pop']

# ---------- music: mood sections (each returns a stereo loop of given length) ----------
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
def pad(chord, d, bright=0.4):
    t = T(d); y = sum(np.sin(2 * np.pi * NOTE(m) * t + 0.3 * np.sin(2 * np.pi * 0.2 * t + i)) + bright * 0.5 * np.sin(4 * np.pi * NOTE(m) * t) for i, m in enumerate(chord))
    return y * np.minimum(1, np.minimum(t / 0.4, (d - t) / 0.4))
def pluck(m, d=0.35, bright=1.0):
    t = T(d); f = NOTE(m); y = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (9 + 6 * k) / bright) / k for k in range(1, 6)); return y
def music(mood, d, bpm=96):
    n = int(d * SR); out = np.zeros(n); beat = 60 / bpm
    prog = {'tense': [[45, 52, 55], [46, 53, 56]], 'curious': [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]],
            'wonder': [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]],
            'serious': [[45, 48, 52], [41, 45, 48]], 'uplift': [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
            'warm': [[53, 57, 60, 64], [55, 59, 62], [60, 64, 67, 72], [60, 64, 67, 72]], 'outro': [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]}[mood]
    bar = beat * 4; nb = int(np.ceil(d / bar)) + 1
    for b in range(nb):
        ch = prog[b % len(prog)]; p = int(b * bar * SR)
        if p >= n: break
        L = min(n - p, int(bar * SR) + int(0.4 * SR))
        if mood in ('wonder', 'warm', 'serious', 'tense'):
            y = (pad(ch, L / SR, 0.3 if mood != 'warm' else 0.6) + 0.5 * pad([ch[0] - 12], L / SR, 0.5)) * (0.2 if mood != 'tense' else 0.14); out[p:p + L] += y[: n - p]
        if mood in ('curious', 'uplift', 'outro', 'wonder', 'warm'):     # plucked arpeggio
            pat = [0, 1, 2, 1, 0, 2, 1, 2] if mood != 'wonder' else [0, 2, 1, 2]
            step = bar / len(pat)
            for i, k in enumerate(pat):
                q = p + int(i * step * SR); y = pluck(ch[k] + (12 if mood in ('uplift', 'outro', 'wonder') else 0), 0.5, 1.2 if mood == 'wonder' else 1.0) * (0.22 if mood != 'wonder' else 0.12)
                out[q:q + len(y)] += y[: max(0, n - q)]
        if mood in ('tense', 'uplift', 'outro', 'curious'):               # pulse / bass on the beat
            for i in range(4):
                q = p + int(i * beat * SR); m = ch[0] - 12
                if mood == 'tense': y = pluck(m + 12, 0.35, 0.6) * 0.5 * (1 if i % 2 == 0 else 0.55)
                else: y = pluck(m + 12, 0.4, 0.7) * 0.35 * (1 if i % 2 == 0 else 0.5)
                out[q:q + len(y)] += y[: max(0, n - q)]
        if mood == 'tense':                                               # high nervous tick-tock layer
            for i in range(8):
                q = p + int(i * beat / 2 * SR); y = band(rng.standard_normal(int(0.03 * SR)), 1800, 4500) * np.exp(-T(0.03) * 120) * 0.05; out[q:q + len(y)] += y[: max(0, n - q)]
        if mood in ('uplift', 'outro'):                                   # light hat/shaker groove
            for i in range(8):
                q = p + int(i * beat / 2 * SR); y = band(rng.standard_normal(int(0.05 * SR)), 5000, 12000) * np.exp(-T(0.05) * 70) * (0.04 if i % 2 else 0.02); out[q:q + len(y)] += y[: max(0, n - q)]
    return st(norm(verb(out, 1.6, 0.22)[:n], 0.8), 4)

if __name__ == '__main__':
    o = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.getcwd(), 'sfxkit'); os.makedirs(o, exist_ok=True)
    kit = dict(impact=impact(), whoosh_in=whoosh(0.9, True), whoosh_out=whoosh(0.9, False), riser=riser(), book_thud=book_thud(), paper=paper(),
               ping=ping(), coin=coin(), coin_cascade=coin_cascade(), cash_register=cash_register(), shimmer=shimmer(), wood_knock=wood_knock(),
               pedestal_rise=pedestal_rise(), pop=pop(), blip=blip(), building_land=building_land(), footsteps=footsteps(), laugh_pop=laugh_pop(), deflate=deflate())
    for m in ('tense', 'curious', 'wonder', 'serious', 'uplift', 'warm', 'outro'): kit['music_' + m] = music(m, 10)
    for k, v in kit.items():
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', os.path.join(o, k + '.wav')], input=v.astype(np.float32).tobytes(), check=True)
    print('wrote', len(kit), 'sounds to', o)
