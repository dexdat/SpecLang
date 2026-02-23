# Bootstrap Phase 1.1: speclangd Daemon (Rust)

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.1 of the bootstrap process.

**Prerequisites**: Phase 0 (Foundation) complete.

## Your Task
Design and begin implementing `speclangd` - the reactive file watcher daemon that powers the cascade. This is the heart of SpecLang.

## Read These Specs First
1. `specs/daemon.spec.md` - Overview
2. `specs/daemon.spec.dir/architecture.spec.md` - Architecture
3. `specs/daemon.spec.dir/events.spec.md` - File watching
4. `specs/daemon.spec.dir/routing.spec.md` - Event routing
5. `specs/daemon.spec.dir/convergence.spec.md` - Convergence detection

## What to Build

### Project Structure
```
src/daemon/
├── Cargo.toml
├── Cargo.lock
└── src/
    ├── main.rs           # Entry point
    ├── config.rs         # Configuration
    ├── watcher.rs        # File watching (inotify)
    ├── router.rs         # Event routing
    ├── convergence.rs    # Quiet detection
    ├── ipc.rs            # Inter-process communication
    └── state.rs          # Daemon state

tests/daemon/
├── integration_test.rs
└── fixtures/
    └── test-project/
```

### Requirements

#### 1. File Watching (watcher.rs)
```rust
struct Watcher {
    // Watch specs/ directory recursively
    // Use inotify on Linux, FSEvents on macOS
    // Emit FileEvent on any change
}

enum FileEvent {
    Create(PathBuf),
    Modify(PathBuf),
    Delete(PathBuf),
    Rename(PathBuf, PathBuf),
}
```

#### 2. Event Filtering (from specs)
```rust
// Only watch these patterns
WATCH_PATTERNS: [
    "**/*.spec.{md,yaml,yml,scl}",
    "**/*.{go,ts,js,py,rs,java}.spec",
    "**/project.scl",
    "**/build.{scl,yaml}",
]

// Ignore these (respect .gitignore)
IGNORE_PATTERNS: [
    ".git/",
    "node_modules/",
    "generated/",
    ".speclang/",
    "*.log",
]
```

#### 3. Event Router (router.rs)
```rust
struct Router {
    // Map file changes to responsible agents
    // Track cascade depth
    // Emit AgentTask events
}

enum AgentTask {
    SpecWriter { trigger: PathBuf },
    CodeGen { spec: PathBuf, target: String },
    TestWriter { code: PathBuf },
    BackSync { generated: PathBuf },
}
```

#### 4. Convergence Detection (convergence.rs)
```rust
struct ConvergenceDetector {
    last_event: Instant,
    quiet_period: Duration,  // default 30s
}

impl ConvergenceDetector {
    // Reset timer on each event
    fn on_event(&mut self);
    
    // Check if quiet long enough
    fn is_converged(&self) -> bool;
    
    // Time until convergence
    fn time_remaining(&self) -> Option<Duration>;
}
```

#### 5. IPC Interface (ipc.rs)
```rust
// Unix socket or named pipe for control
enum DaemonCommand {
    Status,
    Pause,
    Resume,
    Abort,
    Trigger { path: PathBuf },
}

enum DaemonStatus {
    Idle,
    Cascading { depth: u32, files_changed: u32 },
    Converged,
    Paused,
    Error { message: String },
}
```

#### 6. State Persistence (state.rs)
```rust
struct DaemonState {
    cascade_depth: u32,
    files_changed: Vec<PathBuf>,
    active_agents: Vec<AgentId>,
    started_at: DateTime,
}

// Persist to .speclang/daemon-state.json
// Resume after crash
```

### CLI Interface
```bash
# Start daemon in foreground
speclangd

# Start daemon in background
speclangd --daemon

# Check status
speclangd status

# Control cascade
speclangd pause
speclangd resume
speclangd abort

# Manual trigger
speclangd trigger specs/auth.spec.md
```

### Configuration (.speclangrc)
```yaml
watch:
  paths: [specs/]
  ignore: [.gitignore]
  
convergence:
  quiet_period: 30s
  max_depth: 100
  
logging:
  level: info
  file: .speclang/daemon.log
```

## Rust Dependencies
```toml
[dependencies]
notify = "6.0"           # File watching
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
tracing = "0.1"
tracing-subscriber = "0.3"
chrono = { version = "0.4", features = ["serde"] }
```

## Test Cases
1. Detect file creation in specs/
2. Detect file modification
3. Detect file deletion
4. Respect .gitignore patterns
5. Detect convergence after quiet period
6. Resume cascade on new event during quiet
7. Persist state across restart

## Output Format
After design, output:
1. Cargo.toml with dependencies
2. Module structure
3. Key type definitions
4. Integration test plan

Note: Full implementation may span multiple sessions. Start with the design and core watcher.
