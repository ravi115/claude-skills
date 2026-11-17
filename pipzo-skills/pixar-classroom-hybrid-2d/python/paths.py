# Central paths for the 2D skill. Nothing is tied to one machine: set these env vars (or run from the episode folder).
#   PIPZO_WORK  episode working folder (in/*.mp3, words.json, build outputs). Default: ./episode
#   PIPZO_REMO  Remotion project. Default: <skill>/remotion/project
import os
SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.abspath(os.environ.get('PIPZO_WORK', os.path.join(os.getcwd(), 'episode')))
REMO = os.path.abspath(os.environ.get('PIPZO_REMO', os.path.join(SKILL, 'remotion', 'project')))
EP_SRC = os.path.join(REMO, 'src', 'llm2')          # composition code + generated json (cfg2, vis2, visnat)
EP_PUB = os.path.join(REMO, 'public', 'llm2')       # per-episode audio copied here for Remotion
MUSIC = os.path.join(SKILL, 'references', 'audio', 'music')
LIPSYNC = os.path.join(SKILL, 'remotion', 'lipsync')
for d in (os.path.join(WORK, 'in'), os.path.join(WORK, 'build')): os.makedirs(d, exist_ok=True)
