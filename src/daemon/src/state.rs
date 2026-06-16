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
