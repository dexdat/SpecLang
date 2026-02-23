# speclang-header lines:3
# target: src/ralph_loop.py
#!/usr/bin/env python3
"""
Ralph Loop for SpecLang
Runs builder and verify loops alternately until all tasks complete.
"""

import argparse
import logging
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Callable
import json


# Configuration
MAX_AGENT_TIME = 7200  # 2 hours
MAX_FAILED_ATTEMPTS = 3
SLEEP_BETWEEN_ITERATIONS = 2


# Paths
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR
RALPH_DIR = PROJECT_ROOT / ".ralph"
TODO_FILE = PROJECT_ROOT / "TODO.md"
LOOP_STATE = RALPH_DIR / "loop-state.json"
LOGS_DIR = RALPH_DIR / "logs"


# ANSI Colors
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'


@dataclass
class LoopState:
    iteration: int = 0
    phase: str = "idle"
    last_task: Optional[str] = None
    completed_tasks: List[str] = field(default_factory=list)
    failed_attempts: int = 0
    started_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
    def to_dict(self) -> Dict:
        return {
            "iteration": self.iteration,
            "phase": self.phase,
            "last_task": self.last_task,
            "completed_tasks": self.completed_tasks,
            "failed_attempts": self.failed_attempts,
            "started_at": self.started_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "LoopState":
        return cls(
            iteration=data.get("iteration", 0),
            phase=data.get("phase", "idle"),
            last_task=data.get("last_task"),
            completed_tasks=data.get("completed_tasks", []),
            failed_attempts=data.get("failed_attempts", 0),
            started_at=data.get("started_at", datetime.now(timezone.utc).isoformat())
        )


class RalphLogger:
    def __init__(self, name: str = "ralph"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        self.logger.handlers = []
    
    def info(self, msg: str):
        print(f"{Colors.BLUE}[RALPH]{Colors.NC} {msg}")
        self.logger.info(msg)
    
    def success(self, msg: str):
        print(f"{Colors.GREEN}[RALPH]{Colors.NC} {msg}")
        self.logger.info(f"SUCCESS: {msg}")
    
    def warning(self, msg: str):
        print(f"{Colors.YELLOW}[RALPH]{Colors.NC} {msg}")
        self.logger.warning(msg)
    
    def error(self, msg: str):
        print(f"{Colors.RED}[RALPH]{Colors.NC} {msg}")
        self.logger.error(msg)
    
    def phase(self, msg: str):
        print(f"{Colors.CYAN}[RALPH]{Colors.NC} {msg}")
        self.logger.info(f"PHASE: {msg}")


class StateManager:
    def __init__(self, state_file: Path):
        self.state_file = state_file
        self.state = LoopState()
        self._load()
    
    def _load(self):
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
                    self.state = LoopState.from_dict(data)
            except Exception as e:
                print(f"Warning: Could not load state: {e}")
                self.state = LoopState()
    
    def save(self):
        try:
            with open(self.state_file, 'w') as f:
                json.dump(self.state.to_dict(), f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save state: {e}")
    
    def increment_iteration(self) -> int:
        self.state.iteration += 1
        self.save()
        return self.state.iteration
    
    def set_phase(self, phase: str):
        self.state.phase = phase
        self.save()
    
    def record_failure(self) -> int:
        self.state.failed_attempts += 1
        self.save()
        return self.state.failed_attempts
    
    def reset_failures(self):
        self.state.failed_attempts = 0
        self.save()
    
    def reset(self):
        self.state = LoopState()
        self.save()


class TaskManager:
    def __init__(self, todo_file: Path):
        self.todo_file = todo_file
    
    def has_pending_tasks(self) -> bool:
        if not self.todo_file.exists():
            return False
        content = self.todo_file.read_text()
        return bool(re.search(r'^- \[ \]', content, re.MULTILINE))
    
    def count_pending(self) -> int:
        if not self.todo_file.exists():
            return 0
        content = self.todo_file.read_text()
        return len(re.findall(r'^- \[ \]', content, re.MULTILINE))
    
    def get_next_task(self) -> Optional[str]:
        if not self.todo_file.exists():
            return None
        content = self.todo_file.read_text()
        match = re.search(r'^- \[ \] (.+)$', content, re.MULTILINE)
        return match.group(1) if match else None


class LogManager:
    def __init__(self, logs_dir: Path):
        self.logs_dir = logs_dir
        self.logs_dir.mkdir(parents=True, exist_ok=True)
    
    def get_log_file(self, phase: str) -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return self.logs_dir / f"{phase}_{timestamp}.log"
    
    def list_logs(self, count: int = 10) -> List[Path]:
        if not self.logs_dir.exists():
            return []
        logs = sorted(
            [f for f in self.logs_dir.glob("*.log")],
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )
        return logs[:count]
    
    def clean_old_logs(self, keep: int = 100):
        logs = self.list_logs(10000)
        if len(logs) > keep:
            for log in logs[keep:]:
                log.unlink()


class PhaseRunner:
    def __init__(
        self,
        logger: RalphLogger,
        log_manager: LogManager,
        max_agent_time: int = MAX_AGENT_TIME,
        builder_agent: str = "speclang-simulator",
        verifier_agent: str = "speclang-simulator-verify"
    ):
        self.logger = logger
        self.log_manager = log_manager
        self.max_agent_time = max_agent_time
        self.builder_agent = builder_agent
        self.verifier_agent = verifier_agent
        self.files_before: Dict[str, float] = {}
    
    def _get_tracked_files(self) -> Dict[str, float]:
        """Get modified times of all tracked files in the project."""
        files = {}
        # Track spec files, generated code, and tests
        patterns = [
            "specs/**/*.spec.*",
            "specs/**/*.scl",
            "generated/**/*",
            "tests/**/*.spec.*",
            "tests/**/*.test.*",
            "TODO.md",
            "project.scl",
        ]
        for pattern in patterns:
            for p in Path(".").glob(pattern):
                if p.is_file():
                    try:
                        files[str(p)] = p.stat().st_mtime
                    except:
                        pass
        return files
    
    def _get_changed_files(self, files_before: Dict[str, float]) -> List[Path]:
        """Get list of files that changed since before."""
        files_after = self._get_tracked_files()
        changed = []
        for path, mtime in files_after.items():
            if path not in files_before or files_before[path] != mtime:
                changed.append(Path(path))
        return changed
    
    def _commit_file(self, file_path: Path, agent: str, task: str) -> bool:
        """Commit a single file with proper message (per git-history.spec.md)."""
        try:
            # Check if file exists and has changes
            result = subprocess.run(
                ["git", "diff", "--name-only", "--porcelain", str(file_path)],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT
            )
            if not result.stdout.strip():
                return False  # No changes to commit
            
            # Generate summary from task description
            summary = f"{agent}: {task[:50]}"
            if len(task) > 50:
                summary += "..."
            
            # Per-file commit: git commit --only <file> -m "speclang: ..."
            result = subprocess.run(
                ["git", "add", "--only", str(file_path)],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT
            )
            if result.returncode != 0:
                self.logger.warning(f"git add failed for {file_path}: {result.stderr}")
                return False
            
            result = subprocess.run(
                ["git", "commit", "--only", str(file_path), "-m", f"speclang: {summary}"],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT
            )
            if result.returncode == 0:
                self.logger.success(f"Committed: {file_path}")
                return True
            else:
                self.logger.warning(f"Commit failed for {file_path}: {result.stderr}")
                return False
        except Exception as e:
            self.logger.warning(f"Error committing {file_path}: {e}")
            return False
    
    def _commit_all_changes(self, agent: str, task: str) -> int:
        """Commit all changed files (per git-history.spec.md)."""
        changed = self._get_changed_files(self.files_before)
        committed = 0
        for file_path in changed:
            if self._commit_file(file_path, agent, task):
                committed += 1
        return committed
    
    def run_agent(
        self,
        agent: str,
        phase_name: str,
        prompt_file: Optional[Path] = None,
        working_dir: Path = PROJECT_ROOT,
        task: str = "general task"
    ) -> bool:
        log_file = self.log_manager.get_log_file(phase_name)
        
        self.logger.phase("=" * 60)
        self.logger.phase(f"Starting {phase_name} phase (agent: {agent})...")
        self.logger.phase(f"Log file: {log_file}")
        self.logger.phase("=" * 60)
        
        # Capture files BEFORE agent runs (per git-history.spec.md)
        self.files_before = self._get_tracked_files()
        self.logger.info(f"Tracking {len(self.files_before)} files before agent run")
        
        try:
            if prompt_file and prompt_file.exists():
                prompt = prompt_file.read_text()
            else:
                prompt = f"Complete the current task from TODO.md and follow Speclang conventions."
            
            with open(log_file, 'w') as log_fh:
                process = subprocess.Popen(
                    ["opencode", "run", "--agent", agent, prompt],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    cwd=working_dir,
                    text=True
                )
                
                start_time = time.time()
                while True:
                    if time.time() - start_time > self.max_agent_time:
                        process.kill()
                        self.logger.error(f"{phase_name} phase TIMED OUT")
                        return False
                    
                    if process.stdout:
                        line = process.stdout.readline()
                        if not line and process.poll() is not None:
                            break
                        
                        if line:
                            print(line, end='')
                            log_fh.write(line)
                            log_fh.flush()
                    else:
                        if process.poll() is not None:
                            break
                        time.sleep(0.1)
                
                exit_code = process.wait()
                
                # Commit changes AFTER agent completes (per git-history.spec.md)
                committed = self._commit_all_changes(agent, task)
                if committed > 0:
                    self.logger.success(f"Committed {committed} file(s) with per-file commits")
                
                if exit_code == 0:
                    self.logger.success(f"{phase_name} phase completed")
                    self.logger.success(f"Log saved to: {log_file}")
                    return True
                else:
                    self.logger.error(f"{phase_name} phase failed with exit code {exit_code}")
                    self.logger.error(f"Log saved to: {log_file}")
                    return False
                    
        except FileNotFoundError:
            self.logger.error("OpenCode not found. Please install opencode.")
            return False
        except Exception as e:
            self.logger.error(f"Error running {phase_name}: {e}")
            return False


class WorkflowEngine:
    def __init__(
        self,
        logger: RalphLogger,
        state_manager: StateManager,
        task_manager: TaskManager,
        log_manager: LogManager,
        phase_runner: PhaseRunner
    ):
        self.logger = logger
        self.state = state_manager
        self.tasks = task_manager
        self.logs = log_manager
        self.runner = phase_runner
        
        self.pre_phase_hooks: Dict[str, List[Callable]] = {}
        self.post_phase_hooks: Dict[str, List[Callable]] = {}
        self.on_failure_hooks: List[Callable] = []
        self.on_success_hooks: List[Callable] = []
    
    def register_pre_phase_hook(self, phase: str, hook: Callable):
        if phase not in self.pre_phase_hooks:
            self.pre_phase_hooks[phase] = []
        self.pre_phase_hooks[phase].append(hook)
    
    def register_post_phase_hook(self, phase: str, hook: Callable):
        if phase not in self.post_phase_hooks:
            self.post_phase_hooks[phase] = []
        self.post_phase_hooks[phase].append(hook)
    
    def _run_hooks(self, hooks: List[Callable], context: Dict[str, Any]):
        for hook in hooks:
            try:
                hook(context)
            except Exception as e:
                self.logger.warning(f"Hook failed: {e}")
    
    def run_phase(self, phase_name: str, agent: str, prompt_file: Optional[Path] = None, task: str = "general task") -> bool:
        context: Dict[str, Any] = {"phase": phase_name, "agent": agent}
        if phase_name in self.pre_phase_hooks:
            self._run_hooks(self.pre_phase_hooks[phase_name], context)
        
        self.state.set_phase(phase_name)
        success = self.runner.run_agent(agent, phase_name, prompt_file, task=task)
        
        context["success"] = success
        if phase_name in self.post_phase_hooks:
            self._run_hooks(self.post_phase_hooks[phase_name], context)
        
        return success
    
    def run_standard_loop(self):
        prompt_dir = RALPH_DIR
        
        while self.tasks.has_pending_tasks():
            iteration = self.state.increment_iteration()
            pending = self.tasks.count_pending()
            next_task = self.tasks.get_next_task() or "general task"
            
            self.logger.info("=" * 60)
            self.logger.info(f"Iteration #{iteration} | Pending tasks: {pending}")
            self.logger.info(f"Next task: {next_task[:60]}...")
            self.logger.info("=" * 60)
            
            # Build phase
            success = self.run_phase(
                "build",
                self.runner.builder_agent,
                prompt_dir / "PROMPT.md",
                task=next_task
            )
            
            if not success:
                failures = self.state.record_failure()
                
                if failures >= MAX_FAILED_ATTEMPTS:
                    self.logger.error(f"Too many failures ({failures}). Stopping.")
                    self._run_hooks(self.on_failure_hooks, {"failures": failures})
                    return False
                
                self.logger.warning("Build failed, retrying...")
                continue
            
            # Verify phase
            success = self.run_phase(
                "verify",
                self.runner.verifier_agent,
                prompt_dir / "PROMPT-VERIFY.md",
                task=next_task
            )
            
            if not success:
                self.logger.warning("Verification failed, fixes needed")
                self.state.reset_failures()
                continue
            
            self.state.reset_failures()
            time.sleep(SLEEP_BETWEEN_ITERATIONS)
        
        self.logger.success("All tasks complete!")
        self._run_hooks(self.on_success_hooks, {"completed_tasks": self.state.state.completed_tasks})
        return True


class RalphCLI:
    def __init__(self):
        self.logger = RalphLogger()
        self.state = StateManager(LOOP_STATE)
        self.tasks = TaskManager(TODO_FILE)
        self.logs = LogManager(LOGS_DIR)
        self.runner = PhaseRunner(self.logger, self.logs)
        self.engine = WorkflowEngine(
            self.logger, self.state, self.tasks, self.logs, self.runner
        )
    
    def cmd_build(self):
        self.logger.info("Running single build phase...")
        self.engine.run_phase("build", self.runner.builder_agent, RALPH_DIR / "PROMPT.md")
    
    def cmd_verify(self):
        self.logger.info("Running single verify phase...")
        self.engine.run_phase("verify", self.runner.verifier_agent, RALPH_DIR / "PROMPT-VERIFY.md")
    
    def cmd_loop(self):
        self.logger.info("Starting SpecLang Ralph loop...")
        self.engine.run_standard_loop()
    
    def cmd_status(self):
        self.logger.info("Loop status:")
        print(f"  Iteration: {self.state.state.iteration}")
        print(f"  Phase: {self.state.state.phase}")
        print(f"  Pending tasks: {self.tasks.count_pending()}")
        print(f"  Failed attempts: {self.state.state.failed_attempts}")
        print(f"  Started at: {self.state.state.started_at}")
        print("")
        self.cmd_logs(5)
    
    def cmd_logs(self, count: int = 20):
        self.logger.info(f"Recent log files (last {count}):")
        logs = self.logs.list_logs(count)
        if logs:
            for log in logs:
                mtime = datetime.fromtimestamp(log.stat().st_mtime)
                print(f"  {log.name} ({mtime.strftime('%Y-%m-%d %H:%M:%S')})")
        else:
            print("  No logs found")
    
    def cmd_clean(self):
        self.logger.info("Cleaning old logs (keeping last 100)...")
        self.logs.clean_old_logs(100)
        self.logger.success("Log cleanup complete")
    
    def cmd_reset(self):
        self.state.reset()
        self.logger.success("Loop state reset")
    
    def run(self, args: Optional[List[str]] = None):
        parser = argparse.ArgumentParser(
            description="Ralph Loop for SpecLang",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  python ralph_loop.py loop          # Run full loop
  python ralph_loop.py build         # Single build phase
  python ralph_loop.py verify        # Single verify phase
  python ralph_loop.py status        # Show status
  python ralph_loop.py logs 10       # Show last 10 logs
            """
        )
        
        parser.add_argument(
            "command",
            choices=["build", "verify", "loop", "status", "logs", "clean", "reset"],
            nargs="?",
            default="loop",
            help="Command to run (default: loop)"
        )
        parser.add_argument(
            "count",
            type=int,
            nargs="?",
            default=20,
            help="Number of logs to show (for 'logs' command)"
        )
        parser.add_argument(
            "--builder-agent",
            default="speclang-simulator",
            help="Builder agent name"
        )
        parser.add_argument(
            "--verifier-agent",
            default="speclang-simulator-verify",
            help="Verifier agent name"
        )
        parser.add_argument(
            "--timeout",
            type=int,
            default=7200,
            help="Max agent time in seconds (default: 7200)"
        )
        
        parsed = parser.parse_args(args)
        
        # Update runner config
        self.runner.builder_agent = parsed.builder_agent
        self.runner.verifier_agent = parsed.verifier_agent
        self.runner.max_agent_time = parsed.timeout
        
        # Ensure directories exist
        RALPH_DIR.mkdir(parents=True, exist_ok=True)
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        
        commands = {
            "build": self.cmd_build,
            "verify": self.cmd_verify,
            "loop": self.cmd_loop,
            "status": self.cmd_status,
            "logs": lambda: self.cmd_logs(parsed.count),
            "clean": self.cmd_clean,
            "reset": self.cmd_reset,
        }
        
        command_func = commands.get(parsed.command)
        if command_func:
            try:
                command_func()
            except KeyboardInterrupt:
                print("\n")
                self.logger.warning("Interrupted by user")
                sys.exit(130)
            except Exception as e:
                self.logger.error(f"Command failed: {e}")
                sys.exit(1)
        else:
            parser.print_help()
            sys.exit(1)


def main():
    cli = RalphCLI()
    cli.run()


if __name__ == "__main__":
    main()
