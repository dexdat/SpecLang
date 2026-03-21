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
