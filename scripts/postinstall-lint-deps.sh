#!/bin/bash
# Postinstall: install TS 6 in typescript-eslint packages for TS 7 compatibility
# typescript-eslint requires TS <6.1.0 but the project uses TS 7
set -e

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
