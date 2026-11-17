import json, numpy as np
C=json.load(open('/root/tools/remo/src/llm2/cfg2.json')); VS=json.load(open('/root/ep2/vis_fa100.json'))
FPS=30; N=int(C['total']*FPS)+2; LEAD=1
W={'P':np.full(N,-1),'S':np.full(N,-1)}
for k,l in C['lines'].items():
    v=np.array(VS[k]); n30=int(len(v)/100*FPS)+1; seq=np.full(n30,-1)
    for i in range(n30):
        a=int(i*100/FPS); b=max(a+1,int((i+1)*100/FPS)); w=v[a:b]
        if len(w)==0 or (w==-1).mean()>=0.5: continue
        vals=w[w>=0]; seq[i]=np.bincount(vals).argmax()
    # min hold 2 frames for open shapes
    for i in range(1,n30-1):
        if seq[i]>=0 and seq[i-1]!=seq[i] and seq[i+1]!=seq[i]: seq[i]=seq[i-1] if seq[i-1]>=0 else seq[i+1]
    f0=int(round(l['t0']*FPS))-LEAD
    if f0<0: seq=seq[-f0:]; f0=0
    n30=len(seq); m=min(n30,N-f0)
    W[l['who']][f0:f0+m]=np.where(seq[:m]>=0,seq[:m],W[l['who']][f0:f0+m])
out={w:[[1 if j==s else 0 for j in range(6)] for s in seq] for w,seq in W.items()}
V=json.load(open('/root/tools/remo/src/llm2/vis2.json')); V['w']=out
json.dump(V,open('/root/tools/remo/src/llm2/vis2.json','w'),separators=(',',':'))
for who in 'PS':
    s=W[who]; talk=(s>=0).sum(); ch=(np.diff(s)!=0).sum(); print(who,'open',talk,'changes/s',round(ch/(max(1,talk)/30),1),np.bincount(s[s>=0],minlength=6))
names='AH EE OH OO FV L'.split(); P=[w for w in C['words'] if w['line']=='P2']
f0=int(P[11]['t0']*30)-1; print([(w['raw'],w['t0']) for w in P[11:16]]); print(' '.join('_' if x<0 else names[x] for x in W['P'][f0:f0+36]))
