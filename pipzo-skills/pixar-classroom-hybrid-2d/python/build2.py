import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, subprocess, re, random, numpy as np, cmudict
IN=WORK+'/in'; W=json.load(open(WORK+'/words_fa.json'))
def dur(n): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'{IN}/{n}.mp3']).decode())
D={k:dur(k) for k in W}
seq=[]; words=[]; t=0.0
def place(name, who, gap_after=0.3, at=None):
    global t
    if at is not None: t=at
    seq.append(dict(id=name,who=who,t0=round(t,3),t1=round(t+D[name],3)))
    for x in W[name]:
        if x['raw'].startswith('['): continue
        words.append(dict(raw=x['raw'],t0=round(t+x['t0'],3),t1=round(t+x['t1'],3),who=who,line=name))
    t+=D[name]+gap_after
    return seq[-1]
L={}
L['P1']=place('P1','P',0.35)
L['P2']=place('P2','P',0.35)
L['G1']=place('G1','S',0.3)
L['P3']=place('P3','P',0.25)
push_t1=L['P3']['t1']+0.45; push_t0=push_t1-1.45
L['MA']=place('MA','P',0.35,at=push_t1+0.2)
L['G2']=place('G2','S',0.35)
L['MB']=place('MB','P',0.0)
mid_end=L['MB']['t1']+0.3; hold=2.0; pull_t0=mid_end+hold; pull_t1=pull_t0+1.6
L['P13']=place('P13','P',0.3,at=pull_t1+0.15)
L['G3']=place('G3','S',0.3)
L['P14']=place('P14','P',0.35)
L['P15']=place('P15','P',0.0)
total=round(L['P15']['t1']+1.4,3)
def wt(line, word, k=0):
    hits=[x for x in words if x['line']==line and re.sub(r'[^a-z0-9]','',x['raw'].lower())==word]
    return hits[k]['t0']
# shots: kind, t0, t1, zoom keys [[dt,scale]], pivot
S=[]
def shot(kind,t0,t1,zk=None,pivot=(640,600),**kw): S.append(dict(kind=kind,t0=round(t0,3),t1=round(t1,3),zk=zk or [[0,1.0]],pivot=list(pivot),**kw))
cut1=wt('P1','tiny')-0.1
shot('mw',0,cut1,[[0,1.0],[cut1,1.18]],(560,640))
shot('cuP',cut1,L['P2']['t0']+0.0,[[0,1.04],[6,1.10]])
cut2=wt('P2','so')-0.05
shot('mw',L['P2']['t0'],cut2,[[0,1.08],[cut2-L['P2']['t0'],1.32]],(620,560))
cut2b=wt('P2','today')-0.1
shot('cuP',cut2,cut2b,[[0,1.06],[5,1.12]])
shot('mw',cut2b,L['G1']['t0']-0.1,[[0,1.15],[4,1.38]],(560,600))
shot('cuS',L['G1']['t0']-0.1,L['P3']['t0']-0.05,[[0,1.04],[5,1.10]])
cut3=wt('P3','watch')-0.35
shot('cuP',L['P3']['t0']-0.05,cut3,[[0,1.08],[6,1.14]])
shot('pt',cut3,push_t1+0.4,[[0,1.15],[push_t0-cut3,1.3]],(640,600))
shot('mid',push_t1-0.4,pull_t0)
shot('mw',pull_t0,L['G3']['t0']-0.1,[[0,1.0],[2.4,1.0],[7.5,1.25]],(640,600),diagram=1)
shot('cuS',L['G3']['t0']-0.1,L['P14']['t0']-0.05,[[0,1.05],[4,1.1]])
shot('pt',L['P14']['t0']-0.05,L['P15']['t0']-0.1,[[0,1.05],[7.5,1.2]],(640,600),diagram=1)
shot('mw',L['P15']['t0']-0.1,total,[[0,1.0],[3.0,1.0],[8.0,1.12]],(640,600),diagram=1)
cfg=dict(total=total,lines=L,words=words,shots=S,push=dict(t0=round(push_t0,3),t1=round(push_t1,3),zoom=6.0),
  mid=dict(t0=round(push_t1-0.4,3),a0=L['MA']['t0'],g0=L['G2']['t0'],b0=L['MB']['t0'],end=round(mid_end,3)),pull=dict(t0=round(pull_t0,3),t1=round(pull_t1,3)),
  banner=dict(t0=0,t1=2.8),remember=dict(t0=L['P14']['t0']-0.1,t1=L['P14']['t1']+0.3,a='More dials, more text, more it can do.',b='Only pay for the size you need.'),
  follow=dict(t0=round(wt('P15','follow')-0.2,3),tap=round(L['P15']['t1']+0.15,3),pulse=round(wt('P15','follow')+0.8,3),n=3,title='Old NLP vs LLMs'))
json.dump(cfg,open(EP_SRC+'/cfg2.json','w'),indent=0)
json.dump(dict(total=total,lines=L),open(WORK+'/build/audio_plan.json','w'),indent=1)
print('total',total); [print(k,v['t0'],v['t1']) for k,v in L.items()]
print('push',push_t0,push_t1,'pull',pull_t0,pull_t1); [print(s['kind'],s['t0'],s['t1']) for s in S]
