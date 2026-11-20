#!/usr/bin/env bash
# EVID-1: audit the resolvability of every run_id cited as verdict evidence
# on the board (EVID-1, filed 2026-11-20).
#
# A cited run_id is RESOLVABLE when a verdict exists for it in EITHER:
#   1. the working tree:  .gitreins/history/<date>/<run_id>/verdict.json
#   2. the history ref:   refs/gitreins/history tree, same path shape
#      (the .gitreins/specimen history dir is gitignored, so the ref is the
#      only durable copy — verdicts written in another checkout resolve only
#      if that checkout's ref was fetched into this repo).
#
# Ids that are not 8 lowercase hex chars are MALFORMED (task ids, tick ids,
# bare numbers) and can never resolve; they need a record correction, not a
# verdict hunt.
#
# Unlike the original inline one-liner this tolerates legacy rows where
# .detail or .detail.evidence is a plain string, and forces LC_ALL=C so
# sort/comm agree.
#
# Usage:
#   scripts/evidence_audit.sh [path/to/tasks.jsonl]   # default: repo board
# Exit: 0 iff every cited run_id resolves, 1 otherwise.
set -euo pipefail
export LC_ALL=C

BOARD="${1:-.coding-hermes/board/tasks.jsonl}"
[ -f "$BOARD" ] || { echo "board not found: $BOARD" >&2; exit 2; }

TMPD="$(mktemp -d)"
trap 'rm -rf "$TMPD"' EXIT

# --- 1. cited run_ids (objects only; strings are paths, not run ids) -------
jq -r '[(.detail | if type == "object" then (.evidence // []) else [] end)[]?
        | (if type == "object" then (.run_id // empty) else empty end)]
       | .[]' "$BOARD" | sort -u > "$TMPD/cited.txt"

# --- 2. resolvable sources: working tree + history ref ---------------------
{
  git ls-tree -r --name-only refs/gitreins/history 2>/dev/null \
    | grep -oE 'history/[0-9]{4}-[0-9]{2}-[0-9]{2}/[0-9a-f]{8}' | cut -d/ -f3 || true
  ls -d .gitreins/history/*/*/ 2>/dev/null | grep -oE '/[0-9a-f]{8}/$' | tr -d '/' || true
} | sort -u > "$TMPD/known.txt"

# --- 3. classify ------------------------------------------------------------
comm -23 "$TMPD/cited.txt" "$TMPD/known.txt" > "$TMPD/bad.txt"

missing=0; malformed=0
: > "$TMPD/missing.txt"; : > "$TMPD/malformed.txt"
while IFS= read -r id; do
  [ -z "$id" ] && continue
  if [[ "$id" =~ ^[0-9a-f]{8}$ ]]; then
    echo "$id" >> "$TMPD/missing.txt"; missing=$((missing+1))
  else
    echo "$id" >> "$TMPD/malformed.txt"; malformed=$((malformed+1))
  fi
done < "$TMPD/bad.txt"

cited=$(wc -l < "$TMPD/cited.txt")
known=$(wc -l < "$TMPD/known.txt")
resolvable=$((cited - missing - malformed))

echo "EVID-1 evidence audit — board: $BOARD"
echo "  cited run_ids:      $cited"
echo "  resolvable:         $resolvable (working tree + refs/gitreins/history)"
echo "  missing verdict:    $missing   (8-hex id, no verdict.json anywhere)"
echo "  malformed ids:      $malformed (not run ids — need record correction)"
[ "$malformed" -gt 0 ] && { echo "  malformed:"; sed 's/^/    /' "$TMPD/malformed.txt"; }
[ "$missing"  -gt 0 ] && { echo "  missing:";   sed 's/^/    /' "$TMPD/missing.txt"; }

[ "$missing" -eq 0 ] && [ "$malformed" -eq 0 ]
