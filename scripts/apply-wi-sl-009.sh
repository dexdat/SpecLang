#!/usr/bin/env bash
# WI-SL-009: Auto-derive output path + symlink mirroring
# Run this script to apply all changes from the work item.
# Must be run by a user with write access to .speclang/ and specs/assembler/

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== WI-SL-009 Setup ==="
echo "Root: $ROOT"
echo ""

# Step 1-2: Update assembler source
echo "[1/5] Updating .speclang/assembler.spec.ts..."
cp "$ROOT/src/assembler.spec.modified.ts" "$ROOT/.speclang/assembler.spec.ts"
echo "  Done."

# Also copy to .speclang/assembled/ for self-hosting
echo "[2/5] Updating .speclang/assembled/assembler.spec.ts..."
cp "$ROOT/src/assembler.spec.modified.ts" "$ROOT/.speclang/assembled/assembler.spec.ts"
echo "  Done."

# Step 3: Update the assembler spec (specs/assembler/assembler.spec.ts.md)
echo "[3/5] Updating specs/assembler/assembler.spec.ts.md..."
cp "$ROOT/src/assembler.spec.ts.md.modified" "$ROOT/specs/assembler/assembler.spec.ts.md"
echo "  Done."

# Update self-host-harness (fixes test for auto-derive)
echo "[4/5] Updating .speclang/self-host-harness.ts..."
cp "$ROOT/src/self-host-harness.modified.ts" "$ROOT/.speclang/self-host-harness.ts"
echo "  Done."

# Update assemble-all.ts (adds --mirror flag support)
echo "[5/5] Updating .speclang/assemble-all.ts..."
cp "$ROOT/src/assemble-all.modified.ts" "$ROOT/.speclang/assemble-all.ts"
echo "  Done."

echo ""
echo "=== All files updated ==="
echo ""
echo "Next steps:"
echo "  1. npm run build     # TypeScript compilation"
echo "  2. npm run assemble   # Re-assemble all code-pair specs"
echo "  3. npm test           # All 1720+ tests must pass"
echo "  4. npm run verify:self-host  # Byte-identical verification"
echo ""
echo "Verify byte-identical:"
echo "  diff .speclang/assembler.spec.ts .speclang/assembled/assembler.spec.ts"
