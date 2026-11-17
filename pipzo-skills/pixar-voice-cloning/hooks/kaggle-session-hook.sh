#!/usr/bin/env bash
# kaggle-session-hook.sh - "Kaggle Session Hook" (Claude Code PostToolUse hook on Bash).
# After a command that downloads Kaggle voices (tts-kaggle.sh, or `kaggle kernels output ...`), check whether the
# Kaggle session(s) have stopped and REPORT it to the user and to Claude. It never stops or deletes anything:
# a session may be kept on deliberately for more batches. Claude decides what to do with the report.
# Any other Bash command: exits at once, silently.
CMD=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
case "$CMD" in
  *tts-kaggle.sh*|*"kaggle kernels output"*) ;;
  *) exit 0 ;;
esac

CFG="$HOME/.claude/skills/pixar-voice-cloning/kaggle-config.json"
KAGGLE=$(command -v kaggle || echo /opt/homebrew/bin/kaggle)
# kernels to check: the configured batch kernel + any kernel named in the command (kaggle kernels output <user/slug>)
KERNELS=$(python3 - "$CFG" "$CMD" <<'PY'
import json, re, sys
ks = []
try: ks.append(json.load(open(sys.argv[1]))["batch_kernel"])
except Exception: pass
ks += re.findall(r'kernels\s+output\s+\W?([\w.-]+/[\w.-]+)', sys.argv[2])
print(" ".join(dict.fromkeys(ks)))
PY
)
[[ -z "$KERNELS" ]] && exit 0

report=(); running=()
for k in $KERNELS; do
  s=$("$KAGGLE" kernels status "$k" 2>&1 | grep -oE '(QUEUED|RUNNING|COMPLETE|ERROR|CANCEL[A-Z_]*)' | head -1)
  s=${s:-UNKNOWN}
  report+=("$k: $s")
  [[ "$s" == RUNNING || "$s" == QUEUED ]] && running+=("$k")
done
summary=$(IFS='; '; echo "${report[*]}")
if (( ${#running[@]} )); then
  msg="Kaggle Session Hook: GPU session NOT shut down - still active: ${running[*]}. ($summary) Nothing was stopped. If no more batches are planned for it, stop it on kaggle.com or ask Claude; if it is a batch still in progress (e.g. launched in the background), re-check when it finishes."
else
  msg="Kaggle Session Hook: GPU session shut down - no active Kaggle session. ($summary)"
fi
python3 -c 'import json,sys; m=sys.argv[1]; print(json.dumps({"systemMessage": m, "hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": m}}))' "$msg"
exit 0
