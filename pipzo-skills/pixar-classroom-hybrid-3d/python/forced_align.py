# Forced alignment by DTW: text phonemes (with expected mouth openness) vs audio loudness (100 fps).
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, subprocess, re, numpy as np, sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from lipsync_audio import phon, VMAP
FPS=100
PEN=0.01
BAND=25
BANDS=60
OPEN={**{p:1.0 for p in 'AA AE AH AY AW AO OW OY'.split()}, **{p:0.85 for p in 'EH EY ER'.split()}, **{p:0.7 for p in 'IH IY UW UH'.split()},
      **{p:0.45 for p in 'L N R W Y NG HH DH TH'.split()}, **{p:0.32 for p in 'S Z SH ZH CH JH F V'.split()}, **{p:0.22 for p in 'T D K G'.split()}, **{p:0.0 for p in 'M B P'.split()}}
def env(path):
    a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',path,'-ac','1','-ar','16000','-f','s16le','-']),np.int16).astype(np.float32)/32768
    h=160; e=np.array([np.sqrt((a[i*h:(i+1)*h]**2).mean()) for i in range(len(a)//h)])
    e=np.convolve(e,np.ones(3)/3,'same'); e=e/np.percentile(e,95); return np.clip(e,0,1.2)**0.7
def tokens(words):
    T=[('SIL',None,0.0,0.0)]
    for wi,w in enumerate(words):
        ph=phon(w['raw'])
        for k,p in enumerate(ph): T.append((p,wi,OPEN.get(p,0.4),w['t0']+(w['t1']-w['t0'])*(k+0.5)/len(ph)))
        if re.search(r'[.,?!:;]$',w['raw']) or wi==len(words)-1: T.append(('SIL',None,0.0,w['t1']+0.15))
        else: T.append(('GAP',None,0.15,w['t1']))
    return T
def dtw(T,a):
    n,m=len(T),len(a); o=np.array([t[2] for t in T]); INF=1e9
    sil=np.array([t[0] in ('SIL','GAP') for t in T])
    C=(o[:,None]-a[None,:])**2; C[sil]*=0.8
    pr=np.array([t[3] for t in T])*FPS; fr=np.arange(m)[None,:]; band=np.where(sil,BANDS,BAND)[:,None]
    C=C+np.where(np.abs(fr-pr[:,None])>band,1e3,0.0)
    C[0,:int(pr[1]) if n>1 else 1]=np.minimum(C[0,:int(pr[1]) if n>1 else 1],0.5)
    STAY=np.where(sil,0.0,PEN)
    D=np.full((n,m),INF); B=np.zeros((n,m),np.int8); D[0,0]=C[0,0]
    for j in range(1,m):
        stay=D[:,j-1]; adv=np.concatenate([[INF],D[:-1,j-1]])
        # skipping an optional GAP token
        adv2=np.concatenate([[INF,INF],D[:-2,j-1]]); adv2[~np.concatenate([[False,False],np.array([T[i-1][0]=='GAP' for i in range(2,n)])])]=INF
        stay=stay+STAY; best=np.minimum(np.minimum(stay,adv),adv2); B[:,j]=np.where(best==stay,0,np.where(best==adv,1,2))
        D[:,j]=best+C[:,j]
    i=n-1; path=[0]*m
    for j in range(m-1,-1,-1):
        path[j]=i
        if j>0: i-=int(B[i,j])
    return path
def align_line(path_audio, words):
    a=env(path_audio); T=tokens(words); P=dtw(T,a)
    tok=[T[i] for i in P]
    out=[]
    for wi,w in enumerate(words):
        fr=[j for j,t in enumerate(tok) if t[1]==wi]
        if fr: out.append(dict(raw=w['raw'],t0=round(fr[0]/FPS,3),t1=round((fr[-1]+1)/FPS,3)))
        else: out.append(dict(raw=w['raw'],t0=out[-1]['t1'] if out else 0,t1=(out[-1]['t1'] if out else 0)+0.05))
    vis=[VMAP.get(t[0],-1) if t[0] not in ('SIL','GAP') else -1 for t in tok]
    return out, vis, a
if __name__=='__main__':
    W=json.load(open(WORK+'/words.json')); WA={}; VS={}
    for k,ws in W.items():
        sp=[x for x in ws if not x['raw'].startswith('[')]
        out,vis,a=align_line(f'{WORK}/in/{k}.mp3',sp); WA[k]=out; VS[k]=vis
        m=np.zeros(len(a),bool)
        for x in out: m[int(x['t0']*FPS):int(x['t1']*FPS)]=True
        act=a>0.25; print(k,'word-on-voice',round((m&act).sum()/max(1,m.sum()),2),'voice-covered',round((m&act).sum()/max(1,act.sum()),2))
    json.dump(WA,open(WORK+'/words_fa.json','w')); json.dump(VS,open(WORK+'/vis_fa100.json','w'))
