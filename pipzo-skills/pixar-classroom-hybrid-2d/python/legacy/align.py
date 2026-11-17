# snap Scribe word timings to the real audio: global shift per line, then per-word refine
import json,subprocess,numpy as np
W=json.load(open('/root/ep2/words.json')); FPS=100; out={}
for k,ws in W.items():
    a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',f'/root/ep2/in/{k}.mp3','-ac','1','-ar','16000','-f','s16le','-']),np.int16).astype(np.float32)/32768
    hop=160; e=np.array([np.sqrt((a[i*hop:(i+1)*hop]**2).mean()) for i in range(len(a)//hop)])
    thr=max(0.02*e.max(),np.percentile(e,30)); act=(e>thr).astype(float); N=len(e)
    sp=[x for x in ws if not x['raw'].startswith('[')]
    def score(m): return (m*act).sum()-1.5*(m*(1-act)).sum()
    def mask(lst,s):
        m=np.zeros(N)
        for x in lst: m[max(0,int(x['t0']*FPS)+s):max(0,int(x['t1']*FPS)+s)]=1
        return m
    g=max(range(-80,81),key=lambda s:score(mask(sp,s)))
    res=[]
    for x in sp:
        t0=x['t0']+g/FPS; t1=x['t1']+g/FPS
        best=max(range(-15,16),key=lambda s:score(mask([dict(t0=t0,t1=t1)],s)))
        res.append(dict(raw=x['raw'],t0=round(t0+best/FPS,3),t1=round(t1+best/FPS,3)))
    # keep order, no overlaps
    for i in range(1,len(res)):
        if res[i]['t0']<res[i-1]['t1']-0.02: res[i]['t0']=round(res[i-1]['t1']-0.02,3)
        if res[i]['t1']<res[i]['t0']+0.06: res[i]['t1']=round(res[i]['t0']+0.06,3)
    out[k]=res; print(k,'global shift ms',g*10)
json.dump(out,open('/root/ep2/words_aligned.json','w'))
