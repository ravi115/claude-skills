# Lip sync v1 (frozen, approved 2026-11-16)

This is Remotion lip sync for the Professor and Emily. It uses no ElevenLabs credits. It drives:
- classroom close-ups
- wide board plates
- bottom portraits

## How it works
1. **Phonemes are matched to the voice.** `python/forced_align.py` finds where each sound happens in the audio, at 100 fps.
2. **One mouth state per frame.** `python/lipsync_drive.py`:
   - turns each phoneme into an openness, quantile-mapped onto real mouth movement measured from ElevenLabs lip-sync clips (`*/calibration.json`)
   - follows speaking speed, so fast speech uses smaller, slower moves
   - leads the sound by 40 ms
   - writes one state per 30 fps frame: 0 closed, 1 FV, 2 OO, 3 EE, 4 L, 5 OH, 6 AH
   - holds each state at least 3 frames when speech is fast, 2 when slow or medium
3. **One real drawn mouth per frame.** `shared/natMouth.js` and `shared/Face.jsx` draw exactly one mouth patch, fully opaque. Never add blended in-betweens or crossfades: they ghost (tests 1–3).

## Folders
- `shared/`: renderer code, copied from `project/src/rig/`. The project copy is the one that runs.
- `professor/`: his calibration and his rules (`rules.md`).
- `emily/`: her calibration and her rules (`rules.md`).
