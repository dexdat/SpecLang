#!/usr/bin/env bash
# Tier 1 `build` arm for the gitreins judge pipeline (DF-SPECLANG-013).
#
# A fresh clone / worktree has no node_modules until someone runs `npm ci`, so
# `npm run build` (tsc) died on the missing toolchain and the judge graded the
# tree FAIL for a missing-DEPENDENCY condition rather than a code defect.
# Observed 2026-11-16 on DF-SPECLANG-2-R4: first `gitreins task complete` FAIL
# with only `npm notice run speclang@1.0.0 build` as evidence, re-run after
# `npm ci` PASS on the same commit.
#
# Contract with gitreins 0.21.0 (engine/pipeline.py):
#   * `GITREINS_SKIP: <step-id>=<reason>` on stdout + exit 0 => the step passes
#     but the stage records `<step-id>` in `stages.tier1.skipped_steps` and is
#     marked DEGRADED, so a reader (and a judge-gated merge) sees a gate that
#     graded nothing instead of a green it never earned. This is the same idiom
#     the built-in lint step uses for "no linter on PATH".
#   * Otherwise the exit code is `npm run build`'s OWN exit code, so a failing
#     build still fails the arm.
#
# The first line printed is what the judge console renders after `<glyph> build:`
# (engine/pipeline.py::_format_steps takes the first non-blank line), so each
# branch's first line names its own outcome plus the npm exit code.

set -uo pipefail

STEP_ID="build"
REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)" || {
    printf 'build FAILED — cannot resolve the repo root from %s\n' "${BASH_SOURCE[0]}"
    exit 1
}
cd "$REPO_ROOT" || {
    printf 'build FAILED — cannot cd to %s\n' "$REPO_ROOT"
    exit 1
}

if [ ! -d node_modules ]; then
    # Named precondition, not a code finding: nothing about this tree has been
    # compiled yet, so there is no build verdict to report.
    printf 'skipped: dependencies not installed (node_modules absent — run npm ci)\n'
    printf 'GITREINS_SKIP: %s=dependencies not installed (node_modules absent — run npm ci)\n' \
        "$STEP_ID"
    exit 0
fi

out="$(npm run build 2>&1)"
rc=$?
if [ "$rc" -eq 0 ]; then
    printf 'build ok — npm run build exited 0\n'
else
    printf 'build FAILED — npm run build exited %d\n' "$rc"
fi
# The full npm/tsc transcript follows the summary line: the judge console shows
# only the first line, while the verdict keeps the bounded whole as evidence.
if [ -n "$out" ]; then
    printf '%s\n' "$out"
fi
exit "$rc"
