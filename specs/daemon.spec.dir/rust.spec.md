# speclang-header lines:15
id: "@speclang/daemon/rust"
parent: "@ref:specs/daemon"
part: 5/5
siblings:
  prev: "@ref:specs/daemon.spec.dir/convergence"
short: Rust implementation of speclangd daemon
project_level: Alpha
agent_support: agent_autonomous
tags: [daemon, rust, implementation, code]
version: 0.1.0
layer: 5
target: src/daemon/
---
# Rust Daemon Implementation

Rust implementation of speclangd daemon for enterprise mode.

## Cargo.toml

### @block::cargo-toml @kind:code
```toml
[package]
name = "speclangd"
version = "0.1.0"
edition = "2021"
description = "Reactive file watcher daemon for SpecLang cascade"
license = "MIT"
repository = "https://github.com/speclang/speclang"

[dependencies]
notify = "6.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
tracing = "0.1"
tracing-subscriber = "0.3"
chrono = { version = "0.4", features = ["serde"] }
anyhow = "1.0"
thiserror = "1.0"

[dev-dependencies]
tempfile = "3.0"
assert_fs = "1.0"
```

## Main Entry Point

### @block::main-rs @kind:code
```rust
use anyhow::Result;
use tracing::{info, error};
use tracing_subscriber;

mod config;
mod watcher;
mod router;
mod convergence;
mod ipc;
mod state;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();
    
    info!("Starting speclangd v{}", env!("CARGO_PKG_VERSION"));
    
    let config = config::load()?;
    info!("Loaded configuration: {:?}", config);
    
    let (tx, rx) = tokio::sync::mpsc::channel(100);
    
    let watcher = watcher::Watcher::new(&config.watch, tx.clone())?;
    let router = router::Router::new(&config.routing);
    let convergence = convergence::ConvergenceDetector::new(config.convergence.quiet_period);
    let state = state::DaemonState::new();
    
    info!("Daemon initialized, watching {}", config.watch.paths.join(", "));
    
    tokio::select! {
        _ = watcher.run() => error!("Watcher stopped unexpectedly"),
        _ = router.run(rx) => error!("Router stopped unexpectedly"),
        _ = convergence.run() => info!("Convergence detected"),
    }
    
    Ok(())
}
```

## Watcher Module

### @block::watcher-rs @kind:code
```rust
use std::path::{Path, PathBuf};
use std::time::Duration;
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher as NotifyWatcher};
use tokio::sync::mpsc::Sender;
use thiserror::Error;

use crate::config::WatchConfig;

#[derive(Debug, Error)]
pub enum WatcherError {
    #[error("Failed to initialize watcher: {0}")]
    InitError(String),
    #[error("Failed to watch path {0}: {1}")]
    WatchError(PathBuf, String),
}

pub struct Watcher {
    config: WatchConfig,
    event_tx: Sender<FileEvent>,
}

#[derive(Debug, Clone)]
pub enum FileEvent {
    Create(PathBuf),
    Modify(PathBuf),
    Delete(PathBuf),
    Rename(PathBuf, PathBuf),
}

impl Watcher {
    pub fn new(config: &WatchConfig, event_tx: Sender<FileEvent>) -> Result<Self, WatcherError> {
        Ok(Watcher {
            config: config.clone(),
            event_tx,
        })
    }
    
    pub async fn run(&self) -> Result<(), WatcherError> {
        let (tx, rx) = std::sync::mpsc::channel();
        let mut watcher: RecommendedWatcher = RecommendedWatcher::new(
            move |res: notify::Result<Event>| {
                if let Ok(event) = res {
                    let _ = tx.send(event);
                }
            },
            notify::Config::default(),
        ).map_err(|e| WatcherError::InitError(e.to_string()))?;
        
        for path in &self.config.paths {
            watcher.watch(Path::new(path), RecursiveMode::Recursive)
                .map_err(|e| WatcherError::WatchError(path.clone(), e.to_string()))?;
        }
        
        info!("Watching {} paths", self.config.paths.len());
        
        for event in rx {
            self.process_event(event)?;
        }
        
        Ok(())
    }
    
    fn process_event(&self, event: Event) -> Result<(), WatcherError> {
        match event.kind {
            EventKind::Create(_) => {
                for path in event.paths {
                    let _ = self.event_tx.blocking_send(FileEvent::Create(path));
                }
            }
            EventKind::Modify(_) => {
                for path in event.paths {
                    let _ = self.event_tx.blocking_send(FileEvent::Modify(path));
                }
            }
            EventKind::Remove(_) => {
                for path in event.paths {
                    let _ = self.event_tx.blocking_send(FileEvent::Delete(path));
                }
            }
            EventKind::Rename(_, _) => {
                // notify provides old and new paths
                if event.paths.len() >= 2 {
                    let old_path = event.paths[0].clone();
                    let new_path = event.paths[1].clone();
                    let _ = self.event_tx.blocking_send(FileEvent::Rename(old_path, new_path));
                }
            }
            _ => {}
        }
        Ok(())
    }
}
```

## Configuration Module

### @block::config-rs @kind:code
```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DaemonConfig {
    pub watch: WatchConfig,
    pub routing: RoutingConfig,
    pub convergence: ConvergenceConfig,
    pub logging: LoggingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchConfig {
    pub paths: Vec<PathBuf>,
    pub ignore_patterns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingConfig {
    pub max_depth: u32,
    pub agent_timeout: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvergenceConfig {
    pub quiet_period: Duration,
    pub max_depth: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub file: Option<PathBuf>,
}

pub fn load() -> anyhow::Result<DaemonConfig> {
    let config_path = PathBuf::from(".speclangrc");
    if config_path.exists() {
        let content = std::fs::read_to_string(config_path)?;
        let config: DaemonConfig = serde_yaml::from_str(&content)?;
        Ok(config)
    } else {
        Ok(default_config())
    }
}

fn default_config() -> DaemonConfig {
    DaemonConfig {
        watch: WatchConfig {
            paths: vec![PathBuf::from("specs/")],
            ignore_patterns: vec![
                ".git/".to_string(),
                "node_modules/".to_string(),
                "generated/".to_string(),
                ".speclang/".to_string(),
                "*.log".to_string(),
            ],
        },
        routing: RoutingConfig {
            max_depth: 100,
            agent_timeout: Duration::from_secs(30),
        },
        convergence: ConvergenceConfig {
            quiet_period: Duration::from_secs(30),
            max_depth: 100,
        },
        logging: LoggingConfig {
            level: "info".to_string(),
            file: Some(PathBuf::from(".speclang/daemon.log")),
        },
    }
}
```

## Event Router Module

### @block::router-rs @kind:code
```rust
use tokio::sync::mpsc::Receiver;
use crate::FileEvent;

pub struct Router {
    max_depth: u32,
}

impl Router {
    pub fn new(config: &crate::config::RoutingConfig) -> Self {
        Router {
            max_depth: config.max_depth,
        }
    }
    
    pub async fn run(&self, mut rx: Receiver<FileEvent>) {
        while let Some(event) = rx.recv().await {
            self.route_event(event).await;
        }
    }
    
    async fn route_event(&self, event: FileEvent) {
        // TODO: Implement routing logic based on file path and cascade depth
        tracing::debug!("Routing event: {:?}", event);
    }
}
```

## Convergence Detection Module

### @block::convergence-rs @kind:code
```rust
use std::time::{Duration, Instant};
use tokio::time;

pub struct ConvergenceDetector {
    last_event: Instant,
    quiet_period: Duration,
}

impl ConvergenceDetector {
    pub fn new(quiet_period: Duration) -> Self {
        ConvergenceDetector {
            last_event: Instant::now(),
            quiet_period,
        }
    }
    
    pub fn on_event(&mut self) {
        self.last_event = Instant::now();
    }
    
    pub fn is_converged(&self) -> bool {
        self.last_event.elapsed() >= self.quiet_period
    }
    
    pub fn time_remaining(&self) -> Option<Duration> {
        let elapsed = self.last_event.elapsed();
        if elapsed < self.quiet_period {
            Some(self.quiet_period - elapsed)
        } else {
            None
        }
    }
    
    pub async fn run(&self) {
        loop {
            if self.is_converged() {
                tracing::info!("Convergence detected after {:?} quiet period", self.quiet_period);
                // TODO: Trigger pipeline execution
                break;
            }
            time::sleep(Duration::from_secs(1)).await;
        }
    }
}
```

## IPC Module

### @block::ipc-rs @kind:code
```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub enum DaemonCommand {
    Status,
    Pause,
    Resume,
    Abort,
    Trigger { path: PathBuf },
}

#[derive(Debug, Serialize, Deserialize)]
pub enum DaemonStatus {
    Idle,
    Cascading { depth: u32, files_changed: u32 },
    Converged,
    Paused,
    Error { message: String },
}

pub struct IpcServer;

impl IpcServer {
    pub async fn run() -> anyhow::Result<()> {
        // TODO: Implement Unix socket or named pipe server
        Ok(())
    }
}
```

## State Module

### @block::state-rs @kind:code
```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct DaemonState {
    pub cascade_depth: u32,
    pub files_changed: Vec<PathBuf>,
    pub active_agents: Vec<String>,
    pub started_at: DateTime<Utc>,
}

impl DaemonState {
    pub fn new() -> Self {
        DaemonState {
            cascade_depth: 0,
            files_changed: Vec::new(),
            active_agents: Vec::new(),
            started_at: Utc::now(),
        }
    }
    
    pub fn save(&self) -> anyhow::Result<()> {
        let state_path = PathBuf::from(".speclang/daemon-state.json");
        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(state_path, content)?;
        Ok(())
    }
    
    pub fn load() -> anyhow::Result<Self> {
        let state_path = PathBuf::from(".speclang/daemon-state.json");
        if state_path.exists() {
            let content = std::fs::read_to_string(state_path)?;
            let state: DaemonState = serde_json::from_str(&content)?;
            Ok(state)
        } else {
            Ok(DaemonState::new())
        }
    }
}
```