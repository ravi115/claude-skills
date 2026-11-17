#!/usr/bin/env zsh
# tts-kaggle.sh - voice every line of a text file in ONE Kaggle GPU run (OmniVoice, T4), download numbered WAVs.
#
#   ./tts-kaggle.sh path/to/lines.txt
#
# lines.txt, one line per row (blank rows and rows starting with # are skipped):
#   PB-calm-teaching | The model reads an enormous amount of text.     <- cloned from that voice
#   Just a line with no voice name.                                     <- OmniVoice default voice
# Voice names = VoiceStudio profile names, from refs.json in the private Kaggle dataset raviranjan115/pipzo-voices-v2.
# Output: ~/Downloads/voice-out/<YYYY-MM-DD>/001.wav, 002.wav ... in file order, plus run.log.
# The kernel installs OmniVoice, loads it once, voices every line, exits. No GPU time keeps running.
# Kaggle token comes from KAGGLE_API_TOKEN / ~/.kaggle (never printed).
set -euo pipefail
setopt null_glob

LINES_FILE="${1:?usage: tts-kaggle.sh path/to/lines.txt}"
USER_SLUG="${KAGGLE_USER:-raviranjan115}"
KERNEL="$USER_SLUG/pipzo-tts-batch"
DATASET="$USER_SLUG/pipzo-voices-v2"
STEPS="${TTS_STEPS:-32}"                     # 32 = best quality (VoiceStudio default), 16 = faster
OUT="${TTS_OUT:-$HOME/Downloads/voice-out/$(date +%F)}"
POLL_SECONDS=20
MAX_WAIT_MIN=40

[[ -f "$LINES_FILE" ]] || { echo "ERROR: $LINES_FILE not found"; exit 1; }
command -v kaggle >/dev/null || { echo "ERROR: kaggle CLI missing (python3 -m pip install -U kaggle)"; exit 1; }
WORK=$(mktemp -d -t tts-kaggle); trap 'rm -rf "$WORK"' EXIT

# lines -> [[voice or null, text], ...] embedded in the kernel (no upload per run)
python3 - "$LINES_FILE" "$WORK/lines.json" <<'PY'
import json, sys
rows = []
for r in open(sys.argv[1], encoding='utf-8'):
    r = r.strip()
    if not r or r.startswith('#'): continue
    v, sep, t = r.partition('|')
    rows.append([v.strip(), t.strip()] if sep else [None, r])
if not rows: sys.exit('ERROR: no lines to voice')
json.dump(rows, open(sys.argv[2], 'w'), ensure_ascii=False)
print(f'{len(rows)} lines, voices: {sorted({v for v, _ in rows if v})}')
PY

cat > "$WORK/tts_batch.py" <<PY
import glob, json, os, subprocess, sys, time
LINES = json.loads($(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$WORK/lines.json"))
STEPS = $STEPS
OUT = "/kaggle/working/out"; os.makedirs(OUT, exist_ok=True)
t0 = time.time()
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "omnivoice"], check=True)
import torch, soundfile as sf
from omnivoice import OmniVoice
t1 = time.time()
model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cuda:0", dtype=torch.float16)
t2 = time.time()
# voice references from the private dataset (mounted somewhere under /kaggle/input)
rj = (glob.glob("/kaggle/input/**/refs.json", recursive=True) or [None])[0]
REFS, BASE = (json.load(open(rj)), os.path.dirname(rj)) if rj else ({}, "")
prompts = {}
def prompt(v):
    if v not in prompts:
        r = REFS[v]; p = os.path.join(BASE, r["file"])
        if not os.path.exists(p): p = (glob.glob(f"/kaggle/input/**/{os.path.basename(r['file'])}", recursive=True) or [p])[0]
        prompts[v] = model.create_voice_clone_prompt(ref_audio=p, ref_text=r["text"])
    return prompts[v]
failed = []
for i, (voice, text) in enumerate(LINES, 1):
    try:
        if voice and voice not in REFS: raise KeyError(f"voice {voice!r} not in refs.json")
        kw = {"voice_clone_prompt": prompt(voice)} if voice else {}
        audio = model.generate(text=text, language="English", num_step=STEPS, **kw)[0]
        sf.write(f"{OUT}/{i:03d}.wav", audio, 24000)
        print(f"{i:03d} ok {len(audio)/24000:.1f}s [{voice or 'default'}] {text[:60]}", flush=True)
    except Exception as e:
        failed.append(i); print(f"{i:03d} FAILED [{voice}] {e}", flush=True)
print(f"TIMINGS install {t1-t0:.0f}s load {t2-t1:.0f}s generate {time.time()-t2:.0f}s for {len(LINES)} lines; refs {'found' if rj else 'MISSING'}; failed {failed}", flush=True)
PY

cat > "$WORK/kernel-metadata.json" <<JSON
{"id": "$KERNEL", "title": "pipzo tts batch", "code_file": "tts_batch.py", "language": "python",
 "kernel_type": "script", "is_private": true, "enable_gpu": true, "enable_tpu": false, "enable_internet": true,
 "machine_shape": "NvidiaTeslaT4", "dataset_sources": ["$DATASET"], "kernel_sources": [], "competition_sources": [], "model_sources": []}
JSON

echo "Pushing $KERNEL ($STEPS steps) ..."
kaggle kernels push -p "$WORK"
kstatus=""
for (( i = 0; i < MAX_WAIT_MIN * 60 / POLL_SECONDS; i++ )); do
  sleep $POLL_SECONDS
  kstatus=$(kaggle kernels status "$KERNEL" 2>&1 | grep -oE '(QUEUED|RUNNING|COMPLETE|ERROR|CANCEL[A-Z_]*)' | head -1 || true)
  echo "$(date +%T) $kstatus"
  [[ "$kstatus" == COMPLETE || "$kstatus" == ERROR || "$kstatus" == CANCEL* ]] && break
done

mkdir -p "$OUT"
kaggle kernels output "$KERNEL" -p "$WORK/output" >/dev/null 2>&1 || true
wavs=("$WORK"/output/out/*.wav)
(( ${#wavs} )) && cp "${wavs[@]}" "$OUT"/
logs=("$WORK"/output/*.log)
(( ${#logs} )) && python3 -c 'import json,sys; print("".join(e.get("data","") for e in json.load(open(sys.argv[1]))))' "${logs[1]}" > "$OUT/run.log" 2>/dev/null || true

if [[ "$kstatus" != COMPLETE ]]; then
  echo "ERROR: kernel ended with status '${kstatus:-timeout}'. Log: $OUT/run.log"
  echo "If it is still running, stop it at https://www.kaggle.com/code/$KERNEL so no GPU time is used."
  exit 1
fi
echo "Done: ${#wavs} WAVs in $OUT"
grep -E 'TIMINGS|FAILED' "$OUT/run.log" 2>/dev/null || true
