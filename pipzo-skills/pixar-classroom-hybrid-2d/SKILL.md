---
name: "pixar-classroom-hybrid-2d"
description: "Build a Pipzo Pixar-classroom 2D hybrid reel (HD classroom, Remotion lip sync, diagram middle with both portraits at the bottom), exactly like the approved LLM-GPT2 Episode 3."
---

# Pixar Classroom Hybrid 2D

This skill builds a complete 2D episode for any topic. It looks and moves exactly like the approved **LLM-GPT2 Episode 3** (`Output/LLM-GPT2/LLM-GPT2_episode_3/LLM-GPT2_episode_3.mp4`):
- an optional cold open on a phone or laptop
- the HD classroom with close-ups, and a push-in into the pink chalk object
- the diagram middle, with **both portraits talking at the bottom**
- the pull-back that pins the end frame onto the board
- the closing **Follow card over the classroom**, with the blinking Pipzo robot, ending on a **comment question**
- neon word captions

Lip sync is the frozen Remotion lip sync v1, so voices and lip sync cost no credits.

## The rule that matters most: the template is locked
`remotion/project/src/episode/Episode.jsx` and `src/episode/lib/` are the approved Episode 3 look. **Never edit them for an episode, and never write a new episode composition.** Per episode you change only:
1. `$PIPZO_WORK/episode.json`: the episode file (format below).
2. `src/episode/content/Board.jsx`: the chalk drawing, the pink handoff object (`DIAL`) and the end-frame crop (`CROP`).
3. `src/episode/content/Middle.jsx`: the diagram scenes, cued to spoken words. It must export `Middle` and `END_T`.
4. `src/episode/content/ColdOpen.jsx`: the screen content of the cold-open phone or laptop. The frames come from `lib/Devices.jsx`.

The shipped `content/` files and `examples/ep3/episode.json` are Episode 3. Use them as the worked example.

**What the template always does (cannot be switched off):**
- **Both portraits in the middle:** Professor left 10, Emily left 480, size 470. The speaker is at full brightness and the other at 72%. They hide only while a punch-in close-up fills the screen.
- **Captions:** the word being spoken lights up in the speaker's neon colour. Professor is green neon `#2DD4BF`; Emily is violet neon `#B57BFF`, and her lines carry an EMILY tag. Positions: 1235 in the classroom, 1300 in the middle, 1680 under a cold-open device, 1400 under the Follow card.
- **Pull-back:** the end frame holds, then shrinks onto the board over 1.6 s while the classroom fades back around it. It stays on the board until the end.
- **Closing:** the Follow card sits over the classroom (wide shot, diagram on the board). The robot blinks, Follow pulses, and the card shows "Next · Episode N" and the next title. The last spoken line is the comment question.
- **Header:** "SERIES · EP N", progress bar, and @pipzo.ai.
- **Audio:** the mix plays inside the composition, so the render comes out with sound.

**Switches in episode.json:** the banner (title card in the first 2.8 s), the Remember card, the "Following ✓" tap, and the @pipzo.ai handle.

**Scope: 2D only.** This skill never builds a 3D episode (characters walking in a 3D world, three.js scenes, ideas rising from a floor). If the script asks for 3D, say this skill is 2D only and point to `pixar-classroom-hybrid-3d`. Offer the 2D format instead.

## Guardrails
- **Voices:** made with the `pixar-voice-cloning` skill (Kaggle, free). Voice Studio is retired and is not used.
- **ElevenLabs:** not used for voices. Use it only for something Remotion truly cannot do, with a credit plan first and at most 10,000 credits per episode. Above that, ask the user. Never retry a failed generation.
- **Visuals:** everything is drawn in Remotion. No generated images or video without a credit estimate and the user's approval.
- **Publishing:** never post or publish without the user's explicit go-ahead.

## Setup (any machine)
- **Tools:** Node 18+, Python 3.10+, ffmpeg and ffprobe on the PATH.
- **Python:** `pip install numpy cmudict faster-whisper`.
- **Remotion project:** in `remotion/project/`, run `npm install`.
  - Versions are pinned to **4.0.544** to match the deployed Lambda function.
  - If the Lambda function is a different version, set every `remotion`/`@remotion/*` entry to that exact version and reinstall. The `remotion-lambda-readiness` skill checks this.
- **Paths:** `export PIPZO_WORK=<episode work folder>`. `PIPZO_REMO` defaults to this skill's `remotion/project`. The scripts find their own folder, wherever the skill is installed.

## Per-episode steps
1. **Script.**
   - Read the episode `script.md` and the book chapter, and check every number against the book.
   - Write `$PIPZO_WORK/episode.json`: lines in order, with voice, shot, beat windows and silences, the push and pull, sound cues, motions, Follow and the cards.
   - Pick the pink handoff object.
   - Show the user the line table and the credit plan (normally 0), and get approval.
2. **Voices** with the `pixar-voice-cloning` skill.
   - Its episode table is the `id | voice | text` of each line in episode.json.
   - Its `postprocess.py` writes `$PIPZO_WORK/in/<ID>.mp3`.
3. **Words.** Run `python3 python/words.py`. It writes `words.json`, with word timings from Whisper and the script's own words. Re-voice any line it flags.
4. **Build**, from `python/`, in this order:
   1. `forced_align.py`
   2. `build_episode.py`: writes `cfg.json` and `audio_plan.json`, and prints every line, shot, drift and warning. Fix every ERROR. Read every WARN aloud to yourself and decide.
   3. `track_eyes.py`
   4. `lipsync_drive.py`
   5. `mix_plan.py`: writes `mix.wav` and copies it into `public/llm2/` for the render.
5. **Content.** Write `content/Board.jsx`, `content/Middle.jsx` and, if there's a cold open, `content/ColdOpen.jsx`.
6. **Stills** at every shot change, plus the QA moments below. Fix, then render.
7. **Render, QA, review, deliver**, in that order (sections below).

## The episode file (`$PIPZO_WORK/episode.json`)
The `//` comments below are explanations only. Real JSON has no comments.
```json
{
  "series": "Large Language Models, GPT-2", "ep": 5, "title": "Pretrain, Then Finetune",
  "handle": true,
  "banner": null,                        // or {"sub": "subtitle"} for a title card at 0-2.8 s
  "remember": null,                      // or {"a": "line one", "b": "line two"}; needs a line with "role": "remember"
  "follow": {"next_n": 6, "next_title": "Emergent Abilities", "tap": false},   // tap: show the "Following ✓" tap
  "push": {"after": "P3", "zoom": 5.0},  // push into the pink object after this line; the middle starts with the next line
  "pull": {"after": "P4", "hold": 2.0},  // pull back after this line (end frame held 2 s) ...
                                         // ... or {"line": "P13", "at": 0.9}: pull back 0.9 s into this line
  "lines": [
    {"id": "E1", "who": "S", "voice": "emily-surprised-sharp-turn", "text": "...", "shot": "device", "window": [0, 6]},
    {"id": "P1", "who": "P", "voice": "PB-curious-mystery", "text": "...", "shot": "wide", "cuts": [["school", "cuP"]]},
    {"react": "cuS", "dur": 1.1},
    {"id": "M6", "who": "P", "voice": "PB-serious-slow", "text": "...", "motion": [["nod", "language"]]},
    {"id": "E3", "who": "S", "voice": "emily-challenging-sharp", "text": "...", "gap": 2.0, "punch": true},
    {"id": "P6", "who": "P", "voice": "PB-curious-mystery", "text": "Next episode: ...", "shot": "wide", "role": "next"},
    {"id": "P7", "who": "P", "voice": "PB-warm-welcoming", "text": "... what would it be? Comment below.", "shot": "wide", "role": "ask"}
  ],
  "sound": [
    {"type": "tick", "at": "E1", "offset": 0.35, "every": 0.45, "n": 6},
    {"type": "bed", "from": "P1", "to": "E2", "vol": 0.16},
    {"type": "nomusic", "from": "M6", "to": "M6"},
    {"type": "ding", "at": "M7:download"},
    {"type": "lift", "from": "P5", "to": "E5"}
  ]
}
```

**Line fields**
- `shot`, outside the middle:
  - `wide`: the talk plate
  - `point`: the Professor pointing at the board
  - `cuP` / `cuS`: close-ups
  - `device`: the cold open
  - Leave it out for middle lines.
- `cuts`: change the shot at a word inside the line.
- `gap`: the pause before the line. Default 0.3 s; for a fixed silence (e.g. 2 s), set the gap.
- `window`: the script's time window. The line is held back until 1 s before the window opens, and any drift over 1 s is reported.
- `at`: the earliest start.
- `punch`: middle lines only. A full-screen close-up of the speaker for that line, for a big reaction.
- `motion`: small head moves on close-ups and portraits: `nod`, `tilt`, `lean`, `bounce`, `shake`, `pop`. Write `["nod", "word"]` to start at a word, or `["tilt"]` for the line start. These are code moves only; there are no new poses (crossed arms, gestures).
- `role`:
  - `next`: the next-episode line. The Follow card appears here.
  - `ask`: **required, and the last line**. The comment question that ends the episode.
  - `remember`: the line the Remember card sits on.
- `{"react": "cuS", "dur": 1.1}`: a silent reaction shot (grin, laugh).

**Sound cues**
- `bed` and `lift`: background music in a range.
- `nomusic`: no music in that range, even if a bed overlaps.
- `tick`: ticking (`every`, `n`, `offset`).
- `ding`: a ding.
- Times are a line id (its start, or its end for a `to`), `"ID:word"`, or `"ID:end"`.
- Room tone and the closing sting are always on.

**Shots the builder enforces**
- The push-in always starts from the pointing plate.
- The first shot after the pull-back is the wide plate with the diagram on the board.
- Everything from the `next` line on is the wide plate under the Follow card.
- It warns about any shot over 6 s.

## Render (AWS Lambda, with sound)
From `remotion/project/`:
1. `npx remotion lambda sites create src/episode/index.jsx --site-name=pipzo-classroom-2d`. Re-run after every code or asset change.
2. `npx remotion lambda render <serve-url> Episode --codec=h264 --crf=14 --gl=swangle --frames-per-lambda=40`.
   - Don't use `--muted`: the mix is in the composition.
   - The output lands in the Remotion bucket. AWS credentials and region come from the environment.

**Stills** are local and fast: `npx remotion still src/episode/index.jsx Episode still.png --props='{"t":SECONDS,"muted":true}'`. A local render is the fallback only: `npx remotion render src/episode/index.jsx Episode video.mp4 --codec=h264 --crf=14`.

## QA before the user sees it
Download the render and compare it with Episode 3 (`references/video/combined/qa-episode-3/`, frames named by moment). Check each of these, and fix anything that fails:
1. **Middle:** both portraits visible at the bottom, both labelled, and the speaker brighter.
2. **Captions:** the spoken word lights up green for the Professor and violet for Emily. Emily's lines have the EMILY tag. Captions never cover a face or the board writing.
3. **Push-in:** it lands on the pink object, and the middle opens on the same object.
4. **Pull-back:** the end frame shrinks onto the board with no jump or pop. Check stills at pull start +0.3, +0.8 and +1.4 s. The end frame never covers the Professor's head.
5. **Closing:** the Follow card is over the classroom with the diagram on the board. The robot blinks (check two frames 0.1 s apart at a blink). "Next · Episode N" shows the next title. The last spoken line is the comment question.
6. **Mouths:** 24 consecutive frames of a close-up and of a portrait during fast speech. One solid mouth per frame, closed on m/b/p, and the Professor never closed while his voice sounds.
7. **Sound:** voices clear over music, beds only where the script allows, the sting on the last frame, and −14 LUFS.
8. **Length:** 90–150 s.

## Review and delivery (in this order)
1. **Review.** Send the user the rendered video (download link or file) with a one-line QA summary. Wait.
2. **Approve.** Only after the user replies "approve":
   1. Put the deliverables in `Output/<Series>/<Series>_episode_N/`:
      - `<Series>_episode_N.mp4`
      - `cover.jpg`, from `src/cover`
      - `caption.txt`, through the instagram-agent `ig-caption` linter until READY
      - `story.txt` and `handoff.txt`
   2. Promote to S3 `pipzo-reels` and to R2 with the Mac script: `python3 upload_to_r2.py --target both instagram "Output/<Series>/<Series>_episode_N"`.
3. **Never post** without the user's go-ahead.
4. **Report** the credits used (normally 0).

## Locked rules (reference)
- **Lip sync (frozen v1)** (`remotion/lipsync/README.md`):
  - One real drawn mouth per frame, never blended.
  - Forced alignment, mouth 40 ms ahead of the sound, holds ≥3 frames in fast speech.
  - The Professor's vowels always open.
  - Wide plates map FV to EE and L to OH.
- **Classroom:** HD plates `talk_hd.jpg` / `point_hd.jpg` with `mw_*` / `pt_*` mouth patches. Close-ups use the HD busts, with Emily mirrored. Every shot has a slow push.
- **Middle look:** Classroom Green Dark Keynote (`llm1/theme.js`, `llm1/fx.jsx`).
  - Colours: orange for emphasis, pink for the handoff object, yellow for numbers.
  - ≤8 words on screen. Content inside x 70–830 and y 330–1240. The right 230 px kept clear.
