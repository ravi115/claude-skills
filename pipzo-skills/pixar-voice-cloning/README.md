# pixar-voice-cloning: folder guide

The instructions are in `SKILL.md`.

```
pixar-voice-cloning/
├── SKILL.md                    how to voice an episode, mood → voice tables, rules
├── README.md                   this guide
├── voices.md                   catalogue: every voice name, mood, length, exact reference transcript
├── episode-lines.example.txt   example episode table (ID | Voice | Text)
├── kaggle-dataset/             = private Kaggle dataset raviranjan115/pipzo-voices-v2
│   ├── refs.json               voice name -> reference WAV + exact transcript
│   ├── dataset-metadata.json   Kaggle dataset id
│   ├── wav-anchored/           Professor teaching set (PB-*), 10 moods, all start with the anchor line
│   ├── wav/                    Professor classic set (13) + Emily core set (11)
│   └── wav-drama/              Professor drama (6) + Emily drama (6)
├── scripts/
│   ├── make_lines.py           episode table -> lines.txt + ids.txt (checks voice names)
│   ├── tts-kaggle.sh           one Kaggle GPU run (OmniVoice, T4) for all lines -> numbered WAVs
│   ├── postprocess.py          name by ID, trim, optional speed, level -> $PIPZO_WORK/in/<ID>.mp3
│   └── kaggle-tests/           earlier OmniVoice and Chatterbox test kernels
└── samples/review-all-moods.mp3   all moods back to back
```

**Not included:** the unused experimental reference variants (`*-anchored`, `*-anchorfirst`). They're still in `Refrences/voices-v2/` on the Mac.
