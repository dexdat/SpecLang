#!/bin/sh
# audit-evidence-runids.sh — prove every verdict run_id cited by the board
# resolves from THIS checkout.
#
# The board (.coding-hermes/board/tasks.jsonl) cites judge verdicts by run_id
# in detail.evidence[].run_id. A cited run_id is only usable as evidence if
#   .gitreins/history/<date>/<run_id>/verdict.json
# exists either in the working tree or at the same path inside the published
# history ref (refs/gitreins/history). This script checks both, per id.
#
# Read-only. Usage:
#   scripts/audit-evidence-runids.sh [board.jsonl]
#
# Exit codes:
#   0  every value resolves AND no value has a non-run-id shape
#   1  at least one value is unresolvable or is not shaped like a run_id
#   2  usage / precondition error (missing board, missing jq, not a repo)
set -eu

usage() {
    sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
}

case "${1:-}" in
    -h | --help)
        usage
        exit 0
        ;;
esac

command -v jq >/dev/null 2>&1 || {
    echo "audit-evidence-runids: jq is required but not installed" >&2
    exit 2
}

# Resolve the repo root: prefer git, fall back to the script's parent dir.
if ROOT=$(git rev-parse --show-toplevel 2>/dev/null) && [ -n "$ROOT" ]; then
    :
else
    ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
fi
cd "$ROOT" || exit 2

BOARD=${1:-.coding-hermes/board/tasks.jsonl}
[ -f "$BOARD" ] || {
    echo "audit-evidence-runids: board not found: $BOARD" >&2
    exit 2
}

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM

REF=refs/gitreins/history
REF_SHA=$(git rev-parse --verify --quiet "$REF" 2>/dev/null || true)
WT_DIR=.gitreins/history

# --- collect cited values -------------------------------------------------
# detail is sometimes a string/null; evidence is sometimes a string path.
# Only objects carrying a run_id are verdict citations. Everything else is
# counted as "not a run_id citation" so nothing disappears silently.
jq -r '
  if (.detail|type) == "object" then
    (.detail.evidence // [])
    | if type == "array" then
        (.[] | if type == "object" then
                 (if .run_id == null then empty else (.run_id|tostring) end)
               else empty end)
      else empty end
  else empty end
' "$BOARD" 2>/dev/null |
    sed 's/^[[:space:]]*//; s/[[:space:]]*$//' |
    grep -v '^$' >"$TMP/raw" || true

# Rows whose evidence is a bare string (file paths) are reported, not audited.
jq -r '
  select((.detail|type) == "object" and (.detail.evidence|type) == "string")
  | "  \(.id // "?") -> \(.detail.evidence)"
' "$BOARD" 2>/dev/null >"$TMP/notcited" || true

LC_ALL=C sort -u "$TMP/raw" >"$TMP/values"

# --- resolve against the ref and the working tree -------------------------
if [ -n "$REF_SHA" ]; then
    git ls-tree -r --name-only "$REF" 2>/dev/null |
        grep -oE 'history/[0-9]{4}-[0-9]{2}-[0-9]{2}/[0-9a-f]{8}/verdict\.json$' |
        cut -d/ -f3 | LC_ALL=C sort -u >"$TMP/refids" || true
else
    : >"$TMP/refids"
fi

if [ -d "$WT_DIR" ]; then
    find "$WT_DIR" -mindepth 3 -maxdepth 3 -name verdict.json -type f 2>/dev/null |
        awk -F/ '{print $(NF-1)}' | LC_ALL=C sort -u >"$TMP/wtids" || true
else
    : >"$TMP/wtids"
fi

TOTAL=0
RESOLVED=0
MISSING=0
NOTRUNID=0
BADSHAPE_MISSING=0

: >"$TMP/report"
: >"$TMP/notrunidlist"

while IFS= read -r id; do
    TOTAL=$((TOTAL + 1))
    reason=
    if printf '%s' "$id" | grep -qE '^[0-9a-f]{8,16}$'; then
        # Every run id in the history ref is 8 hex chars, and 8-char
        # all-decimal ids do occur (e.g. 19624790), so decimals must be
        # allowed at length 8 — but a longer all-decimal value is an
        # integer (issue/PR number), never a hex hash.
        if printf '%s' "$id" | grep -qE '^[0-9]{9,16}$'; then
            reason='all-decimal integer, not a hex run_id'
        fi
    else
        reason='not 8-16 lowercase hex'
    fi

    if [ -z "$reason" ]; then
        if [ -s "$TMP/refids" ] && grep -Fxq -e "$id" "$TMP/refids"; then
            RESOLVED=$((RESOLVED + 1))
            printf 'RESOLVED(ref)       %s\n' "$id" >>"$TMP/report"
        elif [ -s "$TMP/wtids" ] && grep -Fxq -e "$id" "$TMP/wtids"; then
            RESOLVED=$((RESOLVED + 1))
            printf 'RESOLVED(worktree)  %s\n' "$id" >>"$TMP/report"
        else
            MISSING=$((MISSING + 1))
            printf 'MISSING             %s\n' "$id" >>"$TMP/report"
        fi
    else
        NOTRUNID=$((NOTRUNID + 1))
        # A non-run-id can still name a verdict dir; report that separately so
        # nobody mistakes shape-validity for resolution.
        if [ -s "$TMP/wtids" ] && grep -Fxq -e "$id" "$TMP/wtids"; then
            RESOLVED=$((RESOLVED + 1))
            printf 'NOT-A-RUN-ID        %s  (verdict dir exists in working tree)\n' "$id" >>"$TMP/report"
        elif [ -s "$TMP/refids" ] && grep -Fxq -e "$id" "$TMP/refids"; then
            RESOLVED=$((RESOLVED + 1))
            printf 'NOT-A-RUN-ID        %s  (verdict dir exists in history ref)\n' "$id" >>"$TMP/report"
        else
            BADSHAPE_MISSING=$((BADSHAPE_MISSING + 1))
            printf 'NOT-A-RUN-ID        %s  (%s)\n' "$id" "$reason" >>"$TMP/report"
        fi
        printf '%s\n' "$id" >>"$TMP/notrunidlist"
    fi
done <"$TMP/values"

# --- report ---------------------------------------------------------------
echo "evidence run_id audit — $ROOT"
echo "board:        $BOARD"
if [ -n "$REF_SHA" ]; then
    echo "history ref:  $REF @ $(printf '%s' "$REF_SHA" | cut -c1-8) ($(wc -l <"$TMP/refids" | tr -d ' ') runs)"
else
    echo "history ref:  $REF (ABSENT — only the working tree can resolve ids)"
fi
echo "working tree: $WT_DIR ($(wc -l <"$TMP/wtids" | tr -d ' ') runs)"
echo

if [ -s "$TMP/notcited" ]; then
    echo "note: evidence given as a file path instead of a run_id (not audited):"
    cat "$TMP/notcited"
    echo
fi

cat "$TMP/report"
echo

if [ -s "$TMP/notrunidlist" ]; then
    echo "NOT-A-RUN-ID (a run_id must be 8-16 lowercase hex chars):"
    sed 's/^/  /' "$TMP/notrunidlist"
    echo
fi

echo "total distinct values: $TOTAL"
echo "run-id-shaped:         $((TOTAL - NOTRUNID))"
echo "unresolvable run-ids:  $MISSING"
echo "not-a-run-id:          $NOTRUNID"
echo "resolvable $RESOLVED/$TOTAL"

if [ "$RESOLVED" -eq "$TOTAL" ] && [ "$NOTRUNID" -eq 0 ]; then
    exit 0
fi
exit 1
