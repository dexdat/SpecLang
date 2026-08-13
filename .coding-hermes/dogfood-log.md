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
