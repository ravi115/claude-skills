#!/usr/bin/env python3
# Episode builder: reads $PIPZO_WORK/episode.json (the episode file) and writes
#   src/episode/cfg.json        timeline for the locked template (lines, words, shots, push, middle, pull, cards, motions)
#   $PIPZO_WORK/build/audio_plan.json   everything the mixer places (voices, room tone, beds, ticks, dings, sting)
# Nothing in here is tied to one episode. The episode file format is in SKILL.md ("The episode file").
# Needs: $PIPZO_WORK/in/<ID>.mp3 for every line and $PIPZO_WORK/words_fa.json (python/forced_align.py).
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, re, subprocess

SPEC = json.load(open(os.path.join(WORK, 'episode.json')))
WFA = json.load(open(os.path.join(WORK, 'words_fa.json')))
IN = os.path.join(WORK, 'in')
problems, notes = [], []

def dur(i):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{IN}/{i}.mp3']).decode())
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())

items = SPEC['lines']
ids = [x['id'] for x in items if 'id' in x]
for i in ids:
    if not os.path.exists(f'{IN}/{i}.mp3'): problems.append(f'missing voice in/{i}.mp3')
    if i not in WFA: problems.append(f'missing words for {i} (run forced_align.py)')
if problems: sys.exit('ERROR\n' + '\n'.join(problems))

push_after = SPEC['push']['after']; PUSH_LEAD = SPEC['push'].get('lead', 0.5); PUSH_DUR = 1.45
pull = SPEC['pull']; PULL_DUR = 1.6; HOLD = pull.get('hold', 2.0)
roles = {x.get('role'): x['id'] for x in items if x.get('role')}
if 'ask' not in roles: problems.append('no line has "role": "ask" (the closing comment question is required)')
elif roles['ask'] != ids[-1]: problems.append('the "ask" line must be the last line')
if 'next' not in roles: problems.append('no line has "role": "next" (the next-episode line, where the Follow card appears)')
if problems: sys.exit('ERROR\n' + '\n'.join(problems))
ask_text = next(x['text'] for x in items if x.get('id') == roles['ask'])
if not ask_text.strip().endswith('?') and 'comment' not in ask_text.lower():
    notes.append(f'WARN the ask line does not end with a question or say "comment": {ask_text!r}')

# ---------- 1. place every line and reaction on the timeline ----------
L, words, segs, punch = {}, [], [], []
t = 0.0; phase = 'open'; push = pull_t = None; mid_end = None
for n, it in enumerate(items):
    gap = it.get('gap', 0.3 if n else 0.0)
    prev_end = t
    if 'react' in it:                                   # a silent reaction shot (grin, laugh, nod)
        t0 = t + gap; t1 = t0 + it['dur']
        segs.append(dict(kind=it['react'], t0=t0, t1=t1, phase=phase, react=True)); t = t1; continue
    i = it['id']; who = it['who']; d = dur(i)
    if phase == 'mid_first':
        t0 = push['t1'] + it.get('gap', 0.25); phase = 'mid'
    elif phase == 'after_pull' and pull_t and 'line' not in pull and t < pull_t['t1'] + 0.15:
        t0 = pull_t['t1'] + 0.15
    else:
        t0 = t + gap
    if 'at' in it: t0 = max(t0, it['at'])
    if 'window' in it:
        w0 = it['window'][0]; t0 = max(t0, w0 - 1.0)
        if t0 > w0 + 1.0: notes.append(f'DRIFT {i}: starts {t0:.1f}s, script window starts {w0:.1f}s ({t0 - w0:+.1f}s)')
    t1 = t0 + d
    L[i] = dict(id=i, who=who, t0=round(t0, 3), t1=round(t1, 3))
    for x in WFA[i]:
        if x['raw'].startswith('['): continue
        words.append(dict(raw=x['raw'], t0=round(t0 + x['t0'], 3), t1=round(t0 + x['t1'], 3), who=who, line=i))
    seg_phase = 'mid' if phase in ('mid',) else phase
    segs.append(dict(kind=it.get('shot'), t0=t0, t1=t1, phase=seg_phase, line=i, who=who, cuts=it.get('cuts', []), role=it.get('role')))
    if it.get('punch') and seg_phase == 'mid':
        p0 = prev_end + 0.25 if gap >= 1.0 else t0 - 0.12
        punch.append(dict(kind='cuS' if who == 'S' else 'cuP', t0=round(p0, 3), t1=round(t1 + 0.2, 3), zk=[[0, 1.08], [2, 1.14]], pivot=[640, 600]))
    t = t1
    if i == push_after:                                 # push-in into the pink object, the middle starts next
        p1 = t1 + PUSH_LEAD; push = dict(t0=round(p1 - PUSH_DUR, 3), t1=round(p1, 3), zoom=SPEC['push'].get('zoom', 5.0))
        t = p1; phase = 'mid_first'
    if 'line' in pull and i == pull['line']:            # pull-back starts inside this line
        p0 = t0 + pull.get('at', 0.9); pull_t = dict(t0=round(p0, 3), t1=round(p0 + PULL_DUR, 3)); mid_end = p0
        segs[-1]['phase'] = 'mid'; phase = 'after_pull'
    if 'after' in pull and i == pull['after']:          # pull-back after this line and a held end frame
        mid_end = t1 + 0.3; p0 = mid_end + HOLD; pull_t = dict(t0=round(p0, 3), t1=round(p0 + PULL_DUR, 3))
        t = pull_t['t1']; phase = 'after_pull'
if not push: sys.exit(f'ERROR push.after line {push_after!r} not found')
if not pull_t: sys.exit('ERROR pull line not found')
total = round(L[ids[-1]]['t1'] + 1.3, 3)

def wt(line, word, k=0):
    h = [x for x in words if x['line'] == line and norm(x['raw']) == norm(word)]
    if len(h) <= k: sys.exit(f'ERROR word {word!r} not found in {line}')
    return h[k]['t0']
def at_ref(ref):                                       # "P05" (line start) or "P05:word" or "P05:word:2" or "P05:end"
    p = ref.split(':')
    if len(p) == 1: return L[p[0]]['t0']
    if p[1] == 'end': return L[p[0]]['t1']
    return wt(p[0], p[1], int(p[2]) if len(p) > 2 else 0)
def end_ref(ref): return at_ref(ref) if ':' in ref else L[ref]['t1']   # a bare line id as an end means the end of that line

# ---------- 2. shots ----------
KIND = {'wide': 'mw', 'point': 'pt', 'cuP': 'cuP', 'cuS': 'cuS', 'device': 'device', 'mw': 'mw', 'pt': 'pt'}
cuts = []
for s in segs:
    if s['phase'] == 'mid': continue
    k = s['kind'] or ('mw' if s.get('who') == 'P' else 'cuS')
    cuts.append([0.0 if not cuts else s['t0'] - 0.1, KIND[k], s['phase'], s.get('react', False)])
    for w, k2 in s.get('cuts', []): cuts.append([wt(s['line'], w) - 0.1, KIND[k2], s['phase'], False])
cuts.sort(key=lambda c: c[0])
pre = [c for c in cuts if c[2] == 'open']; post = [c for c in cuts if c[2] == 'after_pull']
if not pre or pre[-1][1] != 'pt':                     # the push-in always starts from the pointing plate
    pre.append([max(pre[-1][0] + 0.8 if pre else 0, push['t0'] - 1.6), 'pt', 'open', False])
S = []
PIV = [(560, 640), (620, 560), (640, 600)]
def zk_for(kind, d, n, react=False):
    if kind in ('cuP', 'cuS'): return [[0, 1.08], [d, 1.14]] if react else [[0, 1.04], [max(4, d), 1.10]]
    if kind == 'pt': return [[0, 1.1], [max(4, d), 1.28]]
    if kind == 'mw': return [[0, 1.0], [max(5, d), 1.15]]
    return [[0, 1.0]]
def add(kind, t0, t1, zk=None, pivot=(640, 600), **kw):
    if t1 - t0 < 0.05: return
    if S and S[-1]['kind'] == kind and not kw.get('diagram') == 0 and S[-1].get('diagram', 0) == kw.get('diagram', 0):
        S[-1]['t1'] = round(t1, 3); return
    S.append(dict(kind=kind, t0=round(t0, 3), t1=round(t1, 3), zk=zk or [[0, 1.0]], pivot=list(pivot), **kw))
for j, (c0, k, _, rx) in enumerate(pre):
    c1 = pre[j + 1][0] if j + 1 < len(pre) else push['t1'] + 0.4
    piv = PIV[j % 3] if k == 'mw' else (640, 600)
    add(k, c0, c1, zk_for(k, c1 - c0, j, rx), piv)
add('mid', push['t1'] - 0.4, pull_t['t0'])
follow_t0 = L[roles['next']]['t0'] - 0.2
post_cuts = [[pull_t['t0'], 'mw', 'after_pull', False]] + [c for c in post if c[0] > pull_t['t0'] + 0.3]
for j, (c0, k, _, rx) in enumerate(post_cuts):
    c1 = post_cuts[j + 1][0] if j + 1 < len(post_cuts) else total
    if c0 >= follow_t0 - 0.05 and k != 'mw': k = 'mw'           # the Follow card always sits over the classroom
    if j == 0: zk = [[0, 1.0], [2.0, 1.0], [5.0, 1.15]]
    elif c0 >= follow_t0 - 0.05: zk = [[0, 1.0], [3.0, 1.0], [9.0, 1.12]]
    else: zk = zk_for(k, c1 - c0, j, rx)
    add(k, c0, c1, zk, (640, 600), **({'diagram': 1} if k in ('mw', 'pt') else {}))
for s in S:
    if s['kind'] not in ('mid',) and s['t1'] - s['t0'] > 6.0 and not (s['t0'] <= push['t0'] <= s['t1']) and s['t1'] < total - 0.01: notes.append(f'WARN shot {s["kind"]} {s["t0"]:.1f}-{s["t1"]:.1f}s is {s["t1"] - s["t0"]:.1f}s long (cut every 3-5 s)')

# ---------- 3. cards, motions, cfg ----------
F = SPEC['follow']
follow = dict(t0=round(follow_t0, 3), pulse=round(follow_t0 + 0.8, 3), tap=round(L[roles['ask']]['t1'] + 0.15, 3) if F.get('tap', True) else None,
              n=F['next_n'], title=F['next_title'])
remember = None
if SPEC.get('remember'):
    r = roles.get('remember');
    if not r: sys.exit('ERROR "remember" text is set but no line has "role": "remember"')
    remember = dict(t0=round(L[r]['t0'] - 0.1, 3), t1=round(L[r]['t1'] + 0.3, 3), a=SPEC['remember']['a'], b=SPEC['remember']['b'])
banner = dict(t0=0.0, t1=2.8, sub=SPEC['banner'].get('sub', '')) if SPEC.get('banner') else None
MOT = {'nod', 'tilt', 'lean', 'bounce', 'shake', 'pop'}
motions = []
for it in items:
    for m in it.get('motion', []):
        m = m if isinstance(m, list) else [m]
        if m[0] not in MOT: sys.exit(f'ERROR motion {m[0]!r} on {it.get("id")}: use one of {sorted(MOT)}')
        motions.append(dict(type=m[0], who=it['who'], t=round(wt(it['id'], m[1]) if len(m) > 1 else L[it['id']]['t0'] + 0.1, 3)))
cfg = dict(total=total, lines=L, words=words, shots=S, punch=punch, push=push,
           mid=dict(t0=round(push['t1'] - 0.4, 3), end=round(mid_end, 3)), pull=pull_t,
           banner=banner, remember=remember, follow=follow, motions=sorted(motions, key=lambda m: m['t']),
           meta=dict(series=SPEC['series'], ep=SPEC['ep'], title=SPEC['title'], handle=SPEC.get('handle', True)))
os.makedirs(EP_SRC, exist_ok=True)
json.dump(cfg, open(os.path.join(EP_SRC, 'cfg.json'), 'w'), indent=0)

# ---------- 4. audio plan ----------
beds, ticks, dings, quiet = [], [], [], []
for s in SPEC.get('sound', []):
    ty = s['type']
    if ty in ('bed', 'lift'):
        beds.append([round(at_ref(s['from']), 3), round(end_ref(s.get('to', s['from'])), 3), s.get('vol', 0.16 if ty == 'bed' else 0.1), 1.2 if ty == 'lift' else 0.5])
    elif ty == 'tick':
        a = at_ref(s['at']) + s.get('offset', 0.0); ticks += [round(a + k * s.get('every', 0.45), 3) for k in range(s.get('n', 1))]
    elif ty == 'ding': dings.append(round(at_ref(s['at']), 3))
    elif ty == 'nomusic': quiet.append([round(at_ref(s['from']), 3), round(end_ref(s.get('to', s['from'])), 3)])
    else: sys.exit(f'ERROR sound type {ty!r}: use bed, lift, tick, ding or nomusic')
for q0, q1 in quiet:
    for b in beds:
        if b[0] < q1 and b[1] > q0: notes.append(f'WARN a bed {b[0]}-{b[1]}s overlaps a no-music range {q0}-{q1}s; the bed is cut there')
plan = dict(total=total, voices=[[f'{k}.mp3', v['t0']] for k, v in L.items()], mid=[cfg['mid']['t0'], pull_t['t0']],
            beds=beds, quiet=quiet, ticks=ticks, dings=dings, sting=SPEC.get('sting', True))
json.dump(plan, open(os.path.join(WORK, 'build', 'audio_plan.json'), 'w'), indent=1)

print(f'total {total}s  push {push["t0"]}-{push["t1"]}  middle {cfg["mid"]["t0"]}-{pull_t["t0"]}  pull {pull_t["t0"]}-{pull_t["t1"]}  follow {follow["t0"]}')
for k, v in L.items(): print(f'  {k:6s} {v["who"]} {v["t0"]:7.2f} {v["t1"]:7.2f}')
for s in S: print(f'  shot {s["kind"]:6s} {s["t0"]:7.2f} {s["t1"]:7.2f}' + (' diagram' if s.get('diagram') else ''))
for n in notes: print(n)
if not 90 <= total <= 150: print(f'WARN total {total}s is outside 90-150 s')
