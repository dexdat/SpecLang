#!/bin/bash
# Postinstall: install TS 6 in typescript-eslint packages for TS 7 compatibility
# typescript-eslint requires TS <6.1.0 but the project uses TS 7.
#
# Also gates the better-sqlite3 native binding (DF-SPECLANG-7). npm >= 12 blocks
# dependency install scripts that are not covered by the root package.json
# "allowScripts" field (RFC npm/rfcs#868), and better-sqlite3 builds/downloads
# its binding from exactly that install script. A blocked install therefore
# leaves the package present and the binding missing, and the failure only
# surfaces later at runtime. This script asserts the binding loads and exits
# non-zero with an actionable remedy when it does not.
#
# DF-SPECLANG-019: the npm >= 12 remedy printed below was run end-to-end on a
# real npm 12.2.2 (better-sqlite3 12.11.1, Node 22.22.3) and works as printed.
# The transcript, including the two traps called out in the remedy, is in
# docs/npm12-allowscripts-probe.md; tests/npm12-remedy-doc.test.ts keeps this
# text, the README section and that transcript on the same command strings.
#
# Usage:
#   bash scripts/postinstall-lint-deps.sh                       # full postinstall
#   bash scripts/postinstall-lint-deps.sh --sqlite-binding-only # just the gate
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Assert that better-sqlite3 is not just installed but that its native binding
# loads. Returns 0 (green) or prints the remedy and returns 1 (red).
check_sqlite_binding() {
  local pkg_dir="$PKG_ROOT/node_modules/better-sqlite3"

  if [ ! -d "$pkg_dir" ]; then
    if grep -q '"better-sqlite3"' "$PKG_ROOT/package.json" 2>/dev/null; then
      echo "FAIL: package.json declares better-sqlite3 but it is absent from node_modules."
      echo "      A declared dependency that does not install is a dependency-resolution"
      echo "      regression (dropped from package-lock.json, pruned, or the install was"
      echo "      interrupted). Every SQLite-backed feature (DB layer, MCP server,"
      echo "      cascade daemon) is dead without it. Remedy: npm install (or npm ci) and"
      echo "      re-run npm run check:sqlite-binding."
      return 1
    fi
    echo "better-sqlite3 is not installed under node_modules — skipping the native binding check"
    return 0
  fi

  local probe_output
  if probe_output=$(cd "$PKG_ROOT" && node -e '
const Database = require("better-sqlite3");
const row = new Database(":memory:").prepare("select 1 as x").get();
if (!row || row.x !== 1) {
  console.error("unexpected query result: " + JSON.stringify(row));
  process.exit(3);
}
console.log("SELECT 1 -> " + JSON.stringify(row));
' 2>&1); then
    echo "OK: better-sqlite3 native binding loads ($probe_output)"
    return 0
  fi

  # --- red path: the package is present, the binding is not usable -----------
  local node_version npm_version npm_major
  node_version="$(node --version 2>/dev/null || echo unknown)"
  npm_version="$(npm --version 2>/dev/null || echo unknown)"
  npm_major="${npm_version%%.*}"
  case "$npm_major" in
    ''|*[!0-9]*) npm_major=0 ;;
  esac

  echo ""
  echo "FAIL: better-sqlite3 is installed but its native binding does not load."
  echo "      node $node_version / npm $npm_version"
  echo "      probe output (first 20 lines):"
  echo "$probe_output" | sed -n '1,20s/^/      /p'
  local probe_lines
  probe_lines=$(printf '%s\n' "$probe_output" | wc -l)
  if [ "$probe_lines" -gt 20 ]; then
    echo "      ... ($((probe_lines - 20)) more lines)"
  fi
  echo ""
  echo "  Every SQLite-backed feature (DB layer, MCP server, cascade daemon) is"
  echo "  dead without this binding."
  echo ""
  if [ "$npm_major" -ge 12 ]; then
    echo "  Cause: npm >= 12 blocks dependency install scripts that are not covered by"
    echo "  package.json \"allowScripts\" (RFC npm/rfcs#868). better-sqlite3 builds or"
    echo "  downloads its binding from that install script, so the script was skipped."
    echo ""
    echo "  Remedy (npm $npm_version):"
    echo "    1. Confirm package.json declares the approval (this repo does):"
    echo "         \"allowScripts\": { \"better-sqlite3\": true }"
    echo "       or let npm write it:"
    echo "         npm install-scripts approve --no-allow-scripts-pin better-sqlite3"
    echo "    2. Re-run only that dependency's install script:"
    echo "         npm rebuild better-sqlite3"
    echo "    3. Re-check:"
    echo "         npm run check:sqlite-binding"
    echo ""
    echo "  Note: \"npm rebuild\" exits 0 even while the install script is still blocked, so"
    echo "  trust step 3, not its exit code. An explicit deny entry"
    echo "  (\"better-sqlite3\": false) makes step 1 a no-op — delete that entry first."
    echo "  Verified end-to-end on npm 12.2.2 — see docs/npm12-allowscripts-probe.md."
  else
    echo "  Cause: the dependency's install script did not run or failed (npm < 12 runs"
    echo "  install scripts by default, so the usual culprits are --ignore-scripts and a"
    echo "  stale node_modules left by an interrupted install)."
    echo ""
    echo "  Remedy (npm $npm_version):"
    echo "    1. Check install scripts are not globally disabled:"
    echo "         npm config get ignore-scripts    # must not be true"
    echo "    2. Re-run only that dependency's install script:"
    echo "         npm rebuild better-sqlite3"
    echo "    3. Re-check:"
    echo "         npm run check:sqlite-binding"
  fi
  echo ""
  echo "  If the rebuild needs to compile from source (no prebuilt binary for this"
  echo "  platform/Node ABI — needs python3 + a C++ toolchain):"
  echo "         npm rebuild better-sqlite3 --build-from-source"
  echo "  Last resort (full reinstall):"
  echo "         rm -rf node_modules && npm install"
  echo ""
  return 1
}

# Gate-only mode: `npm run check:sqlite-binding` and the CI step. No side effects.
if [ "${1:-}" = "--sqlite-binding-only" ]; then
  check_sqlite_binding
  exit $?
fi

# A consumer install must never be broken by this gate: it only fails when
# better-sqlite3 IS installed and cannot load.
check_sqlite_binding || exit 1

# TS 6 is installed as npm alias 'typescript-eslint-ts'
TS_SRC="node_modules/typescript-eslint-ts"

if [ ! -d "$TS_SRC" ]; then
  echo "TS 6 alias not found, skipping postinstall"
  exit 0
fi

echo "Setting up TS 6 side-by-side for typescript-eslint..."

for pkg in \
  node_modules/@typescript-eslint/parser \
  node_modules/@typescript-eslint/eslint-plugin \
  node_modules/@typescript-eslint/typescript-estree \
  node_modules/@typescript-eslint/type-utils \
  node_modules/@typescript-eslint/utils \
  node_modules/typescript-eslint \
  node_modules/ts-api-utils; do

  target="$pkg/node_modules/typescript"
  if [ ! -d "$target" ]; then
    mkdir -p "$pkg/node_modules"
    cp -r "$TS_SRC" "$target"
    echo "  Copied TS 6 for $(basename $pkg)"
  fi
done

echo "TS 6 side-by-side setup complete"
