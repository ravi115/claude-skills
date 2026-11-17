# Professor lip-sync rules (frozen)

## Calibration
`calibration.json` was measured from ElevenLabs clip lsC3 (Episode 4) with `measure_mouth.py` and `mouth_stats.py`.

While speaking, his mouth openness is:
- median 0.37 of his widest "ah"
- p90: 0.66
- mouth leads the audio by about 40 ms

## State rules
His moustache hides small mouths, so:
- **Every vowel gets a visibly open mouth:** EE, L, OH or AH.
- **M/B/P close** when openness < 0.35.
- **Silence closes** when openness < 0.06 and there's no vowel.
- **AH** (wide) when openness ≥ 0.6. **OH** (round) when openness ≥ 0.3.
- **Hold rule:** a short run is merged into the more open neighbour, never into a closed or tiny mouth.

## Wide classroom plates
The plates only have AH, EE, OH and OO, so:
- FV becomes EE
- L becomes OH

## Samples
See `references/video/professor/*_lipsync_sample.mp4`.
