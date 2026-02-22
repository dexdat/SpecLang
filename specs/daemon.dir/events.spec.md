# speclang-header lines:14
id: "@speclang/daemon/events"
parent: "@ref:specs/daemon"
part: 2/4
siblings:
  prev: "@ref:specs/daemon.dir/architecture"
  next: "@ref:specs/daemon.dir/routing"
short: File watching and event handling
project_level: Alpha
agent_support: agent_assisted
tags: [daemon, watcher, events, rust]
version: 0.1.0
layer: 2
---
# Daemon Events & Watcher

File system watching and event generation for speclangd.

## Watcher

### @daemon/watcher

```speclang
# @block:daemon/watcher @kind:entity
Watcher:
  library: notify crate (Rust)
  
  patterns:
    # Primary spec patterns
    - "**/*.spec.{md,yaml,yml,scl}"      # e.g., auth.spec.yaml, auth.spec.md
    - "**/*.{go,ts,js,py,rs,java}.spec"  # e.g., auth.go.spec, auth.ts.spec
    - "**/project.scl"                    # North Star
    - "**/build.scl"                      # Build config
    - "**/build.yaml"                     # Pipeline config
    
  # Ignore patterns (respect .gitignore)
  ignore:
    - Uses: .gitignore rules
    - Plus: [".speclang/", "*.log", "reports/"]
    - System generated never triggers
    
  gitignore_support:
    - Read .gitignore from project root
    - Support negation: !path/to/spec
    - Cache patterns for performance
    - Watch .gitignore for changes
  
  events:
    - Create: new file
    - Modify: content changed  
    - Delete: file removed
    - Rename: file moved
  
  debounce: 100ms (batch rapid changes)
```

### @daemon/watcher-impl

```speclang
# @block:daemon/watcher-impl @kind:code
```rust
use notify::{Watcher, RecursiveMode, watcher};
use std::sync::mpsc::channel;
use glob::Pattern;

pub struct FileWatcher {
    watcher: RecommendedWatcher,
    gitignore: Gitignore,
    spec_patterns: Vec<Pattern>,
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
```
