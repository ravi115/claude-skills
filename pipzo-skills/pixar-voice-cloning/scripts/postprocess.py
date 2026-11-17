#!/usr/bin/env python3
# After tts-kaggle.sh: name, trim and level the generated lines so the episode pipelines can use them.
#   ~/Downloads/voice-out/<date>/001.wav ...  +  ids.txt  ->  $PIPZO_WORK/in/<ID>.mp3
# - trims silence at both ends (keeps 80 ms), so line timing in the edit is exact
# - optional speed-up (--speed 1.04 was used in Episode 4 to fit the length; pitch is kept)
# - loudness -18 LUFS per line (the episode mix normalises the whole reel to -14 LUFS afterwards)
# usage: python3 postprocess.py <voice-out dir> <ids.txt> <episode in/ dir> [--speed 1.04]
import os, subprocess, sys
src, ids_f, dst = sys.argv[1:4]; speed = float(sys.argv[sys.argv.index('--speed') + 1]) if '--speed' in sys.argv else 1.0
ids = [l.strip() for l in open(ids_f) if l.strip()]; os.makedirs(dst, exist_ok=True)
trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse'
for n, i in enumerate(ids, 1):
    w = os.path.join(src, f'{n:03d}.wav')
    if not os.path.exists(w): print(f'MISSING {w} for {i}'); continue
    af = trim + (f',atempo={speed}' if abs(speed - 1) > 1e-3 else '') + ',loudnorm=I=-18:TP=-1.5:LRA=11'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-af', af, '-ar', '44100', '-ac', '1', '-b:a', '192k', os.path.join(dst, f'{i}.mp3')], check=True)
    print(f'{i}.mp3  <- {n:03d}.wav')
