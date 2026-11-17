#!/bin/bash
# Postinstall: keep the repository's `ts-node` bin routed at the classic-API
# TypeScript 6 compiler.
#
# TypeScript 7 (the project's compiler) no longer ships the classic JavaScript
# compiler API that ts-node drives, so `npx ts-node <file>` dies before it can
# read tsconfig.json:
#
#   TypeError: Cannot read properties of undefined (reading 'fileExists')
#     at readConfig (.../ts-node/dist/configuration.js:91)
#
# npm links node_modules/.bin/ts-node straight at node_modules/ts-node/dist/bin.js
# — the crashing entry point. scripts/ts-node-classic.cjs is a launcher that sets
# TS_NODE_COMPILER=typescript-eslint-ts (the typescript@6.0.3 alias the repo
# already installs for the typescript-eslint stack) and then delegates to the real
# CLI unchanged. This script points the bin at that launcher, so the command stays
# the familiar, unqualified one:
#
#   npx ts-node examples/hello-world/index.ts
#
# Every install re-runs this after npm has (re)linked the bins, so the routing
# cannot drift. Both guards below make this a no-op outside a full dev checkout:
# a consumer installing the published package has neither ts-node nor the
# classic-API alias present, and must not have their install touched.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

LAUNCHER="scripts/ts-node-classic.cjs"
TS_NODE_BIN="$PKG_ROOT/node_modules/ts-node/dist/bin.js"
ALIAS_DIR="$PKG_ROOT/node_modules/typescript-eslint-ts"
BIN_DIR="$PKG_ROOT/node_modules/.bin"
BIN_LINK="$BIN_DIR/ts-node"

if [ ! -f "$TS_NODE_BIN" ]; then
  echo "ts-node is not installed under node_modules — skipping ts-node launcher setup"
  exit 0
fi

if [ ! -d "$ALIAS_DIR" ]; then
  echo "TS 6 alias (typescript-eslint-ts) is not installed — skipping ts-node launcher setup"
  exit 0
fi

if [ ! -f "$PKG_ROOT/$LAUNCHER" ]; then
  echo "FAIL: $LAUNCHER is missing — cannot route the ts-node bin at the TS 6 compiler" >&2
  exit 1
fi

# The launcher is executed through the bin symlink, so it must be executable.
chmod 755 "$PKG_ROOT/$LAUNCHER"

mkdir -p "$BIN_DIR"

# Relative link: the tree keeps working when it is moved or hardlink-copied.
ln -sfn "../../$LAUNCHER" "$BIN_LINK"

# "ln exited 0" is not proof the bin now routes where we think it does.
resolved="$(readlink "$BIN_LINK" 2>/dev/null || true)"
if [ "$resolved" != "../../$LAUNCHER" ]; then
  echo "FAIL: node_modules/.bin/ts-node points at '$resolved', expected '../../$LAUNCHER'" >&2
  exit 1
fi

echo "ts-node bin -> $LAUNCHER (classic-API TypeScript 6)"
