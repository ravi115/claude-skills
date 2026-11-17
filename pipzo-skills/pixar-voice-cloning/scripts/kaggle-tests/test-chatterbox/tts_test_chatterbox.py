import time, subprocess, sys, os
T = {}; t = time.time()
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "chatterbox-tts", "torchvision==0.21.0"], check=True); T["install"] = time.time() - t
import torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS
t = time.time(); model = ChatterboxTTS.from_pretrained(device="cuda"); T["load"] = time.time() - t
os.makedirs("/kaggle/working/out", exist_ok=True)
line = "Pretraining is school. Step inside Stage 1, and you will see why it costs a fortune."
t = time.time(); wav = model.generate(line); T["gen"] = time.time() - t
ta.save("/kaggle/working/out/chatterbox.wav", wav, model.sr)
print("TIMINGS", {k: round(v, 1) for k, v in T.items()}, "gpu", torch.cuda.get_device_name(0))
