# SpecLang

A specification-driven multi-agent system where specs cascade through dependency trees to generate working code.

## Installation

> ⚠️ **Warning:** Do **NOT** `npm install -g speclang`. The `speclang` package on
> npm (v0.1.x) is an **unrelated project** (Specific-Language/speclang). This
> repository (`dexdat/SpecLang`, package.json `speclang` 1.0.0) is **not published
> to npm yet** — install from source below.

### From source (recommended)

```bash
# Clone THIS repository
git clone https://github.com/dexdat/SpecLang.git
cd SpecLang

# Install dependencies
npm install

# Build the TypeScript project
npm run build

# Run directly from the repo (no global install needed)
./bin/speclang --help

# Optional: expose a global `speclang` command for this repo's code
npm link
speclang --help
```

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (on npm >= 12 see [Troubleshooting: better-sqlite3 native binding](#troubleshooting-better-sqlite3-native-binding-npm--12))
- **Python** >= 3.8 plus **PyYAML** (for tooling scripts; install with `python3 -m pip install PyYAML` if needed)

### Troubleshooting: `better-sqlite3` native binding (npm >= 12)

SpecLang's DB layer, MCP server and cascade daemon all run on
[`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3), which compiles or
downloads its native binding from its **own install script**.

**npm 12.0.0 and later** block dependency install scripts that are not listed in the
root `package.json` `allowScripts` field (RFC npm/rfcs#868). When that happens
`npm install` still exits 0 — you only get a warning:

```
npm warn install-scripts 1 package had install scripts blocked because they are not covered by allowScripts:
npm warn install-scripts   better-sqlite3@12.11.1 (install: prebuild-install || node-gyp rebuild --release)
```

…and every SQLite-backed command then fails at runtime with
`Could not locate the bindings file`.

This repo declares the approval in `package.json`, so a fresh `npm install` builds the
binding instead of skipping it:

```json
"allowScripts": { "better-sqlite3": true }
```

Check the binding at any time (one `require` + one in-memory query, no build):

```bash
npm run check:sqlite-binding     # OK: better-sqlite3 native binding loads (SELECT 1 -> {"x":1})
```

If it reports FAIL — e.g. `node_modules` was installed before that approval existed, or
Node was upgraded and the compiled binding no longer matches the ABI — make sure the approval
is recorded first, then rebuild:

```bash
npm install-scripts approve --no-allow-scripts-pin better-sqlite3   # records the approval
npm rebuild better-sqlite3       # re-runs only that dependency's install script
npm run check:sqlite-binding     # re-check
```

`npm install-scripts approve` only edits `package.json` — it does not build anything, so the
`npm rebuild` step is what actually runs the install script. Beware the reverse: **`npm rebuild
better-sqlite3` exits 0 even when the script is still blocked**, printing
`npm warn rebuild 1 package had install scripts blocked because they are not covered by
allowScripts` while leaving the binding missing. Judge the fix by `npm run check:sqlite-binding`,
never by `npm rebuild`'s exit code.

Two more traps:

- An explicit deny entry (`"better-sqlite3": false`) makes `approve` a no-op — it warns
  `better-sqlite3 is denied; remove the entry from allowScripts to approve better-sqlite3.`
  and exits 0. Delete the `false` entry by hand first.
- `--no-allow-scripts-pin` writes the unpinned `"better-sqlite3": true`; without it npm pins the
  exact version it approved (`"better-sqlite3@12.11.1": true`), which stops covering the package
  after the next upgrade.

Also make sure install scripts are not globally disabled — `npm config get ignore-scripts` must
not be `true`. If there is no prebuilt binary for your platform/Node ABI, compile it:
`npm rebuild better-sqlite3 --build-from-source` (needs python3 + a C++ toolchain).
Last resort: `rm -rf node_modules && npm install`.

This remedy is verified end-to-end on npm 12.2.2 / Node 22.22.3 / better-sqlite3 12.11.1 — the
full transcript is in [docs/npm12-allowscripts-probe.md](docs/npm12-allowscripts-probe.md).

**Affected npm versions:** npm >= 12.0.0 blocks unreviewed install scripts by default
(with `strict-allow-scripts=true` the warning becomes a hard install error). npm < 12
runs dependency install scripts normally, so there the failure only appears when
`ignore-scripts` is enabled.

### CLI Commands

```bash
./bin/speclang --help           # Show all commands
./bin/speclang validate         # Validate all specs
./bin/speclang cascade <spec>   # Run a cascade on a spec file
```

Full command surface (from `./bin/speclang --help`):

| Command | Description |
|---|---|
| `start` | Start the SpecLang daemon (file watcher + dashboard; MCP is a separate `mcp start`) |
| `cascade <spec>` | Run a cascade on a spec file |
| `agent [agent]` | Run a cascade agent for a trigger using a provider-aware thinking level |
| `status` | Show current system status |
| `stop` | Stop the SpecLang daemon |
| `daemon` | Manage SpecLang daemon (start / stop / status) |
| `validate [files...]` | Validate spec files |
| `check [files...]` | Validate specs without generating |
| `generate [files...]` | Generate code from specs |
| `build` / `compile [files...]` | Build code from specs |
| `bootstrap` | Bootstrap SpecLang: verify specs, run cascade, validate build |
| `mcp` | MCP server management (start / status / stop) |
| `new <name>` | Create a new speclang project |
| `expand <block-id>` | Expand a block ID into detailed specs |
| `search <query>` | Search across all specs |
| `maturity [spec]` | Show maturity level info or validate a spec |
| `upgrade <spec>` | Upgrade a spec to a higher maturity level |
| `downgrade <spec>` | Downgrade a spec to a lower maturity level |
| `init <name>` | Create spec scaffolding for a feature (writes `specs/<name>/<name>.spec.md`) |
| `history` / `log [spec]` | Show spec change history with git integration |
| `help [command]` | Display help for a command |

> **Writing a spec by hand?** A spec opens with `# speclang-header lines:N`, where
> `N` counts the marker line + the YAML lines + the closing `---`. A wrong count
> is the most confusing first-run failure (`Source contains multiple documents`);
> the rule, the off-by-one traps and the other first-run fixes are in
> [First-Spec Failures](docs/troubleshooting.md#first-spec-failures).

### API Reference

For programmatic access, see:
- `docs/API_REFERENCE.md` - Public API reference (library exports, CLI, MCP server)
- `specs/api.spec.md` - REST API specification (internal spec)
- `specs/mcp.spec.md` - MCP server for AI agent integration (internal spec)

## Current Status: Reality-Based Alpha

**✅ What Works:**
- Spec inventory: run `python3 scripts/generate_index.py --graph` for the authoritative number (read-only live graph; not the checked-in index snapshot)
- Reference tooling: `validate_refs.py` reads the checked-in index but does not enforce its collected errors; use `python3 scripts/generate_index.py --validate` for the fail-closed live-graph check
- Autonomous validation (scores indexed specs for agent readiness)
- Hello World example (compiles and runs)
- Explicit cascade protocol with verification gates
- Working agent definitions for OpenCode
- Dual-view compliance: run `python3 scripts/check_compliance.py --report` for the authoritative number and the exempt/non-compliant file lists
- Test execution: run `npm test` for the authoritative number of passing, failing and skipped tests/files; it builds first and reports the result for your checkout. A dated, commit-attributed verification run is recorded in [README-25 evidence](evidence/readme-25-2026-11-18/transcript.md).

**⚠️ Current Limitations:**
- **Daemon is opt-in** - `speclang start` runs the file watcher + dashboard (and `daemon`/`stop` manage it); the MCP server is started separately with `speclang mcp start`; without the daemon, everything runs in the foreground as explicit commands
- **Explicit invocation by default** - Cascade must be invoked explicitly; automatic reactions require the daemon to be running
- **Sequential execution** - Agents invoked one at a time via Task tool
- **User-controlled** - You decide when to continue the cascade

**🎯 Philosophy:** Build what works with available tools, not what we wish existed.

## 🚀 Getting Started

**New to SpecLang? Start here:**

1. **Read:** `GETTING-STARTED.md` - Quick start guide
2. **Then read:** `specs/000-bootstrap.md` - Bootstrap primer (READ FIRST)
3. **Check:** `specs/_index.md` - Directory index of all specs
4. **Explore:** `specs/project.scl` - North Star intent

**For AI agents:** Always read `specs/000-bootstrap.md` first for context.

---

## The Idea (Reality Version)

```
Human writes/updates spec → Trigger cascade explicitly
     ↓
Coordinator parses dependency tree from _index.json
     ↓
Coordinator invokes agents via Task tool (one at a time)
     ↓
Each agent completes task + verification gates
     ↓
User decides: continue / stop / retry
     ↓
Cascade spans multiple trees (specs → code → tests → docs)
     ↓
Final output: clean, verified code in any language
```

**Specs are what humans review. Generated code is verified before accepted.**

---

## The Core Scientific Theory: Context Window Independence

**SpecLang proves that AI context windows don't need to expand indefinitely.**

Traditional code generation fails at scale because:
- **Large codebases exceed context limits**
- **RAG-based retrieval is probabilistic** (may miss critical dependencies)
- **Agents can't reason about what they can't see**

**SpecLang's solution:** Pre-slice the system into context-sized chunks.

### How It Works

Every agent has a **bounded working set**:
```
Context Window:
├── Agent Instructions (~2K tokens)
├── File Being Modified (~5K tokens)  
├── Explicit Dependencies (~10K tokens via @ref:)
└── Cascade Context (~3K tokens)
Total: ~20K tokens (fits in any modern model)
```

**Key insight:** Agents don't need to see the entire system. They only need:
1. The file they own
2. Files that directly influence it (explicitly declared)
3. The cascade that triggered them

### Why This Is Revolutionary

- **Deterministic context** - No guessing what's relevant, dependencies are explicit
- **Parallel execution** - Agents work simultaneously without conflicts
- **Unbounded scale** - System can grow infinitely; context required stays constant
- **No RAG needed** - Eliminates probabilistic retrieval errors

**The claim:** By architecting software as a dependency tree of context-sized slices, we achieve reliable AI code generation at any scale.

---

## How It Actually Works

### 1. Specs Define the Tree Structure

Every spec has:
- **Layer** (0-10): Abstraction level
- **References** (`@ref:`): Dependencies on other specs
- **Headers**: Metadata for validation

Example tree from `project.scl` (Layer 0) — every ref below is declared in `specs/project.scl`
and resolves to a spec file that exists:
```
specs/project.scl  (Layer 0, id: @northstar/speclang)
│   Group headers are the layer each target spec declares in its own header
├── Layer 0
│   ├── @ref:speclang/core                       → specs/core.spec.md
│   ├── @ref:speclang/skills                     → specs/skills.spec.md
│   ├── @ref:speclang/test-specs                 → specs/test-specs.spec.md
│   ├── @ref:speclang/workflow                   → specs/workflow.spec.md
│   ├── @ref:speclang/opencode                   → specs/opencode.spec.md
│   ├── @ref:speclang/directory-structure        → specs/directory-structure.spec.md
│   ├── @ref:speclang/dynamic-split              → specs/dynamic-split.spec.md
│   ├── @ref:speclang/deployment                 → specs/deployment.spec.md
│   ├── @ref:speclang/mcp-daemon                 → specs/mcp-daemon.spec.md
│   ├── @ref:speclang/git-history                → specs/git-history.spec.md
│   └── @ref:speclang/symlinks                   → specs/symlinks.spec.md
├── Layer 1
│   ├── @ref:speclang/daemon                     → specs/daemon.spec.md
│   ├── @ref:speclang/agent-protocol             → specs/agent-protocol.spec.md
│   ├── @ref:speclang/pipeline                   → specs/pipeline.spec.md
│   ├── @ref:speclang/file-naming                → specs/file-naming.spec.md
│   ├── @ref:speclang/cascade                    → specs/cascade.spec.md
│   ├── @ref:speclang/headers                    → specs/headers.spec.md
│   ├── @ref:speclang/sqlite                     → specs/sqlite.spec.md
│   └── @ref:speclang/mcp                        → specs/mcp.spec.md
├── Layer 2
│   └── @ref:speclang/mcp-openapi-generation     → specs/mcp.spec.dir/openapi-generation.spec.md
├── Layer 5
│   ├── @ref:speclang/recovery                   → specs/recovery.spec.md
│   └── @ref:speclang/tools                      → specs/tools.spec.md
└── Layer 10
    └── @ref:speclang/mcp-openapi-generation-cli → specs/mcp.spec.dir/openapi-generation-cli.ts.spec
```

Refs are listed in declaration order within each layer group. A ref name is not always a
filename: nested specs live in a `.spec.dir/` directory, so
`@ref:speclang/mcp-openapi-generation` resolves to
`specs/mcp.spec.dir/openapi-generation.spec.md`.

### 2. Cascade Traverses by Layer

The coordinator processes in layer order (0 → 1 → 2 → ... → 10):

```bash
# Pass 1: Layer 0 (North Star)
@speclang-coordinator start-cascade specs/project.scl

# Pass 2: Layer 1 (Core specs)
→ Invoke @speclang-spec-writer for each Layer 1 spec
→ Verify: python3 scripts/validate_refs.py

# Pass 3: Layer 2-5 (Feature/Implementation specs)
→ Continue spec tree

# Pass 4: Layer 6-10 (Code generation)
→ Invoke @speclang-code-gen
→ Verify: npx tsc --noEmit

# Pass 5: Layer 10+ (Tests)
→ Invoke @speclang-spec-writer for test specs, then @speclang-code-gen for test code
→ Verify: npm test
```

### 3. Multi-Tree Spanning

One spec drives several output trees. For `specs/cascade.spec.md`, the trees present in this repo:

| Input | Output trees |
|-------|--------------|
| `specs/cascade.spec.md` | `specs/cascade.spec.dir/` — child specs (`convergence.spec.md`, `triggers.spec.md`, …) plus the assembled `src/` (spec tree) |
| | `src/cascade/` (code tree) |
| | `tests/cascade/` (test tree) |

### 4. Verification Gates (Mandatory)

After EVERY agent invocation:

```bash
# Gate 1: Reference validation
python3 scripts/validate_refs.py

# Gate 2: Spec validation
python3 scripts/validate_autonomous.py --file <spec>

# Gate 3: Code compilation
npx tsc --noEmit

# Gate 4: Test execution
npm test
```

**If any gate fails → Cascade pauses, error reported**

### 5. User Control

You decide when to continue:

```
[Cascade Step 3/15]
✓ Spec created: specs/auth.spec.md
✓ References valid
✓ Code generated: src/auth/handler.ts
✓ Compilation: PASSED

Next: Generate auth tests
Continue? (yes/no/skip/retry)
```

---

## Quick Start

### Verification commands and their limits

```bash
# Run from the repository root; npm ci installs the locked dependency versions.
npm ci
# Python tooling also requires PyYAML (`python3 -m pip install PyYAML` if absent).

# 1. Read the checked-in index
python3 scripts/validate_refs.py
# Output: All references valid.
# Caveat: this legacy script prints success even when it collects errors;
# it skips block refs and is NOT proof that all live references resolve.

# 2. Run autonomous validation against files selected by the checked-in index
python3 scripts/validate_autonomous.py --project
# Output: per-entry Validation Report blocks and an exit code based on their status.
# Multiple index entries can select the same file, so report count != file count.
# Run `python3 scripts/validate_autonomous.py --project` for the authoritative number
# of reports and their results; inspect individual check warnings as well as PASSED.

# 3. Typecheck the configured TypeScript project (does not run Hello World)
npx tsc --noEmit
# Output: (no errors = success)

# 4. Build and run the test suite (pretest performs npm run build)
npm test
# Run `npm test` for the authoritative number of passing, failing and skipped tests.

# 5. Inspect the checked-in index or compute the live graph without rewriting it
jq '.specs | length' _index.json
# Run `jq '.specs | length' _index.json` for the authoritative number of saved entries.
# This is a snapshot, not a live file count. The generator's read-only modes
# compute the live graph in memory; run `python3 scripts/generate_index.py --graph`
# for the authoritative number of graph nodes and edges.
# A bare `python3 scripts/generate_index.py` prints usage without writing anything.
# Only --generate rewrites the index; do not use it for read-only verification.
# --tree and --impact REQUIRE a spec ID, not a path or an omitted argument:
python3 scripts/generate_index.py --tree @speclang/ui      # what it depends on
python3 scripts/generate_index.py --impact speclang/core   # what depends on it
python3 scripts/generate_index.py --graph                  # live graph stats
# Strict reference/cycle gate (unlike validate_refs.py):
python3 scripts/generate_index.py --validate
# The recorded README-25 run exits 1 for missing reference targets; see evidence.
# It exits non-zero when missing refs exceed --max-missing (default 0) or cycles exist.
# There is no `speclang index` command registered in bin/speclang yet.
```

**Measured 2026-11-18 at `1a2134ac7d82395c22594c0d9a104cbc65ca06dc`:**
`validate_refs.py`, `validate_autonomous.py --project` and `npx tsc --noEmit` each exited `0`.
`npm test` exited `1` with database test/hook timeouts; the separate `tests/db` filter also
failed with SQLite disk-I/O/readonly errors. The strict `python3 scripts/generate_index.py --validate`
check exited `1` for missing reference targets. This was **not an all-green verification run**;
full output, totals and host-load observations are in the [transcript](evidence/readme-25-2026-11-18/transcript.md).
No implementation, tests or validator behavior was changed by this README fixup.

### Run a Mini Cascade

The cascade has two entry points — a plain CLI that works in any terminal, and OpenCode agent commands (chat syntax, not shell commands).

**CLI (works in any terminal).** `generate` runs straight from `bin/`; `cascade` loads the engine from
the compiled `dist/`, so build once first — on a clone that has only had `npm install`, `cascade`
stops at `❌ SpecLang not built. Run: npm run build`.

```bash
# 1. Dry run — confirm the spec's TypeScript block is found. Writes NOTHING.
./bin/speclang generate specs/examples.spec.dir/hello-world.spec.md --dry-run
# Output: Mode: DRY RUN / Files written: 0
#   📁 Would generate: src/generated/hello-world.spec-hello-function.ts
# Drop --dry-run to write it for real (Mode: LIVE, Files written: 1, same path).

# 2. Run the cascade — it WRITES files; `cascade` has no --dry-run flag
./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md
# Output: ✅ Cascade complete / Generated: 1 files / Converged: Yes
#   - specs/generated/hello/function.ts   (printed as an absolute path under the repo root)
```

> **Output locations** — `cascade` and `generate` write to **different output trees, by design**:
> - `./bin/speclang cascade <spec>` is spec-relative, by one rule: `<directory containing the spec>/../generated/`.
>   E.g. `cascade specs/examples.spec.dir/hello-world.spec.md` → `specs/generated/hello/function.ts`;
>   a spec sitting directly in `specs/` (e.g. `specs/foo.spec.md`) → `<project root>/generated/foo/function.ts`.
>   The sub-path and file name come from the block id (`@block::hello/function` → `hello/function.ts`).
> - `./bin/speclang generate <spec>` defaults to `src/generated/` (e.g.
>   `src/generated/hello-world.spec-hello-function.ts`) and accepts `--output-dir <dir>` to override.
> - **Which is canonical?** `specs/` is the source of truth; both `specs/generated/` and
>   `src/generated/` are generated artifacts in the working tree (dual-view pattern, and both are
>   gitignored — `generated/` in `.gitignore`, so running these examples leaves `git status` clean). Use
>   `cascade` output when iterating on a spec — it stays next to the spec it came from. Use
>   `generate --output-dir` when you need code in a specific location such as `src/`.

**In OpenCode (agent syntax — these are chat commands, not shell commands):**

```text
@speclang-coordinator start-cascade specs/examples.spec.dir/hello-world.spec.md
# Coordinator will:
#   - Read the spec
#   - Determine dependencies
#   - Invoke @speclang-spec-writer (if needed)
#   - Run verification gates
#   - Ask if you want to continue

@speclang-code-gen
#   - Read specs/examples.spec.dir/hello-world.spec.md
#   - Extract TypeScript block
#   - Generate src/examples/hello-world.ts
#   - Verify compilation

@speclang-verifier
#   - Check compilation
#   - Create steering packet
#   - Report actual status (not claimed)
```

### Configure an LLM Provider (only `speclang agent` needs one)

`cascade` and `generate` extract code from the spec's own blocks and never call a
model. The LLM path is `speclang agent`, which reads its key from the environment
of the shell that runs it — **no `.env` file is loaded**:

| Provider | API key variable | Default model |
|---|---|---|
| `openai` (default) | `OPENAI_API_KEY` | `gpt-5-mini` |
| `openrouter` | `OPENROUTER_API_KEY` | `openai/gpt-5-mini` |
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-5` |
| `google` | `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | `gemini-2.5-pro` |

```bash
export OPENAI_API_KEY="sk-..."                                # this shell only
./bin/speclang agent --trigger specs/main.spec.md --dry-run   # mapping check, no key needed
./bin/speclang agent --trigger specs/main.spec.md             # real call
```

`SPECLANG_PROVIDER`, `SPECLANG_MODEL` and `SPECLANG_BASE_URL` set the provider,
model and endpoint without passing flags. Failure modes and the full first-run
walkthrough: [First-Spec Failures](docs/troubleshooting.md#first-spec-failures).

### Run a Root Example

The root `examples/` directory holds **runnable example outputs** — one `index.ts` entry point per example (`hello-world/`, `auth/`, `crud-app/`). Every file under it is a **symlink into `specs/examples.spec.dir/`** — the dual-view pattern applied to runnable code:

```
examples/
├── README.md       # → specs/examples.spec.dir/README.md
├── hello-world/
│   └── index.ts    # → specs/examples.spec.dir/hello-world/src/hello-world.ts
├── auth/
│   └── index.ts    # → specs/examples.spec.dir/auth/src/auth.ts
└── crud-app/
    └── index.ts    # → specs/examples.spec.dir/crud-app/src/crud-app.ts
```

- **`specs/examples.spec.dir/`** — spec sources, canonical. Each example is authored as a spec (`hello-world.spec.md`, `auth.spec.md`, `crud-app.spec.md`) and assembled into `src/*.ts` under its directory.
- **`examples/`** — runnable symlinked outputs. `examples/<name>/index.ts` is the same file as `specs/examples.spec.dir/<name>/src/<name>.ts`, visible from two locations. The files are SPECLANG-GENERATED — edit the spec, not the output.

Run a root example directly. The examples are TypeScript, so they need a TypeScript runtime — the repo ships `tsx` as a devDependency (plain `node` cannot load the `.ts` entry points):

```bash
npx tsx examples/hello-world/index.ts
# Output: Hello, World!
```

Because both paths resolve to the same file, the spec-tree copy runs identically:

```bash
npx tsx specs/examples.spec.dir/hello-world/src/hello-world.ts
# Output: Hello, World!
```

**Only `hello-world/` is a standalone script. `auth/` and `crud-app/` are importable modules, not standalone scripts** — they export classes and helpers (`AuthService`, `authMiddleware`; `TodoRepository`, `TodoController`) and have no top-level demo, so running them directly exits 0 and prints nothing. That silence is expected, not a failure; to see them work, import the module and call its exports.

`npx tsx -e` evaluates a snippet with the repo root as its working directory, so both commands below copy-paste directly:

```bash
# auth: register a user, log in, and reject a bad password
npx tsx -e "import { AuthService } from './examples/auth/index.ts'; void (async () => { const auth = new AuthService('demo-secret'); await auth.register('ada','ada@example.com','hunter2'); const ok = await auth.login('ada','hunter2'); const bad = await auth.login('ada','wrong-password'); console.log('auth: login =', ok.success, '| token issued =', typeof ok.token === 'string', '| wrong password ->', bad.success ? 'ACCEPTED' : bad.error); })();"
# Output: auth: login = true | token issued = true | wrong password -> Invalid credentials
```

```bash
# crud-app: create, update, list and delete a todo through TodoRepository
npx tsx -e "import { TodoRepository } from './examples/crud-app/index.ts'; void (async () => { const repo = new TodoRepository(); const t = await repo.create({ title: 'Ship README', description: 'prove the example runs' }); console.log('crud: created', JSON.stringify(t.title), '| completed =', t.completed); const u = await repo.update(t.id, { completed: true }); console.log('crud: updated completed =', u?.completed, '| rows =', (await repo.findAll()).length, '| deleted =', await repo.delete(t.id), '| rows =', (await repo.findAll()).length); })();"
# Output: crud: created "Ship README" | completed = false
#         crud: updated completed = true | rows = 1 | deleted = true | rows = 0
```

`tsx -e` compiles to CommonJS, where top-level `await` is rejected — keep the body inside `void (async () => { ... })()` as above, or save the snippet to a `.ts` file and run it with `npx tsx <file>`.

---

## Testing

The suite is **vitest** (`vitest.config.ts`), run against the TypeScript sources — no separate
test build step. A fresh clone needs two commands before the suite is meaningful:

```bash
npm ci          # locked dependencies, including the better-sqlite3 binding (see Installation)
npm run build   # tsc → dist/
```

The build is not optional if you drive the CLI: `dist/` is **gitignored and not tracked**
(`git ls-files dist | wc -l` prints `0`), and `bin/speclang` loads compiled modules from it
(`require('../dist/src/...')`) for `start`, `cascade`, `agent`, `validate` and `layers`. With no
`dist/`, those subcommands stop at `❌ SpecLang not built. Run: npm run build` (probed by moving
`dist/` aside and running `./bin/speclang validate`), while the rest of the CLI — e.g.
`speclang history` — still runs out of `bin/speclang` itself.

### Run the whole suite

```bash
npm test
```

`npm test` is `TMPDIR=$PWD/.tmp vitest run`, and its `pretest` script runs `npm run build` first, so
the build prerequisite is handled for you on this path. Check its exit code and summary; success
is not guaranteed merely because the tree is clean. The summary has this shape:

```
Test Files  <n> passed | <k> skipped (<total>)
      Tests  <n> passed | <k> skipped (<total>)
```

The counts move every time a test lands, and they differ between a worktree and a full checkout, so
read the summary line your own run prints instead of quoting one from here. If a run fails, start
with the timeout-shaped ones: several suites drive real subprocesses and their budgets assume the
machine is not already saturated (`GAP-003` bounded the vitest worker pool for exactly this reason).

### Run one file or one directory

```bash
npx vitest run tests/parser.test.ts    # a single-file path filter
npx vitest run tests/db                # a substring path filter
```

`npx vitest run` does **not** run `pretest`, so build first (or use `npm test -- <path>`, which runs
the same filter with the build attached). The positional argument is a path *filter* — a substring
match on the file path, not a strict scope — so `tests/db` also picks up the root-level
`tests/db.test.ts`. Run `npm test -- tests/db` for the authoritative number selected by that filter.

### Where the tests live

`vitest.config.ts` collects `tests/**/*.test.ts` and `tests/**/*.test.tsx`, with
`tests/global-setup.ts` and `tests/setup-tmpdir.ts` redirecting `TMPDIR` to the gitignored `.tmp/`.
Run `npx vitest list --filesOnly` for the collected file inventory and run `npm test` for the
authoritative number of passing, failing and skipped files/tests. The Playwright `*.spec.ts`
files under `tests/e2e/` are excluded from this collection (see below).
Root-level files include `tests/parser.test.ts` and `tests/config.test.ts`; directories cover:

| directory | what it covers |
|---|---|
| `tests/cli/` | CLI command surface (`bin/speclang` end to end) |
| `tests/daemon/` | file-watcher daemon |
| `tests/dashboard/` | dashboard hooks and React components (React mocked, node env) |
| `tests/db/` | SQLite layer, migrations |
| `tests/cascade/`, `tests/cascade_new/` | cascade execution |
| `tests/maturity/` | maturity levels, criteria, MVP validator |
| `tests/mcp/` | MCP server, tools, bin-path resolution and metrics |
| `tests/autonomous/` | autonomous validation runs and confidence scoring |
| `tests/codegen/` | TypeScript and Go code generation |
| `tests/validation/` | validation engine, rules, parse-and-validate |
| `tests/performance/` | performance checks for cascade, daemon and MCP |
| `tests/ci/` | CI self-checks (pre-commit hook, coverage run) |
| `tests/meta/` | spec-index generator and repo bootstrap |
| `tests/stdlib/` | standard-library spec functions and types |
| `tests/agent-driver/` | `scripts/agent-driver/drive.mjs` fail-closed contract and happy path |
| `tests/agents/`, `tests/examples/`, `tests/transition/`, `tests/workflow/` | agent communication, hello-world example, spec transitions, conversation workflow |
| `tests/e2e/` | end-to-end cascade run (`spec-to-code.test.ts` — see below) |

`tests/mocks/` holds shared fixtures (`fixtures.ts`, `mcp-server.ts`, …) and no test files of its own.

### `tests/e2e` is not a Playwright entry point here

The Playwright specs in `tests/e2e/` (`@playwright/test`: `dashboard.spec.ts`,
`monitoring.spec.ts`, `cascade-control.spec.ts`, `spec-editing.spec.ts`) **cannot run in this
repo as cloned**: `@playwright/test` is not a dependency (absent from `package.json` and from
`node_modules`) and `vitest.config.ts` excludes `tests/e2e/**/*.spec.ts`. The vitest-native
`tests/e2e/spec-to-code.test.ts` is collected; run `npm test -- tests/e2e` for the authoritative
number of files/tests and their results.

### Test-run side effects

- `dist/` and `.tmp/` are gitignored build/scratch directories; some tests create `test-temp-*/`
  directories at the repo root.
- `_index.json` is tracked but regenerated by the run, so `git status` shows it modified after
  `npm test`. Don't commit that churn.

### Static checks: lint and types

```bash
npm run lint            # eslint over src/**/*.ts
npx tsc --noEmit        # type check only; emits nothing
```

`npm run lint` is `NODE_OPTIONS="--require ./scripts/lint/ts6-resolution.cjs" eslint "src/**/*.ts"`.
Lint runs against the TypeScript 6 API while `npm run build` stays on TypeScript 7: typescript-eslint
8.x refuses to load against TS >= 7, so `scripts/lint/ts6-resolution.cjs` scopes `require("typescript")`
from inside the lint toolchain onto the `typescript-eslint-ts` alias (`npm:typescript@6.0.3`) that
`package.json` already declares as a devDependency. It needs no setup beyond `npm install`.

Observed at `6e69f3ae` (2026-11-17): `npm run lint` exits `0` with 0 errors and 1 warning —

```
src/ralph-loop/types.ts
  11:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-var-requires')

✖ 1 problem (0 errors, 1 warning)
```

`npx tsc --noEmit` also exits `0` on that tree — the same compiler `npm run build` runs, without the
`dist/` emit.

---

## Architecture

### Agent Roles

| Agent | Role | Verification |
|-------|------|--------------|
| `@speclang-coordinator` | Explicitly orchestrates cascade steps | Runs verification gates, tracks state and depth, asks user to continue |
| `@speclang-spec-writer` | Creates/updates specs with headers and references | validate_refs.py and validate_autonomous.py |
| `@speclang-code-gen` | Extracts spec code blocks into implementation files | TypeScript, Go, or Python compilation checks |
| `@speclang-verifier` | Validates cascade output and creates steering packets | Spec validation, compilation, tests, and recorded verification results |
| `@speclang-simulator` | Simulates cascade and agent roles within spec-file boundaries | Checks file patterns, headers, and references before writes; limits cascade depth |
| `@speclang-simulator-verify` | Validates Builder work and creates Ralph Loop steering packets | Spec format, compilation, tests, and integration checks |

### File Structure

```
specs/                    # Source of truth (live inventory: generate_index.py --graph)
├── project.scl          # Layer 0 - North Star
├── core.spec.md         # Layer 1 - Core concepts
├── cascade.spec.md      # Layer 1 - Cascade system
├── auth.spec.md         # Layer 2 - Auth feature
└── examples.spec.dir/  # Examples (spec sources — canonical)
    ├── hello-world/hello-world.spec.md
    ├── auth/auth.spec.md
    └── crud-app/crud-app.spec.md

examples/                # Runnable example outputs (symlinks → specs/examples.spec.dir/)
├── hello-world/index.ts # → specs/examples.spec.dir/hello-world/src/hello-world.ts
├── auth/index.ts        # → specs/examples.spec.dir/auth/src/auth.ts
└── crud-app/index.ts    # → specs/examples.spec.dir/crud-app/src/crud-app.ts

src/                     # Handwritten TypeScript application source (compiled to dist/ by tsc)
├── examples/
│   ├── auth.ts          # Auth example (not a src/auth/ directory)
│   └── hello-world.ts   # Hello World example
├── db/                  # Existing source directory
└── ...                  # Other source paths omitted

scripts/                 # Tools (dual-view: symlinks → specs/scripts.spec.dir/, which holds the
│                        # canonical implementations next to their specs)
├── validate_refs.py     # ✅ Works
├── validate_autonomous.py # ✅ Works
└── generate_*.py        # ⚠️ Have extraction bugs

.opencode/agents/        # Agent definitions
├── speclang-coordinator.md    # ✅ New
├── speclang-spec-writer.md    # ✅ New
├── speclang-code-gen.md       # ✅ New
└── speclang-verifier.md       # ✅ New

.speclang/               # State tracking
├── daemon-state.json          # Daemon state
└── cascade_state.json         # Current cascade
```

### TypeScript Build Verification

Measured on 2026-11-17 at `6e69f3ae`, after `npm ci --no-audit --no-fund`
and `npm rebuild better-sqlite3`. Run these commands from the repository root;
the captured output is quoted below (npm's notice lines omitted):

```console
$ ls -d src/db src/auth; printf 'rc=%s\n' "$?"
ls: cannot access 'src/auth': No such file or directory
src/db
rc=2
$ ls -1 src/examples/auth.ts src/examples/hello-world.ts
src/examples/auth.ts
src/examples/hello-world.ts
$ npx tsc --noEmit; printf 'rc=%s\n' "$?"
rc=0
$ npm run build; printf 'rc=%s\n' "$?"
rc=0
```

Both TypeScript commands succeed using the repository's `tsconfig.json`, which
already enables `skipLibCheck` and excludes some source paths. These results prove
the configured typecheck and build pass, not that every file or dependency
declaration is checked, or that runtime behavior is correct.

---

## What Works vs What Doesn't

*(Validation and test commands re-run on 2026-11-18 at `1a2134ac7d82395c22594c0d9a104cbc65ca06dc`;
see [README-25 evidence](evidence/readme-25-2026-11-18/transcript.md) for exact exit codes and output.
These measurements describe that commit, not a promise about later checkouts.)*

### ✅ Working

- **Spec inventory**: Run `python3 scripts/generate_index.py --graph` for the authoritative number of live graph nodes, edges and missing refs; this is distinct from the saved `_index.json` entries
- **Reference tooling**: `validate_refs.py` prints `All references valid.` but does not enforce its collected errors; `python3 scripts/generate_index.py --validate` is the strict reference/cycle check, not evidence of universal success
- **Autonomous validation**: Scores indexed entries for agent readiness; run `python3 scripts/validate_autonomous.py --project` for the authoritative number of reports and their results (non-autonomous specs need not pass every sub-check)
- **Hello World**: Compiles successfully (proof of concept)
- **Cascade protocol**: Documented explicit coordination
- **Agent definitions**: 6 definitions in `.opencode/agents/` (excluding its README.md) — see [Agent Roles](#agent-roles) for responsibilities
- **TypeScript compilation**: `npx tsc --noEmit` and `npm run build` both exit with `rc=0` under the repository configuration (see [TypeScript Build Verification](#typescript-build-verification) for commands and captured output)
- **Integration / E2E tests**: Run `npm test -- tests/e2e/spec-to-code.test.ts tests/poc-e2e.test.ts tests/dashboard/integration/git-integration.test.tsx` for the authoritative number of passing, failing and skipped tests/files in this selection

### ⚠️ Partially Working

- **Code generation**: Scripts exist but have bugs (nested backticks, duplication)
- **Test suite**: Run `npm test` for the authoritative number and exit status on your checkout; consult the dated [measurement transcript](evidence/readme-25-2026-11-18/transcript.md), not a hard-coded total or an unconditional green claim
- **Steering packets**: Now accurate (fixed in redesign)

### ❌ Not Working (Yet)

- **Automatic cascade**: File watching requires the opt-in daemon — `speclang start` runs the file watcher (see Current Limitations above); the MCP server is started separately with `speclang mcp start`; without the daemon, cascades are triggered manually
- **Self-hosting**: Not yet complete — no tool is generated end-to-end from its own spec. The layout is already dual-view, though: each tool's implementation lives canonically under `specs/scripts.spec.dir/` next to its own spec (`generate_index.py` beside `_index.md` / `generate-index.spec.md`), and `scripts/` surfaces those implementations as symlinks (`scripts/generate_index.py` → `../specs/scripts.spec.dir/generate_index.py`; 32 symlinks plus 8 repo-level shell/node harnesses such as `guard-build.sh` and `gen-migrations.mjs`). Script bodies, and the TypeScript application source under `src/`, are hand-authored; only what `speclang generate` / `cascade` emits (`src/generated/`, `specs/generated/`) is machine-generated, and both of those paths are gitignored
- **Full tree traversal**: Coordinator doesn't automate multi-tree yet
- **Error recovery**: Basic, needs improvement

---

## Comparison: Vision vs Reality

| Feature | Original Vision | Current Reality |
|---------|----------------|-----------------|
| File watching | inotify daemon | Daemon (opt-in) / manual trigger |
| Agent triggering | Automatic | Explicit Task invocation |
| Convergence | Auto-detected | User decision |
| Multi-tree | Automatic spanning | Explicit layer-by-layer |
| Verification | Assumed | Mandatory gates |
| Code quality | "Just works" | Verified compilation |
| Steering packets | Auto-generated | Verified ground truth |

**Trade-off**: We lost magic, gained reliability.

---

## The Path Forward

### Immediate (This Week)

1. ✅ Fix test suite imports
2. ✅ Create working Hello World example
3. ✅ Document cascade protocol
4. **Fix code extraction bugs** (nested backticks, duplication)

### Short-term (This Month)

1. **Create coordinator tree traversal** - Automate multi-tree spanning
2. **Build 3-5 working examples** - Counter, Database, API
3. **Create cascade templates** - Reusable patterns

### Medium-term (This Quarter)

1. **Bootstrap extraction scripts** - Generate from specs
2. **Full integration tests** - End-to-end cascade validation
3. **Self-hosting proof** - One tool generated from specs
4. **OpenCode integration** - Proper mode implementation

---

## Documentation

- `docs/AGENT_DRIVER.md` - **Driving SpecLang from another coding agent** (the default usage path: seed a baseline prompt, let the cascade expand and build it)
- `docs/CONFIGURATION.md` - Every environment variable SpecLang reads, with defaults and source anchors
- `docs/CASCADE_DEMO.md` - Working example walkthrough
- `specs/cascade-protocol.spec.md` - Full protocol specification
- `specs/examples.spec.dir/hello-world.spec.md` - Minimal working example
- `.opencode/agents/` - Agent definitions

---

## Contributing

This is a meta-circular project. To contribute:

1. **Fix extraction bugs** - `scripts/generate_*.py`
2. **Add examples** - `specs/examples.spec.dir/`
3. **Improve validation** - `scripts/validate_*.py`
4. **Test cascades** - Run examples, report issues

---

## License

MIT

---

**Status**: Alpha - One working example, solid foundation, much more to build.

**Last Updated**: 2026-11-18
**Specs**: run `python3 scripts/generate_index.py --graph` for the authoritative number.
**Tests**: run `npm test` for the authoritative number and result; [dated measurement evidence](evidence/readme-25-2026-11-18/transcript.md).
