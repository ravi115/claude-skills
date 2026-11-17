# pixar-classroom-hybrid-2d: folder guide

The instructions are in `SKILL.md`. This file explains what each folder holds.

```
pixar-classroom-hybrid-2d/
├── SKILL.md      how to build an episode, guardrails, locked rules
├── README.md     this folder guide
├── python/       build pipeline (portable: paths from PIPZO_WORK / PIPZO_REMO)
├── remotion/     Remotion project + lip-sync code
└── references/   photos, small video samples, audio
```

## python/
Run these in order for every episode.

| Script | What it does |
|---|---|
| `paths.py` | Every path the pipeline uses, from `PIPZO_WORK` and `PIPZO_REMO`. No machine-specific paths. |
| `forced_align.py` | Aligns each word and phoneme to the voice, giving `words_fa.json` for captions and cues. |
| `build2.py` | Builds the timeline (`cfg2.json`): line times, shots, push-in, middle, pull-back, Remember, Follow. **Per-episode edits go here.** |
| `track_e2.py` | Blinks and eye saccades (`vis2.json`). |
| `lipsync_drive.py` | **Frozen lip sync v1.** One mouth state per frame for both characters (`visnat.json`). |
| `mix2.py` | Voices, room tone and closing sting, mixed to −14 LUFS (`mix.wav`). |
| `lipsync_audio.py` | Phoneme dictionary (CMUdict) and phoneme→mouth map, used by the scripts above. |
| `measure_mouth.py`, `mouth_stats.py` | Recalibration tools: measure real mouth opening from a lip-sync video and write `calibration.json`. Only needed if a character changes. |
| `legacy/` | The old Episode 2 mouth rule (`vis_from_fa.py`) and the old aligner. Superseded and kept for history. Do not use. |

## remotion/project/
The runnable Remotion project. Run `npm install`, then render composition `Ep2`.

| Path | What it holds |
|---|---|
| `src/llm2/Ep2.jsx` | The episode: classroom plates, close-ups, push-in and pull-back, captions, cards, and **both bottom portraits** (Professor left 10, Emily left 480). **Per-episode edits go here.** |
| `src/llm2/Middle2.jsx` | Diagram middle scenes, cued to spoken words. **Per-episode edits go here.** |
| `src/llm2/*.json` | Generated per episode: `cfg2`, `vis2`, `visnat`. The patch box files `mwpatch` and `ptpatch` are fixed. |
| `src/rig/Face.jsx`, `src/rig/natMouth.js` | Talking face rig and the one-mouth-per-frame renderer. |
| `src/llm1/` | Theme, effects, fonts setup and visemes data shared by all episodes. |
| `src/cover/` | Cover composition. |
| `public/llm2/` | HD classroom plates, close-up backgrounds, plate mouth and blink patches. Episode voices are copied here. |
| `public/llm1/` | Fonts, Pipzo avatar, HD busts with mouth, eye and blink patches. |

## remotion/lipsync/

| Path | What it holds |
|---|---|
| `README.md` | How the frozen lip sync works and what not to change. |
| `shared/` | Copies of `natMouth.js` and `Face.jsx`. |
| `professor/` | `calibration.json` (from ElevenLabs clip lsC3), the measured frames, and `rules.md`. |
| `emily/` | `calibration.json` (from lsCE), the measured frames, and `rules.md`. |

## references/photos/

| Folder | What it holds |
|---|---|
| `professor/` | Master portrait, HD bust cut-out, `mouths/` (closed base plus AH, EE, OH, OO, FV, L, blink patches). Never regenerate these. |
| `emily/` | Same set for Emily. |
| `combined/` | Classroom plates (talk, point), `plate-mouths/` (wide-shot mouth patches), close-up backgrounds, Pipzo robot avatar, an example cover. |

## references/video/
All files here are small 540p previews. Full-size originals are in `Output/LLM-GPT2/`.

| Folder | What it holds |
|---|---|
| `combined/` | Approved Episode 2 (the whole format), approved Episode 3 (the bottom-portrait middle), approved lip-sync test 4. |
| `professor/` | Close-up and wide-plate lip-sync samples. These are the target quality. |
| `emily/` | Close-up lip-sync sample. |

## references/audio/

| Folder | What it holds |
|---|---|
| `professor/samples` | 3 Voice Studio lines in different moods (urgent-warm, calm-teaching, confident-clear): the target voice and pacing. |
| `professor/elevenlabs-uploads` | The audio behind the Professor's ElevenLabs lip-sync clips (FLAC). Only needed to recalibrate lip sync. |
| `emily/samples`, `emily/elevenlabs-uploads` | Same for Emily (annoyed, curious, bright). |
| `music/` | `closing_sting.mp3` (closing music), `classroom_roomtone.mp3`, `background_bed_ep4.mp3` (the approved background music). |
