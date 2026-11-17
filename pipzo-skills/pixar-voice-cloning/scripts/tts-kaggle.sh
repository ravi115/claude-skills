#!/usr/bin/env zsh
# tts-kaggle.sh - voice every line of a text file in ONE Kaggle GPU run (OmniVoice), download numbered WAVs,
# then make sure the GPU session is stopped.
#
#   scripts/tts-kaggle.sh path/to/lines.txt
#
# lines.txt, one line per row (blank rows and # rows skipped):
#   PB-calm-teaching | The model reads an enormous amount of text.     <- cloned from that voice (names: voices.md)
#   Just a line with no voice name.                                     <- OmniVoice default voice
# Settings come from ../kaggle-config.json. Token from KAGGLE_API_TOKEN / ~/.kaggle (never printed).
# Output: <out_dir>/<YYYY-MM-DD>/001.wav, 002.wav ... in file order, plus run.log.  TTS_OUT / TTS_STEPS override.
#
# GPU guardrails (all four always apply):
#   1. Kaggle hard limit: the kernel is pushed with --timeout = max_run_minutes; Kaggle kills it after that.
#   2. In-kernel watchdog: the script exits itself 60 s before that limit, whatever it is doing.
#   3. The kernel exits as soon as the last WAV is written (no notebook left open, no idle session).
#   4. After downloading, this script re-checks the status and REPORTS it ("GPU session stopped" / "NOT stopped").
#      It never stops a session itself; the Kaggle Session Hook (hooks/kaggle-session-hook.sh) reports it to Claude too.
set -euo pipefail
setopt null_glob

SKILL="${0:A:h:h}"; CFG="$SKILL/kaggle-config.json"
cfg() { python3 -c 'import json,os,sys; v=json.load(open(sys.argv[1]))[sys.argv[2]]; print(os.path.expanduser(v) if isinstance(v,str) else json.dumps(v))' "$CFG" "$1"; }
LINES_FILE="${1:?usage: tts-kaggle.sh path/to/lines.txt}"
KERNEL=$(cfg batch_kernel); DATASET=$(cfg voices_dataset); CACHE=$(cfg model_cache_kernel); MODEL=$(cfg model_name)
USE_CACHE=$(cfg use_model_cache); ACC=$(cfg accelerator); STEPS="${TTS_STEPS:-$(cfg steps)}"
MAX_MIN=$(cfg max_run_minutes); POLL=$(cfg poll_seconds)
OUT="${TTS_OUT:-$(cfg out_dir)/$(date +%F)}"

[[ -f "$LINES_FILE" ]] || { echo "ERROR: $LINES_FILE not found"; exit 1; }
command -v kaggle >/dev/null || { echo "ERROR: kaggle CLI missing (python3 -m pip install -U kaggle)"; exit 1; }
WORK=$(mktemp -d -t tts-kaggle); trap 'rm -rf "$WORK"' EXIT

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
import glob, json, os, subprocess, sys, threading, time
# guardrail 2: hard self-exit 60 s before Kaggle's limit, even if generation hangs
_wd = threading.Timer(max(60, $MAX_MIN * 60 - 60), lambda: (print("WATCHDOG: time limit reached, exiting", flush=True), os._exit(3)))
_wd.daemon = True; _wd.start()  # daemon: a crash anywhere still ends the session at once
LINES = json.loads($(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$WORK/lines.json"))
STEPS = $STEPS
OUT = "/kaggle/working/out"; os.makedirs(OUT, exist_ok=True)
t0 = time.time()
# saved model (kernel output of the cache kernel): offline install + local weights; else download from the internet
info = (glob.glob("/kaggle/input/**/cache-info.json", recursive=True) or [None])[0]
if info:
    C = os.path.dirname(info)
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "--no-index", "--find-links", f"{C}/wheels", "omnivoice"], check=True)
    MODEL_PATH = f"{C}/model"; SRC = "saved model " + json.load(open(info)).get("built", "")
else:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "omnivoice"], check=True)
    MODEL_PATH = "$MODEL"; SRC = "internet download (no saved model attached)"
import torch, soundfile as sf
from omnivoice import OmniVoice
t1 = time.time()
model = OmniVoice.from_pretrained(MODEL_PATH, device_map="cuda:0", dtype=torch.float16)
t2 = time.time()
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
print(f"TIMINGS install {t1-t0:.0f}s load {t2-t1:.0f}s generate {time.time()-t2:.0f}s for {len(LINES)} lines; model from {SRC}; refs {'found' if rj else 'MISSING'}; failed {failed}", flush=True)
os._exit(0)  # guardrail 3: end the session immediately
PY

if [[ "$USE_CACHE" == true ]]; then SOURCES="[\"$CACHE\"]"; NET=false; else SOURCES="[]"; NET=true; fi
cat > "$WORK/kernel-metadata.json" <<JSON
{"id": "$KERNEL", "title": "pipzo tts batch", "code_file": "tts_batch.py", "language": "python",
 "kernel_type": "script", "is_private": true, "enable_gpu": true, "enable_tpu": false, "enable_internet": $NET,
 "machine_shape": "$ACC", "dataset_sources": ["$DATASET"], "kernel_sources": $SOURCES, "competition_sources": [], "model_sources": []}
JSON

echo "Pushing $KERNEL ($STEPS steps, $ACC, saved model: $USE_CACHE, hard limit ${MAX_MIN} min) ..."
kaggle kernels push -p "$WORK" -t $(( MAX_MIN * 60 )) --accelerator "$ACC"   # guardrail 1
state() { kaggle kernels status "$KERNEL" 2>&1 | grep -oE '(QUEUED|RUNNING|COMPLETE|ERROR|CANCEL[A-Z_]*)' | head -1 || true; }
kstate=""
for (( i = 0; i < (MAX_MIN * 60 + 300) / POLL; i++ )); do
  sleep $POLL; kstate=$(state); echo "$(date +%T) $kstate"
  [[ "$kstate" == COMPLETE || "$kstate" == ERROR || "$kstate" == CANCEL* ]] && break
done

mkdir -p "$OUT"
kaggle kernels output "$KERNEL" -p "$WORK/output" >/dev/null 2>&1 || true
wavs=("$WORK"/output/out/*.wav)
(( ${#wavs} )) && cp "${wavs[@]}" "$OUT"/
logs=("$WORK"/output/*.log)
(( ${#logs} )) && python3 -c 'import json,sys; print("".join(e.get("data","") for e in json.load(open(sys.argv[1]))))' "${logs[1]}" > "$OUT/run.log" 2>/dev/null || true

# guardrail 4: report the GPU session state after download (never stops it; the Kaggle Session Hook re-checks too)
final=$(state)
if [[ "$final" == QUEUED || "$final" == RUNNING ]]; then
  echo "GPU session NOT stopped: $KERNEL is still $final. Not stopping it (more batches may need it); decide, or stop it on kaggle.com."
else
  echo "GPU session stopped: $final"
fi

[[ "$kstate" == COMPLETE ]] || { echo "ERROR: kernel ended with '${kstate:-timeout}'. Log: $OUT/run.log"; exit 1; }
echo "Done: ${#wavs} WAVs in $OUT"
grep -E 'TIMINGS|FAILED|WATCHDOG' "$OUT/run.log" 2>/dev/null || true
