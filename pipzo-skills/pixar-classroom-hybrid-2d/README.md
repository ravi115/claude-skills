# pixar-classroom-hybrid-2d: folder guide

The instructions are in `SKILL.md`. This file explains what each folder holds.

```
pixar-classroom-hybrid-2d/
├── SKILL.md      how to build an episode, guardrails, locked rules
├── README.md     this folder guide
├── python/       build pipeline (portable: paths from PIPZO_WORK / PIPZO_REMO)
├── remotion/     Remotion project + lip-sync code
├── examples/     the Episode 3 episode file
└── references/   photos, small video samples, audio, sfx, QA frames from Episode 3
```

## python/
Run in the order given in SKILL.md. Nothing here is tied to one episode.

| Script | What it does |
|---|---|
| `paths.py` | Every path, from `PIPZO_WORK` / `PIPZO_REMO` and the skill's own folder. |
| `words.py` | Word timings for each voice line (faster-whisper), keeping the script's exact words → `words.json`. |
| `forced_align.py` | Aligns words and phonemes to each voice → `words_fa.json`. |
| `build_episode.py` | Reads `episode.json` → `src/episode/cfg.json` (lines, shots, push, middle, pull, cards, motions) and `build/audio_plan.json`. Reports drift and warnings. |
| `track_eyes.py` | Blinks and eye saccades → `vis.json`. |
| `lipsync_drive.py` | **Frozen lip sync v1.** One mouth state per frame → `visnat.json`. |
| `mix_plan.py` | Voices, room tone, beds, ticks, dings, closing sting → `mix.wav` at −14 LUFS, copied to `public/llm2/` for the render. |
| `lipsync_audio.py` | Phoneme dictionary and mouth map, used by the scripts above. |
| `measure_mouth.py`, `mouth_stats.py` | Recalibration tools, only if a character changes. |
| `legacy/` | Superseded. Do not use. |

## remotion/project/
Run `npm install` (Remotion 4.0.544), then render composition `Episode` from `src/episode/index.jsx`.

| Path | What it holds |
|---|---|
| `src/episode/Episode.jsx` | **Locked template** (approved Episode 3): classroom, close-ups, push-in, both bottom portraits, pull-back, neon captions, Follow card with blinking robot, banner, Remember card, motions, audio. Never edited per episode. |
| `src/episode/lib/` | **Locked**: board geometry, phone and laptop frames. |
| `src/episode/content/` | **Per episode**: `Board.jsx` (chalk drawing, pink object, end-frame crop), `Middle.jsx` (diagram scenes), `ColdOpen.jsx` (device screen). Ships with Episode 3. |
| `src/episode/*.json` | Generated per episode: `cfg`, `vis`, `visnat`. `mwpatch` and `ptpatch` are fixed. |
| `src/rig/` | Talking-face rig and the one-mouth-per-frame renderer. |
| `src/llm1/` | Theme, effects and fonts shared by all episodes. |
| `src/cover/` | Cover composition. |
| `public/llm2/` | HD plates, close-up backgrounds and plate patches. The episode `mix.wav` is copied here. |
| `public/llm1/` | Fonts, Pipzo avatar, HD busts with mouth, eye and blink patches. |

## examples/
`ep3/episode.json`: the episode file for the approved Episode 3, matching the shipped `content/`.

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
| `combined/` | Approved Episode 2, approved Episode 3 (the reference look), approved lip-sync test 4. |
| `combined/qa-episode-3/` | Full-size frames from the approved Episode 3 at the QA moments (middle, captions, pull-back, closing card, blink). Compare every new render with these. |
| `professor/` | Close-up and wide-plate lip-sync samples. These are the target quality. |
| `emily/` | Close-up lip-sync sample. |

## references/audio/

| Folder | What it holds |
|---|---|
| `professor/samples` | 3 approved lines in different moods (urgent-warm, calm-teaching, confident-clear): the target voice and pacing. |
| `professor/elevenlabs-uploads` | The audio behind the Professor's ElevenLabs lip-sync clips (FLAC). Only needed to recalibrate lip sync. |
| `emily/samples`, `emily/elevenlabs-uploads` | Same for Emily (annoyed, curious, bright). |
| `music/` | `closing_sting.mp3` (closing music), `classroom_roomtone.mp3`, `background_bed_ep4.mp3` (the approved background music, used for beds and lifts). |
| `sfx/` | `tick.wav` and `ding.wav`, made with ffmpeg tones (0 credits). |
