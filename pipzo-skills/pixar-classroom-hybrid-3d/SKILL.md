---
name: "pixar-classroom-hybrid-3d"
description: "Build a Pipzo Pixar-classroom 3D reel: classroom bookends, then the Professor and Emily walk and talk in a 3D space while neon glass boxes with 3D models rise in front of them (approved LLM-GPT2 encoder/decoder look)."
---

# Pixar Classroom Hybrid 3D

This skill builds a complete 3D-format episode for any topic:
- an optional cold open on a phone or laptop
- the HD classroom with close-ups, then a push-in into the board
- the **3D middle**: a teal star sky with three star layers and a green neon grid floor. The Professor and Emily walk toward the camera and stop at each station. At each stop:
  - a **dark glass box with neon edges** rises out of the floor to the Professor's hand height
  - a **cap** lands on top of it
  - the station's **thick 3D models** (e.g. encoder, decoder) appear on the cap on their spoken cue words, each with its name above
  - when the two walk on, the box sinks back into the floor
- the pull-back pins the last frame of the world onto the board
- the closing **Follow card over the classroom** with the blinking robot, ending on a **comment question**
- neon word captions, with sound inside the render

**Approved reference:** `references/video/combined/approved_neonbox_encoder_decoder_30s_preview540.mp4` (from Episode 4). Every episode must look like it.

**Lip sync is fully Remotion, at 0 credits:**
- Classroom faces use the frozen v1.
- The walking and talking 3D characters use the frozen 3D v1. It re-sequences real talking frames from the one-time ElevenLabs lip-sync library to the new line's phonemes (`remotion/lipsync/3d/README.md`).

## The rule that matters most: the template and the world are locked
`src/ep3d/Episode3D.jsx`, `src/ep3d/World3D.jsx` and `src/ep3d/lib/` are the approved look. **Never edit them for an episode, and never write a new composition.** Per episode you change only:
1. `$PIPZO_WORK/episode.json`: the episode file (format below).
2. `src/ep3d/content/Board.jsx`: the chalk drawing, the handoff object (`DIAL`) and the end-frame crop.
3. `src/ep3d/content/ColdOpen.jsx`: the cold-open screen content.
4. `src/ep3d/content/Models.jsx`: the 3D models that stand on the caps, registered by kind in `MODELS`. Episode 4 ships `encoder` and `decoder`. Add new kinds here, built from the kit.

**Fixed look (approved; do not offer or switch to other looks):**
- Sky and floor: the teal sky with three star layers and the green neon grid floor. Violet, sunset, aurora and rose skies, and white, yellow, blue and other grid colours, were all tried and rejected.
- Boxes: dark tinted glass, opacity 0.8, with **dimmed** teal neon edges (thin core, soft glow). Size 0.42 wide (0.42 per model when there are several) and 1.0 high, which is the Professor's hand height. They stand 1 m in front of him, screen-left, where he points.
- Rise: 1.4 s up through the floor (it is clipped at the floor, so it truly comes out of it). The cap lands 1.25 s after the rise starts.
- Models:
  - They appear on their cue words, never before the cap has landed. They turn slowly to show their depth.
  - A switched-off model dims and shrinks (e.g. "GPT uses **only** the decoder").
  - Neighbouring models are joined by a small 3D arrow.
- **Everything except text is 3D.** Models are built from real geometry: rounded slabs, cubes, tubes, spheres and cones, with lit colour materials (`Mat`) and neon frames (`NEdge`). Never use flat images, icons on planes or 2D diagrams. The only flat element is the name label above a model.
- Role colours are constant across the series:
  - tokens green `#4ADE80`
  - attention pink `#F472B6`
  - feed-forward orange `#F97316`
  - output vectors blue `#38BDF8`
  - the newly written word yellow `#FACC15`
  - the encoder frame teal, the decoder frame pink
- The last station's box stays up. It is the end frame pinned to the board.

**Classroom bookends:** the same as the 2D skill (approved Episode 3 look).
- **Captions:** the spoken word lights up green `#2DD4BF` for the Professor and violet `#B57BFF` for Emily, and Emily's lines carry an EMILY tag. Positions: 1235 in the classroom, **1590 in the 3D middle** (low, clear of the boxes), 1680 under a cold-open device, 1400 under the Follow card.
- **Closing:** the Follow card over the classroom, with the robot blinking, Follow pulsing, and "Next · Episode N" with the next title. The last spoken line is the comment question.

**Scope: 3D only.** For the 2D format (diagram middle with both portraits at the bottom), use `pixar-classroom-hybrid-2d`.

## Guardrails
- **Voices:** made with the `pixar-voice-cloning` skill (Kaggle, free). Voice Studio is retired.
- **ElevenLabs:** not used for voices, and never to regenerate the characters. Use it only for something Remotion truly cannot do (e.g. a new pose no footage covers). Make a credit plan first, with at most 10,000 credits per episode; above that, ask the user. Never retry a failed generation.
- **Characters:** walking, standing, talking and lip sync come only from the packed cut-outs and the Remotion code.
- **Publishing:** never post or publish without the user's explicit go-ahead.

## Setup (any machine)
- **Tools:** Node 18+, Python 3.10+, and ffmpeg/ffprobe with the libvpx-vp9 decoder.
- **Remotion project:** `npm install` in `remotion/project/`.
  - Versions are pinned to **4.0.544**, matching the deployed Lambda function, including `@remotion/lambda` and `@remotion/three`.
  - If the Lambda function differs, set every `remotion`/`@remotion/*` entry to its exact version and reinstall. The `remotion-lambda-readiness` skill checks this.
- **Python:** `pip install numpy cmudict Pillow faster-whisper`.
- **Paths:** `export PIPZO_WORK=<episode work folder>`. `PIPZO_REMO` defaults to this skill's `remotion/project`. The scripts find their own folder, wherever the skill is installed.
- **Unpack the characters once per machine:** `python3 python/unpack_cutouts.py`. It decodes `references/video/*/cutouts/*.webm` into `public/ep3d/<clip>/`, about 2,600 frames in 1–2 minutes.

## Per-episode steps
1. **Script.**
   - Read the episode `script.md` and the book chapter, and check every number against the book.
   - Write `$PIPZO_WORK/episode.json`: lines in order with voice and shot, the push and pull, which lines walk to a new station, the stations and their models with cue words, sound cues, motions, and Follow.
   - Show the line table and the stations, plus the credit plan (normally 0), and get approval.
2. **Voices** with the `pixar-voice-cloning` skill. Its table is the `id | voice | text` of each line, and its `postprocess.py` writes `$PIPZO_WORK/in/<ID>.mp3`.
3. **Words:** `python3 python/words.py` writes `words.json`. Re-voice any line it flags.
4. **Build**, from `python/`, in this order:
   1. `forced_align.py`
   2. `build_episode3d.py`: writes `cfg.json` and `audio_plan.json`, and prints every line, walk, stop and station with its model times. Fix every ERROR and decide on every WARN.
   3. `vis3d.py`
   4. `lipsync_drive.py`
   5. `reseq.py`: expect 99–100% mouth match per line.
   6. `mix3d.py`: writes `mix.wav` and copies it into `public/ep3d/`.
5. **Content.** Write `content/Board.jsx`, `content/ColdOpen.jsx`, and any new models in `content/Models.jsx`.
6. **End frame.** Render the world alone at the pull-back frame: `npx remotion still src/ep3d/index.jsx Ep3D public/ep3d/end.jpg --frame=<round(pull.t0*30)> --props='{"worldOnly":true,"muted":true}'`.
7. **Stills** at every station (rise, cap, each model, walk-off) and every classroom shot change. Fix, then render.
8. **Render, QA, review, deliver**, in that order (sections below).

## The episode file (`$PIPZO_WORK/episode.json`)
The worked example is `examples/ep4/episode.json`. The `//` comments below are explanations only; real JSON has no comments.
```json
{
  "series": "Large Language Models, GPT-2", "ep": 4, "title": "The Transformer in One Minute",
  "handle": true, "banner": null, "remember": null,
  "follow": {"next_n": 5, "next_title": "Pretrain, Then Finetune", "tap": false},
  "push": {"after": "P04", "zoom": 5.0},       // push into the board after this line; the 3D middle starts next
  "pull": {"after": "P13", "hold": 0.4},       // pull back to the classroom after this line
  "lines": [
    {"id": "E01", "who": "S", "voice": "emily-annoyed-flat", "text": "...", "shot": "device"},
    {"id": "P05", "who": "P", "voice": "PB-calm-teaching", "text": "..."},              // first middle line: they walk to station 0 first
    {"id": "P07", "who": "P", "voice": "PB-confident-clear", "text": "...", "walk": true}, // walk on to the next station before this line
    {"id": "E10", "who": "S", "voice": "emily-challenging-sharp", "text": "...", "walk": true, "gap": 2.2},  // 2 s held silence, then walk
    {"id": "P15a", "who": "P", "voice": "PB-curious-mystery", "text": "Next episode ...", "shot": "wide", "role": "next"},
    {"id": "P15b", "who": "P", "voice": "PB-warm-welcoming", "text": "... reading or writing? Tell us.", "shot": "wide", "role": "ask"}
  ],
  "stations": [                                // one per station walked to, in order
    {"models": [{"kind": "encoder", "at": "P05:reads"}, {"kind": "decoder", "at": "P06:writes"}]},
    {"models": [{"kind": "encoder", "off": "P07:only"}, {"kind": "decoder"}]}
  ],
  "sound": [
    {"type": "bed", "from": "P02:inside", "to": "P15b"},
    {"type": "nomusic", "from": "E03", "to": "P03"},
    {"type": "nomusic", "from": "P09:end", "to": "E10:start"},
    {"type": "lift", "from": "P14", "to": "E14"},
    {"type": "tick", "at": "P06:one", "every": 0.52, "n": 5}
  ]
}
```

**Lines**
- `shot`, classroom only: `wide`, `point`, `cuP`, `cuS`, `device`. Leave it out for middle lines.
- `cuts`: change the shot at a word.
- `gap`: the pause before the line. On a `walk` line, it's the held silence before they walk.
- `window`: script timing, with drift over 1 s reported.
- `motion`: `nod`, `tilt`, `lean`, `bounce`, `shake` or `pop`, on close-ups.
- `role`: `next` (the Follow card appears here), `ask` (**required, last line**, the comment question), `remember`.
- `{"react": "cuS", "dur": 0.7}`: a silent reaction shot.

**Stations**
- One entry per station.
- `models` are shown left to right.
- `kind` is a key in `content/Models.jsx`.
- `at` is the cue: `"ID"`, `"ID:word"`, `"ID:word:2"`, `"ID:start"` or `"ID:end"`. Without it, the model appears right after the cap lands.
- `off` dims the model on a cue.
- `label` overrides the name shown above the model.

**Timing the builder enforces**
- The first middle line starts 0.45 s after they reach station 0.
- Every walk is 2.3 s, a length fixed by the character clips.
- Each box starts rising 0.45 s before they stop.
- Models never appear before the cap has landed.
- It warns when a station is too short for the box to rise and fill.

**Sound cues**
- `bed` and `lift`: music in a range. A lift is louder.
- `nomusic`: silence in that range, even if a bed overlaps.
- `tick`: ticking (`every`, `n`, `offset`).
- `ding`: a ding.

**Added automatically, each on its exact frame (the tightened audio):**
- the rise sound's peak as the box breaks the floor
- a click as the cap lands
- a chime as each model appears
- a tick as a model switches off
- a whoosh as they walk on
- room tone in the classroom only
- the music ducked −7 dB under every spoken word
- the closing sting ending on the last frame

## Render (AWS Lambda, with sound)
From `remotion/project/`, after `unpack_cutouts.py`, the build, the content and `end.jpg`:
1. `npx remotion lambda sites create src/ep3d/index.jsx --site-name=pipzo-classroom-3d`. Re-run after any code or asset change.
2. `npx remotion lambda render <serve-url> Ep3D --codec=h264 --crf=14 --gl=swangle --frames-per-lambda=40`.
   - Don't use `--muted`: the mix is in the composition.
   - The 3D scene needs WebGL; on Lambda that is `swangle`.

**Stills:** `npx remotion still src/ep3d/index.jsx Ep3D still.png --frame=N --props='{"muted":true}'`. A local render is the fallback only: `npx remotion render src/ep3d/index.jsx Ep3D video.mp4 --codec=h264 --crf=14 --gl=angle`.

## QA before the user sees it
Compare with the approved preview (`references/video/combined/approved_neonbox_encoder_decoder_30s_preview540.mp4`). Check:
1. **Boxes:** in front of the Professor, screen-left, top at his hand height. The neon is dimmed, not blazing. The box comes out of the floor, then the cap lands, then the models appear on their words, then it sinks as they walk on. The last box stays up.
2. **Models:** real 3D (they show depth as they turn). They are never on the cap before it lands. Their name labels are readable, and they never cover a face.
3. **Characters:** both full-body in frame through every walk and stop, never cut off at the frame edge. 3D lip sync at 99–100% match, with no pose jump visible at phone size.
4. **Captions:** the spoken word green for the Professor and violet for Emily, at 1590 in the middle, clear of the boxes.
5. **Pull-back:** the world's end frame shrinks onto the board smoothly.
6. **Closing:** the Follow card over the classroom, the robot blinking, the comment question last.
7. **Sound:**
   - The rise peak, cap click and model chimes land on their frames (scrub frame by frame around each station).
   - Music only where allowed, voices clear, the sting on the last frame, −14 LUFS.
8. **Length:** 90–150 s.

## Review and delivery (in this order)
1. **Review.** Send the user the rendered video with a one-line QA summary. Wait.
2. **Approve.** Only after the user replies "approve":
   1. Put the deliverables in `Output/<Series>/<Series>_episode_N/`:
      - `<Series>_episode_N.mp4`
      - `cover.jpg`
      - `caption.txt`, through the instagram-agent `ig-caption` linter until READY
      - `story.txt` and `handoff.txt`
   2. Promote to S3 `pipzo-reels` and R2: `python3 upload_to_r2.py --target both instagram "Output/<Series>/<Series>_episode_N"`.
3. **Never post** without the user's go-ahead. Report the credits used (normally 0).
