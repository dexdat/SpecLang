# Bootstrap Phase 1.6: Daemon Events & Watcher

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.6 of the bootstrap process.

**Prerequisites**: Phase 1.1 (Daemon Core) complete.

## Your Task
Implement file system watching and event generation for speclangd.

## Read These Specs First
1. `specs/daemon.spec.dir/events.spec.md` - File watching and events

## Watcher Configuration

### Watch Patterns
```rust
const WATCH_PATTERNS: &[&str] = &[
    "**/*.spec.{md,yaml,yml,scl}",      // auth.spec.yaml, auth.spec.md
    "**/*.{go,ts,js,py,rs,java}.spec",  // auth.go.spec, auth.ts.spec
    "**/project.scl",                    // North Star
    "**/build.scl",                      // Build config
    "**/build.yaml",                     // Pipeline config
];
```

### Ignore Patterns
```rust
// Respect .gitignore plus additional ignores
const EXTRA_IGNORES: &[&str] = &[
    ".speclang/",
    "*.log",
    "reports/",
];
```

### Event Types
```rust
pub enum FileEvent {
    Create { path: PathBuf },
    Modify { path: PathBuf },
    Delete { path: PathBuf },
    Rename { from: PathBuf, to: PathBuf },
}
```

## Implementation

### 1. File Watcher (`daemon/watcher.rs`)
```rust
use notify::{Watcher, RecommendedWatcher, RecursiveMode, Event};
use std::sync::mpsc::channel;
use std::time::Duration;
use glob::Pattern;

pub struct FileWatcher {
    watcher: RecommendedWatcher,
    gitignore: Gitignore,
    spec_patterns: Vec<Pattern>,
    last_event: Instant,
}

impl FileWatcher {
    pub fn new() -> Self {
        let spec_patterns = vec![
            Pattern::new("**/*.spec.{md,yaml,yml,scl}").unwrap(),
            Pattern::new("**/*.{go,ts,js,py,rs,java}.spec").unwrap(),
            Pattern::new("**/project.scl").unwrap(),
            Pattern::new("**/build.{scl,yaml}").unwrap(),
        ];
        
        let gitignore = Gitignore::from_file(".gitignore")
            .unwrap_or_default()
            .add(".speclang/")
            .add("*.log")
            .add("reports/");
            
        FileWatcher {
            watcher: watcher(tx, Duration::from_millis(100)).unwrap(),
            gitignore,
            spec_patterns,
            last_event: Instant::now(),
        }
    }
    
    pub fn should_watch(&self, path: &Path) -> bool {
        // Check gitignore first
        if self.gitignore.is_ignored(path) {
            return false;
        }
        
        // Check if matches spec patterns
        let path_str = path.to_string_lossy();
        self.spec_patterns.iter().any(|p| p.matches(&path_str))
    }
    
    pub fn handle_event(&self, event: Event) -> Option<SpecEvent> {
        let path = event.paths.first()?;
        
        if !self.should_watch(path) {
            return None; // Silently ignore
        }
        
        Some(SpecEvent {
            kind: event.kind,
            path: path.clone(),
            timestamp: Instant::now(),
        })
    }
}
```

### 2. Gitignore Support (`daemon/gitignore.rs`)
```rust
pub struct Gitignore {
    patterns: Vec<Pattern>,
    negations: Vec<Pattern>,
}

impl Gitignore {
    pub fn from_file(path: &Path) -> Result<Self> {
        // Read .gitignore from project root
        // Support negation: !path/to/spec
        // Cache patterns for performance
    }
    
    pub fn is_ignored(&self, path: &Path) -> bool {
        // Check against patterns
        // Respect negation rules
    }
    
    pub fn watch_gitignore(&self) {
        // Watch .gitignore for changes
        // Reload patterns on modification
    }
}
```

### 3. Event Debouncing
```rust
pub struct DebouncedWatcher {
    inner: FileWatcher,
    pending: HashMap<PathBuf, Instant>,
    debounce_ms: u64,  // default 100ms
}

impl DebouncedWatcher {
    pub fn poll(&mut self) -> Vec<SpecEvent> {
        // Batch rapid changes
        // Only emit after debounce period
    }
}
```

### 4. Spec Event Type
```rust
pub struct SpecEvent {
    pub kind: EventKind,
    pub path: PathBuf,
    pub timestamp: Instant,
}

pub enum EventKind {
    Created,
    Modified,
    Deleted,
    Renamed { from: PathBuf, to: PathBuf },
}
```

## Event Flow

```
File Change
    ↓
FileWatcher.handle_event()
    ↓ (filter by patterns)
    ↓ (check gitignore)
    ↓
DebouncedWatcher.poll()
    ↓ (batch rapid changes)
    ↓
SpecEvent emitted
    ↓
Router receives event
```

## Configuration

```yaml
watcher:
  patterns:
    - "**/*.spec.{md,yaml,yml,scl}"
    - "**/*.{go,ts,js,py,rs,java}.spec"
    - "**/project.scl"
    - "**/build.{scl,yaml}"
  ignore:
    - Uses: ".gitignore"
    - Plus: [".speclang/", "*.log", "reports/"]
  debounce: 100
```

## Dependencies
```toml
[dependencies]
notify = "6.0"           # File watching
glob = "0.3"             # Pattern matching
```

## Test Cases
1. Detect file creation matching watch patterns
2. Detect file modification
3. Detect file deletion
4. Detect file rename
5. Ignore files in .gitignore
6. Ignore files in extra ignore list
7. Debounce rapid changes (100ms)
8. Handle .gitignore changes at runtime
9. Ignore system-generated files

## Output
1. FileWatcher implementation
2. Gitignore parser and matcher
3. DebouncedWatcher for batching
4. SpecEvent types
5. Integration tests for all event types
