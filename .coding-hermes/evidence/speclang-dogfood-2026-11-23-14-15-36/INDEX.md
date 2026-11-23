# Evidence — tick speclang-dogfood-2026-11-23-14-15-36 (first delivery)

Measured tree: origin/main 2c2ae93f. Run record: RUN-RECORD.md (read that first).

| file | what it is | transform |
|---|---|---|
| df23-postinstall-check.mjs.txt | staged probe: sqlite binding + esbuild + build | scratch .mjs renamed .mjs.txt (evidence capture, not shipped code) |
| df23-happy-path.mjs.txt | staged CLI happy-path driver (version/help/dry-run/validate/cascade) | same |
| df23-perf2-younglock.mjs.txt | PERF-2 AC-1 young-empty-lock repro at tip (3 runs) | same |
| df23-nasa-new.mjs.txt | NASA spec re-proof + speclang new journey driver | same |
| df23-daemon-arm2.mjs.txt | daemon reactive arm (--no-dashboard, save -> recascade -> stop) | same |
| agent-qa-run.log.txt | bunker agent b23d8d61 qa-run.log (battery pre-cell death) | pulled via bunker exec, *.log -> .txt past ignore rule |
| agent-qa-run-sh-extract.txt | generated qa-run.sh lines 1-6 + 228-236 (the QAREPO/cd mismatch) | pulled via bunker exec |
| RUN-RECORD.md | the run narrative: numbers, premises checked, consumer-script corrections | — |

Install leg: launch 2026-11-23T14:48Z, agent=b23d8d61 @ bunker-las-03; battery died at setup
(cd qa-SpecLang vs synced qa-speclang) — filed DF-SPECLANG-028. Agent destroyed after harvest
(bunker list re-check: 0 matches). bunker-mvp leg: launcher preflight refusal, disk 97% > 94%.
