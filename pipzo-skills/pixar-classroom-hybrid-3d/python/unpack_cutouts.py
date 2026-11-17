# Unpack the character cut-outs (transparent WebM, VP9 alpha) into PNG frames for Remotion:
#   references/video/{professor,emily}/cutouts/<clip>.webm  ->  remotion/project/public/ep3d/<clip>/0000.png ...
# Run once per machine (about 1-2 minutes). Frame counts/positions are in src/ep3d/sprites.json.
import os, sys, glob, subprocess, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
META = json.load(open(os.path.join(EP_SRC, 'sprites.json')))
for webm in sorted(glob.glob(os.path.join(CUTS, '*', 'cutouts', '*.webm'))):
    clip = os.path.splitext(os.path.basename(webm))[0]; out = os.path.join(EP_PUB, clip); n = META[clip]['n']
    if os.path.isdir(out) and len(glob.glob(out + '/*.png')) >= n: print('ok  ', clip); continue
    os.makedirs(out, exist_ok=True)
    # libvpx-vp9 decoder is required to keep the alpha channel
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-c:v', 'libvpx-vp9', '-i', webm, '-start_number', '0', os.path.join(out, '%04d.png')], check=True)
    print('done', clip, len(glob.glob(out + '/*.png')), 'frames')
