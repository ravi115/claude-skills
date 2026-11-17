---
name: "pixar-classroom-hybrid-2d"
description: "Build a Pipzo Pixar-classroom 2D hybrid reel (HD classroom, Remotion lip sync, diagram middle with both portraits at the bottom), as in LLM-GPT2 Episodes 2-3."
---

# Pixar Classroom Hybrid 2D

This skill builds a complete 2D episode for any new topic. It reproduces the approved LLM-GPT2 Episode 2 ("Why 'Large'?") and uses the bottom-portrait middle from Episode 3:
- classroom opening and closing from HD stills
- push-in into the pink chalk object
- flat diagram middle (with glow and slight tilt effects) and **both portraits talking at the bottom**
- pull-back, Remember card, Follow card
- captions, cover and caption files

Lip sync is the **frozen Remotion lip sync v1**. It uses no ElevenLabs credits.

## Scope: 2D only (hard rule)
This skill **never** builds a 3D episode, whatever the script or brief says. "3D" here means:
- characters walking or standing in a 3D space
- a 3D room or world, or a three.js / WebGL scene
- ideas rising from a 3D floor
- re-sequenced walking/talking character clips

If the script asks for any of these:
1. Do not build it with this skill, and do not invent a 3D version from these files.
2. Tell the user the script calls for the 3D format and that this skill is 2D only. Recommend the separate `pixar-classroom-hybrid-3d` skill.
3. Offer to build the episode in the 2D format instead. Continue in 2D only if the user agrees.

The only "3D" this skill allows is the flat glow look of the diagram middle (`Tilt`, `Bar3D`, `Glass`). These are CSS effects on 2D cards, not a 3D scene.

## Skill folder
Everything lives in `~/Documents/AI Video Editor/Skills/pixar-classroom-hybrid-2d/`. The folder map is in `README.md`.
- `remotion/project/`: the Remotion project. The composition is `Ep2` in `src/llm2/`. Fonts, plates, busts and mouth patches are in `public/`.
- `remotion/lipsync/`: lip-sync calibration and rules (shared, professor, emily).
- `python/`: the build pipeline. Paths come from `PIPZO_WORK` (episode folder) and `PIPZO_REMO` (Remotion project), never from a fixed machine.
- `references/`: photos, small video samples and audio. Approved targets are in `references/video/combined/`.

Also on the Mac:
- Full approved videos: `Output/LLM-GPT2/LLM-GPT2_episode_2/`, `_episode_3/`.
- Book: `Requirements/LLM-GPT2/Build-a-Large-Language-Model-From-Scratch.pdf`.
- Scripts: `Requirements/LLM-GPT2/episode-NN-*/script.md`, index `EPISODE-INDEX.md`.

## Guardrails (read before any generation)

**Voices: Voice Studio only.**
- Generate every line with the local Voice Studio tool (`voicestudio__generate_speech` via the remote-devices bridge).
  - Professor profiles: `PB-*` (calm-teaching, curious-mystery, urgent-warm, confident-clear, excited-energetic, warm-welcoming, thoughtful-reflective, serious-slow, relieved-satisfied, frustrated-tired) and `X-prof-*`.
  - Emily profiles: `emily-*` and `X-emily-*`.
  - Pick the profile whose emotion matches the line's feeling tag.
- Run calls one at a time, never more than 3–4 in parallel.
- An 80 s bridge timeout still writes the file. Find it with `ls -t ~/Documents/AI Video Editor/*.wav` and check it with `voicestudio__transcribe`.
- Memory errors: wait, then retry the same call.
- Transcribe each line with `voicestudio__transcribe` to get `words.json`. It's free.
- If the lines run long, a ×1.04 speed-up is allowed. It was used in Episode 4.

**ElevenLabs is a last resort, never the first attempt.**
- Use it only if Voice Studio does not work at all, or for something Remotion truly cannot do.
- **Budget: up to 10,000 credits per episode.**
  1. Plan first. List every generation with its credit estimate (`estimate_only`) and the total.
  2. Spend only if the total is well under 10,000.
  3. If the episode would need more than 10,000, stop and get the user's approval first.
- **Never repeat a generation because it failed.** A failed run is still charged. Report it and ask before trying again.
- Everything visual is done in Remotion: lip sync, motion, diagrams, captions. No generated video and no new images without a credit estimate and approval.

**Never post or publish** without the user's explicit go-ahead.

## Setup (any machine; nothing comes from a previous workspace)
1. **Tools:** Node 18+, Python 3.10+, ffmpeg and ffprobe on the PATH.
2. **Remotion project:** run `npm install` in `remotion/project/`.
   - Versions are pinned to Remotion **4.0.543**, including `@remotion/lambda`.
   - The Lambda function must be the same version. If the deployed function is a different version, change every `remotion`/`@remotion/*` entry in `package.json` to that exact version and install again.
3. **Python:** `pip install numpy cmudict` (plus `opencv-python-headless Pillow` only for recalibration).
4. **Paths:**
   - `export PIPZO_WORK=<episode folder>` for voices, `words.json` and build outputs.
   - `PIPZO_REMO` defaults to `remotion/project` inside this skill.
5. **Voice Studio** must be reachable as an MCP server in the session:
   - the Claude desktop app's local `voicestudio`, or the same server added to Claude Code with `claude mcp add`.
   - If it isn't, stop and tell the user. Do not fall back to ElevenLabs without following the guardrails.

## Per-episode steps (in order)
1. **Script.** Read the episode `script.md` and the book chapter, and check every number against the book. Write the line table:
   - P1 hook (≤7 s, motion in frame 1)
   - P2 stake ("We're building a large language model from scratch, piece by piece, so you can build agentic AI apps yourself. Today is step N: …")
   - G1 Emily question
   - P3 handoff ("… Watch this one [object].")
   - MA and MB, the middle long takes
   - G2 Emily insert
   - P13 takeaway
   - G3 Emily says it back
   - P14 Remember
   - P15 "Next class: … Follow me, so you don't miss episode N+1."

   Pick the pink chalk handoff object. Show the table and the credit plan (normally 0 credits), and get approval.
2. **Voices.** Generate in Voice Studio, one file per line. Save them as `$PIPZO_WORK/in/P1.mp3 … P15.mp3, MA.mp3, MB.mp3, G1–G3.mp3`, and copy them to `remotion/project/public/llm2/`.
3. **Words.** From the Voice Studio transcripts, write `$PIPZO_WORK/words.json` as `{line: [{raw, t0, t1}]}`. Drop entries that start with `[`.
4. **Build**, in this order, from `python/`:
   1. `forced_align.py`: phoneme alignment, giving `words_fa.json` for captions and cues.
   2. `build2.py`: timeline, giving `cfg2.json`.
   3. `track_e2.py`: blinks and eye saccades, giving `vis2.json`.
   4. `lipsync_drive.py`: **mouths**, giving `visnat.json`.
   5. `mix2.py`: mix at −14 LUFS.
5. **Edit the episode content** (next section). Render stills at every shot change, fix them, then render the full video.
6. **QA and deliver** (sections below).

## What changes per episode (and nothing else)
- `build2.py`:
  - the shot cut words: `wt('P1','tiny')`, `wt('P2','so')`, `wt('P2','today')`, `wt('P3','watch')`, changed to words from the new lines
  - `remember` a/b text
  - `follow` n and title
- `Ep2.jsx`:
  - `EP`, `TITLE`, banner subtitle
  - `BoardDrawing`: chalk content, KalamX font, chalk `#F4F1E6`, handoff object in pink `#F472B6`
  - `DIAL`: the pink object's point in the 1000x560 board canvas, under the professor's finger in the pointing plate
- `Middle2.jsx`: new scenes.
  - Cue every element to a spoken word with `cue(line, word, k)`, and add the cue names to `T`.
  - Keep `Stage`, `SectionChip`, `Glass`, `Tilt`, `Bar3D`, `Dial`, `Pill`, `GlowText`.
  - The last scene is the save-worthy end frame (`Agents` slot, `END_T`).
- Cover props, plus `caption.txt`, `story.txt`, `handoff.txt`.

## Locked rules

**Lip sync: frozen v1, never blend mouths** (`remotion/lipsync/README.md`)
- `lipsync_drive.py` produces **one mouth state per frame**: closed, FV, OO, EE, L, OH or AH.
  - Phonemes are forced-aligned to the voice (window ±0.45 s).
  - Openness is quantile-mapped to the real mouth movement measured from the ElevenLabs lip-sync clips. Calibration is in `remotion/lipsync/{professor,emily}/calibration.json`.
  - The mouth leads the sound by 40 ms.
  - Fast speech (≥5 syllables/s) holds each mouth ≥3 frames; slow and medium speech hold ≥2.
  - Lips close on M/B/P and between words.
  - Emily's rules are frozen.
  - Professor: every vowel gets a visibly open mouth (his moustache hides small mouths), and a short syllable merges into the more open neighbour. It is never swallowed.
- The renderer (`rig/natMouth.js`, `rig/Face.jsx`, `PlateFace` in `Ep2.jsx`) draws exactly **one real drawn mouth patch at opacity 1**. No synthetic in-betweens and no crossfades; they cause ghosting.
- Wide plates have only AH, EE, OH and OO, so FV maps to EE and L maps to OH.
- The same code drives the classroom close-ups, the wide plates and the bottom portraits.
- Blinks happen every 2.4–4.8 s and eye saccades every 0.7–2.2 s (`track_e2.py`).

**Classroom (crisp, no generated video)**
- Plates are `talk_hd.jpg` and `point_hd.jpg` (2160x3840, drawn at 1080x1920). Their mouth and blink patches are `mw_*` and `pt_*`, with plate coordinates halved.
- Close-ups use HD busts via `rig/Face.jsx` (size 1400, left −170, top 560) over a blurred `cu_bgP.jpg` / `cu_bgS.jpg`.
  - Emily is mirrored to face the professor.
  - Grade: `sepia(0.16) saturate(1.1) brightness(1.03) contrast(1.03)`.
- Cut every 3–5 s between wide, close-up and pointing shots.
  - Every shot has a slow push: zoom 1.0→1.15–1.4, pivot about [640,600].
  - No static shot lasts over 4 s.
- Board quads:
  - talk: `[[500,40],[1080,0],[1080,985],[500,980]]`
  - point: `[[498,30],[1080,0],[1080,1022],[500,1018]]`
  - Chalk sits in board v 0.40–0.72. The diagram after the pull-back sits in v 0.16–0.78.

**Bottom portraits in the middle (Episode 3 layout)**
- Both portraits are on screen together, at size 470, glowing in their neon colour.
  - Professor: teal `#2DD4BF`, left 10.
  - Emily: pink `#F472B6`, **left 480**. That's 40 px more space than Episode 3, and she stays clear of the Instagram buttons.
- Labels read PROFESSOR and EMILY.
- The active speaker is at full brightness and the other at 72%. Both bob gently while talking.
- They fade in after the push-in and out before the pull-back.

**Handoffs**
- Push-in: 1.45 s, zoom 6 into the pink object. The middle opens on the same object at (450, 860).
- Final diagram: holds 2 s, then a 1.6 s pull-back. The diagram stays on the board for the closing shots.

**Middle look**
- Classroom Green Dark Keynote with glow and tilt effects (`llm1/theme.js`, `llm1/fx.jsx`). These are 2D effects only (see Scope).
  - Colours: ground #22312B, orange #F97316 for emphasis, pink #F472B6 for the handoff, teal #2DD4BF, yellow #FACC15 for numbers only, green for tokens.
  - ≤8 words on screen. Content column x 70–830, y 330–1240. Keep the right 230 px clear.
- Rotate one variation per episode: the `Stage` floor-grid colour, the glow accent, or the scene entrance. Log which one was used, and don't repeat it within 3 episodes.

**Overlays (fixed positions)**
- Header "LARGE LANGUAGE MODELS, GPT-2 · EP N" at top 196, progress bar at 232, @pipzo.ai on the right.
- Banner from 0–2.8 s at top 1020.
- Remember card: left 70, top 975, chalk 46 px.
- Follow card: top 640, with the blinking robot (`BlinkBot`). It taps "Following ✓" after the last word.
- Captions:
  - Positions: top 1235 in the classroom, 1270 in the middle, 1400 under the Follow card.
  - Emily's lines get her tag.
  - Nothing covers a face or the board writing. Covering hands or trousers is fine.

## Render, audio, encode
- **Render on AWS Lambda (default).** Run from `remotion/project/`, after the episode's JSON and voices are in `src/llm2` and `public/llm2`:
  1. `npx remotion lambda sites create src/llm2/index.jsx --site-name=pipzo-classroom-2d`. Re-run after every code or asset change; it prints the serve URL.
  2. `npx remotion lambda render <serve-url> Ep2 --codec=h264 --crf=14 --muted`.
     - It prints the S3 output. Download it as `video.mp4`.
     - AWS credentials and region come from the environment, as set up for the user's Lambda function.
- **Local fallback:** `npx remotion render src/llm2/index.jsx Ep2 video.mp4 --codec=h264 --crf=14 --muted`.
- **Stills for QA** are always local and fast: `npx remotion still src/llm2/index.jsx Ep2 still.png --frame=N`.
- The video renders muted. The audio is added in the encode step from `mix.wav`.
- Mix (`mix2.py`):
  - voices at line starts
  - room tone (`references/audio/music/classroom_roomtone.mp3`), quieter in the middle
  - closing music (`closing_sting.mp3`) ending on its sting
  - two-pass loudnorm to −14 LUFS, TP −1.5
- Encode: `-vf scale=in_range=pc:out_range=tv,format=yuv420p -c:v libx264 -profile:v high -preset slow -crf 15 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -r 30 -c:a aac -b:a 256k -movflags +faststart`.

## QA before delivery
- **Stills at every shot change:** no clipping, nothing on a face, board text readable, both portraits fully in frame.
- **Mouth strips:** 24 consecutive frames of a close-up and of a bottom portrait during a fast phrase.
  - One clean, solid mouth per frame, with no second mouth showing through.
  - Closed on m/b/p.
  - The Professor is never closed while his voice sounds.
- **Captions** match the voice. **Total length** 90–150 s.

## Delivery
- Deliver to `Output/LLM-GPT2/LLM-GPT2_episode_N/`:
  - `LLM-GPT2_episode_N.mp4`
  - `cover.jpg`: `src/cover`, props `ep`, `topic`, `bg` = blurred talk plate, `h1` "LARGE LANGUAGE", `s1` 118, `h2` "MODELS · GPT-2", `s2` 118
  - `caption.txt`: through the instagram-agent `ig-caption` linter until READY, with one ask, ≤5 hashtags, and credit to Raschka/Manning
  - `story.txt`: 3 frames
  - `handoff.txt`
- Copy the build script to `Requirements/LLM-GPT2/episode-NN-*/script-v2-build.md`.
- Large files: `SendUserFile` first, then `device_commit_files` by fileUuid.
- Report credits used (normally 0). Never post without the user's go-ahead.
