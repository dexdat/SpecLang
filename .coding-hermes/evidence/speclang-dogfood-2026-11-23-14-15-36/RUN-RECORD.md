# Dogfood run record — tick speclang-dogfood-2026-11-23-14-15-36 (first delivery)

Measured tree: origin/main 2c2ae93f (worktree /home/kara/.hermes/cache/scratch/speclang-df20261123,
created because the primary checkout /home/kara/speclang was 8 commits behind origin/main and dirty —
the divergence already filed as CLN-003). Remote: origin = github.com/dexdat/SpecLang.git, branch main.

Host: 16 cores; loadavg at measurement windows 10-18 (1m), 17-21 (5m), 25-50 (15m) — contended window,
all figures below are warm single-shot timings under that load, not bench-grade.

## Real-use walk (all commands documented in README/GETTING-STARTED)

- Fresh install per README: npm install (npm 12.2.3, Node v22.22.3) rc=0, 4.0s.
  WARNING npm blocks esbuild@0.28.2 postinstall (allowScripts covers only better-sqlite3) — benign
  at tip because @esbuild/linux-x64 ships the binary (esbuild --version = 0.28.2). Undocumented
  (README only covers the better-sqlite3 variant); minor docs nit, no row filed.
- npm run check:sqlite-binding rc=0 0.4s ("OK: better-sqlite3 native binding loads").
- npm run build rc=0 1.9s.
- bin/speclang --version / --help / generate --dry-run / validate hello-world (rc=0) / cascade
  hello-world (rc=0, wrote specs/generated/hello/function.ts). All steps 0.1-0.3s each.
- First-user journey in a scaffold: speclang new hello-world -d <proj> rc=0 61ms (scaffolds
  specs/main.spec.md, build.yaml, scripts/speclang.cjs, README); npm run validate rc=0 (1 file);
  npm run generate rc=0 (1 file written, src/generated/main.spec-main.ts).
- Daemon arm (--no-dashboard because the host's own duckbrain service owns port 3000):
  start rc=0; spec save triggered auto-recascade "[Convergence] Cascade complete! Files: 2,
  Duration: 31046ms" (the known 30s quiet period + ~1s work); src/generated/main.spec-extra.ts
  written; status honest (Daemon: Running PID); stop clean, no ENOENT (DF-6 fix holds), no
  recascade loop (DF-2-R5 fix holds: "Auto-recascade enabled — armed for next cascade").
- DF-SPECLANG-022 fix verified live: `start` with port 3000 occupied prints a clear EADDRINUSE
  refusal on stderr ("Refusing to announce a dashboard this process does not serve."), rc=1.

## Prior-finding premise checks at tip

- PERF-2 young-empty-lock case (open in the 2026-11-20 note tail): FIXED at tip.
  bin/speclang now carries LOCK_BODY_GRACE_MS=400 + re-read window (bin/speclang:19-25, 57-81):
  fresh 0-byte lock -> validate rc=0 in 89/109/92 ms (was 60,235 ms), lock auto-reclaimed.
- DF-SPECLANG-9 headline: validate specs/docs.spec.dir/playbook/NASA-SE-PLAYBOOK.md.spec.md
  now rc=0 (103-125 ms); the multiple-documents parse error is gone at tip.

## New finding filed

- DF-SPECLANG-027 (P2): `speclang status` prints "Generated files: 0" forever in a scaffold
  project — the counter at bin/speclang:593-597 counts projectDir/generated while every observed
  writer (generate default output-dir, scaffold build.yaml generate stage, daemon auto-recascade)
  writes src/generated/. Verified: status said 0 while src/generated held 2 files.

## Install leg (bunker)

- bunker-mvp: launcher PREFLIGHT FAIL — disk usage 97% > 94% threshold (known pressure).
- bunker-las-03: launched OK, agent=b23d8d61, --keep; collect verdict recorded in the tick report
  and this dir's INDEX.md.

## Consumer-script corrections (mine, not the product's)

- `speclang new <name>` takes ONE positional arg; a target dir goes through `-d`. My first
  invocation `new <path> hello-world` failed with a correct usage error; the "no spec files"
  validate failure was my wrong filename (specs/hello-world.spec.md vs the scaffold's
  specs/main.spec.md), not a product bug.
- First daemon-arm attempt read only the first 6 banner lines and missed the EADDRINUSE stderr
  that was present all along — the "silent death" was my reader, the product was loud and honest.
