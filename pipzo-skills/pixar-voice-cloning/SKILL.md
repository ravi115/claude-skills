---
name: "pixar-voice-cloning"
description: "Generate the Professor's and Emily's voices for Pipzo Pixar-classroom reels on Kaggle (OmniVoice, free T4 GPU), cloned from 46 approved mood references. Use for any episode voice line."
---

# Pixar voice cloning: the Professor and Emily

This skill makes every spoken line of a Pipzo episode in the two approved character voices. It works for both the 2D and the 3D classroom skills.

The voices are cloned on **Kaggle** with **OmniVoice** (`k2-fsa/OmniVoice`) on a free T4 GPU. Each clone comes from a reference clip plus its exact transcript.

Voice Studio on the Mac is retired, so don't use it. ElevenLabs is not part of this skill.

## What's in the skill
- `kaggle-dataset/`: the 46 approved references.
  - `refs.json` maps each voice name to its WAV and its exact transcript.
  - This folder is the private Kaggle dataset `raviranjan115/pipzo-voices-v2`, file for file.
- `voices.md`: the catalogue of every voice name, its mood, its length and its transcript. Pick voices from here.
- `kaggle-config.json`: how to connect to Kaggle (account, dataset, saved model, GPU, limits). See "Kaggle connection".
- `scripts/tts-kaggle.sh`: voices a whole episode in ONE Kaggle GPU run, downloads numbered WAVs, then confirms the GPU session is stopped.
- `scripts/build-model-cache.sh`: one-time: saves the OmniVoice model + pip wheels on Kaggle so runs skip install and download.
- `scripts/make_lines.py`: turns the episode table (`ID | Voice | Text`) into `lines.txt` + `ids.txt` for the run.
- `scripts/postprocess.py`: names the WAVs by line ID, trims silence, applies the optional speed-up, levels to −18 LUFS, and writes `$PIPZO_WORK/in/<ID>.mp3`.
- `scripts/kaggle-tests/`: the one-off OmniVoice and Chatterbox test kernels, kept for reference.
- `samples/review-all-moods.mp3`: every mood back to back, to hear the range.

## Kaggle connection (`kaggle-config.json`)
All scripts read `kaggle-config.json` in this folder. Change settings there, not in the scripts.

| Key | Meaning |
|---|---|
| `username` | Kaggle account (`raviranjan115`). |
| `accelerator` | GPU for voice runs (`NvidiaTeslaT4`). |
| `voices_dataset` | Private dataset with the 46 references (`raviranjan115/pipzo-voices-v2`). |
| `model_name` | OmniVoice model on Hugging Face (`k2-fsa/OmniVoice`). |
| `model_cache_kernel` | Kaggle kernel whose saved output holds the model + pip wheels (`raviranjan115/pipzo-omnivoice-cache`). |
| `use_model_cache` | `false` (default, fastest): download the model each run. `true`: use the saved model (slow to read on Kaggle; fallback only). |
| `batch_kernel` | Kernel each voice run pushes (`raviranjan115/pipzo-tts-batch`). |
| `steps` | Diffusion steps: 32 = best quality, 16 = faster draft. |
| `max_run_minutes` | Hard GPU limit per run (Kaggle kills the kernel after this). |
| `poll_seconds`, `out_dir` | Status polling interval; where WAVs are downloaded. |

**Token:** never in the config. The Kaggle CLI reads it from `KAGGLE_API_TOKEN` (exported in `~/.zshrc`) or `~/.kaggle/access_token`. Run scripts through `zsh -ic '...'` so `~/.zshrc` is loaded. Never print, echo or log the token.

**First-time setup on a new machine:** `python3 -m pip install -U kaggle`, then check `kaggle kernels list --mine`. No model setup is needed: each run downloads OmniVoice (~22 s). `scripts/build-model-cache.sh` is only for the offline fallback.

## Guardrails (hard rules)
1. **Shut the GPU down after every run.** A voice run must end with no Kaggle GPU session left running. `tts-kaggle.sh` enforces this four ways:
   - pushes the kernel with a hard `--timeout` of `max_run_minutes` (Kaggle stops it after that);
   - an in-kernel watchdog exits 60 s before that limit, whatever the kernel is doing;
   - the kernel exits the moment the last WAV is written;
   - after downloading the WAVs, the script re-checks the kernel and reports "GPU session stopped" or "NOT stopped". It never stops a session itself.

   **Kaggle Session Hook** (`hooks/kaggle-session-hook.sh`, registered in `~/.claude/settings.json` as a PostToolUse hook on Bash; to install on a new machine, merge `hooks/settings-snippet.json` into that file): after any command that downloads voices (`tts-kaggle.sh` or `kaggle kernels output`), it checks the batch kernel and any kernel named in the command, and reports to the user and to Claude whether the GPU session is shut down. It only reports; it never stops or deletes a session, because one may be kept on for more batches.

   When the hook (or the script) says a session is NOT shut down: if more batches are planned for it, carry on; otherwise tell the user and stop it on kaggle.com (or delete the kernel with the user's OK). A background run triggers the hook at launch, so it will say "running" then; re-check after the run finishes. Never push a GPU kernel any other way and never open the batch kernel as an interactive notebook session.
2. **Load the model the fast way: download it each run.** Keep `use_model_cache: false` (internet on). Measured on a T4, 17 Nov 2026:

   | | Download from Hugging Face | Saved model (kernel output) |
   |---|---|---|
   | install | 32 s | 37 s |
   | model load | **22 s** | **484 s** |

   Kaggle mounts a saved kernel output as slow attached storage, so reading the 3.3 GB model from it takes ~8 min, while Hugging Face downloads it in ~22 s. A whole run (queue + install + load + 20 lines) is ~3 min with download. The saved model (`scripts/build-model-cache.sh`, `model_cache_kernel`, `use_model_cache: true`) stays available only as a fallback if Hugging Face is unreachable. If a run's `run.log` shows a model load over ~60 s, check this setting first.

## Voices by mood (pick by the line's feeling tag)

**Professor.** Default to the PB set: every reference starts with the same anchor line, so his timbre is identical across moods.

| Feeling | Voice |
|---|---|
| calm / explaining | `PB-calm-teaching` |
| curious / mystery | `PB-curious-mystery` |
| warm / welcoming | `PB-warm-welcoming` |
| confident / takeaway | `PB-confident-clear` |
| excited | `PB-excited-energetic` |
| urgent | `PB-urgent-warm` |
| serious / slow | `PB-serious-slow` |
| thoughtful | `PB-thoughtful-reflective` |
| relieved / satisfied | `PB-relieved-satisfied` |
| frustrated | `PB-frustrated-tired` |
| amused / playful | `professor-amused-playful` |
| surprised / impressed | `professor-surprised-impressed` |
| mood changes within the line | `professor-arc-urgent-frustrated-relieved` |
| teasing bet | `X-prof-teasing-bet` |
| alarm | `X-prof-urgent-alarm` |
| triumph | `X-prof-triumphant` |
| "come closer" | `X-prof-mystery-invite` |
| exasperated | `X-prof-exasperated` |
| big reveal | `X-prof-dramatic-reveal` |

**Emily.** Default to the `emily-*` set; use `X-emily-*` only for big reactions.

| Feeling | Voice |
|---|---|
| curious question | `emily-bright-curious` |
| puzzled | `emily-puzzled-unsure` |
| annoyed / flat | `emily-annoyed-flat` |
| confident / smug | `emily-confident-smug` |
| challenge | `emily-challenging-sharp` |
| surprised turn | `emily-surprised-sharp-turn` |
| amazed | `emily-excited-amazed` |
| laughing | `emily-grinning-laughing` |
| quiet realisation | `emily-thoughtful-quiet` |
| proud "I got it" | `emily-proud-satisfied` |
| bright → excited → surprised | `emily-arc-bright-excited-surprised` |
| cocky | `X-emily-cocky` |
| irritated | `X-emily-irritated` |
| stunned | `X-emily-stunned` |
| outraged | `X-emily-outraged` |
| gasp | `X-emily-gasp-amazed` |
| laughing defeat | `X-emily-laugh-defeat` |

## Steps for an episode
You need the Kaggle CLI (`pip install kaggle`), ffmpeg and Python 3 on the machine running this.

1. **Write the table.** Write `episode-lines.txt` as one row per spoken line: `ID | Voice | Text`. See `episode-lines.example.txt`.
   - IDs match the episode skill: `E01`, `P02`, `P15a` and so on.
   - Write the text exactly as it should be spoken. Spell numbers the way they should sound ("one hundred twenty-four"), and write "GPT two".
2. **Prepare the run.** `python3 scripts/make_lines.py episode-lines.txt`. It checks every voice name against `refs.json` and writes `lines.txt` + `ids.txt`.
3. **Run on Kaggle.** `scripts/tts-kaggle.sh lines.txt`.
   - It pushes one private GPU kernel, voices every line at 32 steps (`TTS_STEPS=16` for a faster draft), downloads `~/Downloads/voice-out/<date>/001.wav …` and stops.
   - It needs the Kaggle CLI and the token in `KAGGLE_API_TOKEN` or `~/.kaggle`. Never print the token.
4. **Name and level the files.** `python3 scripts/postprocess.py ~/Downloads/voice-out/<date> ids.txt $PIPZO_WORK/in`. Add `--speed 1.04` only if the episode runs long; Episode 4 used it.
5. **Check every line before building.**
   - Listen to each one, or transcribe it (Whisper or any transcriber), and compare it with the text.
   - Re-voice only the failed lines: put them in a new `lines.txt` and run again.
   - Then write `words.json` for the episode skill.

## Rules
- **One Kaggle run per batch.** Put all lines in one file. Re-run only the lines that failed, never the whole episode for one bad line.
- **The reference transcript must match the reference audio exactly.** If you add or replace a reference, transcribe it first.
- **Keep the dataset in sync.** After changing `kaggle-dataset/`, update the Kaggle dataset too: `kaggle datasets version -p kaggle-dataset -m "<what changed>"`. The script reads the dataset, not this folder.
- **One mood per line.** A line that changes mood uses an `arc` voice, or is split into two lines.
- **ElevenLabs is not used for voices.** If Kaggle is down, stop and tell the user.
- **Never post or publish** without the user's go-ahead.

## Adding a new mood
1. Record or pick a clean 10–15 s clip of the character in that mood, with no music.
2. Transcribe it exactly.
3. For the Professor, start the clip with the anchor line "We're building a large language model from scratch, piece by piece, so you can build agentic AI apps yourself." That keeps his timbre consistent with the PB set.
4. Add the WAV under `kaggle-dataset/wav*/` and an entry in `refs.json`.
5. Re-generate `voices.md`, and version the Kaggle dataset.
