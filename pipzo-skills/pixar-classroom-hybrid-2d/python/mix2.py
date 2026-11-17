import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from paths import *
import json, subprocess, os
P=json.load(open(WORK+'/build/audio_plan.json')); IN=WORK+'/in'; total=P['total']
inputs=[]; filt=[]; labels=[]
for i,(f,at,off,dur) in enumerate(P['aud']):
    inputs+=['-i',f'{IN}/{f}']
    tr=f"atrim=start={off}" + (f":duration={dur}" if dur else "")
    filt.append(f"[{i}:a]{tr},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo,afade=t=in:d=0.02,adelay={int(at*1000)}|{int(at*1000)}[v{i}]"); labels.append(f"[v{i}]")
n=len(P['aud'])
filt.append(f"{''.join(labels)}amix=inputs={n}:normalize=0,highpass=f=70,acompressor=threshold=-22dB:ratio=2:attack=5:release=120[voice]")
# room tone: looped, quieter during the diagram middle
m0,m1=P['mid']
inputs+=['-stream_loop','-1','-i',MUSIC+'/classroom_roomtone.mp3']
filt.append(f"[{n}:a]atrim=duration={total},aresample=44100,aformat=channel_layouts=stereo,volume='if(between(t,{m0},{m1}),0.05,0.14)':eval=frame[room]")
# closing music, ending (with its sting) on the last frame
mt=P['music_t0']; mlen=10.56; off=max(0,mlen-(total-mt))
inputs+=['-i',MUSIC+'/closing_sting.mp3']
filt.append(f"[{n+1}:a]atrim=start={off},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo,afade=t=in:d=0.6,volume=0.28,adelay={int(mt*1000)}|{int(mt*1000)}[mus]")
filt.append(f"[voice][room][mus]amix=inputs=3:normalize=0,atrim=duration={total}[mix]")
cmd=['ffmpeg','-v','error','-y',*inputs,'-filter_complex',';'.join(filt),'-map','[mix]','-ar','44100',WORK+'/build/mix_raw.wav']
subprocess.run(cmd,check=True)
# two-pass loudnorm
r=subprocess.run(['ffmpeg','-hide_banner','-i',WORK+'/build/mix_raw.wav','-af','loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
j=json.loads(r[r.rindex('{'):r.rindex('}')+1])
af=f"loudnorm=I=-14:TP=-1.5:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg','-v','error','-y','-i',WORK+'/build/mix_raw.wav','-af',af,'-ar','44100',WORK+'/build/mix.wav'],check=True)
print(subprocess.run(['ffmpeg','-hide_banner','-i',WORK+'/build/mix.wav','-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True).stderr[-420:])
