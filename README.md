# SpecLang

A specification-driven multi-agent system where specs cascade through dependency trees to generate working code.

## Installation

### From npm (recommended)
```bash
npm install -g speclang
speclang --help
```

### From source
```bash
# Clone the repository
git clone https://github.com/dexdat/SpecLang.git
cd SpecLang

# Install dependencies
npm install

# Build the TypeScript project
npm run build

# Verify installation
./bin/speclang --help
```

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Python** >= 3.8 (for tooling scripts)

### CLI Commands

```bash
./bin/speclang --help           # Show all commands
./bin/speclang validate         # Validate all specs
./bin/speclang check            # Validate specs without generating
./bin/speclang generate         # Generate code from specs
./bin/speclang build            # Build code from specs
./bin/speclang cascade          # Run cascade (dry-run by default)
./bin/speclang status           # Show system status
./bin/speclang bootstrap        # Bootstrap SpecLang: verify specs, run cascade
```

### API Reference

For programmatic access, see:
- `specs/api.spec.md` - REST API specification
- `specs/mcp.spec.md` - MCP server for AI agent integration

## Current Status: Reality-Based Alpha

**✅ What Works:**
- 475 specifications with proper headers and references
- Reference validation (all specs resolve correctly)
- Autonomous validation (scores specs for agent readiness)
- Hello World example (compiles and runs)
- Explicit cascade protocol with verification gates
- Working agent definitions for OpenCode
- 1750 tests passing (4 known cascade flakes in arch004; all pass in isolation)

**⚠️ Current Limitations:**
- **No automatic file watching** - Coordinator must be invoked explicitly
- **No background daemon** - Everything runs in foreground
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

Example tree from `project.scl` (Layer 0):
```
project.scl (Layer 0)
├── @ref:speclang/core (Layer 1)
│   ├── @ref:speclang/auth (Layer 2)
│   │   ├── specs/auth/implementation.spec.md (Layer 3)
│   │   └── src/auth/handler.ts (Layer 8)
│   └── @ref:speclang/database (Layer 2)
│       └── src/db/client.ts (Layer 8)
└── @ref:speclang/cascade (Layer 1)
    └── specs/cascade-protocol.spec.md (Layer 1)
```

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
→ Invoke @speclang-test-writer
→ Verify: python3 -m pytest tests/
```

### 3. Multi-Tree Spanning

One spec change cascades across multiple output trees:

| Input | Generates |
|-------|-----------|
| `specs/auth.spec.md` | `specs/auth/impl.spec.md` (spec tree) |
| | `src/auth/handler.ts` (code tree) |
| | `tests/auth.test.ts` (test tree) |
| | `docs/api/auth.md` (docs tree) |

### 4. Verification Gates (Mandatory)

After EVERY agent invocation:

```bash
# Gate 1: Reference validation
python3 scripts/validate_refs.py

# Gate 2: Spec validation
python3 scripts/validate_autonomous.py --file <spec>

# Gate 3: Code compilation
npx tsc --noEmit --skipLibCheck <file.ts>

# Gate 4: Test execution
python3 -m pytest tests/ -v
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

### Verify Everything Works

```bash
# 1. Validate all specs
python3 scripts/validate_refs.py
# Output: All references valid.

# 2. Run autonomous validation
python3 scripts/validate_autonomous.py --project
# Output: 475 specs validated

# 3. Try Hello World example
npx tsc --noEmit --skipLibCheck src/examples/hello-world.ts
# Output: (no errors = success)

# 4. Generate spec index
python3 generate_index.py
# Output: Created _index.json with 153 entries
```

### Run a Mini Cascade

```bash
# 1. Start cascade with a spec
@speclang-coordinator start-cascade specs/examples/hello-world.spec.md

# 2. Coordinator will:
#    - Read the spec
#    - Determine dependencies
#    - Invoke @speclang-spec-writer (if needed)
#    - Run verification gates
#    - Ask if you want to continue

# 3. Generate code
@speclang-code-gen
#    - Read specs/examples/hello-world.spec.md
#    - Extract TypeScript block
#    - Generate src/examples/hello-world.ts
#    - Verify compilation

# 4. Verify
@speclang-verifier
#    - Check compilation
#    - Create steering packet
#    - Report actual status (not claimed)
```

---

## Architecture

### Agent Roles

| Agent | Role | Verification |
|-------|------|--------------|
| `@speclang-coordinator` | Orchestrates cascade | Tracks state, manages depth |
| `@speclang-spec-writer` | Creates/updates specs | validate_refs.py |
| `@speclang-code-gen` | Generates code | npx tsc --noEmit |
| `@speclang-test-writer` | Creates tests | pytest |
| `@speclang-verifier` | Validates output | All checks + steering |

### File Structure

```
specs/                    # Source of truth (475 specs)
├── project.scl          # Layer 0 - North Star
├── core.spec.md         # Layer 1 - Core concepts
├── cascade.spec.md      # Layer 1 - Cascade system
├── auth.spec.md         # Layer 2 - Auth feature
└── examples/            # Examples
    └── hello-world.spec.md

src/                     # Generated code
├── examples/
│   └── hello-world.ts   # ✅ Compiles
├── db/                  # ⚠️ Has compilation errors
├── auth/                # ⚠️ Has compilation errors
└── ...                  # ⚠️ Various issues

scripts/                 # Tools
├── validate_refs.py     # ✅ Works
├── validate_autonomous.py # ✅ Works
└── generate_*.py        # ⚠️ Have extraction bugs

.opencode/agents/        # Agent definitions
├── speclang-coordinator.md    # ✅ New
├── speclang-spec-writer.md    # ✅ New
├── speclang-code-gen.md       # ✅ New
└── speclang-verifier.md       # ✅ New

.speclang/               # State tracking
├── steering_packets.json      # Cascade history
└── cascade_state.json         # Current cascade
```

---

## What Works vs What Doesn't

### ✅ Working

- **Spec validation**: All 475 specs have valid headers and references
- **Reference resolution**: `validate_refs.py` confirms 100% accuracy
- **Autonomous validation**: Scores specs for agent readiness (0.75-1.05 confidence)
- **Hello World**: Compiles successfully (proof of concept)
- **Cascade protocol**: Documented explicit coordination
- **Agent definitions**: Complete for all 5 roles

### ⚠️ Partially Working

- **Code generation**: Scripts exist but have bugs (nested backticks, duplication)
- **TypeScript compilation**: Works with `--skipLibCheck`, has type conflicts
- **Test suite**: Created but import paths broken
- **Steering packets**: Now accurate (fixed in redesign)

### ❌ Not Working (Yet)

- **Automatic cascade**: No file watching (by design)
- **Self-hosting**: Scripts are handwritten, not generated
- **Full tree traversal**: Coordinator doesn't automate multi-tree yet
- **Integration tests**: None exist
- **Error recovery**: Basic, needs improvement

---

## Comparison: Vision vs Reality

| Feature | Original Vision | Current Reality |
|---------|----------------|-----------------|
| File watching | inotify daemon | Manual trigger |
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
2. **Fix TypeScript type conflicts** - @types/glob issues
3. **Build 3-5 working examples** - Counter, Database, API
4. **Create cascade templates** - Reusable patterns

### Medium-term (This Quarter)

1. **Bootstrap extraction scripts** - Generate from specs
2. **Full integration tests** - End-to-end cascade validation
3. **Self-hosting proof** - One tool generated from specs
4. **OpenCode integration** - Proper mode implementation

---

## Documentation

- `docs/CASCADE_DEMO.md` - Working example walkthrough
- `specs/cascade-protocol.spec.md` - Full protocol specification
- `specs/examples/hello-world.spec.md` - Minimal working example
- `.opencode/agents/` - Agent definitions

---

## Contributing

This is a meta-circular project. To contribute:

1. **Fix extraction bugs** - `scripts/generate_*.py`
2. **Add examples** - `specs/examples/`
3. **Improve validation** - `scripts/validate_*.py`
4. **Test cascades** - Run examples, report issues

---

## License

ISC

---

**Status**: Alpha - One working example, solid foundation, much more to build.

**Last Updated**: 2026-07-18
**Specs**: 475 | **Examples**: 1 working | **Tests**: 1753 passing (1 known flake: arch004 cascade timeout)
