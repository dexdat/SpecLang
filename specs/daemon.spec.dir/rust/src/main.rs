use anyhow::Result;
use tracing::{info, error};
use tracing_subscriber;

mod config;
mod watcher;
mod router;
mod convergence;
mod ipc;
mod state;

pub use watcher::FileEvent;

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
