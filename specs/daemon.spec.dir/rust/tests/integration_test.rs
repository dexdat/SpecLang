use std::fs;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

// ============================================================
// Test harness — spawns the daemon and collects its stderr logs
// ============================================================

fn daemon_binary() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_speclangd"))
}

struct DaemonHarness {
    child: Child,
    logs: Arc<Mutex<Vec<String>>>,
    _reader: thread::JoinHandle<()>,
}

impl DaemonHarness {
    fn start(dir: &tempfile::TempDir) -> Self {
        let mut child = Command::new(daemon_binary())
            .arg("--watch")
            .arg(dir.path())
            .stderr(Stdio::piped())
            .stdout(Stdio::null())
            .spawn()
            .expect("failed to spawn speclangd");

        let stderr = child.stderr.take().expect("stderr captured");
        let logs = Arc::new(Mutex::new(Vec::new()));
        let capture = Arc::clone(&logs);

        let reader = thread::spawn(move || {
            for line in BufReader::new(stderr).lines() {
                if let Ok(line) = line {
                    capture.lock().unwrap().push(line);
                }
            }
        });

        DaemonHarness { child, logs, _reader: reader }
    }

    fn snapshot(&self) -> Vec<String> {
        self.logs.lock().unwrap().clone()
    }

    fn wait_for_log(&self, needle: &str, timeout: Duration) -> bool {
        let start = Instant::now();
        while start.elapsed() < timeout {
            if self.logs.lock().unwrap().iter().any(|l| l.contains(needle)) {
                return true;
            }
            thread::sleep(Duration::from_millis(50));
        }
        false
    }

    fn send_sigterm(&self) {
        let pid = self.child.id();
        let status = Command::new("kill")
            .arg("-TERM")
            .arg(pid.to_string())
            .status()
            .expect("failed to run kill");
        assert!(status.success(), "kill -TERM must succeed");
    }

    /// Send SIGTERM and wait for the daemon to exit.
    fn shutdown(&mut self) {
        self.send_sigterm();
        self.child.wait().expect("wait for daemon");
        thread::sleep(Duration::from_millis(200));
    }
}

impl Drop for DaemonHarness {
    fn drop(&mut self) {
        // Safety net: kill (SIGKILL) if the test panicked before shutdown()
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

// ============================================================
// Tests
// ============================================================

#[test]
fn test_daemon_runs_and_logs_startup_with_watch_dir() {
    let dir = tempfile::tempdir().expect("tempdir");
    let mut daemon = DaemonHarness::start(&dir);

    assert!(
        daemon.wait_for_log("Starting speclangd", Duration::from_secs(10)),
        "Daemon should log startup. Logs:\n{}",
        daemon.snapshot().join("\n")
    );

    let path_str = dir.path().to_string_lossy();
    assert!(
        daemon.wait_for_log(&path_str, Duration::from_secs(2)),
        "Daemon should log the watch path. Logs:\n{}",
        daemon.snapshot().join("\n")
    );

    daemon.shutdown();
    let final_logs = daemon.snapshot();

    assert!(
        final_logs.iter().any(|l| l.contains("shut down cleanly")),
        "Daemon should log clean shutdown after SIGTERM. Logs:\n{}",
        final_logs.join("\n")
    );
    assert!(
        !final_logs.iter().any(|l| l.contains("panic")),
        "Daemon should not panic. Logs:\n{}",
        final_logs.join("\n")
    );
}

#[test]
fn test_daemon_detects_file_events_and_shuts_down_cleanly() {
    let dir = tempfile::tempdir().expect("tempdir");
    let mut daemon = DaemonHarness::start(&dir);

    assert!(
        daemon.wait_for_log("Starting speclangd", Duration::from_secs(10)),
        "Daemon should start"
    );

    // Touch a new file (triggers FileEvent::Create)
    fs::write(dir.path().join("test.spec.md"), b"id: test\n---\n").unwrap();
    assert!(
        daemon.wait_for_log("FileEvent::Create", Duration::from_secs(5)),
        "Daemon should log FileEvent::Create after file creation. Logs:\n{}",
        daemon.snapshot().join("\n")
    );

    // Modify the file (triggers FileEvent::Modify)
    fs::write(dir.path().join("test.spec.md"), b"id: test\n---\n# Modified\n").unwrap();
    assert!(
        daemon.wait_for_log("FileEvent::Modify", Duration::from_secs(5)),
        "Daemon should log FileEvent::Modify after file modification. Logs:\n{}",
        daemon.snapshot().join("\n")
    );

    // Clean shutdown with SIGTERM
    daemon.shutdown();
    let final_logs = daemon.snapshot();

    assert!(
        final_logs.iter().any(|l| l.contains("shut down cleanly")),
        "Daemon should log clean shutdown. Logs:\n{}",
        final_logs.join("\n")
    );
    assert!(
        !final_logs.iter().any(|l| l.contains("panic")),
        "Daemon should not panic. Logs:\n{}",
        final_logs.join("\n")
    );
}

#[test]
fn test_daemon_default_config_starts() {
    // Without --watch the default config watches "specs/" (relative to CWD).
    // When that dir does not exist the watcher fails immediately and the
    // daemon exits after logging its startup banner.
    let output = Command::new(daemon_binary())
        .output()
        .expect("failed to run daemon");
    let combined = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr),
    );
    assert!(
        combined.contains("Starting speclangd"),
        "Daemon should log startup. Output:\n{}",
        combined,
    );
}
