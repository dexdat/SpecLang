/**
 * Process ownership for daemon integration tests.
 *
 * A detached daemon cannot be cleaned up through its short-lived CLI parent.
 * Register both the CLI child and the daemon PID, retain the fixture root, and
 * discover the complete process tree synchronously so even Node's `exit` event
 * can terminate it. Every candidate is tied to a fixture inside this suite;
 * the sweeper never signals arbitrary system processes.
 */

import { type ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";

const FIXTURES_ROOT = path.resolve(__dirname, "fixtures");
const TREE_TERM_TIMEOUT_MS = 2_000;

interface Registration {
  fixtureRoot: string;
  startTime: string | null;
}

interface ProcInfo {
  pid: number;
  ppid: number;
  startTime: string;
  cwd: string | null;
  zombie: boolean;
}

const registrations = new Map<number, Registration>();
const fixtureRoots = new Set<string>();

function fixtureRoot(cwd: string): string {
  const root = path.resolve(cwd);
  const relative = path.relative(FIXTURES_ROOT, root);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`daemon fixture root escapes ${FIXTURES_ROOT}: ${root}`);
  }
  fixtureRoots.add(root);
  return root;
}

function readProc(pid: number): ProcInfo | null {
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8");
    const closingParen = stat.lastIndexOf(")");
    if (closingParen < 0) return null;
    // Fields after comm start at field 3 (state); field 22 is starttime.
    const fields = stat.slice(closingParen + 2).split(" ");
    let cwd: string | null = null;
    try {
      cwd = fs.readlinkSync(`/proc/${pid}/cwd`).replace(/ \(deleted\)$/, "");
    } catch {
      // The process may exit between stat and readlink.
    }
    return {
      pid,
      ppid: Number(fields[1]),
      startTime: fields[19],
      cwd,
      zombie: fields[0] === "Z",
    };
  } catch {
    return null;
  }
}

function allProcesses(): ProcInfo[] {
  const result: ProcInfo[] = [];
  for (const entry of fs.readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    const info = readProc(Number(entry));
    if (info) result.push(info);
  }
  return result;
}

function insideFixture(cwd: string | null, root: string): boolean {
  if (!cwd) return false;
  const relative = path.relative(root, cwd);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function candidateTree(): { roots: ProcInfo[]; tree: ProcInfo[] } {
  const processes = allProcesses();
  const byPid = new Map(processes.map((info) => [info.pid, info]));
  const roots: ProcInfo[] = [];
  const tree = new Map<number, ProcInfo>();

  for (const [pid, registration] of registrations) {
    const info = byPid.get(pid);
    if (!info || info.zombie) continue;
    if (
      registration.startTime !== null &&
      info.startTime !== registration.startTime
    ) {
      continue; // A recycled PID is not the process this suite spawned.
    }
    if (!insideFixture(info.cwd, registration.fixtureRoot)) continue;
    roots.push(info);
    tree.set(pid, info);
  }

  // Covers the window after `start -d` returns but before its PID is read.
  for (const info of processes) {
    if (info.zombie) continue;
    for (const root of fixtureRoots) {
      if (insideFixture(info.cwd, root)) {
        tree.set(info.pid, info);
        break;
      }
    }
  }

  // Include descendants even if they changed cwd or created their own group.
  for (;;) {
    let discovered = false;
    for (const info of processes) {
      if (info.zombie || tree.has(info.pid)) continue;
      if (tree.has(info.ppid)) {
        tree.set(info.pid, info);
        discovered = true;
      }
    }
    if (!discovered) break;
  }

  return { roots, tree: [...tree.values()] };
}

function signalProcess(pid: number, signal: NodeJS.Signals): void {
  if (pid === process.pid || pid === process.ppid) return;
  try {
    process.kill(pid, signal);
  } catch {
    // ESRCH means teardown already won; do not mask the original test result.
  }
}

/** Synchronous by design: this is also called from Node's `exit` handler. */
export function killRegisteredTreesSync(
  signal: NodeJS.Signals = "SIGKILL",
): void {
  const { roots, tree } = candidateTree();
  for (const root of roots) {
    try {
      // Detached speclangd children are process-group leaders. Killing only
      // their pidfile PID leaves agent/build children alive.
      process.kill(-root.pid, signal);
    } catch {
      // A non-detached CLI child has no group of its own; signal it below.
    }
  }
  for (const info of tree) signalProcess(info.pid, signal);
}

export function registerSpawnedDaemon(
  child: ChildProcess,
  cwd: string,
): void {
  if (child.pid) registerDaemonPid(child.pid, cwd);
}

export function registerDaemonPid(pid: number, cwd: string): void {
  if (!Number.isInteger(pid) || pid <= 1) return;
  registrations.set(pid, {
    fixtureRoot: fixtureRoot(cwd),
    startTime: readProc(pid)?.startTime ?? null,
  });
}

/** Environment inherited by the detached child for parent-death detection. */
export function daemonTestEnv(cwd: string): NodeJS.ProcessEnv {
  fixtureRoot(cwd);
  return {
    ...process.env,
    NODE_OPTIONS: "",
    SPECLANGD_OWNER_PID: String(process.pid),
  };
}

export function hasLiveRegisteredTrees(): boolean {
  return candidateTree().tree.some((info) => !info.zombie);
}

export async function stopRegisteredDaemons(): Promise<void> {
  killRegisteredTreesSync("SIGTERM");
  const deadline = Date.now() + TREE_TERM_TIMEOUT_MS;
  while (Date.now() < deadline && hasLiveRegisteredTrees()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (hasLiveRegisteredTrees()) killRegisteredTreesSync("SIGKILL");
}

function installExitHandlers(): void {
  process.once("exit", () => killRegisteredTreesSync("SIGKILL"));
  for (const [signal, exitCode] of [
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ] as const) {
    process.once(signal, () => {
      killRegisteredTreesSync("SIGKILL");
      process.exit(exitCode);
    });
  }

  // Leave Vitest's own reporting handlers in charge when they are installed.
  // If this helper is used standalone, still fail loudly after the cleanup.
  process.on("uncaughtException", (error) => {
    killRegisteredTreesSync("SIGKILL");
    if (process.listenerCount("uncaughtException") === 1) {
      console.error(error);
      process.exit(1);
    }
  });
  process.on("unhandledRejection", (reason) => {
    killRegisteredTreesSync("SIGKILL");
    if (process.listenerCount("unhandledRejection") === 1) {
      console.error(reason);
      process.exitCode = 1;
    }
  });
}

installExitHandlers();
