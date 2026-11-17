# Only for NEW character footage: cut a character out of a video (rembg, isnet-general-use) into PNG frames.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import sys, os, subprocess, numpy as np, glob
from PIL import Image
from rembg import new_session, remove
src, out, oscale = sys.argv[1], sys.argv[2], float(sys.argv[3])
os.makedirs(out, exist_ok=True); tmp = out + '_raw'; os.makedirs(tmp, exist_ok=True)
subprocess.run(['ffmpeg','-nostdin','-y','-loglevel','error','-i',src,f'{tmp}/%04d.png'],check=True)
sess = new_session('isnet-general-use')
fr = sorted(glob.glob(f'{tmp}/*.png')); prev=None
for i,f in enumerate(fr):
    im = Image.open(f).convert('RGB'); W0,H0=im.size
    small = im.resize((int(W0*0.6),int(H0*0.6)), Image.BILINEAR)
    a = np.asarray(remove(small, session=sess, only_mask=True)).astype(np.float32)/255
    if prev is not None: a = 0.75*a + 0.25*prev
    prev = a
    W,H = round(W0*oscale), round(H0*oscale)
    big = im.resize((W,H), Image.LANCZOS)
    al = Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8)).resize((W,H), Image.BICUBIC)
    al = al.point(lambda v: 0 if v<20 else (255 if v>235 else int((v-20)*255/215)))
    big.putalpha(al); big.save(f'{out}/{i:04d}.png', compress_level=2)
    if i%50==0: print(i, len(fr), flush=True)
print('done', len(fr))
subprocess.run(['rm','-rf',tmp])
