# SpecLang

**Specs are source code. Generated code is machine code.**

SpecLang is a reactive multi-agent system where natural language specifications self-assemble into working code through a swarm of AI agents. Humans write specs. AI writes code. The specs are what we review, version, and maintain.

## How It Works

```
User edits project.scl (North Star)
  ↓
speclangd detects file change (inotify)
  ↓
SpecWriter agent expands specs
  ↓
CodeGen agent generates code
  ↓
TestWriter agent writes tests
  ↓
Convergence: 30s quiet → pipeline runs
```

**One agent per file.** File watcher triggers cascade. Multiple agents run concurrently. Generated code is disposable — rebuild anytime from specs.

## Quick Start

```bash
git clone https://github.com/dexdat/SpecLang
cd SpecLang
npm install
npm run build && npm test    # 2,150+ tests
npm run e2e                   # proves the engine: daemon → cascade → code
```

**Requirements:** Node.js >= 18, Pi Agent SDK (`@earendil-works/pi-coding-agent`), DeepSeek API key (for code generation).

Set `DEEPSEEK_API_KEY` in your environment or `.env` file.

## Architecture

| Component | Role |
|-----------|------|
| **speclangd** | File watcher daemon (chokidar + inotify) |
| **Cascade Router** | Queues file changes, spawns Pi Agent sessions |
| **SpecWriter** | Expands high-level specs into detailed specs |
| **CodeGen** | Generates TypeScript/Go/Python code from specs |
| **TestWriter** | Writes tests from test specs |
| **Guard** | Enforces one-agent-per-file ownership |
| **Pipeline** | Runs build/test after convergence |

## Project Structure

```
specs/          📋 Source of truth — 254 specification files
src/            💻 Generated TypeScript implementation
bin/            🛠 CLI tools and test scripts
tests/          🧪 Test suite (2,150+ tests)
.opencode/      🤖 OpenCode skills and plugins
.ralph/         🔄 Ralph Loop project management
```

## Why SpecLang

- **Deterministic context**: Explicit `@ref:` links, not probabilistic retrieval
- **Concurrent agents**: Multiple Pi Agent sessions run in parallel
- **Cheap models work**: DeepSeek V4 handles one file at a time with perfect context
- **Generated code is disposable**: Edit specs, regenerate — like recompiling
- **Self-specifying**: SpecLang's own specs describe how to build SpecLang

## License

MIT © SpecLang Contributors
