# SpecLang Integration Report — 2026-08-13

**Dogfood field test (coding-hermes-dogfood).** How to use SpecLang for real: the working example, the errors hit, and their fixes. Verdict: 🟡 PROMISING-BUT-ROUGH.

## 1. What SpecLang Is (verified by use)

SpecLang is a spec-driven code-generation toolchain. You write markdown specs with YAML headers + `@block:` code blocks; SpecLang validates them, cascades them through dependency trees, and generates code (TypeScript today). Three surfaces: **CLI** (`bin/speclang`), **npm library** (`dist/index.js`, 153 exports), **MCP server** (⚠️ broken, see §5).

The hello-world example that works end-to-end:

```bash
cd /home/kara/speclang
./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md
# ✅ Cascade complete — Generated: 1 files — Converged: Yes
# → specs/generated/hello/function.ts (gitignored, correct TS with provenance header)
```

## 2. First-User Journey (timed)

| Step | Command | Result | Time |
|---|---|---|---|
| Create project | `speclang new dogfood-speclang` | ✅ project + git init + minimal spec | 0.04s |
| Validate | `speclang validate` | ✅ Passed: 1 (SL-GAP-001 fix holds) | ~1s |
| Generate | `speclang generate` | ⚠️ 0 files — template has no code blocks (hint printed; dead "next step") | ~1s |
| Cascade | `speclang cascade specs/main.spec.md` | works once the spec has a code block | fast |
| Build | `speclang build <spec>` | ⚠️ duplicates output (SL-GAP-035) | fast |
| Search | `speclang search "hello world"` | ✅ 12 matches w/ tags + previews | fast |
| Maturity | `speclang maturity <spec>` | ⚠️ rejects the flagship example (SL-GAP-037) | fast |
| Init | `speclang init foo` | ⚠️ scaffolding fails its own validate (SL-GAP-036) | fast |

**Time-to-first-success: ~2 minutes** (new → validate → cascade hello-world → inspect generated code).

## 3. Library Integration (the "aha" once it works)

Real consumer created at `/tmp/dogfood-lib-consumer` (`npm install speclang@file:/home/kara/speclang`). Working recipe:

```js
import { parseSpec, validate, runCascade, createDatabase } from 'speclang';
import { readFileSync } from 'fs';

const SPEC = 'specs/hello-world.spec.md';
const content = readFileSync(SPEC, 'utf8');
const parsed = parseSpec(content);                       // ✅ { id, version, blocks }

// ⚠️ validate() is ASYNC and wants a ParsedSpec object, NOT a content string:
const report = await validate({
  filepath: SPEC, headerLines: 12,
  metadata: { id: parsed.id, version: parsed.version, layer: 5 },
  content,
});
console.log(report.passed, report.errors);               // ⚠️ use .passed, not .valid

// ⚠️ parseSpec keeps YAML quotes on id → validate fails its idRule (SL-GAP-034).
// Workaround until fixed: metadata.id = parsed.id.replace(/^"|"$/g, '');

const res = await runCascade(SPEC, { maxDepth: 5, convergenceTimeout: 30000 });
// ✅ success:true, converged:true, filesGenerated:['.../generated/hello/function.ts']

const db = createDatabase({ path: '/tmp/df/test.db', wal: false });  // ⚠️ key is `path`, not `filename`
db.upsertSpec({ id: parsed.id, content, path: SPEC });
db.getAllSpecs();   // ✅ persisted (SQLite, survives restart)
// ⚠️ db.getSpec(SPEC) returns undefined right after upsert — record is keyed
//    differently than the path you passed; use getAllSpecs() or key by id.
```

**Errors hit during integration (and why):**
1. `TypeError: Cannot open database because the directory does not exist` — used `filename:` instead of `path:` (option undocumented).
2. `valid: undefined` then `TypeError: Cannot read properties of undefined (reading 'id')` at process exit — `validate()` is async and expects `ParsedSpec`, not a content string; API_REFERENCE.md §1.3 shows neither.
3. `ID must start with @` from the id rule — `parseSpec` doesn't strip YAML quotes from `id`.

## 4. CLI Command Inventory (what actually works)

Works: `new` (minimal/http/api templates), `validate`, `check`, `generate` (0-file dead end on template specs), `build` (dup bug), `cascade`, `status` (count drift), `search`, `maturity`, `expand` (shows `@kind:unknown` for `@kind:code` blocks — display bug), `init` (broken header), `mcp status/stop`, `daemon`, `--help`.

Broken: `mcp start` (P0, see §5). Untested: `agent`, `bootstrap`, `upgrade`, `downgrade`, `history`, `start`/`stop` (daemon).

## 5. The MCP Server Is Dead (P0)

```bash
./bin/speclang mcp start --remote --port 37891
# 🚀 Starting SpecLang MCP server... → ❌ SpecLang not built. Run: npm run build
```
Root cause: `bin/speclang:1171` does `require('../dist/src/mcp/index.js')`, but `tsconfig.json` **excludes `src/mcp/**`** from compilation, so no build ever emits that file. The error message is a lie — rebuilding doesn't help. `dist/src/implementation/speclang-mcp.js` is a stale leftover from an old layout (`src/implementation/` no longer exists). `tests/mcp/*.test.ts` pass only because vitest imports `src/` directly — the L3 user path was never exercised. Board: SL-GAP-033.

## 6. The Right Way (patterns that work)

- Specs: `# speclang-header lines:N` (count must include all header lines through `---`), YAML header, `### @block::name @kind:code` + fenced code block → cascade extracts and generates.
- Generated output lands in `specs/generated/` (cascade) / `src/generated/` (build) — both gitignored, disposable by design.
- Dual-view: real spec sources live under `specs/*.spec.dir/`, working locations (src/, docs/, .opencode/) are symlinks.
- Python tooling needs `python3 scripts/generate_index.py --generate` (never bare — mode guard since SL-GAP-031); pytest works from repo root (pytest.ini sets `pythonpath = scripts`).
