# 3D lip sync v1 (frozen, approved 2026-11-16, 3D test 1)

This is lip sync for the walking and talking characters in the 3D space. It uses no ElevenLabs credits.

## How it works
1. **Mouth states.** `python/lipsync_drive.py` writes one mouth state per frame for every line. It uses the same frozen rules as the classroom (`../professor/rules.md`, `../emily/rules.md`).
2. **Re-sequencing real frames.** `python/reseq.py`:
   1. Takes the real talking frames from Episode 4's ElevenLabs lip-sync clips (the "pool").
   2. Labels every pool frame with its mouth state, by aligning the clip's own audio (`references/audio/lipsync-pool/`).
   3. For each new line, picks ONE whole real frame per output frame (Viterbi):
      - the mouth state must match;
      - frames play in order where possible, so the head and hands move naturally;
      - it cuts only between look-alike frames.
   4. Writes `src/ep3d/reseq.json`.
3. **Drawing.** `World3D.jsx` `clipAt()` shows those frames inside each talk window. Talk windows come from the script's lines in the 3D part. There is a 0.2 s crossfade to and from the idle loop at the window edges.

## Pool
- Professor: about 1,440 frames from clips lsC1–lsC7 (lsC1 and lsC2 only before their zoom cut).
- Emily: 216 frames from lsCE.
- `pool.json` says which lines each clip holds and where. The frames themselves are `references/video/*/cutouts/*.webm`.

## Known limits
- **Emily's gestures repeat** on long lines, because her pool is small.
- **Head pose** can shift slightly at a cut, roughly every 0.3–0.5 s.
- **Gesture speed:** the 24 fps source plays at 30 fps.
- **Only these poses and angles:** sitting, turning or new expressions need new footage. That costs credits, so ask first.
