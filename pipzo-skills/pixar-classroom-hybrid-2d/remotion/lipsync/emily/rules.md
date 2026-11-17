# Emily lip-sync rules (frozen at test 3, unchanged in test 4)

## Calibration
`calibration.json` was measured from ElevenLabs clip lsCE (Episode 4).

While speaking, her mouth openness is:
- median 0.26 of her widest "ah"
- p90: 0.60
- mouth leads the audio by about 40 ms

## State rules
| Situation | Mouth |
|---|---|
| Openness < 0.08, or M/B/P with openness < 0.3 | closed |
| F/V | FV |
| OO sounds | OO |
| OH sounds | OH if openness ≥ 0.45, else OO |
| EE sounds | EE if openness ≥ 0.2, else FV |
| AH sounds | AH if openness ≥ 0.7, L if ≥ 0.3, else FV |
| Other | L if openness ≥ 0.3, else FV |

**Hold rule:** a short run takes the previous state.

## Sample
See `references/video/emily/emily_closeup_lipsync_sample.mp4`.
