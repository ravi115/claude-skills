# artifacts/

Large shared files that must **not** live inside a skill bundle. Skills reference them by path or release URL.

- `videos/`: large reference videos (for example full approved episodes). Files over 100 MB go in a GitHub Release of this repo, not in git.
- `audios/`: large audio sources (long recordings, stems).
- `misc/`: anything else large (packed character cut-out frames, project archives).

Nothing here is needed to build an episode. Skills contain everything they need.
