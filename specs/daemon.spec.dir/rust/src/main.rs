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

    let mut config = config::load()?;

    // Override watch path from CLI arg for integration testing
    let args: Vec<String> = std::env::args().collect();
    if args.len() >= 3 && args[1] == "--watch" {
        config.watch.paths = vec![std::path::PathBuf::from(&args[2])];
    }

    info!("Loaded configuration: {:?}", config);

    let (tx, rx) = tokio::sync::mpsc::channel(100);

    let watcher = watcher::Watcher::new(&config.watch, tx.clone())?;
    let router = router::Router::new(&config.routing);
    let convergence = convergence::ConvergenceDetector::new(config.convergence.quiet_period);
    let state = state::DaemonState::new();

    info!("Daemon initialized, watching {}", config.watch.paths.iter().map(|p| p.display().to_string()).collect::<Vec<_>>().join(", "));

    // Main work loop wrapped with signal handling for graceful shutdown
    let main_loop = async {
        tokio::select! {
            _ = watcher.run() => error!("Watcher stopped unexpectedly"),
            _ = router.run(rx) => error!("Router stopped unexpectedly"),
            _ = convergence.run() => info!("Convergence detected"),
        }
    };

    tokio::select! {
        _ = main_loop => {},
        _ = tokio::signal::ctrl_c() => {
            info!("Received SIGINT, shutting down gracefully");
        }
        _ = async {
            #[cfg(unix)]
            {
                let mut sigterm = tokio::signal::unix::signal(
                    tokio::signal::unix::SignalKind::terminate()
                ).expect("Failed to install SIGTERM handler");
                sigterm.recv().await;
            }
            #[cfg(not(unix))]
            std::future::pending::<()>().await;
        } => {
            info!("Received SIGTERM, shutting down gracefully");
        }
    }

    // Graceful shutdown: close channel, save state, exit cleanly
    drop(tx);
    state.save().unwrap_or_else(|e| error!("Failed to save daemon state: {}", e));
    info!("speclangd shut down cleanly");
    Ok(())
}
