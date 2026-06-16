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
