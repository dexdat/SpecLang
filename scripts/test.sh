#!/usr/bin/env bash
# CI-002: Wrapper script to run vitest with project-local TMPDIR
# Usage: ./scripts/test.sh [vitest args]
#
# This ensures tests don't hit /tmp EDQUOT on systems with full tmpfs.
# The TMPDIR is set to .tmp/ (gitignored, project-local).

set -e
cd "$(dirname "$0")/.."
mkdir -p .tmp
TMPDIR="$PWD/.tmp" npx vitest run "$@"