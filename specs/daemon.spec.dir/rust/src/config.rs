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
