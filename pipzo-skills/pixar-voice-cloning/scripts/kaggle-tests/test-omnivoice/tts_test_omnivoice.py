import time, subprocess, sys, os
T = {}; t = time.time()
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "omnivoice"], check=True); T["install"] = time.time() - t
import torch, soundfile as sf
from omnivoice import OmniVoice
t = time.time(); model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cuda:0", dtype=torch.float16); T["load"] = time.time() - t
os.makedirs("/kaggle/working/out", exist_ok=True)
line = "Pretraining is school. Step inside Stage 1, and you will see why it costs a fortune."
for steps in (16, 32):
    t = time.time(); audio = model.generate(text=line, num_step=steps); T[f"gen_{steps}"] = time.time() - t
    sf.write(f"/kaggle/working/out/omnivoice_{steps}steps.wav", audio[0], 24000)
print("TIMINGS", {k: round(v, 1) for k, v in T.items()}, "gpu", torch.cuda.get_device_name(0))
