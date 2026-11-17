# viseme/blink/gaze tracks for Episode 2 (same algorithm as ep1/vis/track.py v2)
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, re, random, subprocess, numpy as np, cmudict
D=cmudict.dict(); C=json.load(open(EP_SRC+'/cfg2.json'))
V=['AH','EE','OH','OO','FV','L']; PM={}
for p in 'AA AE AH AY AW'.split(): PM[p]=('AH',1.0)
for p in 'EH EY IH IY Y'.split(): PM[p]=('EE',0.95)
for p in 'S Z SH CH JH ZH'.split(): PM[p]=('EE',0.6)
for p in 'AO OW OY ER'.split(): PM[p]=('OH',1.0)
for p in 'UW UH W'.split(): PM[p]=('OO',1.0)
for p in 'F V'.split(): PM[p]=('FV',1.0)
for p in 'L TH DH N T D'.split(): PM[p]=('L',0.75)
for p in 'K G NG HH R'.split(): PM[p]=('AH',0.45)
for p in 'M B P'.split(): PM[p]=(None,0)
VOW=set('AA AE AH AY AW EH EY IH IY AO OW OY ER UW UH'.split())
NUM={'124':'one hundred twenty four','175':'one hundred seventy five','300':'three hundred','4.6':'four point six','gpt-2':'g p t two','gpt-3':'g p t three','llms':'l l m s','ai':'a i'}
def phones(w):
    w=w.lower().strip('.,?!:;"')
    if w in NUM: return sum([phones(x) for x in NUM[w].split()],[])
    w=re.sub(r"[^a-z']",'',w)
    if not w: return []
    if w in D: return [re.sub(r'\d','',p) for p in D[w][0]]
    m={'a':'AE','e':'EH','i':'IH','o':'OW','u':'UH','y':'IY','f':'F','v':'V','l':'L','m':'M','b':'B','p':'P','w':'W','s':'S','z':'Z','r':'R','t':'T','d':'D','n':'N','k':'K','c':'K','g':'G','h':'HH','j':'JH','q':'K','x':'S'}
    return [m[ch] for ch in w if ch in m]
FPS=30; N=int(C['total']*FPS)+2
# loudness envelopes from the placed voice files
def env_for(who):
    e=np.zeros(N)
    for k,l in C['lines'].items():
        if l['who']!=who: continue
        a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',f'{WORK}/in/{k}.mp3','-ac','1','-ar','16000','-f','s16le','-']),np.int16).astype(np.float32)/32768
        hop=16000//FPS; r=np.array([np.sqrt((a[i*hop:(i+1)*hop]**2).mean()+1e-9) for i in range(len(a)//hop)])
        f0=int(round(l['t0']*FPS)); e[f0:f0+len(r)]=np.maximum(e[f0:f0+len(r)],r[:max(0,N-f0)])
    return np.clip(e/np.percentile(e[e>0],95),0,1)
LEAD=0.04; MINK=0.10; out={}
for who in ['P','S']:
    keys=[]
    for w in [x for x in C['words'] if x['who']==who]:
        ph=phones(w['raw'])
        if not ph: continue
        wt=np.array([1.8 if p in VOW else 1.0 for p in ph]); dur=w['t1']-w['t0']; edges=w['t0']+np.concatenate([[0],np.cumsum(wt)])/wt.sum()*dur
        for p,a,b in zip(ph,edges[:-1],edges[1:]):
            v,st=PM.get(p,('AH',0.5)); keys.append([a-LEAD,b-LEAD,v,st,p in VOW or p in ('M','B','P','F','V')])
    merged=[]
    for k in keys:
        if merged and (k[1]-k[0]<MINK and not k[4]): merged[-1][1]=k[1]; continue
        if merged and merged[-1][2]==k[2] and k[0]-merged[-1][1]<0.03: merged[-1][1]=k[1]; merged[-1][3]=max(merged[-1][3],k[3]); continue
        merged.append(k)
    T=np.full(N,-1,int); S=np.zeros(N)
    for a,b,v,st,_ in merged:
        f0=int(round(a*FPS)); f1=max(f0+2,int(round(b*FPS)))
        for f in range(max(0,f0),min(N,f1)): T[f]=-1 if v is None else V.index(v); S[f]=0 if v is None else st
    env=env_for(who); tgt=np.zeros((N,6))
    for f in range(N):
        if T[f]>=0: tgt[f,T[f]]=S[f]*np.clip(0.6+0.8*env[f],0,1.0)
    Wt=np.zeros((N,6)); cur=np.zeros(6)
    for f in range(N):
        for j in range(6):
            d=tgt[f,j]-cur[j]; cur[j]+=d*(0.6 if d>0 else 0.45)
        cur[cur<0.02]=0; Wt[f]=cur
    s_=Wt.sum(1,keepdims=True); Wt=np.divide(Wt,s_,out=Wt.copy(),where=s_>1)
    out[who]=[[round(float(x),2) for x in r] for r in Wt]
rnd=random.Random(11); sched={}
for who in ['P','S']:
    bl=[];t=1.0
    while t<C['total']: bl.append(round(t,2)); t+=rnd.uniform(2.4,4.8)
    gz=[];t=0;rng=(6,3) if who=='P' else (5,3)
    while t<C['total']: gz.append([round(t,2),round(rnd.uniform(-rng[0],rng[0]),1),round(rnd.uniform(-rng[1],rng[1]*0.6),1)]); t+=rnd.uniform(0.7,2.2)
    sched[who]=dict(blink=bl,gaze=gz)
json.dump(dict(V=V,w=out,s=sched),open(EP_SRC+'/vis2.json','w'),separators=(',',':'))
print('ok',N)
