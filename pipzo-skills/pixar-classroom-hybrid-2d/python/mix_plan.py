#!/usr/bin/env python3
# Mixer: reads $PIPZO_WORK/build/audio_plan.json (written by build_episode.py) and writes
#   $PIPZO_WORK/build/mix.wav  (-14 LUFS, true peak -1.5)  and copies it to public/llm2/mix.wav,
# where the template plays it, so the Lambda render comes out with sound.
# Layers: voices, classroom room tone (quieter in the middle), music beds and lifts (script cues),
# ticks and dings (references/audio/sfx), and the closing music ending on its sting on the last frame.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, subprocess, shutil

P = json.load(open(os.path.join(WORK, 'build', 'audio_plan.json'))); IN = os.path.join(WORK, 'in'); total = P['total']
inputs, filt, mixl = [], [], []
def inp(*a): inputs.extend(a); return len([x for x in inputs if x == '-i']) - 1
ST = 'aresample=44100,aformat=channel_layouts=stereo'
ms = lambda x: int(round(x * 1000))

# voices
vl = []
for k, (f, at) in enumerate(P['voices']):
    i = inp('-i', os.path.join(IN, f))
    filt.append(f'[{i}:a]{ST},afade=t=in:d=0.02,adelay={ms(at)}|{ms(at)}[v{k}]'); vl.append(f'[v{k}]')
filt.append(f"{''.join(vl)}amix=inputs={len(vl)}:normalize=0,highpass=f=70,acompressor=threshold=-22dB:ratio=2:attack=5:release=120[voice]"); mixl.append('[voice]')

# room tone, looped; quieter during the diagram middle
m0, m1 = P['mid']
i = inp('-stream_loop', '-1', '-i', os.path.join(MUSIC, 'classroom_roomtone.mp3'))
filt.append(f"[{i}:a]atrim=duration={total},{ST},volume='if(between(t,{m0},{m1}),0.05,0.14)':eval=frame[room]"); mixl.append('[room]')

# music beds and lifts, cut out of any no-music range
def quiet_expr():
    return '*'.join([f"(1-between(t,{a},{b}))" for a, b in P.get('quiet', [])]) or '1'
for k, (a, b, vol, fade) in enumerate(P.get('beds', [])):
    d = max(0.1, b - a)
    i = inp('-stream_loop', '-1', '-i', os.path.join(MUSIC, 'background_bed_ep4.mp3'))
    filt.append(f"[{i}:a]atrim=duration={d},asetpts=PTS-STARTPTS,{ST},afade=t=in:d={min(fade, d / 3)},afade=t=out:st={max(0, d - 0.6)}:d=0.6,volume={vol},adelay={ms(a)}|{ms(a)},volume='{quiet_expr()}':eval=frame[b{k}]"); mixl.append(f'[b{k}]')

# ticks and dings
for name, times, vol in (('tick', P.get('ticks', []), 0.5), ('ding', P.get('dings', []), 0.45)):
    for k, at in enumerate(times):
        i = inp('-i', os.path.join(SFX, f'{name}.wav'))
        filt.append(f'[{i}:a]{ST},volume={vol},adelay={ms(at)}|{ms(at)}[{name}{k}]'); mixl.append(f'[{name}{k}]')

# closing music, ending (with its sting) on the last frame
if P.get('sting', True):
    mlen = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', os.path.join(MUSIC, 'closing_sting.mp3')]).decode())
    mt = max(0.0, total - mlen); off = max(0.0, mlen - (total - mt))
    i = inp('-i', os.path.join(MUSIC, 'closing_sting.mp3'))
    filt.append(f'[{i}:a]atrim=start={off},asetpts=PTS-STARTPTS,{ST},afade=t=in:d=0.6,volume=0.28,adelay={ms(mt)}|{ms(mt)}[mus]'); mixl.append('[mus]')

filt.append(f"{''.join(mixl)}amix=inputs={len(mixl)}:normalize=0,atrim=duration={total}[mix]")
raw = os.path.join(WORK, 'build', 'mix_raw.wav'); out = os.path.join(WORK, 'build', 'mix.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filt), '-map', '[mix]', '-ar', '44100', raw], check=True)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af, '-ar', '44100', out], check=True)
os.makedirs(EP_PUB, exist_ok=True); shutil.copy(out, os.path.join(EP_PUB, 'mix.wav'))
print(subprocess.run(['ffmpeg', '-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr[-300:])
print('mix ->', out, 'and', os.path.join(EP_PUB, 'mix.wav'))
