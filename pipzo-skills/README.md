# Pipzo skills

Skills for building Pipzo "Large Language Models, GPT-2" classroom reels with the Professor and Emily.

| Skill | Use it for | Status |
|---|---|---|
| `pixar-classroom-hybrid-2d/` | 2D episodes: HD classroom, Remotion lip sync, diagram middle with both portraits at the bottom (Episodes 2–3 style) | ready |
| `pixar-classroom-hybrid-3d/` | 3D walk-and-talk episodes (Episode 4 style) | planned |
| `pixar-professor-character/` | Everything about the Professor: look, images, voice, lip sync | planned |
| `pixar-emily-character/` | Everything about Emily | planned |

## Install
- **Claude Code:** copy or symlink a skill folder into `~/.claude/skills/`. For example: `ln -s $PWD/pixar-classroom-hybrid-2d ~/.claude/skills/`.
- **claude.ai:** zip one skill folder and upload it under Settings → Capabilities → Skills.

Each skill's `SKILL.md` has the instructions. Its `README.md` explains every folder.

## Rules shared by all skills
- **Voices:** Voice Studio only.
- **ElevenLabs:** last resort, at most 10,000 credits per episode after a costed plan. Never retry a failed generation without asking.
- **Visuals:** everything visual is rendered with Remotion, on AWS Lambda by default.
- **Publishing:** never post without the user's go-ahead.
