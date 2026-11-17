# Blink and gaze schedule for the classroom faces (mouths come from lipsync_drive.py, not from here).
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, numpy as np, random
C=json.load(open(EP_SRC+'/cfg.json')); VS=json.load(open(WORK+'/vis_fa100.json'))
FPS=30; N=int(C['total']*FPS)+2; LEAD=1
W={'P':np.full(N,-1),'S':np.full(N,-1)}
for k,l in C['lines'].items():
    v=np.array(VS[k]); n30=int(len(v)/100*FPS)+1; seq=np.full(n30,-1)
    for i in range(n30):
        a=int(i*100/FPS); b=max(a+1,int((i+1)*100/FPS)); w=v[a:b]
        if len(w)==0 or (w==-1).mean()>=0.5: continue
        vals=w[w>=0]; seq[i]=np.bincount(vals).argmax()
    for i in range(1,n30-1):
        if seq[i]>=0 and seq[i-1]!=seq[i] and seq[i+1]!=seq[i]: seq[i]=seq[i-1] if seq[i-1]>=0 else seq[i+1]
    f0=int(round(l['t0']*FPS))-LEAD
    if f0<0: seq=seq[-f0:]; f0=0
    m=min(len(seq),N-f0); W[l['who']][f0:f0+m]=np.where(seq[:m]>=0,seq[:m],W[l['who']][f0:f0+m])
out={w:[[1 if j==s else 0 for j in range(6)] for s in seq] for w,seq in W.items()}
random.seed(3); sched={}
for who in 'PS':
    bl=[]; t=0.8
    while t<C['total']: bl.append(round(t,2)); t+=random.uniform(2.4,4.6)
    gz=[[0,0,0]]; t=0.6
    while t<C['total']: gz.append([round(t,2),round(random.uniform(-5,5),1),round(random.uniform(-2,2),1)]); t+=random.uniform(1.2,3.0)
    sched[who]=dict(blink=bl,gaze=gz)
V={'V':['AH','EE','OH','OO','FV','L'],'w':out,'s':sched}
json.dump(V,open(EP_SRC+'/vis.json','w'),separators=(',',':'))
for who in 'PS': s=W[who]; print(who,'open frames',(s>=0).sum())
