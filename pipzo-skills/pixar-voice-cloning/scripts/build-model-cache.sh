#!/usr/bin/env zsh
# build-model-cache.sh - ONE-TIME (or after an OmniVoice upgrade): save the OmniVoice model + its pip packages on Kaggle.
#
#   scripts/build-model-cache.sh
#
# Pushes the kernel <model_cache_kernel> from kaggle-config.json. It downloads k2-fsa/OmniVoice and the
# higgs-audio-v2 audio tokenizer into one local folder, saves the exact pip wheels OmniVoice needs, and exits.
# Its saved output is attached to every voice run (kernel_sources), which then installs offline and loads from disk:
# no model download, no internet. Runs on CPU (no GPU hours). Re-run only when you want a newer OmniVoice.
set -euo pipefail
SKILL="${0:A:h:h}"; CFG="$SKILL/kaggle-config.json"
cfg() { python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])' "$CFG" "$1"; }
KERNEL=$(cfg model_cache_kernel); MODEL=$(cfg model_name)
WORK=$(mktemp -d -t omnivoice-cache); trap 'rm -rf "$WORK"' EXIT

cat > "$WORK/build_cache.py" <<PY
import json, os, shutil, subprocess, sys, time
t = time.time(); W = "/kaggle/working"
before = {l.split("==")[0].lower(): l for l in subprocess.check_output([sys.executable, "-m", "pip", "freeze"], text=True).split()}
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "omnivoice"], check=True)
after = {l.split("==")[0].lower(): l for l in subprocess.check_output([sys.executable, "-m", "pip", "freeze"], text=True).split()}
new = sorted(v for k, v in after.items() if before.get(k) != v and "==" in v)
os.makedirs(f"{W}/wheels", exist_ok=True)
subprocess.run([sys.executable, "-m", "pip", "download", "-q", "--no-deps", "-d", f"{W}/wheels", *new], check=True)
from huggingface_hub import snapshot_download
model = snapshot_download("$MODEL", local_dir=f"{W}/model")
if not os.path.isdir(f"{W}/model/audio_tokenizer"):
    snapshot_download("eustlb/higgs-audio-v2-tokenizer", local_dir=f"{W}/model/audio_tokenizer")
for junk in ("model/.cache", "model/audio_tokenizer/.cache"): shutil.rmtree(f"{W}/{junk}", ignore_errors=True)
json.dump({"model": "$MODEL", "packages": new, "built": time.strftime("%Y-%m-%d %H:%M")}, open(f"{W}/cache-info.json", "w"), indent=1)
size = sum(os.path.getsize(os.path.join(a, f)) for a, _, fs in os.walk(W) for f in fs) / 1e9
print(f"CACHE READY {size:.1f} GB, {len(new)} wheels, {time.time()-t:.0f}s: {new}", flush=True)
PY

cat > "$WORK/kernel-metadata.json" <<JSON
{"id": "$KERNEL", "title": "pipzo omnivoice cache", "code_file": "build_cache.py", "language": "python",
 "kernel_type": "script", "is_private": true, "enable_gpu": false, "enable_tpu": false, "enable_internet": true,
 "dataset_sources": [], "kernel_sources": [], "competition_sources": [], "model_sources": []}
JSON

echo "Pushing $KERNEL (CPU only, internet on) ..."
kaggle kernels push -p "$WORK" -t 1800
for (( i = 0; i < 120; i++ )); do
  sleep 15
  ks=$(kaggle kernels status "$KERNEL" 2>&1 | grep -oE '(QUEUED|RUNNING|COMPLETE|ERROR|CANCEL[A-Z_]*)' | head -1 || true)
  echo "$(date +%T) $ks"
  [[ "$ks" == COMPLETE || "$ks" == ERROR || "$ks" == CANCEL* ]] && break
done
kaggle kernels logs "$KERNEL" 2>/dev/null | grep -oE 'CACHE READY[^"]*' | head -1 || true
[[ "$ks" == COMPLETE ]] && echo "Model cache saved as kernel output of $KERNEL" || { echo "ERROR: cache build ended with '${ks:-timeout}'"; exit 1; }
