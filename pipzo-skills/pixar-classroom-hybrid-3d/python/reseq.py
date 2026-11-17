# 3D lip sync (frozen v1): re-sequence REAL lip-sync frames (from earlier ElevenLabs clips) to new audio.
# Each output frame shows one whole real frame whose mouth state matches the new line; the path
# prefers playing frames in order (natural head/body motion) and only cuts between look-alike frames.
import os, sys, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import types
drv = types.ModuleType('drv'); drv.__file__ = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lipsync_drive.py')
exec(compile(open(drv.__file__).read().replace('\nmain()\n', '\n'), drv.__file__, 'exec'), drv.__dict__)
from PIL import Image
PUB = EP_PUB; SRC = EP_SRC
CH = json.load(open(os.path.join(LIPSYNC, '3d', 'pool.json')))   # which real talking clip holds which pool lines, at what offset
META = json.load(open(f'{SRC}/sprites.json')); C = json.load(open(f'{SRC}/cfg.json'))
W = json.load(open(os.path.join(POOL, 'words.json')))             # words of the pool lines (to label each pool frame's mouth)
FPS_IN = 100
def raw_for(lines_off, dur, who):
    n = int(dur * FPS_IN) + 10; x = np.zeros(n); shp = np.full(n, -1); ph = ['SIL'] * n
    for k, off in lines_off:
        sp = [w for w in W[k] if not w['raw'].startswith('[')]
        o, sh, a, p = drv.line_track(os.path.join(POOL, f'{k}.mp3'), sp)
        f0 = int(round(off * FPS_IN)); m = min(len(o), n - f0)
        x[f0:f0 + m] = o[:m]; shp[f0:f0 + m] = sh[:m]; ph[f0:f0 + m] = p[:m]
    return x, shp, ph
def states_for(who, lines_off, dur):
    x, shp, ph = raw_for(lines_off, dur, who); N = int(dur * 30) + 2
    st, _ = drv.compute(who, x, shp, ph, N); return np.array(st)
def feat(clip, f):
    m = META[clip]; im = np.array(Image.open(f'{PUB}/{clip}/{f:04d}.png').convert('RGBA')).astype(np.float32)
    h = m['h']; x0, x1 = int(m['cx'] - 0.35 * h), int(m['cx'] + 0.35 * h); y0, y1 = int(m['feet'] - h), int(m['feet'] - 0.45 * h)  # upper body + head
    pad = np.zeros((int(h) + 400, int(0.7 * h) + 400, 4), np.float32)
    crop = im[max(0, y0):y1, max(0, x0):x1]
    g = Image.fromarray(np.clip(crop[..., :3] * (crop[..., 3:] / 255), 0, 255).astype(np.uint8)).convert('L').resize((24, 20), Image.BILINEAR)
    return np.array(g, np.float32).ravel() / 255
SIM = np.full((7, 7), 1.4); np.fill_diagonal(SIM, 0)
for a, b in [(1, 3), (3, 4), (4, 5), (5, 6), (4, 6), (2, 5), (1, 2), (0, 1)]: SIM[a, b] = SIM[b, a] = 0.6
SIM[0, 1:] = SIM[1:, 0] = 2.0; SIM[0, 1] = SIM[1, 0] = 1.0
def pool(who, exclude_lines):
    P = []
    for c, m in CH.items():
        if (who == 'S') != (c == 'CE'): continue
        clip = f'ls{c}'; n = META[clip]['n']; fps = META[clip]['fps']
        lines = [(k, off) for k, off in m['off'].items()]
        st = states_for(who, lines, m['dur'])
        for f in range(n):
            t = f / fps
            # which line is this frame in? skip frames belonging to excluded lines (fair test)
            cur = None
            for k, off in sorted(lines, key=lambda q: q[1]):
                if t >= off - 0.1: cur = k
            if cur in exclude_lines: continue
            P.append((clip, f, int(st[min(len(st) - 1, int(round(t * 30)))])))
    F = np.array([feat(c, f) for c, f, _ in P])
    return P, F
def solve(target, P, F, lam=1.6):
    n = len(P); T = len(target); S = np.array([p[2] for p in P])
    D = ((F[:, None, :] - F[None, :, :]) ** 2).mean(-1); D = D / np.median(D)
    J = lam * D + 0.35  # jump cost
    nxt = np.full(n, -1)
    for i in range(n - 1):
        if P[i + 1][0] == P[i][0] and P[i + 1][1] == P[i][1] + 1: nxt[i] = i + 1
    U = SIM[np.array(target)][:, S]  # T x n
    cost = U[0].copy(); back = np.zeros((T, n), np.int32)
    acc = np.zeros(n)  # sub-frame accumulator ignored; 24->30 fps handled by allowing hold
    for t in range(1, T):
        # candidates: from any j with jump cost; from j=i (hold, small cost) ; from prev in sequence (free)
        best = cost[:, None] + J  # j -> i
        stay = cost + 0.12
        seq = np.full(n, np.inf); has = nxt >= 0; seq[nxt[has]] = cost[has]
        bj = best.argmin(0); bv = best[bj, np.arange(n)]
        choose = np.stack([bv, stay, seq]); k = choose.argmin(0)
        prev = np.where(k == 0, bj, np.where(k == 1, np.arange(n), np.where(seq < np.inf, np.argmax(np.eye(n)[:, :][np.r_[has]] if False else 0, 0) if False else 0, 0)))
        # resolve sequential predecessor index
        pred = np.full(n, -1); pred[nxt[has]] = np.where(has)[0]
        prev = np.where(k == 0, bj, np.where(k == 1, np.arange(n), pred))
        cost = choose.min(0) + U[t]; back[t] = prev
    path = [int(cost.argmin())]
    for t in range(T - 1, 0, -1): path.append(int(back[t][path[-1]]))
    return [P[i] for i in path[::-1]]
if __name__ == '__main__':
    # usage: reseq.py [--fair t0 t1]
    #   default: every line of the 3D part, pool = all real talking frames (a new episode's lines are never in the pool)
    #   --fair t0 t1: test mode, lines inside the window are removed from the pool (as approved in 3D test 1)
    fair = '--fair' in sys.argv
    win = (float(sys.argv[2]), float(sys.argv[3])) if fair else (C['mid']['t0'] - 0.5, C['pull']['t0'] + 0.5)
    NAT = json.load(open(f'{SRC}/visnat.json'))['w']
    out = {'P': {}, 'S': {}}
    for who in 'PS':
        lines = [k for k, l in C['lines'].items() if l['who'] == who and l['t1'] > win[0] and l['t0'] < win[1]]
        if not lines: continue
        P, F = pool(who, set(lines) if fair else set()); print(who, 'lines', lines, 'pool frames', len(P))
        for k in lines:
            l = C['lines'][k]; a, b = int((l['t0'] - 0.35) * 30), int((l['t1'] + 0.45) * 30)
            tgt = NAT[who][a:b]; path = solve(tgt, P, F)
            for i, (c, f, s) in enumerate(path): out[who][a + i] = [c, f]
            cuts = sum(1 for i in range(1, len(path)) if not (path[i][0] == path[i - 1][0] and 0 <= path[i][1] - path[i - 1][1] <= 1))
            match = np.mean([tgt[i] == path[i][2] for i in range(len(path))])
            print(f'  {k}: {len(path)} frames, mouth match {match:.0%}, cuts {cuts}')
    json.dump(out, open(f'{SRC}/reseq.json', 'w'))
