#!/usr/bin/env python3
# 3D episode builder: reads $PIPZO_WORK/episode.json and writes
#   src/ep3d/cfg.json                  timeline for the locked template + world (lines, words, shots, push, walks, stops,
#                                      stations with their model cue times, pull, cards, motions)
#   $PIPZO_WORK/build/audio_plan.json  everything mix3d.py places (voices, beds, ticks, dings, and the box sounds)
# Nothing here is tied to one episode. The episode file format is in SKILL.md ("The episode file").
# Needs: $PIPZO_WORK/in/<ID>.mp3 for every line and $PIPZO_WORK/words_fa.json (forced_align.py).
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, re, subprocess

SPEC = json.load(open(os.path.join(WORK, 'episode.json')))
WFA = json.load(open(os.path.join(WORK, 'words_fa.json')))
IN = os.path.join(WORK, 'in')
problems, notes = [], []
dur = lambda i: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{IN}/{i}.mp3']).decode())
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
r3 = lambda x: round(x, 3)

items = SPEC['lines']; ids = [x['id'] for x in items if 'id' in x]
for i in ids:
    if not os.path.exists(f'{IN}/{i}.mp3'): problems.append(f'missing voice in/{i}.mp3')
    if i not in WFA: problems.append(f'missing words for {i} (run forced_align.py)')
roles = {x.get('role'): x['id'] for x in items if x.get('role')}
if 'ask' not in roles: problems.append('no line has "role": "ask" (the closing comment question is required)')
elif roles['ask'] != ids[-1]: problems.append('the "ask" line must be the last line')
if 'next' not in roles: problems.append('no line has "role": "next" (the next-episode line, where the Follow card appears)')
if problems: sys.exit('ERROR\n' + '\n'.join(problems))
ask_text = next(x['text'] for x in items if x.get('id') == roles['ask'])
if '?' not in ask_text and 'comment' not in ask_text.lower(): notes.append(f'WARN the ask line is not a question: {ask_text!r}')

push_after = SPEC['push']['after']; PUSH_LEAD = SPEC['push'].get('lead', 0.5); PUSH_DUR = 1.4
pull = SPEC['pull']; PULL_DUR = 1.6
TW = 2.3          # one walk between stations (32-frame gait, speed 1.06): fixed by the character clips
AFTER_STOP = 0.45 # first line of a station starts 0.45 s after they stop; the box starts rising 0.45 s before they stop

# ---------- 1. place lines, reactions and walks ----------
L, words, segs = {}, [], []
t = 0.0; phase = 'open'; push = pull_t = None; mid0 = None
for n, it in enumerate(items):
    gap = it.get('gap', 0.25 if n else 0.0)
    if 'react' in it:
        t0 = t + gap; segs.append(dict(kind=it['react'], t0=t0, t1=t0 + it['dur'], phase=phase, react=True)); t = t0 + it['dur']; continue
    i = it['id']; who = it['who']; d = dur(i)
    if phase == 'mid_first':                      # walk to the first station, then speak
        segs.append(dict(walk=True, k=0, t0=mid0, t1=mid0 + TW, phase='mid')); t0 = mid0 + TW + AFTER_STOP; phase = 'mid'
    elif phase == 'mid' and it.get('walk'):       # walk on to the next station before this line
        k = len([s for s in segs if s.get('walk')]); w0 = t + max(0.2, it.get('gap', 0.2))   # gap on a walk line = a held silence before they walk on
        segs.append(dict(walk=True, k=k, t0=w0, t1=w0 + TW, phase='mid')); t0 = w0 + TW + AFTER_STOP
    elif phase == 'after_pull' and t < pull_t['t1'] - 1.25:
        t0 = max(t + gap, pull_t['t0'] + 0.35)
    else:
        t0 = t + gap
    if 'at' in it: t0 = max(t0, it['at'])
    if 'window' in it:
        w0 = it['window'][0]; t0 = max(t0, w0 - 1.0)
        if t0 > w0 + 1.0: notes.append(f'DRIFT {i}: starts {t0:.1f}s, script window starts {w0:.1f}s ({t0 - w0:+.1f}s)')
    t1 = t0 + d; L[i] = dict(id=i, who=who, t0=r3(t0), t1=r3(t1))
    for x in WFA[i]:
        if not x['raw'].startswith('['): words.append(dict(raw=x['raw'], t0=r3(t0 + x['t0']), t1=r3(t0 + x['t1']), who=who, line=i))
    segs.append(dict(kind=it.get('shot'), t0=t0, t1=t1, phase=phase if phase != 'mid_first' else 'mid', line=i, who=who, cuts=it.get('cuts', [])))
    t = t1
    if i == push_after:
        p1 = t1 + PUSH_LEAD; push = dict(t0=r3(p1 - PUSH_DUR), t1=r3(p1), zoom=SPEC['push'].get('zoom', 5.0)); mid0 = p1 - 0.4; t = p1; phase = 'mid_first'
    if i == pull.get('after'):
        p0 = t1 + pull.get('hold', 0.4); pull_t = dict(t0=r3(p0), t1=r3(p0 + PULL_DUR)); t = p0; phase = 'after_pull'
if not push or not pull_t: sys.exit('ERROR push.after / pull.after line not found')
total = r3(L[ids[-1]]['t1'] + 1.3)

def wt(line, word, k=0):
    h = [x for x in words if x['line'] == line and norm(x['raw']) == norm(word)]
    if len(h) <= k: sys.exit(f'ERROR word {word!r} not found in {line}')
    return h[k]['t0']
def at_ref(ref):
    p = ref.split(':')
    if len(p) == 1: return L[p[0]]['t0']
    if p[1] == 'end': return L[p[0]]['t1']
    if p[1] == 'start': return L[p[0]]['t0']
    return wt(p[0], p[1], int(p[2]) if len(p) > 2 else 0)
end_ref = lambda ref: at_ref(ref) if ':' in ref else L[ref]['t1']

# ---------- 2. the world: walks, stops, pops, stations ----------
walks = [s for s in segs if s.get('walk')]
wsegs = [['walk', r3(w['t0']), r3(w['t1']), w['k']] for w in walks]
stops = [['stop', r3(w['t1']), r3(walks[j + 1]['t0'] if j + 1 < len(walks) else pull_t['t0']), w['k']] for j, w in enumerate(walks)]
pops = [r3(s[1] - 0.45) for s in stops]
ST = SPEC.get('stations', [])
if len(ST) != len(walks): sys.exit(f'ERROR {len(walks)} stations walked to (first middle line + every "walk": true) but {len(ST)} in "stations"')
stations = []
for k, st in enumerate(ST):
    ms = []
    for j, m in enumerate(st['models']):
        a = at_ref(m['at']) if 'at' in m else pops[k] + 1.7 + 0.3 * j
        if a < pops[k] + 1.7: a = pops[k] + 1.7          # a model can't appear before the cap has landed
        mm = dict(kind=m['kind'], at=r3(a))
        if 'off' in m: mm['off'] = r3(at_ref(m['off']))
        if 'label' in m: mm['label'] = m['label']
        ms.append(mm)
    stations.append(dict(models=ms))
    if stops[k][2] - pops[k] < 4.0: notes.append(f'WARN station {k} is only {stops[k][2] - pops[k]:.1f}s long; the box needs about 3 s to rise and fill')

# ---------- 3. classroom shots (same rules as the 2D skill) ----------
KIND = {'wide': 'mw', 'point': 'pt', 'cuP': 'cuP', 'cuS': 'cuS', 'device': 'device'}
cuts = []
for s in segs:
    if s.get('walk') or s['phase'] == 'mid': continue
    k = s['kind'] or ('mw' if s.get('who') == 'P' else 'cuS')
    cuts.append([0.0 if not cuts else s['t0'] - 0.1, KIND[k], s['phase'], s.get('react', False)])
    for w, k2 in s.get('cuts', []): cuts.append([wt(s['line'], w) - 0.1, KIND[k2], s['phase'], False])
cuts.sort(key=lambda c: c[0])
pre = [c for c in cuts if c[2] == 'open']; post = [c for c in cuts if c[2] == 'after_pull']
if not pre or pre[-1][1] != 'pt': pre.append([max(pre[-1][0] + 0.8 if pre else 0, push['t0'] - 1.6), 'pt', 'open', False])
S = []
def zk_for(kind, d, react=False):
    if kind in ('cuP', 'cuS'): return [[0, 1.08], [d, 1.14]] if react else [[0, 1.04], [max(4, d), 1.10]]
    if kind == 'pt': return [[0, 1.08], [max(4, d), 1.25]]
    if kind == 'mw': return [[0, 1.0], [max(5, d), 1.12]]
    return [[0, 1.0]]
def add(kind, t0, t1, zk=None, pivot=(640, 600), **kw):
    if t1 - t0 < 0.05: return
    if S and S[-1]['kind'] == kind and S[-1].get('diagram', 0) == kw.get('diagram', 0): S[-1]['t1'] = r3(t1); return
    S.append(dict(kind=kind, t0=r3(t0), t1=r3(t1), zk=zk or [[0, 1.0]], pivot=list(pivot), **kw))
PIV = [(560, 640), (620, 560), (640, 600)]
for j, (c0, k, _, rx) in enumerate(pre):
    c1 = pre[j + 1][0] if j + 1 < len(pre) else push['t1'] + 0.4
    add(k, c0, c1, zk_for(k, c1 - c0, rx), PIV[j % 3] if k == 'mw' else (640, 600))
add('mid', mid0, pull_t['t0'])
follow_t0 = L[roles['next']]['t0'] - 0.2
post_cuts = [[pull_t['t0'], 'mw', 'after_pull', False]] + [c for c in post if c[0] > pull_t['t0'] + 0.3]
for j, (c0, k, _, rx) in enumerate(post_cuts):
    c1 = post_cuts[j + 1][0] if j + 1 < len(post_cuts) else total
    if c0 >= follow_t0 - 0.05 and k != 'mw': k = 'mw'
    zk = [[0, 1.0], [2.0, 1.0], [5.0, 1.12]] if j == 0 else ([[0, 1.0], [3.0, 1.0], [9.0, 1.12]] if c0 >= follow_t0 - 0.05 else zk_for(k, c1 - c0, rx))
    add(k, c0, c1, zk, (640, 600), **({'diagram': 1} if k in ('mw', 'pt') else {}))
for s in S:
    if s['kind'] != 'mid' and s['t1'] - s['t0'] > 6.0 and not (s['t0'] <= push['t0'] <= s['t1']) and s['t1'] < total - 0.01:
        notes.append(f'WARN shot {s["kind"]} {s["t0"]:.1f}-{s["t1"]:.1f}s is {s["t1"] - s["t0"]:.1f}s long (cut every 3-5 s)')

# ---------- 4. cards, motions, cfg ----------
F = SPEC['follow']
follow = dict(t0=r3(follow_t0), pulse=r3(follow_t0 + 0.8), tap=r3(L[roles['ask']]['t1'] + 0.15) if F.get('tap', False) else None, n=F['next_n'], title=F['next_title'])
remember = None
if SPEC.get('remember'):
    rr = roles.get('remember')
    if not rr: sys.exit('ERROR "remember" text is set but no line has "role": "remember"')
    remember = dict(t0=r3(L[rr]['t0'] - 0.1), t1=r3(L[rr]['t1'] + 0.3), a=SPEC['remember']['a'], b=SPEC['remember']['b'])
banner = dict(t0=0.0, t1=2.8, sub=SPEC['banner'].get('sub', '')) if SPEC.get('banner') else None
MOT = {'nod', 'tilt', 'lean', 'bounce', 'shake', 'pop'}; motions = []
for it in items:
    for m in it.get('motion', []):
        m = m if isinstance(m, list) else [m]
        if m[0] not in MOT: sys.exit(f'ERROR motion {m[0]!r}: use one of {sorted(MOT)}')
        motions.append(dict(type=m[0], who=it['who'], t=r3(wt(it['id'], m[1]) if len(m) > 1 else L[it['id']]['t0'] + 0.1)))
cfg = dict(total=total, lines=L, words=words, shots=S, punch=[], push=push, mid=dict(t0=r3(mid0), end=pull_t['t0']), pull=pull_t,
           world=dict(segs=sorted(wsegs + stops, key=lambda s: s[1]), pops=pops, stations=stations),
           banner=banner, remember=remember, follow=follow, motions=sorted(motions, key=lambda m: m['t']),
           meta=dict(series=SPEC['series'], ep=SPEC['ep'], title=SPEC['title'], handle=SPEC.get('handle', True)))
json.dump(cfg, open(os.path.join(EP_SRC, 'cfg.json'), 'w'), indent=0)

# ---------- 5. audio plan ----------
beds, ticks, dings, quiet = [], [], [], []
for s in SPEC.get('sound', []):
    ty = s['type']
    if ty in ('bed', 'lift'): beds.append([r3(at_ref(s['from'])), r3(end_ref(s.get('to', s['from']))), ty])
    elif ty == 'tick': a = at_ref(s['at']) + s.get('offset', 0.0); ticks += [r3(a + q * s.get('every', 0.45)) for q in range(s.get('n', 1))]
    elif ty == 'ding': dings.append(r3(at_ref(s['at'])))
    elif ty == 'nomusic': quiet.append([r3(at_ref(s['from'])), r3(end_ref(s.get('to', s['from'])))])
    else: sys.exit(f'ERROR sound type {ty!r}: use bed, lift, tick, ding or nomusic')
box = dict(rise=pops, cap=[r3(p + 1.55) for p in pops], model=[m['at'] for st in stations for m in st['models']],
           off=[m['off'] for st in stations for m in st['models'] if 'off' in m], walk=[w[1] for w in wsegs[1:]])
plan = dict(total=total, voices=[[f'{k}.mp3', v['t0']] for k, v in L.items()], mid=[cfg['mid']['t0'], pull_t['t0']],
            beds=beds, quiet=quiet, ticks=ticks, dings=dings, box=box, sting=SPEC.get('sting', True))
json.dump(plan, open(os.path.join(WORK, 'build', 'audio_plan.json'), 'w'), indent=1)

print(f'total {total}s  push {push["t0"]}-{push["t1"]}  middle {r3(mid0)}-{pull_t["t0"]}  pull {pull_t["t0"]}-{pull_t["t1"]}  follow {follow["t0"]}')
for k, v in L.items(): print(f'  {k:6s} {v["who"]} {v["t0"]:7.2f} {v["t1"]:7.2f}')
for s in sorted(wsegs + stops, key=lambda s: s[1]): print(f'  {s[0]:4s} station {s[3]}  {s[1]:7.2f}-{s[2]:7.2f}')
for k, st in enumerate(stations): print(f'  station {k}: rise {pops[k]:.2f}  ' + ', '.join(f'{m["kind"]}@{m["at"]}' + (f' off@{m["off"]}' if 'off' in m else '') for m in st['models']))
for n in notes: print(n)
if not 90 <= total <= 150: print(f'WARN total {total}s is outside 90-150 s')
