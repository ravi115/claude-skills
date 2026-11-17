# pixar-classroom-hybrid-3d: folder guide

The instructions are in `SKILL.md`. This file explains what each folder holds.

```
pixar-classroom-hybrid-3d/
├── SKILL.md      how to build a 3D episode, guardrails, locked rules (Episode 4 + improvements)
├── README.md     this folder guide
├── examples/     the Episode 4 episode file
├── python/       build pipeline (portable: paths from PIPZO_WORK / PIPZO_REMO)
├── remotion/     Remotion project + lip-sync calibration and 3D lip-sync pool
└── references/   photos, packed character cut-outs, small previews, audio
```

## python/
Run these in order for every episode.

| Script | What it does |
|---|---|
| `paths.py` | Every path the pipeline uses. No machine-specific paths. |
| `unpack_cutouts.py` | **Once per machine.** Decodes the packed character cut-outs (WebM with transparency) into PNG frames under `public/ep3d/<clip>/`. |
| `forced_align.py` | Aligns each word and phoneme to the voice (`words_fa.json`, `vis_fa100.json`). |
| `words.py` | Word timings for each voice line (faster-whisper), keeping the script's exact words → `words.json`. |
| `build_episode3d.py` | Reads `episode.json` → `cfg.json` (classroom shots, push-in, walks and stops, the stations and their model cue times, pull-back, cards, motions) and `build/audio_plan.json`. Reports drift and warnings. Nothing to edit here. |
| `vis3d.py` | Blinks and gaze for the classroom faces (`vis.json`). |
| `lipsync_drive.py` | **Frozen lip sync v1:** one mouth state per frame for both characters (`visnat.json`). |
| `reseq.py` | **Frozen 3D lip sync v1:** picks real talking frames to match each line in the 3D part (`reseq.json`). |
| `mix3d.py` | Voices, the music bed only where episode.json allows it (ducked under speech), the box sounds on their exact frames (rise, cap, model chimes, switch-off, walk-on), script ticks and dings, room tone in the classroom only, closing sting → `mix.wav` at −14 LUFS, copied into `public/ep3d/` for the render. |
| `lipsync_audio.py` | Phoneme dictionary and phoneme→mouth map, used by the scripts above. |
| `cut_sprites.py`, `sprite_meta.py` | Only for **new** character footage: cut the character out of a video (rembg) and measure feet, height and centre for `sprites.json`. |
| `measure_mouth.py`, `mouth_stats.py` | Only to recalibrate lip sync from a new real lip-sync clip. |

## remotion/project/
The runnable Remotion project. Run `npm install`, then `unpack_cutouts.py`, then render composition `Ep3D`.

| Path | What it holds |
|---|---|
| `src/ep3d/Episode3D.jsx` | **Locked template:** classroom plates and close-ups, push-in, pull-back, neon word captions, Follow card with blinking robot over the classroom, banner, Remember card, motions, audio. Never edited per episode. |
| `src/ep3d/World3D.jsx` | **Locked 3D world:** teal sky and three star layers, green neon grid floor, camera, walking and stopping, the characters (cut-outs + 3D lip sync), and the station boxes (glass box with neon edges rising to hand height, cap, models on cue words, sinking back). Never edited per episode. |
| `src/ep3d/lib/` | **Locked:** board geometry, phone/laptop frames, the 3D parts kit (`kit3d.jsx`: neon edges, lit materials, floor clipping). |
| `src/ep3d/content/` | **Per episode:** `Board.jsx` (chalk drawing, handoff object, end-frame crop), `ColdOpen.jsx` (device screen), `Models.jsx` (the 3D models on the caps, registered by kind). Ships with Episode 4. |
| `src/ep3d/*.json` | `cfg` (timeline), `vis` (blinks), `visnat` (mouths), `reseq` (3D talking frames), `sprites` (cut-out metrics), `mwpatch`/`ptpatch` (plate mouth boxes). Generated per episode; the shipped files are Episode 4's. |
| `src/rig/`, `src/llm1/`, `src/cover/` | Face rig with one-mouth-per-frame renderer, theme and effects, cover composition. |
| `public/ep3d/` | Devanagari fonts (for the Hindi phone), `end.jpg` (world-only end frame, re-rendered per episode), `mix.wav` (copied by `mix3d.py`), and the unpacked character frames once `unpack_cutouts.py` has run (not in git). |
| `public/llm1/`, `public/llm2/` | Fonts, avatar, HD busts and mouth patches, classroom plates and plate mouth patches. |

## remotion/lipsync/

| Path | What it holds |
|---|---|
| `README-classroom.md` | How classroom lip sync v1 works. |
| `shared/` | Copies of `natMouth.js` and `Face.jsx`. |
| `professor/`, `emily/` | Calibration (measured from the ElevenLabs clips) and each character's `rules.md`. |
| `3d/README.md` | How 3D lip sync v1 works, and its limits. |
| `3d/pool.json` | Which real talking clip holds which lines, and where. Used to label the frame pool. |

## references/photos/

| Folder | What it holds |
|---|---|
| `professor/` | Master portrait, HD bust and mouth patches, **3D start images** (standing and walking, the source of his loops), turn poses A and B. Never regenerate these. |
| `emily/` | Same set for Emily. |
| `combined/` | Classroom plates and their mouth patches, close-up backgrounds, Pipzo avatar, Episode 3 v3 two-shots, the Episode 4 world end frame, an example cover. |

## references/video/

| Folder | What it holds |
|---|---|
| `professor/cutouts/` | **The Professor's moving body:** `walkP`, `idleP` and the talking clips `lsC1`–`lsC7`, as transparent WebM (about 18 MB in total; unpack with `unpack_cutouts.py`). |
| `emily/cutouts/` | `walkE`, `idleE` and the talking clip `lsCE` (about 5 MB). |
| `professor/`, `emily/` | Small classroom lip-sync samples: the target quality. |
| `combined/` | Small previews: **approved neon-box encoder/decoder 30 s** (the reference look for the middle), approved Episode 4, approved 3D lip-sync test, approved classroom lip-sync test. |

## references/audio/

| Folder | What it holds |
|---|---|
| `music/` | `background_bed.mp3` (the approved Episode 4 music), `closing_sting.mp3`, `classroom_roomtone.mp3`. |
| `sfx/` | `rise1/2` (box rises), `pass1/2` (walk-on whoosh), `chime1/2` (a model appears), `tick1/2` (cap lands, switch-off, script ticks). |
| `lipsync-pool/` | Audio and words of the lines inside the real talking clips. Required by `reseq.py` to label the frame pool. |
| `professor/samples`, `emily/samples` | Short approved samples: the target voices. |
| `professor/elevenlabs-uploads`, `emily/elevenlabs-uploads` | The audio behind the ElevenLabs lip-sync clips. Only needed for recalibration. |

## Outside the skill (repo `artifacts/`)
- `artifacts/videos/character-clips/`: the original character videos with their background (walk, idle and talking). Only needed to re-cut the characters with `cut_sprites.py`.
- `artifacts/videos/episodes/`: full-size approved episodes, for viewing only.
