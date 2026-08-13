# SpecLang Diagnostics — 2026-08-13

The diagnostic trail: how SpecLang is built, why, the errors encountered (mine and the project's own history), and the right way to do things. Written after a real-use dogfood run.

## 1. How the system is built

- **TypeScript, compiled with `tsc` to `dist/`** (`npm run build`). `package.json` `main: dist/index.js`, CLI at `bin/speclang` (a plain JS wrapper that `require`s from `../dist/src/...`). If you run commands from a checkout where `dist/` is stale, the CLI errors with `MODULE_NOT_FOUND` — the error handler then prints **"❌ SpecLang not built. Run: npm run build"**, which is only sometimes the real fix (see §3.1).
- **Dual-view pattern**: `specs/*.spec.dir/` are the source of truth; `src/`, `docs/`, `.opencode/skills/`, `scripts/` are largely symlinks into spec dirs. ~99.2% compliant (audit: `python3 scripts/check_compliance.py --report`). **Never create files directly in working locations — create the spec source first, then symlink.** This is why the dogfood skill artifact lives at `specs/skills.spec.dir/skills/speclang-usage.md` with a symlink at `.opencode/skills/speclang-usage.md`.
- **Meta-circular goal**: specs → (LLM as compiler, for now) → src. The codegen in `src/codegen` is meant to eventually do what agents do today. Hence the emphasis on headers/refs staying valid — the corpus is both the product and the test.
- **Validation layering**: `speclang validate` (CLI, 449 files, warnings tolerated) vs `speclang maturity` (stricter: autonomous specs need `project_level >= Beta`) vs `scripts/generate_index.py --validate` (ref gate) vs `scripts/validate_autonomous.py` (corpus-wide content checks). The maturity-vs-validate disagreement on the hello-world example was fixed (SL-GAP-037) and some gates had exit-code bugs (SL-GAP-032, fixed).
- **Board**: `.coding-hermes/board/tasks.jsonl` is the authoritative task store (JSONL-canonical since tick #152); `tasks.md` is a legacy log. Foreman ticks every 2h (CooldownS=7200). Counting drift is a recurring theme (SL-GAP-005/011/038).

## 2. Counting problem (three numbers, one truth)

RESOLVED 2026-08-13 (SL-GAP-038): all three counters now agree at **449**:
- `find specs \( -name '*.spec.md' -o -name '*.scl' \) | wc -l` → **449** (447 .spec.md + 2 .scl)
- `speclang status` → **449** ("447 .spec.md + 2 .scl")
- `speclang validate` → **449 files**

Root cause: `find -L` in `status` followed the dir symlink `specs/project-layout.spec.dir/config -> ../config.spec.dir/src` and double-counted `index.spec.md`; `validate`'s glob did the same (fixed with realpath dedupe) and excluded the 2 `.scl` files (now included and engine-validated). SL-GAP-011 was marked complete on 2026-08-07 while still failing — a textbook premature completion; reopened as SL-GAP-038 and closed with the fix.

## 3. Errors encountered during the run and their root causes

### 3.1 `mcp start`: "❌ SpecLang not built. Run: npm run build" (P0, SL-GAP-033)
- Symptom: `speclang mcp start` exits 1 with `MODULE_NOT_FOUND`.
- Cause: `bin/speclang:1171` requires `../dist/src/mcp/index.js`; `tsconfig.json` `exclude` list contains `"src/mcp/**"` (also `src/cli/**`, `src/indexer/**`, `src/parser/**`, `src/codegen/**`, `src/lsp/**/*`), so `tsc` never emits it. The `MODULE_NOT_FOUND` catch-all handler prints the build hint for *any* missing module, which is wrong here.
- The real MCP entry is `src/mcp/index.ts` (exists, unchanged since Jul 12). `dist/src/implementation/speclang-mcp.js` is a stale artifact of an earlier layout.
- Right way: un-exclude `src/mcp` (it's the live entry point, tested by `tests/mcp/`) or repoint the CLI. Note `mcp status`/`mcp stop` work because they only check process/port state.

### 3.2 Library `parseSpec`/`validate` incompatibility (P1, SL-GAP-034)
- `parseSpec(content).id` → `"@speclang/examples/hello-world"` **including the literal double quotes** (YAML scalar not unquoted).
- `validate()` is `async` and takes a `ParsedSpec` (`{filepath, headerLines, metadata:{id,...}, content}`), not content text. Un-awaited/string calls produce `valid: undefined` and a confusing late `TypeError: Cannot read properties of undefined (reading 'id')` at `engine.js:113` (`buildContext`).
- The id rule then rejects the quoted id: `ID must start with @`. So parse → validate fails on the exact format `speclang new` generates.
- Why tests never caught it: `tests/validation/engine.test.ts` hand-builds `ParsedSpec` literals; nothing feeds `parseSpec` output into `validate`.
- Right way (until fixed): strip quotes (`parsed.id.replace(/^"|"$/g,'')`) and `await validate({filepath, headerLines:12, metadata:{id,version,layer}, content})`; read `report.passed`.

### 3.3 `build` duplicate output (P1, SL-GAP-035)
- `speclang build specs/examples.spec.dir/hello-world.spec.md` → `src/generated/hello-world.spec-hello-function.ts` AND `src/generated/hello-world.spec-impl-2.ts`, byte-identical except the `Generated:` timestamp. One `@kind:code` block, two files. Block→file mapping bug in the build path. Output is gitignored, so CI never flags it.

### 3.4 `init` scaffolding fails validation (P2, SL-GAP-036)
- `speclang init foo` writes `specs/foo/foo.spec.md` starting with `---` and **no `# speclang-header lines:N` line** → `validate` errors "No speclang-header declaration found". SL-GAP-001 fixed `new`'s template (which now emits `lines:6` correctly) but the `init` template was missed.
- Also: `init` writes into `./specs/` relative to cwd — the name arg is the spec id, not a directory; `--dir` is not accepted (error: unknown option).

### 3.5 `expand` shows `@kind:unknown` (P2, noted)
- `speclang expand hello/function` lists the block as `@kind:unknown` although the source declares `@kind:code`. Parser display bug only; the code content is shown correctly.

### 3.6 `maturity` vs `validate` disagreement (P2, SL-GAP-037)
- Flagship example: `agent_autonomous` + `project_level: POC` → maturity says ❌ (rule: autonomous ⇒ ≥ Beta), validate says ✅. The showcase spec violates the project's own stricter gate.

## 4. What held up (verified)

- `speclang new` (all 3 templates) → `validate` ✅ (SL-GAP-001 fixed).
- `cascade` on the real example path → correct, provenance-stamped TS; README/CASCADE_DEMO now document the right path (SL-GAP-010 fixed).
- `check`, `search`, `maturity`, `status`, `mcp status/stop`, `daemon` help, `pytest` (20/20; SL-GAP-012 fixed via `pytest.ini pythonpath = scripts`).
- Library: `runCascade` (real file generation), `createDatabase` + `upsertSpec` + `getAllSpecs` (SQLite persistence, migration applied, file survives).
- Repo gates: `validate` 449/449 (535 warnings), vitest suite green per foreman ticks, `npm audit` 0 vulns.

## 5. Advice to the maintainer (1 hour of your time, in order)

1. Fix `mcp start` (un-exclude src/mcp in tsconfig; 10 minutes) — it's the only P0.
2. Strip quotes in `parseSpec` and add one integration test that pipes parseSpec → validate (30 minutes) — this is the "two documented functions don't compose" trap.
3. Fix build duplicate naming; add a vitest asserting 1 file per block (20 minutes).
4. Reopen SL-GAP-011 and unify the three counters (status/validate/find) on one walk (remaining time).
5. Add the `# speclang-header` line to the `init` template and align hello-world's maturity metadata.
