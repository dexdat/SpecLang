# Dogfood Log

Field-test records for SpecLang. Each entry: date, verdict, promise, top findings, time-to-first-success.

---

## 2026-08-13 — 🟡 PROMISING-BUT-ROUGH

- **Project:** speclang (workdir /home/kara/speclang)
- **Verdict:** 🟡 PROMISING-BUT-ROUGH — core promise holds, integration surface and library consistency are the blockers.
- **Promise:** "A specification-driven multi-agent system where specs cascade through dependency trees to generate working code" — via CLI (`speclang new/validate/cascade/build/generate`), npm library (`parseSpec`, `validate`, `runCascade`, `SpecLangDB`), and MCP server.
- **Time-to-first-success:** ~2 min (new → validate → cascade hello-world → correct generated TS with provenance header).
- **Top 3 findings:**
  1. **P0 SL-GAP-033** — `speclang mcp start` is 100% dead (tsconfig excludes src/mcp/** but bin/speclang requires dist/src/mcp/index.js; misleading "SpecLang not built" error; rebuild cannot fix).
  2. **P1 SL-GAP-034** — `parseSpec()` returns ids with literal YAML quotes → `validate()` rejects them ("ID must start with @"); the two documented library functions are mutually incompatible on the corpus's own id format.
  3. **P1 SL-GAP-035** — `speclang build` emits duplicate files (1 code block → 2 identical outputs, diff = timestamp only).
- **Also:** SL-GAP-011 (status count drift) still failing live despite being marked complete — premature completion on the board; SL-GAP-036 (init scaffolding fails its own validate), SL-GAP-037 (maturity rejects the flagship example).
- **Verified fixed:** SL-GAP-001 (new → validate ✅, all 3 templates), SL-GAP-010 (README/CASCADE_DEMO path corrected), SL-GAP-012 (pytest 20/20 via pytest.ini pythonpath).
- **Artifacts:** docs/dogfood/2026-08-13-integration.md (integration report), docs/dogfood/diagnostics.md (diagnostic trail), specs/skills.spec.dir/skills/speclang-usage.md + .opencode/skills/speclang-usage.md symlink (usage skill). Board: tasks.jsonl + tasks.md, IDs SL-GAP-033..038 (status open).
- **Foreman:** not woken — cooldown 7200s (< 14400), Enabled=true, ticks every 2h and will pick up the open tasks.
2026-09-01 | PROMISING-BUT-ROUGH | 2s t2fs | friction 6 | 5 findings

2026-09-04 | PROMISING-BUT-ROUGH | 5s t2fs | friction 7 | 5 findings\n
2026-09-07 | PROMISING-BUT-ROUGH | 45s t2fs | friction 12 | 5 findings
2026-11-16 | PROMISING-BUT-ROUGH | t2fs not timed (install not timed; build 0.59s, first command 0.87s cold) | friction 4 | 3 findings | tick speclang-dogfood-2026-11-16-05-02-33 | rev 08b77a59 | filed DF-SPECLANG-9 (validate --format json drops the failing spec from reports and prefixes a banner) and DF-SPECLANG-10 (install leg SKIPPED: 0 cells audited) | README-18 re-verified and raised P4 to P1 (validate exits 1: NASA playbook spec declares lines:9, header is 7 lines) | paired DF-SPECLANG-6/7/8 with task_created events 277-279 | perf 0.50s warm / 0.87s cold over 452 files, no PERF row (nothing user-feelable) | evidence .coding-hermes/evidence/speclang-dogfood-2026-11-16-05-02-33/
2026-11-16 re-fire (delivery 3 of tick speclang-dogfood-2026-11-16-05-02-33) | no new rows | install-leg residue: ephemeral agent f2dc254c (created 06:36:01Z for this tick) was STILL RUNNING at 5.6 GB when this delivery started, so FINDINGS.md section 3 "No residue" is false as written; destroyed it (bunker-mvp agents 4 to 3) and left foreign agent 850ebfa7 (05:33:28Z, named in no evidence file) alone | headline re-proved at 1d25137: ./bin/speclang validate specs/docs.spec.dir/playbook/NASA-SE-PLAYBOOK.md.spec.md exits 1 on 3/3 runs, 0.08 to 0.11 s, same multiple-documents parse error | product tree since measured 08b77a59 moved only by deleting three one-line root files (python, typescript, yaml), so no arm re-walk | scheduler attribution: this tick is marked failed at 01:02:57 on gateway HTTP 502 hop-wall-timeout (xkiro openai/gpt-6.1-sol and deepseek-flash each 600 s), not on the lane work, which landed as 0c9ec4c3 | duplicate dispatch evidence: three deliveries of one tick id.
