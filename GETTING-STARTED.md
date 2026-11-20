# Getting Started with SpecLang

**Start here if you're new to SpecLang.**

## Quick Start

1. **Read:** `specs/000-bootstrap.md` - Bootstrap primer (READ FIRST)
2. **Read:** `specs/project.scl` - North Star intent
3. **Check:** `specs/_index.md` - Directory index
4. **Explore:** Follow `@ref:` links in spec headers

## What is SpecLang?

SpecLang is designed as a **reactive multi-agent system** where:
- **Specs are source code** - Humans write and review specs
- **Generated code is machine code** - Trust it, don't hand-edit it
- **Filesystem is the event bus** *(design goal)* - File changes trigger agent reactions
- **Context never gets lost** - Universal headers track dependencies

### Reality Check

The reactive vision above is the **design goal**, not the current
implementation. Per README's Current Status:

- **Daemon is opt-in** - `speclang start` runs the file watcher +
  dashboard (and `daemon`/`stop` manage it); the MCP server is started
  separately with `speclang mcp start`; without the daemon, everything
  runs in the foreground as explicit commands
- **Explicit invocation by default** - Cascade must be invoked
  explicitly (e.g. `@speclang-coordinator start-cascade <spec>` or
  `./bin/speclang cascade <spec>`); automatic reactions require the
  daemon to be running
- **Sequential execution** - agents invoked one at a time
- **User-controlled** - you decide when to continue a cascade

Indexing and validation are manual steps too: run
`python3 scripts/generate_index.py --generate` after editing specs, and use
`python3 scripts/generate_index.py --validate` as the reference gate (it
exits non-zero while missing references exceed `--max-missing`).

### Try It

```bash
# 1. Dry run — confirm the spec's TypeScript block is found
#    (`generate` previews into its --output-dir, default `src/generated/`)
./bin/speclang generate specs/examples.spec.dir/hello-world.spec.md --dry-run

# 2. Run the cascade — this writes real files. Output lands in
#    `specs/generated/`: SpecLang takes the directory containing the spec
#    file (`specs/examples.spec.dir`), goes one level up (`specs/`) and
#    appends `generated/`. Block names may carry a path, so the block
#    `@block::hello/function` lands at `specs/generated/hello/function.ts`.
./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md
```

`-d, --dir <directory>` (default `.`) is the project root used to resolve
`<spec>`. Output always follows the spec file, by one rule:
`<directory containing the spec>/../generated/`. Measured on 2026-11-17 with
`./bin/speclang cascade`:

- `specs/examples.spec.dir/hello-world.spec.md` → `specs/generated/hello/function.ts`
- `specs/foo.spec.md` (a spec directly in `specs/`) → `<project root>/generated/foo/function.ts`

Both locations are gitignored.

## MCP Server

`speclang mcp` exposes the same operations over the Model Context Protocol, so
an agent host (Claude Desktop, an IDE, another harness) can search specs and
drive cascades without shelling out.

```bash
# stdio transport (the default) — what an MCP client spawns as a subprocess
node bin/speclang mcp start

# HTTP transport — what you point a remote client or curl at
node bin/speclang mcp start --remote --port 3000
```

Flags, as they actually exist (`node bin/speclang mcp start --help`):

- `--remote` — switch to HTTP server mode. It is a boolean, not a transport
  argument; without it the server speaks JSON-RPC on stdin/stdout.
- `-p, --port <port>` — HTTP port, only used with `--remote` (default `3000`)
- `-d, --dir <directory>` — project directory (default `.`); specs are read
  from `<dir>/specs` and the index DB is written to
  `<dir>/.speclang/speclang.db`
- `--auth <none|basic|token>` with `--user` / `--pass` / `--token` — guards the
  `/mcp` routes (default `none`)

In `--remote` mode the server listens on:

| Route | Purpose |
|---|---|
| `GET /mcp` | SSE stream; the first event is `endpoint: /mcp/message?sessionId=<uuid>` |
| `POST /mcp/message` | JSON-RPC 2.0 requests (`initialize`, `tools/list`, `tools/call`) |
| `GET /events` | SSE event feed (enabled unless `MCP_SSE_ENABLED=false`) |
| `GET /health` | liveness probe: `{"status":"ok","mode":"http"}` |
| `GET /metrics` | Prometheus scrape endpoint (no auth); see `docs/observability-spec.md` §9.1 for metric families |

A session end to end:

```bash
node bin/speclang mcp start --remote --port 3000 &

curl -s localhost:3000/health
# {"status":"ok","mode":"http"}

curl -s localhost:3000/mcp/message -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# {"jsonrpc":"2.0","result":{"tools":[{"name":"speclang_search",...}]},"id":1}

curl -s localhost:3000/mcp/message -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",
       "params":{"name":"speclang_cascade_status","arguments":{}}}'
# {"jsonrpc":"2.0","result":{"status":"idle"},"id":2}
```

Startup diagnostics go to stderr on purpose — in stdio mode stdout carries the
JSON-RPC stream. Note that `mcp status` / `mcp stop` read `.speclang/mcp.pid`,
which `mcp start` does not write today; stop the server with SIGTERM or Ctrl-C.

## Core Principle

> "When was the last time you reviewed machine code?"

You review **specs**, not generated code. Generated code is like machine code - you trust the compiler (SpecLang).

## Naming Conventions (IMPORTANT)

### Directory Names

```
specs/
├── foo.spec.md              # Parent spec (intent)
├── foo.spec.dir/            # Sub-specs directory (MUST be *.spec.dir)
│   ├── _index.md
│   ├── bar.spec.md          # Intent spec (what we want)
│   └── bar.go.spec          # Generated code spec (symlinked to bar.go)
└── generated/               # Cascade output — `specs/generated/`
    └── go/
        └── bar.go           # Actual generated code (symlink target)
```

**Rules:**
- Sub-spec directories MUST be named `*.spec.dir` (not just `*.dir`)
- Index files are `_index.md` (not `.spec.md`)
- Spec IDs should match: `@speclang/foo.spec.dir/bar`

### File Names and Generation Flow

```
INTENT SPEC              GENERATED SPEC           ACTUAL FILE
(bar.spec.md)    →       (bar.go.spec)     →      (bar.go)
"what we want"           "code mapping"           "real code"
```

**Example for OpenAPI:**
```
openapi.spec.md     →    openapi.yaml.spec   →    openapi.yaml
(requirements)           (generated YAML)        (symlink)
```

**Example for Go:**
```
helloworld.spec.md  →    helloworld.go.spec →    helloworld.go
(intent)                 (code mapping)          (symlink)
```

### Spec ID Format

```yaml
# CORRECT
id: "@speclang/api.spec"           # Parent spec
id: "@speclang/api.spec.dir/openapi"  # Child spec in directory

# INCORRECT  
id: "@speclang/api"                # Missing .spec
id: "@speclang/api.spec.dir/openapi"    # Directory missing .spec
```

## Directory Structure

```
SpecLang/
├── specs/                    ← ALL SPECIFICATIONS (source of truth)
│   ├── 000-bootstrap.md     ← READ FIRST - Bootstrap primer
│   ├── _index.md            ← Directory index
│   ├── project.scl          ← North Star intent
│   ├── core.spec.md         ← Core architecture
│   ├── foo.spec.md          # Parent spec
│   └── foo.spec.dir/        # Sub-specs (MUST be *.spec.dir)
│       ├── _index.md
│       └── bar.spec.md
│
├── src/                     ← Generated TypeScript implementation
├── docs/                    ← Documentation and prompts
├── .speclang/              ← Local index DB (speclang.db), created on first run
├── .opencode/              ← OpenCode configuration
└── scripts/                ← Tooling scripts
```

## For AI Agents

If you're an AI agent working with SpecLang:

1. **Always read** `specs/000-bootstrap.md` first
2. **Check** `specs/_index.md` for file listings
3. **Follow** `@ref:` links in headers for dependencies
4. **Use** SQLite database queries when available
5. **Drive the build** through the agent-driver loop — `docs/AGENT_DRIVER.md` (seed a baseline prompt; the cascade expands and builds it; the driver fails closed on hollow output)
6. **Remember**: One file, one commit, perfect history

### Agent Rules for Creating Specs

When creating new specs, follow these rules:

1. **Parent spec**: `specs/foo.spec.md` with id `@speclang/foo.spec`
2. **Sub-specs directory**: `specs/foo.spec.dir/` (not `foo.spec.dir/`)
3. **Child specs**: `specs/foo.spec.dir/bar.spec.md` with id `@speclang/foo.spec.dir/bar`
4. **Index file**: `specs/foo.spec.dir/_index.md` with id `@speclang/foo.spec.dir/index`

## For Developers

If you're developing SpecLang itself:

1. **Specs define the system** - Edit specs, not generated code
2. **Meta-circular** - Specs describe the system that reads specs
3. **Self-building** - SpecLang builds SpecLang from specs
4. **Incremental** - Only regenerate changed dependencies

## Key Files

### Must Read (Minimum Context)
- `specs/000-bootstrap.md` - Bootstrap primer
- `specs/project.scl` - North Star vision
- `specs/core.spec.md` - Core architecture
- `specs/spec-format.spec.md` - Spec format
- `specs/headers.spec.md` - Universal headers

### Implementation
- `src/` - TypeScript implementation (generated from specs)
- `docs/prompts/` - Phase-by-phase development prompts
- `scripts/` - Python tooling scripts

## How to Navigate

### As a New User/Agent:
```
specs/000-bootstrap.md → specs/project.scl → specs/core.spec.md
```

### To Understand a Specific Component:
1. Find the main spec (e.g., `daemon.spec.md`)
2. Read its `children:` field for sub-specs
3. Check the `*.spec.dir/` folder for detailed specs
4. Read `_index.md` in each directory

### To Find Files:
1. Check `specs/_index.md` for root directory
2. Check `_index.md` in each subdirectory
3. Use `grep` for specific terms
4. When available, query SQLite database

## Development Workflow

1. **Edit specs** in `specs/` directory
2. **Generate index**: `python3 scripts/generate_index.py --generate` (bare invocation only prints usage — the index is never rewritten without the explicit flag)
3. **Validate references**: `python3 scripts/generate_index.py --validate` (exits non-zero when missing references exceed `--max-missing`, default 0)
4. **Generate code**: (When compiler is ready)
5. **Test**: Run generated tests

## Remember

- **Specs are the source of truth** - Generated code is disposable
- **Context never lost** - Headers track dependencies
- **One file, one commit** - Perfect git history
- **Agents own files** - No stepping on each other's work
- **Directory names must be `*.spec.dir`** - Not just `*.dir`
- **Spec IDs must include `.spec`** - Match the file name

**Start with `specs/000-bootstrap.md` and follow the dependency graph.**