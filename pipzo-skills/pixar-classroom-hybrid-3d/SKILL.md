---
name: "pixar-classroom-hybrid-3d"
description: "Build a Pipzo Pixar-classroom 3D reel: dramatic beginner-friendly script, classroom bookends, then the Professor and Emily walk and talk in a 3D space while realistic 3D objects rise on a wooden pedestal or pop out of the floor Pixar style, with mood-scored music and a sound for every object (approved LLM-GPT2 Episode 5 look)."
---

# Pixar Classroom Hybrid 3D

This skill builds a complete 3D-format episode for any topic:
- an optional cold open on a phone or laptop
- the HD classroom with close-ups, then a push-in into the board
- the **3D middle**: the **universe** look (night-black sky, warm glowing stars, spinning planets, a dark glass-deck floor with stars below). The Professor and Emily walk toward the camera and stop at each station. At each stop:
  - **one object:** a **walnut pedestal**, turned at an angle, rises out of the floor to the Professor's hand height, its top lands, and the realistic 3D object appears on its spoken cue word with its name above
  - **two or more objects:** no pedestal. Each object **pops out of the floor Pixar style** (anticipation flash, stretch, overshoot, squash, then a hover and slow turn) to its own spot: the first at hand height, the next higher and further back
  - when the two walk on, the pedestal sinks / the objects hop and pop back into the floor
- the pull-back pins the last frame of the world onto the board
- the closing **Follow card over the classroom** with the blinking robot, ending on a **comment question**
- word captions that never touch a face, with mood-scored music and a sound for every object inside the render

**Approved reference:** LLM-GPT2 **Episode 5** (`examples/ep5/`: episode.json with the full sound design, Board, ColdOpen with the 3D laptop; the shipped `content/Models.jsx` is Episode 5's realistic objects, with Episode 4's encoder/decoder kept). Episode 4 (`examples/ep4/`) is the older neon-box look and is kept only as a timing example.

**Lip sync is fully Remotion, at 0 credits:**
- Classroom faces use the frozen v1.
- The walking and talking 3D characters use the frozen 3D v1. It re-sequences real talking frames from the one-time ElevenLabs lip-sync library to the new line's phonemes (`remotion/lipsync/3d/README.md`).

## The rule that matters most: the template and the world are locked
`src/ep3d/Episode3D.jsx`, `src/ep3d/World3D.jsx` and `src/ep3d/lib/` are the approved look. **Never edit them for an episode, and never write a new composition.** Per episode you change only:
1. `$PIPZO_WORK/episode.json`: the episode file (format below).
2. `src/ep3d/content/Board.jsx`: the chalk drawing, the handoff object (`DIAL`) and the end-frame crop.
3. `src/ep3d/content/ColdOpen.jsx`: the cold-open screen content.
4. `src/ep3d/content/Models.jsx`: the 3D models that stand on the caps, registered by kind in `MODELS`. It ships Episode 5's realistic objects (book, brain, envelope, page stack, coins, cloud, office, hospital, bank) and Episode 4's `encoder`/`decoder`. Add new kinds here as `{ C, label, h }`.

**Fixed look (approved on Episode 5; the neon glass box of Episode 4 is retired):**
- **Sky and floor: the universe look** (approved 2026-11-17, `remotion/project/src/ep3d/universe/Universe.jsx`; references in `references/universe/`). It is the default (`"look": "universe"` in episode.json); `"look": "teal"` gives back the Episode 5 teal sky and green grid.
  - Sky: near-black (`#020203`), never blue. Warm white stars, the brighter ones with a soft glow. The Milky Way is only a very faint warm haze.
  - Planets: nine, mixed sizes, each with its own colour and spinning visibly on its axis (wavy bands, swirls and spots so the spin shows). One huge tan gas giant shows only its lower half along the top edge and slides slowly across; the ringed planet beside it is lavender-blue so the two never look alike. The planet group wheels slowly; all motion is centred on the middle of the 3D section and bounded, so no planet leaves for good on a long middle.
  - Floor: dark tinted glass (`#0a1020`, 72 %) with thin frosted panel seams and a starfield below it. Overlays sit 3 cm above the glass with a polygon offset on the glass, or the far lens makes them z-fight and vanish.
  - Rejected: a blue sky, bright nebula and dense Milky Way (looked fake), and the mirror, faded-grid, moon-dust and orbit-dial floors.
- **Realistic, never cartoon-flat or neon.** Every object is a recognisable real thing (book, brain, envelope, coin, building, laptop) built from real geometry with physically based materials (`meshPhysicalMaterial`, clearcoat, sheen) lit by `StudioEnv` (a RoomEnvironment reflection map) plus a warm key and a cool fill. Canvas textures add detail (page edges, keys, windows, labels). Never flat images or icons on planes.
- **One object = the walnut pedestal** (`NeonBoxStation` in World3D): rounded walnut body, dark plinth, two brass inlays, an oak top on a brass edge, a soft black contact shadow (no glow). It is **always turned** (`LAY[1].yaw` 0.7 rad) so it reads as 3D, never flat to camera. It rises 1.4 s, the top drops a short 6 cm and lands at +1.25 s.
- **Two or more objects = Pixar pop, no table** (`FloatStation`): a light ring flashes on the floor 0.15 s before the cue word (anticipation), the object shoots up stretched (scale-y 1.35), overshoots its spot, squashes and settles with a damped wobble, then hovers (2.5 cm) and turns slowly; a soft shadow under it shrinks with height. On exit it does a small hop and pops back down. Slots (`FSLOT`): first at hand height screen-left, the next higher and further back, each floating above the previous label (`baseOf`), further slots scaled bigger (`FSCALE`) so all read the same size.
- **Spacing, solved with a projection check** (camera stop pose, sway ±0.2): ≥ 60 px from the left frame edge, ≥ 60 px between the Professor's pointing hand and any object or pedestal, ≥ 50 px between the Professor and Emily (Professor `PX` 0.32, Emily `EX` −0.65, half a step behind). Objects are drawn in a canvas **above** the character sprites, so any overlap shows as an object cutting through a person: there must be none.
- **Labels:** one per object, at most 3 words, auto-fitted, just above the object's real height. Give tall objects a height hint in the MODELS registry: `{ C, label, h }` (model units) and optionally `fs` (extra size when floating). Labels never land on a face or on another object.
- **Character poses:** switching between the idle loop and a talking chunk is a **hard one-frame cut**. Never cross-dissolve two poses (two half-transparent bodies and two floor reflections ghost on top of each other).
- Role colours are constant across the series:
  - tokens green `#4ADE80`
  - attention pink `#F472B6`
  - feed-forward orange `#F97316`
  - output vectors blue `#38BDF8`
  - the newly written word yellow `#FACC15`
  - the encoder frame teal, the decoder frame pink
- The last station stays up. It is the end frame pinned to the board; its `CROP` in Board.jsx must include the whole pedestal or object and both characters.

**Classroom bookends:** the same as the 2D skill (approved Episode 3 look).
- **Captions:** the spoken word lights up teal-green `#2DD4BF` for the Professor and pink `#F472B6` for Emily, and Emily's lines carry an EMILY tag. Positions: **1720 everywhere in the classroom** (close-ups, wide, point, punch-ins and under the Follow card: the chest/sweater band, never on a face or a student's head), **1590 in the 3D middle** (below the feet), 1680 under a cold-open device.
- **Board drawing vs the pointing hand:** the `point` plate is a 2D photo, so the Professor's fingertip is fixed at about **canvas (217, 312)** of the 1000×560 board. Keep every chalk mark ≥ 40 px clear of it and start the pointed-at object to its right (x ≥ 280), so the finger touches the object's edge and never sits inside the writing.
- **Closing:** the Follow card over the classroom, with the robot blinking, Follow pulsing, and "Next · Episode N" with the next title. The last spoken line is the comment question.

**Scope: 3D only.** For the 2D format (diagram middle with both portraits at the bottom), use `pixar-classroom-hybrid-2d`.

## Guardrails
- **Voices:** made with the `pixar-voice-cloning` skill (Kaggle, free). Voice Studio is retired.
- **ElevenLabs:** not used for voices, and never to regenerate the characters. Use it only for something Remotion truly cannot do (e.g. a new pose no footage covers). Make a credit plan first, with at most 10,000 credits per episode; above that, ask the user. Never retry a failed generation.
- **Characters:** walking, standing, talking and lip sync come only from the packed cut-outs and the Remotion code.
- **Publishing:** never post or publish without the user's explicit go-ahead.

## Writing the script (do this before any voice is made)
The approved brief is `examples/script-brief.md` (Episode 5–10 rewrites). Every script must:
1. **Teach a complete beginner.** One idea at a time; every term explained in plain words the first time; every concept gets an **everyday analogy** (kitchen, school, sport, shop, family), then what it means in real software and work.
2. **Stay true to the book.** Every fact and number must be in the source book, cited with its page. Facts the book does not support are cut, even if an older locked script had them.
3. **Hook in the first 2 seconds**, scored STRONG with the instagram-agent `ig-reel` `hookscore.py` (score 6+ options, keep the best), plus an **open loop** paid off later.
4. **A different opening scenario every episode** (price shock on a laptop, an impossible moment on a phone, a funny machine failure, a bet, a secret code, a rambling assistant ...). Never reuse one.
5. **Drama that moves:** one voice mood per line from `pixar-voice-cloning` (stress or panic on a problem, surprise when it works, curiosity before the explanation, relief and pride at the payoff), with a delivery direction for each line.
6. **Two punchlines unique to the episode:** going into 3D (makes the jump an adventure) and coming back (the lesson in one memorable sentence). Never generic ("let's dive in").
7. **Sound written in:** the music mood per section and a sound for every object, plus stingers at the hook, the reversal and both handoffs. These become `score` and `sfx` in episode.json.
8. 90–150 s, about 220–320 spoken words; on-screen text ≤ 8 words; no em dashes or AI-slop words in spoken lines.

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
   6. `mix3d.py`: writes `mix.wav` (plus `stem_music.wav`, `stem_fx.wav`) and copies it into `public/ep3d/`. Every sound is synthesized by `sfxkit.py` (0 credits); `python3 python/sfxkit.py <dir>` writes the whole kit to listen to.
5. **Content.** Write `content/Board.jsx`, `content/ColdOpen.jsx`, and any new models in `content/Models.jsx`.
6. **End frame.** Render the world alone at the pull-back frame: `npx remotion still src/ep3d/index.jsx Ep3D public/ep3d/end.jpg --frame=<round(pull.t0*30)> --props='{"worldOnly":true,"muted":true}'`.
7. **Stills** at every station (rise, cap, each model, walk-off) and every classroom shot change. Fix, then render.
8. **Render, QA, review, deliver**, in that order (sections below).

## The episode file (`$PIPZO_WORK/episode.json`)
The worked example is `examples/ep5/episode.json` (with `score`, `sfx` and per-model `sfx`); `examples/ep4/episode.json` shows walk/off timing. The `//` comments below are explanations only; real JSON has no comments.
```json
{
  "series": "Large Language Models, GPT-2", "ep": 4, "title": "The Transformer in One Minute",
  "handle": true, "banner": null, "remember": null,
  "look": "universe",                          // 3D middle look: "universe" (default) or "teal" (Episode 5 sky + green grid)
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
- `models`: one model goes on the pedestal; two or more pop out of the floor in the slots described above (first at hand height, next higher and further back).
- `kind` is a key in `content/Models.jsx`.
- `at` is the cue: `"ID"`, `"ID:word"`, `"ID:word:2"`, `"ID:start"` or `"ID:end"`. Without it, the model appears right after the cap lands.
- `off` dims the model on a cue.
- `label` overrides the name shown above the model.
- `sfx`: sounds played as this model appears (0.2 s after its cue), e.g. `[{"type": "coin_cascade", "db": -8}]`.

**Timing the builder enforces**
- The first middle line starts 0.45 s after they reach station 0.
- Every walk is 2.3 s, a length fixed by the character clips.
- Each pedestal starts rising 0.45 s before they stop.
- Pedestal models never appear before the top has landed.
- It warns when a station is too short to rise and fill.

**Sound (approved on Episode 5): music never stops, and nothing appears silently**
- `score`: the music, one mood per story section, each running until the next entry:
  `[{"at": "start", "mood": "tense"}, {"at": "P1", "mood": "curious"}, {"at": "world", "mood": "wonder"}, {"at": "M6", "mood": "serious"}, {"at": "board", "mood": "warm"}, {"at": "follow", "mood": "outro"}]`.
  Moods: `tense` (problem, stress), `curious` (setup, "wait, how?"), `uplift` (a bet, momentum, it works), `serious` (the reversal), `wonder` (the 3D world), `warm` (payoff), `outro` (Follow card), `silence`. Optional `db`. The music ducks −10 dB under every word and fades under the sting.
- `sfx`: word-cued sounds: `{"type": "cash_register", "at": "E1:six", "db": -7}`. Options: `offset`, `n` + `every` (repeat), `fade` (dB less per repeat), `to` + `every` (repeat across a range), `args` (e.g. a ping's pitch). Types (sfxkit.py): `impact, whoosh, riser, book_thud, paper, ping, coin, coin_cascade, cash_register, shimmer, wood_knock, pedestal_rise, blip, building_land, footsteps, laugh_pop, deflate, pop`.
- Time references everywhere: `"ID"`, `"ID:end"`, `"ID:word"`, `"ID:word:end"`, seconds, or `start`, `push`, `world` (the world appears), `pull`, `board` (the frame lands on the board), `follow`, `follow_pulse`, `end`.
- **Added automatically:** a hit on the hook; handoff IN = riser into the push, whoosh through the board, impact and shimmer as the world appears; handoff BACK = whoosh out, warm ping and soft hit as the frame lands on the board; pedestal rise and a wood knock as the top lands; a whoosh and pop for every floating object; footsteps on every walk; a blip on the Follow pulse; the closing sting on the last frame; room tone in the classroom only; −14 LUFS.
- Phone speakers cannot play below about 120 Hz: keep music and effects bodies above it (sfxkit already does).
- Old `sound` cues `tick` and `ding` still work; `bed`/`lift`/`nomusic` are superseded by `score`.

## Render (AWS Lambda, with sound)
From `remotion/project/`, after `unpack_cutouts.py`, the build, the content and `end.jpg`:
1. `npx remotion lambda sites create src/ep3d/index.jsx --site-name=pipzo-classroom-3d`. Re-run after any code or asset change.
2. `npx remotion lambda render <serve-url> Ep3D --codec=h264 --crf=12 --jpeg-quality=100 --gl=swangle --frames-per-lambda=40`.
   - `--jpeg-quality=100` matters: the default 80 makes the 3D scenes visibly soft.
   - The site upload fails on symlinked folders in `public/` (readDirectory EISDIR): copy the character frames as real folders.
   - Download the output with boto3 if the `aws` CLI is the wrong architecture. To share a review copy, upload the mp4 to R2 `pipzo-reels/instagram/review/` (messaging apps recompress it).
   - Don't use `--muted`: the mix is in the composition.
   - The 3D scene needs WebGL; on Lambda that is `swangle`.

**Stills:** `npx remotion still src/ep3d/index.jsx Ep3D still.png --frame=N --props='{"muted":true}'`. A local render is the fallback only: `npx remotion render src/ep3d/index.jsx Ep3D video.mp4 --codec=h264 --crf=14 --gl=angle`.

## QA before the user sees it
Compare with the approved Episode 5 look (`examples/ep5/`, stills in `examples/ep5/qa/`). Check:
1. **Stations:** a single object on the angled pedestal, or several popping out of the floor; ≥ 60 px from the left edge, nothing touching or crossing the Professor or Emily (check every station at both camera sway extremes), the Professor and Emily never overlapping each other. The last station stays up.
2. **Models:** real 3D (they show depth as they turn). They are never on the cap before it lands. Their name labels are readable, and they never cover a face.
3. **Characters:** both full-body in frame through every walk and stop, never cut off at the frame edge. 3D lip sync at 99–100% match. Pose changes are one-frame cuts: scrub the frames around every line start and end for a double body or double reflection.
4. **Captions:** the spoken word teal-green for the Professor and pink for Emily; never on a face (classroom close-ups, wide shots and the Follow card included), at 1590 in the middle.
4b. **Board:** in the pointing shot the fingertip touches the edge of the pointed object, never inside chalk text.
5. **Pull-back:** the world's end frame shrinks onto the board smoothly.
6. **Closing:** the Follow card over the classroom, the robot blinking, the comment question last.
7. **Sound:**
   - Music under the whole episode, changing mood with the story; every object has its sound on its frame; stingers at the hook and both handoffs.
   - Voices always clear over the music, the sting on the last frame, −14 LUFS. Listen on a phone speaker too.
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

## Reference: problems found on Episode 5 and how they were fixed (apply the same rule to every episode)
| What the user saw | Cause | Rule now in the template |
|---|---|---|
| Laptop/objects looked fake, cartoonish, neon | flat planes, emissive neon materials | realistic geometry + PBR + StudioEnv; laptop with lettered keys, black bezel, screen as wide as the keyboard (examples/ep5/content/ColdOpen.jsx) |
| Video soft | default JPEG 80 frames | render with `--crf=12 --jpeg-quality=100` |
| Captions on the Professor's beard and Emily's face (classroom) | captions at y 1235 | 1720 in every classroom shot |
| Labels over the Professor's hair | wide two-model table too close | spacing rules + Pixar pop for multi-object stations |
| 46–48 s and the board at 118 s: table flat to camera, cut by the left edge | wide table facing camera at x 1.58 | pedestal always angled; multi-object = no table; CROP includes the whole station |
| Objects touching the Professor's hand | objects drawn over sprites, no clearance check | projection-checked slots, ≥ 60 px clearance |
| Professor and Emily overlapping | characters moved too close (0.65 m) | PX 0.32 / EX −0.65, ≥ 50 px gap |
| Ghosting when the Professor changes pose | 0.2 s cross-dissolve between idle and talking clips | hard one-frame cut |
| 27–29 s: the finger inside "STAGE 1 — PRETRAIN" | chalk text drawn where the 2D fingertip is | FINGER rule: nothing within 40 px of canvas (217, 312) |
| No background sound; objects appeared silently | music only in short beds; generic chime | `score` + `sfx` + automatic handoff/object sounds (mix3d v2) |
| Script hard to follow, flat | no analogies, no mood changes, generic handoffs | script rules above (Episodes 5–10 v2 brief) |
