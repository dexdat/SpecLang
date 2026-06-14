use std::io::Read;
use std::process::{Command, Stdio};
use std::time::Duration;

#[test]
fn test_daemon_runs_and_logs_startup_with_watch_dir() {
    let dir = tempfile::tempdir().expect("failed to create temp dir");
    let dir_path = dir.path().to_path_buf();

    // Spawn in background — daemon stays running when watching a real dir
    let mut child = Command::new(env!("CARGO_BIN_EXE_speclangd"))
        .arg("--watch")
        .arg(&dir_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("failed to spawn daemon");

    // Give it time to start and write the log line
    std::thread::sleep(Duration::from_secs(2));

    // Kill and wait
    let _ = child.kill();
    let _ = child.wait();

    // Now read all available output
    let mut stderr_output = String::new();
    let mut stdout_output = String::new();
    if let Some(ref mut stderr) = child.stderr {
        let _ = stderr.read_to_string(&mut stderr_output);
    }
    if let Some(ref mut stdout) = child.stdout {
        let _ = stdout.read_to_string(&mut stdout_output);
    }

    let combined = format!("{}{}", stdout_output, stderr_output);

    assert!(
        combined.contains("Starting speclangd"),
        "Daemon should log startup. Output:\n{}",
        combined
    );

    let path_str = dir_path.to_string_lossy();
    assert!(
        combined.contains(&*path_str),
        "Daemon should log the watch path '{}'. Output:\n{}",
        path_str,
        combined
    );
}

#[test]
fn test_daemon_default_config_starts() {
    // Start without --watch — watcher fails when specs/ doesn't exist,
    // so the daemon exits quickly and output() captures everything
    let output = Command::new(env!("CARGO_BIN_EXE_speclangd"))
        .output()
        .expect("failed to run daemon");

    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    let combined = format!("{}{}", stdout, stderr);

    assert!(
        combined.contains("Starting speclangd"),
        "Daemon should log startup. Output:\n{}",
        combined
    );
}
