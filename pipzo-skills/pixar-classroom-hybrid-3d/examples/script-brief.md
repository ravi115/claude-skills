# Script rewrite brief: LLM-GPT2 Episodes 5-10 (v2)

Goal: rewrite one episode's script so a complete beginner understands the concept, feels something, and watches to the end. These are animated tutorials for Instagram Reels.

## Read first
1. Your episode's current locked script: `~/Documents/AI Video Editor/Requirements/LLM-GPT2/episode-NN-*/script.md` (the facts, the handoff object, the next-episode title).
2. The book, which is ground truth: `~/Documents/AI Video Editor/Requirements/LLM-GPT2/Build-a-Large-Language-Model-From-Scratch.pdf`. Read the pages your script cites with the Read tool (`pages` param, at most 20 per call). Every fact, number and claim must be in the book. **The concept must stay intact. Do not add any fact the book does not support.**
3. `~/Documents/AI Video Editor/Requirements/LLM-GPT2/EPISODE-INDEX.md` (audience rules: why it exists, what you'll understand, the concept with a real-life example, the real-world implication).
4. The Instagram hook skill: `~/.claude/plugins/marketplaces/instagram-agent-skill/skills/ig-reel/SKILL.md`. Use its formulas and **run its `hookscore.py`** (in that folder) on at least 6 hook options. Pick the top one; it must score STRONG.
5. Voice moods: `~/.claude/skills/pixar-voice-cloning/SKILL.md` ("Voices by mood") and `voices.md`. Each line gets exactly one voice name from that list (or an arc voice when the mood changes inside a line).

## Format (3D skill, `pixar-classroom-hybrid-3d`)
- **Cold open (optional, 3-6 s):** a phone or laptop screen with one moment on it.
- **Classroom:** the Professor (teal captions) and Emily, a curious student (pink captions). Shots: wide, point (Professor at the board), close-up of either, silent reaction shots.
- **Handoff out:** the camera pushes into one object on the chalkboard. We land in the 3D world: the Professor and Emily walk toward camera and stop at "stations". At each station a wooden pedestal rises and realistic 3D objects appear on it on spoken cue words, with a short name label (at most 3 words). Objects must be physical things you can build in 3D (books, brain, envelopes, coins, buildings, a lock, a dial, cards, blocks, arrows). No charts, no paragraphs of text.
- **Handoff back:** the last station's frame pulls back onto the chalkboard and we are in the classroom again.
- **Closing:** "Next episode: <title>" and then a comment question as the last line.
- **Length:** 90-150 s, about 220-320 spoken words. Speech is about 150 words/minute.
- On-screen text (labels, screens) at most 8 words each.

## What the user wants in v2 (this is the point of the rewrite)
1. **Clear to someone who knows nothing.** One idea at a time. Explain every term the first time, in plain words. Every concept gets an **everyday real-life analogy** (kitchen, school, sport, shop, family). Then show what it means in real software and work.
2. **Drama and mood that change.** Each line has a mood, and moods must move: stress or panic when there is a problem, surprise when something works, curiosity and "wait, how?" before the explanation, relief and pride at the payoff. Write stage directions for the delivery (e.g. "[panicked, fast]", "[whisper]", "[beat of silence]").
3. **A strong hook in the first 2 seconds**, scored with hookscore.py, plus a reason to stay (an open loop paid off later).
4. **A distinct opening scenario.** Use the opening category assigned to you below. Do not reuse other episodes' openings.
5. **Two punchlines at the handoffs, both unique to this episode:**
   - classroom to 3D (going in): a line that makes the jump feel like an adventure;
   - 3D to classroom (coming back): a line that lands the lesson in one memorable sentence.
   They must not be generic ("let's dive in", "and that's it"). Never reuse a line from another episode.
6. **Sound design in the script.** For each beat give: the music mood (e.g. "tense low pulse", "light curious pizzicato", "big warm swell", "silence"), and a sound effect for every object that appears (e.g. "heavy book thud", "coin clink", "whoosh", "glass ping", "cash register"), plus stingers at the hook, the reversal and the two handoffs.

## Output
Write ONE file: `~/Documents/AI Video Editor/Requirements/LLM-GPT2/script-review-v2/episode-NN.md` with these sections:
1. Title, the hook (with its hookscore score and the 5 runner-ups with scores), and the one-sentence promise to the viewer.
2. Facts taught, each with the book page it comes from.
3. Beat table: `# | time | scene (cold open / classroom shot / 3D station) | who | voice name | delivery direction | spoken line | on-screen text or 3D objects (with cue word) | music | SFX`.
4. The two handoff punchlines, called out.
5. Word count and estimated runtime.
6. "What changed vs the locked script and why" (short).
7. "Questions for the user": anything you were unsure about (max 4).

Rules: plain English, global audience, no em dashes in spoken lines, no AI-slop words ("delve", "unlock", "game-changer", "dive in"). Do not edit any other file. Do not run gradle. Do not post anything anywhere.
