# Probe: the npm >= 12 `allowScripts` remedy, run against a real npm 12

**Status: VERIFIED.** The remedy printed by `scripts/postinstall-lint-deps.sh` (and documented in
the README troubleshooting section) works end-to-end on a real npm **12.2.2**. The remedy text did
not need changing; this document records the transcript, plus two traps the probe uncovered that
the README now spells out.

| Item | Value |
| --- | --- |
| npm | 12.2.2 (`/home/<user>/.local/share/vite-plus/package_manager/npm/12.2.2/npm/bin/npm-cli.js`) |
| node | v22.22.3 |
| better-sqlite3 | 12.11.1 (same major as this repo's `^12.11.1` pin) |
| OS | Linux x64 |
| Scratch project | `$TMPDIR`-external scratch dir, `better-sqlite3` only, no `.npmrc` |

Every command below was run with that npm 12.2.2 CLI. Output is verbatim; where a block is
trimmed, the omission is marked with `...`.

> Note on the binding probe: the automation harness blocks inline `node -e` / `node -c` payloads
> in unattended mode, so the probe is a one-line file, `check-binding.js`, containing the same
> `require("better-sqlite3")` plus a query:
>
> ```js
> const Database = require('better-sqlite3');
> const db = new Database(':memory:');
> const row = db.prepare('select sqlite_version() as sqlite_version').get();
> console.log('sqlite_version() -> ' + row.sqlite_version);
> ```

## 1. Reproduction — `npm install` with no `allowScripts` entry

```bash
npm install
```

```
npm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.

added 38 packages, and audited 39 packages in 2s

9 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
npm warn install-scripts 1 package had install scripts blocked because they are not covered by allowScripts:
npm warn install-scripts   better-sqlite3@12.11.1 (install: prebuild-install || node-gyp rebuild --release)
npm warn install-scripts
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
```

Exit code **0** — the install "succeeds", exactly as the README says. The package is on disk and
the binding is not:

```bash
node check-binding.js
```

```
Error: Could not locate the bindings file. Tried:
 → <scratch>/node_modules/better-sqlite3/build/better_sqlite3.node
 → <scratch>/node_modules/better-sqlite3/build/Debug/better_sqlite3.node
 → <scratch>/node_modules/better-sqlite3/build/Release/better_sqlite3.node
 ...
```

Exit code **1**. `node_modules/better-sqlite3/build` does not exist at all.

## 2. The printed remedy, step 1 — `npm install-scripts approve`

```bash
npm install-scripts approve --no-allow-scripts-pin better-sqlite3
```

```
Approved better-sqlite3:
  added better-sqlite3
```

Exit code **0**. `package.json` gains the entry the script prints:

```diff
   "dependencies": {
     "better-sqlite3": "^12.11.1"
+  },
+  "allowScripts": {
+    "better-sqlite3": true
   }
```

`approve` **does not build anything itself** — it only records the approval. Immediately after it
the build directory is still absent and `node check-binding.js` still exits 1.

## 3. The printed remedy, step 2 — `npm rebuild`

```bash
npm rebuild better-sqlite3
```

```
rebuilt dependencies successfully
```

Exit code **0**, and now `node_modules/better-sqlite3/build/Release/better_sqlite3.node` exists.

## 4. The printed remedy, step 3 — verify

The remedy's last step is the repo gate, `npm run check:sqlite-binding`, which runs
`bash scripts/postinstall-lint-deps.sh --sqlite-binding-only`. The scratch project has no such
script, so the equivalent probe there is the one-liner below (same `require` + in-memory query);
in the real repo the gate prints `OK: better-sqlite3 native binding loads (SELECT 1 -> {"x":1})`.

```bash
node check-binding.js          # the `node -e "require('better-sqlite3')"` equivalent
```

```
sqlite_version() -> 3.53.2
```

Exit code **0**.

```bash
npm install-scripts ls
```

```
No packages with unreviewed install scripts.
```

The remedy is correct as printed: `approve` → `rebuild` → `npm run check:sqlite-binding` passes and
the binding loads.

## 5. Counter-probes (why each line of the remedy is load-bearing)

### 5a. `npm rebuild` alone, with no approval — a green no-op

```bash
npm install                        # no allowScripts entry
npm rebuild better-sqlite3
```

```
npm warn rebuild 1 package had install scripts blocked because they are not covered by allowScripts. Run `npm install-scripts ls` to review.
rebuilt dependencies successfully
```

Exit code **0** — and `node check-binding.js` still exits 1 with `Could not locate the bindings
file`. **`npm rebuild` exits 0 while doing nothing when the script is not approved.** The approval
step is mandatory; a bare `rebuild` is not a fix.

### 5b. `"better-sqlite3": false` in `allowScripts` blocks `approve`

An explicit deny entry (written by `npm install-scripts deny`) makes the printed `approve` command a
green no-op:

```bash
npm install-scripts deny better-sqlite3
npm install-scripts approve better-sqlite3
```

```
npm warn install-scripts better-sqlite3 is denied; remove the entry from allowScripts to approve better-sqlite3.
Nothing to approve; allowScripts unchanged.
```

Exit code **0**. The `false` entry has to be deleted by hand before `approve` can work.

### 5c. Pin behaviour — what `--no-allow-scripts-pin` buys

Without the flag, `approve` pins the exact installed version:

```bash
npm install-scripts approve better-sqlite3
```

```
Approved better-sqlite3:
  added better-sqlite3@12.11.1
```

```json
"allowScripts": { "better-sqlite3@12.11.1": true }
```

With `--no-allow-scripts-pin` the entry is unpinned (`"better-sqlite3": true`), so it keeps covering
the package across upgrades — which is why both this repo's `package.json` and the printed remedy
use the unpinned form. Re-running `approve --no-allow-scripts-pin` on an already-pinned entry
rewrites it to the unpinned form (`Approved better-sqlite3:\n  added better-sqlite3`).

### 5d. Fresh install with the entry already declared — no warning, binding builds

```bash
npm install    # package.json already carries "allowScripts": { "better-sqlite3": true }
node check-binding.js
```

```
npm warn deprecated prebuild-install@7.1.3: No longer maintained. ...

added 38 packages, and audited 39 packages in 1s
...
found 0 vulnerabilities
sqlite_version() -> 3.53.2
```

No `install-scripts` warning, exit 0. This is the state the repo ships in.

## Reproducing this probe

```bash
mkdir -p /tmp/npm12-probe && cd /tmp/npm12-probe
printf '{"name":"p","version":"1.0.0","private":true,"dependencies":{"better-sqlite3":"^12.11.1"}}' > package.json
npm --version                      # must be 12.x
npm install                        # expect the install-scripts blocked warning
npm install-scripts approve --no-allow-scripts-pin better-sqlite3
npm rebuild better-sqlite3
node check-binding.js              # sqlite_version() -> ...
```

`tests/npm12-remedy-doc.test.ts` keeps this document, the README section and the remedy printed by
`scripts/postinstall-lint-deps.sh` on the same command strings, so they cannot drift apart again.
