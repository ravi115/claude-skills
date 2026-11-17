# Turn per-frame mouth measurements (measure_mouth.py) of a real lip-sync clip into a calibration file
# for lipsync_drive.py: normalised openness per frame + audio envelope, plus printed stats.
# usage: python3 mouth_stats.py <measured.json> <clip.mp4> <out calibration.json>
import json, numpy as np, subprocess, sys
def env(src, fps, n):
    a = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(a, np.float32); hop = 16000 / fps
    return np.array([np.sqrt(np.mean(x[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-9) for i in range(n)])
meas, clip, out = sys.argv[1:4]
d = json.load(open(meas)); fps = d['fps']; v = np.array([r[0] for r in d['v']])
lo, hi = np.percentile(v, 5), np.percentile(v, 99); o = np.clip((v - lo) / (hi - lo), 0, 1)
e = env(clip, fps, len(v)); en = np.clip(e / np.percentile(e, 98), 0, 1)
sp = en > 0.12
print('openness while speaking p10..p98:', np.round(np.percentile(o[sp], [10, 25, 50, 75, 90, 98]), 2), 'closed-frac', round(float(np.mean(o[sp] < 0.12)), 2))
json.dump({'o': o.round(3).tolist(), 'e': en.round(3).tolist(), 'fps': fps}, open(out, 'w'))
