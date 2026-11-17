# Audio-driven lip sync: one clean mouth shape per frame, straight from the voice.
# V = ['AH','EE','OH','OO','FV','L']; -1 = closed (base image mouth)
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, subprocess, numpy as np
FPS=30; SR=16000; HOP=SR//FPS
def frames_for(path):
    a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',path,'-ac','1','-ar',str(SR),'-f','s16le','-']),np.int16).astype(np.float32)/32768
    n=len(a)//HOP; win=np.hanning(1024); out=[]
    fr=np.fft.rfftfreq(1024,1/SR)
    for i in range(n):
        c=i*HOP+HOP//2; seg=a[max(0,c-512):c+512]
        if len(seg)<1024: seg=np.pad(seg,(0,1024-len(seg)))
        S=np.abs(np.fft.rfft(seg*win))**2
        band=lambda lo,hi: S[(fr>=lo)&(fr<hi)].sum()+1e-9
        rms=np.sqrt((seg**2).mean())
        out.append([rms,band(150,500),band(500,1100),band(1100,2000),band(2000,3500),band(3500,7500)])
    return np.array(out)
def feats(F):
    rms=F[:,0]; lo,f1,mid,f2,hi=[F[:,i] for i in range(1,6)]; tot=lo+f1+mid+f2+hi
    return rms, hi/tot, (mid+f2)/tot, lo/tot
def calib(Fs):
    A=np.vstack(Fs); rms,h,fr,ro=feats(A); ref=np.percentile(rms[rms>0.003],90); v=rms/ref>0.16
    return dict(ref=ref,h=np.percentile(h[v],85),fr=np.percentile(fr[v],70),ro=np.percentile(ro[v],80))
def classify(F,K,hold=3):
    rms,h,fr,ro=feats(F); e=rms/K['ref']; seq=np.full(len(F),-1)
    for i in range(len(F)):
        if e[i]<0.16: continue
        if h[i]>K['h'] and e[i]<0.55: seq[i]=1          # s/sh/f: teeth showing
        elif fr[i]>K['fr']: seq[i]=1                    # front vowel: ee
        elif ro[i]>K['ro']: seq[i]=2 if e[i]>0.5 else 3  # rounded: oh / oo
        elif e[i]<0.38: seq[i]=5                         # soft voiced: half open
        else: seq[i]=0                                   # open vowel: ah
    # 5-frame mode filter
    s2=seq.copy()
    for i in range(2,len(seq)-2):
        w=list(seq[i-2:i+3]); s2[i]=max(set(w),key=w.count)
    # enforce minimum hold: merge short runs into the previous shape
    out=s2.copy(); i=0
    while i<len(out):
        j=i
        while j+1<len(out) and out[j+1]==out[i]: j+=1
        if j-i+1<hold and i>0 and out[i]!=-1: out[i:j+1]=out[i-1]
        i=j+1
    return out
def build(cfg, in_dir):
    N=int(cfg['total']*FPS)+2; W={'P':np.full(N,-1),'S':np.full(N,-1)}
    FF={k:frames_for(f'{in_dir}/{k}.mp3') for k in cfg['lines']}
    K={w:calib([FF[k] for k,l in cfg['lines'].items() if l['who']==w]) for w in 'PS'}
    for k,l in cfg['lines'].items():
        seq=classify(FF[k],K[l['who']]); f0=int(round(l['t0']*FPS))
        n=min(len(seq),N-f0); cur=W[l['who']][f0:f0+n]; W[l['who']][f0:f0+n]=np.where(seq[:n]>=0,seq[:n],cur)
    out={}
    for who,seq in W.items():
        out[who]=[[1 if j==s else 0 for j in range(6)] for s in seq]
    return out
if __name__=='__main__':
    C=json.load(open(EP_SRC+'/cfg.json'))
    out=build(C,WORK+'/in'); V=json.load(open(EP_SRC+'/vis.json')); V['w']=out
    json.dump(V,open(EP_SRC+'/vis.json','w'),separators=(',',':'))
    for who in 'PS':
        s=np.array([r.index(1) if 1 in r else -1 for r in out[who]]); talk=(s>=0).sum()
        ch=(np.diff(s)!=0).sum(); print(who,'open frames',talk,'changes/s while talking',round(ch/(max(1,talk)/30),1),'shape mix',np.bincount(s[s>=0],minlength=6))

# ---- v3: phoneme sequence from the words, timing from the audio inside each word ----
import cmudict, re
_D=cmudict.dict()
VMAP={}
for p in 'AA AE AH AY AW'.split(): VMAP[p]=0
for p in 'EH EY IH IY Y S Z SH CH JH ZH'.split(): VMAP[p]=1
for p in 'AO OW OY ER'.split(): VMAP[p]=2
for p in 'UW UH W'.split(): VMAP[p]=3
for p in 'F V'.split(): VMAP[p]=4
for p in 'L TH DH N T D K G NG HH R'.split(): VMAP[p]=5
for p in 'M B P'.split(): VMAP[p]=-1
VOW=set('AA AE AH AY AW EH EY IH IY AO OW OY ER UW UH'.split())
NUM={'124':'one hundred twenty four','175':'one hundred seventy five','300':'three hundred','4.6':'four point six','gpt-2':'g p t two','gpt-3':'g p t three','gpt-2,':'g p t two','llms':'l l m s','ai':'a i','175b':'one hundred seventy five b'}
def phon(w):
    w0=w.lower().strip('.,?!:;"\'')
    if w0 in NUM: return sum([phon(x) for x in NUM[w0].split()],[])
    w1=re.sub(r"[^a-z']",'',w0)
    if not w1: return []
    if w1 in _D: return [re.sub(r'\d','',p) for p in _D[w1][0]]
    m={'a':'AE','e':'EH','i':'IH','o':'OW','u':'UH','y':'IY','f':'F','v':'V','l':'L','m':'M','b':'B','p':'P','w':'W','s':'S','z':'Z','r':'R','t':'T','d':'D','n':'N','k':'K','c':'K','g':'G','h':'HH','j':'JH','q':'K','x':'S'}
    return [m[c] for c in w1 if c in m]
def line_track(F,K,words,line_t0):
    rms=F[:,0]; e=rms/K['ref']; act=e>=0.14; n=len(F)
    seq=classify(F,K,hold=2)          # audio fallback
    seq=np.where(act,seq,-1); fixed=np.zeros(n,bool)
    for w in words:
        a=int(round((w['t0']-line_t0-0.06)*FPS)); b=int(round((w['t1']-line_t0+0.06)*FPS))
        a=max(0,a); b=min(n,b)
        fr=[i for i in range(a,b) if act[i]]
        ph=phon(w['raw'])
        if not fr or not ph: continue
        wt=np.array([1.8 if p in VOW else (0.8 if p in ('M','B','P') else 1.0) for p in ph]); cum=np.concatenate([[0],np.cumsum(wt)])/wt.sum()
        for k,i in enumerate(fr):
            u=(k+0.5)/len(fr); j=min(len(ph)-1,np.searchsorted(cum,u,side='right')-1)
            seq[i]=VMAP.get(ph[j],0); fixed[i]=True
        # make sure every M/B/P shows at least one closed frame
        for j,p in enumerate(ph):
            if p in ('M','B','P'):
                i=fr[min(len(fr)-1,int(cum[j]*len(fr)))]; seq[i]=-1
    # minimum hold 2 frames for open shapes (closures may be 1 frame)
    i=0
    while i<n:
        j=i
        while j+1<n and seq[j+1]==seq[i]: j+=1
        if j==i and seq[i]!=-1 and 0<i<n-1: seq[i]=seq[i-1] if seq[i-1]!=-1 else seq[i+1]
        i=j+1
    return seq
def build3(cfg,in_dir):
    N=int(cfg['total']*FPS)+2; W={'P':np.full(N,-1),'S':np.full(N,-1)}
    FF={k:frames_for(f'{in_dir}/{k}.mp3') for k in cfg['lines']}
    K={w:calib([FF[k] for k,l in cfg['lines'].items() if l['who']==w]) for w in 'PS'}
    for k,l in cfg['lines'].items():
        ws=[x for x in cfg['words'] if x['line']==k]
        seq=line_track(FF[k],K[l['who']],ws,l['t0']); f0=int(round(l['t0']*FPS)); m=min(len(seq),N-f0)
        W[l['who']][f0:f0+m]=np.where(seq[:m]>=0,seq[:m],W[l['who']][f0:f0+m])
    return {who:[[1 if j==s else 0 for j in range(6)] for s in seq] for who,seq in W.items()}
