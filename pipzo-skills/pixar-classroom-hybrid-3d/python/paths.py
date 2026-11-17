# Central paths for the 3D skill. Nothing is tied to one machine.
#   PIPZO_WORK  episode folder (in/*.mp3, words.json, build outputs). Default: ./episode
#   PIPZO_REMO  Remotion project. Default: <skill>/remotion/project
import os
SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.abspath(os.environ.get('PIPZO_WORK', os.path.join(os.getcwd(), 'episode')))
REMO = os.path.abspath(os.environ.get('PIPZO_REMO', os.path.join(SKILL, 'remotion', 'project')))
EP_SRC = os.path.join(REMO, 'src', 'ep3d')       # composition code + generated json (cfg, vis, visnat, reseq, sprites)
EP_PUB = os.path.join(REMO, 'public', 'ep3d')    # unpacked character frames, fonts, end.jpg
REF = os.path.join(SKILL, 'references')
MUSIC = os.path.join(REF, 'audio', 'music'); SFX = os.path.join(REF, 'audio', 'sfx')
POOL = os.path.join(REF, 'audio', 'lipsync-pool')   # audio + words of the real talking clips (labels the 3D lip-sync pool)
CUTS = os.path.join(REF, 'video')                    # professor/ and emily/ cutouts/*.webm
LIPSYNC = os.path.join(SKILL, 'remotion', 'lipsync')
for d in (os.path.join(WORK, 'in'), os.path.join(WORK, 'build')): os.makedirs(d, exist_ok=True)
