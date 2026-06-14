use std::path::{Path, PathBuf};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher as NotifyWatcher};
use tokio::sync::mpsc::Sender;
use thiserror::Error;
use tracing::info;

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
                    info!("FileEvent::Create {:?}", path);
                    let _ = self.event_tx.blocking_send(FileEvent::Create(path));
                }
            }
            EventKind::Modify(_) => {
                for path in event.paths {
                    info!("FileEvent::Modify {:?}", path);
                    let _ = self.event_tx.blocking_send(FileEvent::Modify(path));
                }
            }
            EventKind::Remove(_) => {
                for path in event.paths {
                    info!("FileEvent::Delete {:?}", path);
                    let _ = self.event_tx.blocking_send(FileEvent::Delete(path));
                }
            }
            EventKind::Any => {
                // Handle rename events by checking path count (notify v6 merged Rename into Any)
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

#[cfg(test)]
mod tests {
    use std::path::PathBuf;
    use super::FileEvent;

    #[test]
    fn test_file_event_debug() {
        let event = FileEvent::Create(PathBuf::from("/tmp/test.txt"));
        assert!(format!("{:?}", event).contains("Create"));
    }

    #[test]
    fn test_file_event_clone() {
        let event = FileEvent::Delete(PathBuf::from("/tmp/old.txt"));
        let cloned = event.clone();
        assert!(matches!(cloned, FileEvent::Delete(_)));
    }

    #[test]
    fn test_file_event_variants() {
        let create = FileEvent::Create(PathBuf::from("a"));
        let modify = FileEvent::Modify(PathBuf::from("b"));
        let delete = FileEvent::Delete(PathBuf::from("c"));
        let rename = FileEvent::Rename(PathBuf::from("d"), PathBuf::from("e"));

        assert!(matches!(create, FileEvent::Create(_)));
        assert!(matches!(modify, FileEvent::Modify(_)));
        assert!(matches!(delete, FileEvent::Delete(_)));
        assert!(matches!(rename, FileEvent::Rename(_, _)));
    }
}
