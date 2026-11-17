# Only for NEW character footage: measure feet, height and centre of each cut-out clip -> src/ep3d/sprites.json.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import sys, json, glob, numpy as np
from PIL import Image
P=EP_SRC+'/sprites.json'
try: M=json.load(open(P))
except: M={}
M['speed']=1.06
for clip,fps,n in [a.split(':') for a in sys.argv[1:]]:
    d=fEP_PUB+'/{clip}'; fs=sorted(glob.glob(d+'/*.png')); feet=[]; top=[]; cx=[]
    for f in fs[::6]:
        a=np.asarray(Image.open(f))[:,:,3]>128; a[-6:]=False; ss=a.sum(1); rows=np.where((ss>25)&(ss<0.6*a.shape[1]))[0]; cols=np.where(a[rows[-1]-60:rows[-1]].any(0))[0]
        feet.append(rows[-1]); top.append(rows[0]); cx.append((cols[0]+cols[-1])/2)
    im=Image.open(fs[0]); N=int(n) if int(n)>0 else len(fs)
    M[clip]=dict(n=N,fps=float(fps),w=im.width,H=im.height,feet=float(np.median(feet)),h=float(np.median(feet)-np.median(top)),cx=float(np.median(cx)))
    print(clip,M[clip])
json.dump(M,open(P,'w'),indent=1)
