# Work Item: WI-SL-009 — File watcher daemon lifecycle (AC-009)

**AC:** AC-009 — File watcher daemon — full startup/shutdown lifecycle
**Goal:** `speclangd` binary can start, detect file changes, and gracefully shut down
**Status:** in_progress

## Plan

### Step 1: Fix bin/speclangd import path
- `bin/speclangd` line 25: `require('../dist/daemon/daemon.js')` → `require('../dist/src/daemon/daemon.js')`
- `tsconfig.json` has `rootDir: "."` so compiled output goes to `dist/src/daemon/`, not `dist/daemon/`

### Step 2: Enable skipped daemon tests
- `tests/daemon/daemon.test.ts` line 292 (`it.skip('should restart correctly')`) → `it(...)`
- `tests/daemon/daemon.test.ts` line 305 (`it.skip('should health check return true when running')`) → `it(...)`
- Run: `npx vitest run tests/daemon/daemon.test.ts` to confirm both pass

### Step 3: Verify binary works end-to-end
- Build: `npm run build`
- Start: `timeout 5 ./bin/speclangd start` should print startup logs and exit cleanly on SIGTERM
- OR: `echo '{}' | node -e "require('./dist/src/daemon/daemon').Daemon"` to verify module loads

### Step 4: Full regression
- `npm test` — must still pass all 2152+ tests

## Verification Commands
```bash
# Step 1 check
grep 'dist/' bin/speclangd

# Step 2 check  
npx vitest run tests/daemon/daemon.test.ts --reporter=verbose

# Step 3 check
npm run build && timeout 5 node -e "const {Daemon} = require('./dist/src/daemon/daemon'); const d = new Daemon(); d.start().then(() => { console.log('STARTED'); d.stop().then(() => console.log('STOPPED')) })"

# Step 4 check
npm test
```
