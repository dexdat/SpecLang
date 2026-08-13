---
name: speclang-usage
version: 1.0.0
description: How to actually USE SpecLang — entry points, run commands, the working library recipe, and the known pitfalls (mcp start dead, parseSpec quotes, build duplicates). Load before working on or with the speclang repo.
trigger: Working on the speclang repo or integrating speclang into something
permissions: [read]
subagent: false
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5

# SpecLang Usage Skill

What SpecLang is: a spec-driven code-generation toolchain. Markdown specs with YAML headers + `### @block::name @kind:code` blocks are validated, cascaded, and compiled to TypeScript. Three surfaces: CLI (`bin/speclang`), npm library (`dist/index.js`), MCP server (**currently broken — see Pitfalls**).

## Entry points

- CLI: `./bin/speclang <cmd>` (commander-based; `--help` lists all)
- Library: `import { parseSpec, validate, runCascade, createDatabase } from 'speclang'` (153 exports, `dist/index.js`)
- Daemon: `./bin/speclang start` / `stop` / `daemon` (file watcher + dashboard)
- MCP: `./bin/speclang mcp start/status/stop` — **start is dead (SL-GAP-033)**
- Python tooling: `scripts/generate_index.py --generate|--validate` (never bare), `scripts/check_compliance.py --report`

## Run commands (validated 2026-08-13)

```bash
npm install && npm run build          # dist/ must exist for the CLI (npm test uses vitest, imports src/ directly)
./bin/speclang new demo               # → demo/ with minimal spec; all 3 templates validate ✅
./bin/speclang validate               # repo: 448/448 pass (535 warnings pre-existing)
./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md   # ✅ generates specs/generated/hello/function.ts
./bin/speclang build <spec>           # ⚠️ duplicates output (SL-GAP-035)
./bin/speclang search "query"         # ✅ fast, tagged previews
./bin/speclang status                 # ⚠️ spec count overreports by 1 (SL-GAP-011/038)
./bin/speclang init foo               # ⚠️ output fails validate until SL-GAP-036 fixed
python3 -m pytest tests/ -q           # ✅ 20/20 from repo root (pytest.ini sets pythonpath=scripts)
```

## Library recipe (the working path)

```js
import { parseSpec, validate, runCascade, createDatabase } from 'speclang';
const content = readFileSync(specPath, 'utf8');
const parsed = parseSpec(content);
// PITFALL: parsed.id includes literal quotes — strip them or validate's idRule fails (SL-GAP-034):
const id = parsed.id.replace(/^"|"$/g, '');
const report = await validate({ filepath: specPath, headerLines: 12,
  metadata: { id, version: parsed.version, layer: 5 }, content });
// report.passed (NOT report.valid); validate is async
const res = await runCascade(specPath, { maxDepth: 5, convergenceTimeout: 30000 });
// res.filesGenerated[0] is the output; verify it exists before trusting success
const db = createDatabase({ path: '/tmp/x.db', wal: false });  // option key is `path`
db.upsertSpec({ id, content, path: specPath }); db.getAllSpecs();
```

## Repo layout rules (dual-view)

- `specs/*.spec.dir/` = source of truth. `src/`, `docs/`, `.opencode/skills/`, `scripts/` entries are **symlinks** into spec dirs.
- Create new docs/skills in `specs/...spec.dir/` FIRST, then symlink (see `specs/skills.spec.dir/skills/`).
- Generated output (`specs/generated/`, `src/generated/`) is gitignored — disposable by design.
- Board: `.coding-hermes/board/tasks.jsonl` is authoritative; `tasks.md` is a legacy log.

## Pitfalls (hit in dogfood 2026-08-13)

1. **`speclang mcp start` always fails** with "❌ SpecLang not built" — tsconfig excludes `src/mcp/**`; the message is a lie, `npm run build` won't fix it. Use `mcp status/stop` (they work). Tracked: SL-GAP-033.
2. **`parseSpec` keeps YAML quotes on `id`** → `validate` rejects the id; docs omit `await` and the ParsedSpec shape. Tracked: SL-GAP-034.
3. **`build` writes two identical files per block** (hello-world.spec-hello-function.ts + .spec-impl-2.ts). Tracked: SL-GAP-035.
4. **`init` scaffolding fails its own `validate`** (missing speclang-header). Tracked: SL-GAP-036.
5. **Validators disagree**: `maturity` ❌ on the flagship example while `validate` ✅. Tracked: SL-GAP-037.
6. **Counts disagree**: status 450 / validate 448 / disk 449. Tracked: SL-GAP-038.
7. `speclang generate` on a fresh `new` project writes 0 files (template has no code blocks) — that's expected; add a `@kind:code` block or use cascade.
8. `db.getSpec(path)` returns undefined right after `upsertSpec` with the same path — keying differs; use `getAllSpecs()`.

## Full evidence

`docs/dogfood/2026-08-13-integration.md` (integration walkthrough), `docs/dogfood/diagnostics.md` (root causes + maintainer advice).
