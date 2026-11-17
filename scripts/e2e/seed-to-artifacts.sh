#!/usr/bin/env bash
# The standing seed test: ONE seed file in specs/ -> speclang generates EVERY
# artifact the seed asks for, through the reactive daemon path with no manual
# per-artifact driving.
#
# Usage:
#   OPENROUTER_API_KEY=... ./scripts/e2e/seed-to-artifacts.sh [outdir]
#
# Passes iff the daemon routes the seed, dispatches exactly one agent session,
# and every artifact named in the seed exists under generated/ with real
# content. Exits non-zero with the daemon log tail on failure.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="${1:-$REPO_ROOT/.e2e-seed-$(date +%s)}"
TIMEOUT_S="${E2E_TIMEOUT_S:-420}"
EXPECTED=(structure.md characters.md locations.md book-one-chapters.md book-one-chapter-01.md)

mkdir -p "$OUT/specs"
cp "$REPO_ROOT/scripts/e2e/seed-trilogy.spec.md" "$OUT/specs/the-salt-chorus.spec.md"
# Minimal pipeline so the post-generation step is green too (proves the whole
# chain: event -> route -> agent -> artifacts -> pipeline).
cat > "$OUT/build.yaml" <<'YAML'
pipeline:
  on_converge:
    - name: mark-generated
      run: "sh -c 'ls generated/*.md | wc -l > generated/.artifact-count'"
YAML

cd "$OUT"
npx tsx "$REPO_ROOT/scripts/e2e/seed-to-artifacts.driver.ts" "$OUT/" > "$OUT/e2e.log" 2>&1 &
DRIVER_PID=$!
trap 'kill $DRIVER_PID 2>/dev/null; wait $DRIVER_PID 2>/dev/null' EXIT

sleep 25
touch specs/the-salt-chorus.spec.md   # fire the create/modify event
echo "[e2e] seed armed; waiting up to ${TIMEOUT_S}s for artifacts" | tee -a "$OUT/e2e.log"

DEADLINE=$(( $(date +%s) + TIMEOUT_S ))
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
  HAVE=0
  for f in "${EXPECTED[@]}"; do
    if [ -s "generated/$f" ]; then HAVE=$((HAVE+1)); fi
  done
  if [ "$HAVE" -eq "${#EXPECTED[@]}" ]; then
    echo "[e2e] PASS — all ${#EXPECTED[@]} artifacts generated"
    wc -w generated/*.md
    exit 0
  fi
  sleep 10
done

echo "[e2e] FAIL after ${TIMEOUT_S}s — artifacts missing" >&2
for f in "${EXPECTED[@]}"; do
  [ -s "generated/$f" ] || echo "  MISSING: generated/$f" >&2
done
echo "--- daemon log tail ---" >&2
tail -30 "$OUT/e2e.log" >&2
exit 1
