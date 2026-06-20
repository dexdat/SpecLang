# speclang-header lines:7
id: "@speclang/roadmap/poc/demo-workflow"
parent: "@ref:specs/roadmap/poc"version: 0.1.0
layer: 2
short: "Complete end-to-end demo workflow for POC"
tags: [poc, demo, workflow, example, happy-path]
---

# POC: Demo Workflow

Complete end-to-end demonstration of SpecLang POC.

## Demo Scenario

**Goal**: Create a "Hello World" function from spec to working code.

### Step 1: Create Spec

User creates `specs/greeting.spec.md`:

```markdown
# speclang-header lines:10
id: "@examples/greeting"
version: 1.0.0
layer: 5
short: "Simple greeting functions"
tags: [example, greeting]
---

# Greeting Functions

Simple greeting utilities.

### @block::greet @kind:function

Returns a personalized greeting.

**Parameters:**
- name: string - Person to greet

**Returns:** string - Greeting message

**Example:**
```typescript
greet("World") // "Hello, World!"
```
```

### Step 2: File Watcher Detects

```
[14:32:01] FileWatcher: Created specs/greeting.spec.md
[14:32:01] FileWatcher: Emitting file-changed event
```

### Step 3: Simple Agent Processes

```
[14:32:01] SimpleAgent: Received event for specs/greeting.spec.md
[14:32:01] SimpleAgent: Parsing spec header...
[14:32:01] SimpleAgent: Found 1 block: greet
[14:32:01] SimpleAgent: Generating TypeScript...
[14:32:01] SimpleAgent: Writing to specs/greeting.spec.dir/src/greet.ts
[14:32:01] SimpleAgent: Creating symlink src/greeting
[14:32:02] SimpleAgent: ✅ Complete
```

### Step 4: Generated Code

**File**: `specs/greeting.spec.dir/src/greet.ts`

```typescript
// SPECLANG-GENERATED: function
// Source: specs/greeting.spec.md#greet
// DO NOT EDIT MANUALLY

/**
 * Returns a personalized greeting.
 * @param name - Person to greet
 * @returns Greeting message
 */
export function greet(name: string): string {
  // TODO: Implement
  throw new Error('Not implemented');
}
```

### Step 5: Symlink Created

```bash
$ ls -la src/
lrwxr-xr-x greeting -> ../specs/greeting.spec.dir/src

$ ls -la src/greeting/
-rw-r--r-- greet.ts
-rw-r--r-- index.ts  # Auto-generated barrel export
```

### Step 6: Build Passes

```bash
$ npm run build

> speclang@0.1.0 build
> tsc

✅ Build successful
```

### Step 7: Use the Code

```typescript
// Another file can now import:
import { greet } from './greeting/greet';

console.log(greet("World")); // "Hello, World!"
```

## Complete Cascade Flow

```
┌─────────────────┐
│ User edits spec │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FileWatcher     │
│ detects change  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SimpleAgent     │
│ parses spec     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate code   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create symlink  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build succeeds  │
└─────────────────┘
```

## Demo Commands

### Run the Demo

```bash
# 1. Start the daemon
./bin/speclangd

# 2. Create a spec
cat > specs/hello.spec.md << 'SPEC'
# speclang-header lines:8
id: "@demo/hello"
version: 1.0.0
layer: 5
---

### @block::sayHello @kind:function
Say hello to someone.

**Parameters:**
- name: string
SPEC

# 3. Watch the cascade happen automatically
# (Daemon detects, agent processes, code appears)

# 4. Verify
ls src/hello/          # Should see generated files
npm run build          # Should compile
```

### Expected Output

```
[speclangd] Watching specs/ for changes...
[speclangd] Change detected: specs/hello.spec.md
[speclangd] Agent processing...
[speclangd] ✅ Generated: src/hello/sayHello.ts
[speclangd] Convergence detected (2.3s)
```

## Success Criteria

✅ **Demo Completes Successfully**
```
Given: User creates specs/hello.spec.md
When: They save the file
Then: Within 5 seconds:
  - Code appears in specs/hello.spec.dir/src/
  - Symlink exists at src/hello
  - npm run build succeeds
  - Can import and use generated code
```

## What This Demonstrates

1. ✅ **Specs are source of truth** - Code generated from specs
2. ✅ **Reactive cascade** - Change triggers automatic generation
3. ✅ **Dual-view pattern** - Specs in specs/, code in src/ via symlinks
4. ✅ **Build integration** - Generated code compiles
5. ✅ **Fast feedback loop** - < 5 seconds from edit to working code

## Next Steps After Demo

- Add more blocks to the spec
- Edit the spec and watch regeneration
- Add validation (MVP phase)
- Add multi-agent coordination (MVP phase)
