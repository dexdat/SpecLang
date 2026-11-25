# speclang-header lines:4
# id: @specs/docs
# version: 1.0.0
# layer: 5

# SpecLang Daemon Operations Runbook

**Audience:** whoever is on call when the daemon is misbehaving, at 3am, with no memory
of how this project was set up.
**Applies to:** speclang v1.0.0 (`bin/speclang`, package `speclang`).
**Verification:** every command and every quoted line of output below was executed against
this repository at the commit that added this file. Nothing here is copied from an older
doc. Where a behaviour could not be verified, it says so in the text instead of guessing.

Two notes about how the evidence was produced:

- The worktree used for verification has no `node_modules/` or `dist/` (a git worktree
  never does), so the live probes ran the *same* sources through the built checkout at
  `/home/kara/speclang`: `bin/speclang`, `src/daemon/index.ts`,
  `src/daemon/daemon-cli.ts`, `src/daemon/config.ts` and `package.json` were checksum-
  identical to this tree before the probes ran.
- Port `3000` was already held by an unrelated Node process on the verifying host, so the
  live daemons were started on `18777` / `18778`. The command *default* of `3000` was read
  from `speclang start --help` and `speclang daemon start --help`. Substitute your port
  wherever the transcripts below say `18777`.

## 0. TL;DR for a locked-up daemon

```bash
cd <project dir>
speclang status                       # what the pid file says
speclang daemon status --json         # what the daemon state says (removes a stale pid file)
ss -tlnp | grep ':3000'               # what is actually listening
curl -s localhost:3000/health         # which PID is actually answering
```

If the PID from `/health` is alive but `.speclang/daemon.pid` is missing or disagrees, you
have an **orphan** (see §7). Stop it by PID, then start once, then re-run the four commands
above and confirm they agree.

## 1. The two start commands are not the same command

`speclang` ships two things that both look like "start the daemon". Only one of them runs
the daemon an operator means.

| Command | What it actually does (verified) |
|---|---|
| `speclang start [-p <port>] [-d <dir>] [--no-dashboard]` | The real daemon: creates `.speclang/`, writes `.speclang/daemon.pid`, starts the `specs/ tests/ generated/` file watcher, and — unless `--no-dashboard` — binds the dashboard on the port. `--port` default `3000`. |
| `speclang daemon start [-p <port>] [-d <dir>] [--dashboard] [--no-cascade]` | A watcher-only variant implemented inline in `bin/speclang`. It loads a compiled engine from `.speclang/daemon.spec` **before** doing anything else. |

`speclang daemon start` fails on a clean checkout. `.speclang/` is gitignored
(`.gitignore:38`) and no `daemon.spec` artifact is committed, so the command exits 1:

```
$ speclang daemon start -p 18777 -d .
🚀 Starting SpecLang Daemon...
   Project: /path/to/project
   Specs: /path/to/project/specs

❌ SpecLang engine not found. Run from SpecLang installation directory.

EXIT=1
```

Consequences an operator needs to know:

- Use `speclang start` to run a daemon. `speclang daemon start` is not a fallback; without
  the artifact it cannot start anything.
- The `-p 3000` / `--dashboard` flags on `speclang daemon start` are therefore moot in this
  tree: the command exits before it reaches them.
- `speclang daemon start` does **not** serve the dashboard even when the artifact exists:
  with `--dashboard` it prints
  `Dashboard: not served by \`daemon start\` (use \`speclang start\`)`.
  That one line is read from `bin/speclang` rather than executed: with the engine artifact
  absent the command exits before reaching it.

## 2. Paths, defaults and flags (all relative to the project directory)

| What | Path / value | Where it comes from |
|---|---|---|
| Project directory | `-d/--dir`, default `.` (`.` = your shell's cwd) | `speclang start --help`, `speclang status --help` |
| Dashboard port | `-p/--port`, default `3000` | `speclang start --help`; `src/daemon/daemon-cli.ts:40` (`const port = options.port || 3000;`) |
| PID file | `.speclang/daemon.pid` (the raw PID, no newline) | written by `fs.writeFileSync(pidFile, process.pid.toString())` in `src/daemon/index.ts`; read by `bin/speclang` (`readDaemonPid`) |
| Daemon state | `.speclang/daemon-state.json` | written by the daemon on start; read by `speclang daemon status` |
| State database | `.speclang/speclang.db` (override with `$SPECLANG_DB`) | `bin/speclang` `status` action |
| Locks | `.speclang/locks/` | created on start |
| Log file | `.speclang/daemon.log` | default in `src/daemon/config.ts:35` — see §3, nothing writes it today |

`speclang start` runs in the **foreground**. There is no `--daemonize`: if you close the
terminal or the process leaves with the session, the daemon is gone. Detach it yourself:

```bash
cd <project dir>
nohup speclang start -p 3000 >> .speclang/daemon.log 2>&1 &
```

### About `.speclang/daemon.log`

`.speclang/daemon.log` is the *configured* log path, but no code writes it. Verified two
ways: a live daemon created only `.speclang/daemon.pid`, `.speclang/daemon-state.json` and
`.speclang/locks/` — no `daemon.log` — and the only references to the name in
`src/`/`dist/` are the `DEFAULT_CONFIG.logging.file` value in `src/daemon/config.ts:35`;
nothing reads `logging.file`.

The daemon logs to stdout/stderr. So `.speclang/daemon.log` only exists if *you* create it
with the redirect shown above. Without the redirect, the daemon's output goes wherever the
terminal goes and is lost on disconnect — which is why "there is no log" is a normal state,
not evidence that the daemon never started.

## 3. Start, and what a healthy start looks like

```bash
cd <project dir>
speclang start -p 18777
```

```
🚀 Starting SpecLang...
   Directory: /home/kara/.hermes/cache/scratch/doc3-sandbox
   Dashboard: http://localhost:18777

🚀 SpecLang Daemon Starting...

   Project: /home/kara/.hermes/cache/scratch/doc3-sandbox
   Port: 18777
[Daemon] Starting speclangd...
[Watcher] Started watching: specs/, tests/, generated/
[Daemon] Started successfully

✅ SpecLang Daemon Started
   Press Ctrl+C to stop


📊 Dashboard: http://localhost:18777
```

There is **no "already running" check**. Starting a second daemon in the same project
directory does not refuse — it overwrites `.speclang/daemon.pid` and you lose the handle on
the first process (§7).

The dashboard is a single-page status view plus three endpoints:

| Endpoint | Verified response |
|---|---|
| `GET /` | HTML page titled `SpecLang Dashboard`, re-polls `/api/status` every second |
| `GET /health` | `{"status":"ok","pid":2890801}` — **the authoritative identity of the process answering the port** |
| `GET /api/status` | `{"status":"converged","cascadeDepth":0,"filesChanged":0,"activeAgents":0,"startedAt":1794911059950}` |

`/health` is the cheapest way to answer "which process owns port 3000". Remember its PID.

## 4. What each status command prints, in each state

Three commands report status and they do **not** agree with each other by design. Learn the
difference once; it saves an hour at 3am.

| State | `speclang status -d <dir>` | `speclang daemon status` (cwd only) | `speclang daemon status --json` |
|---|---|---|---|
| No daemon, no pid file | `Daemon: Not running` | `🔴 Daemon: Stopped` | `{"running":false,"pid":null,"status":"stopped"}` |
| Daemon running | `Daemon: Running (PID 2890801)` | `🟢 Daemon: Running` + `PID:` `Status:` `Cascade Depth:` `Files Changed:` | `{"running":true,"pid":2890801,"status":"idle","cascadeDepth":0,"filesChanged":0}` |
| PID file points at a dead process | `Daemon: Running (PID 999999)` — **wrong, see below** | `🔴 Daemon: Stopped` **and the pid file is deleted** | `{"running":false,...}` |
| PID file is empty or garbage | `Daemon: Not running` | `🔴 Daemon: Stopped` (file left in place) | `{"running":false,...}` |
| `.speclang/speclang.db` is not SQLite | refuses, exit 1 (§6.5) | unaffected — prints normally | unaffected |

Full `speclang status` when down:

```
$ speclang status -d .
📊 SpecLang Status
   Project: /home/kara/.hermes/cache/scratch/doc3-sandbox
   Daemon: Not running
   Specs: 0 (0 .spec.md + 0 .scl)
   Generated files: 0
```

The `Specs:` line counts `*.spec.md` + `*.scl` under `specs/`; `Generated files:` appears
only when a `generated/` directory exists.

Full `speclang daemon status` when up:

```
$ speclang daemon status
🟢 Daemon: Running
   PID: 2890801
   Status: idle
   Cascade Depth: 0
   Files Changed: 0
```

The `Status`, `Cascade Depth` and `Files Changed` values come from
`.speclang/daemon-state.json`, not from the live process. That file at the time read:

```json
{
  "cascadeDepth": 0,
  "filesChanged": [],
  "activeAgents": [],
  "startedAt": 1794911059950,
  "status": "idle"
}
```

The live `/api/status` endpoint reported `"status":"converged"` at the same moment, so the
file and the endpoint can disagree — the file is the last snapshot the daemon wrote, the
endpoint is computed on request. Neither is a health check; `/health` is.

### Two asymmetries that bite

1. **`speclang status` does not check that the PID is alive.** With `999999` written into
   `.speclang/daemon.pid` it printed `Daemon: Running (PID 999999)` and exited 0, while
   `speclang daemon status` in the same directory correctly said `Stopped` and removed the
   file. Treat a PID from `speclang status` as a claim, and confirm it with `kill -0`.
2. **`speclang daemon stop` and `speclang daemon status` take no `-d`.** Their help output
   has no options except `--json` (status) / `--help`; both use `process.cwd()`. Run them
   from the project directory. `speclang status -d <dir>` and `speclang stop -d <dir>` are
   the directory-aware forms.

## 5. Telling "down" from "stale pid file" from "port held"

Run these in order. Each answer narrows the next question.

```bash
cd <project dir>

# 1. Is there a pid file at all?
ls -l .speclang/daemon.pid
cat .speclang/daemon.pid

# 2. If there is one, is that PID alive?
kill -0 "$(cat .speclang/daemon.pid)" && echo ALIVE || echo DEAD

# 3. Is anything listening on the port? (default 3000)
ss -tlnp | grep ':3000'

# 4. Who answers on that port?
curl -s --max-time 3 localhost:3000/health
```

Decode the results:

- **No pid file, nothing listening** → genuinely down. Start it (§3).
- **No pid file, something listening on the port** → an **orphan** (§7). Someone started a
  second daemon on the same project dir and its shutdown removed the shared pid file.
- **Pid file with a dead PID** → stale pid file (§6.1). `speclang status` will still claim
  `Running`; trust `kill -0`, not the banner.
- **Pid file with a live PID, nothing listening on the port** → an older build (pre
  DF-SPECLANG-022) started its watcher even when the dashboard bind failed, so this used
  to mean a port collision (§6.2). On a post-fix build a held port **fails the start
  outright** (exit 1, EADDRINUSE message, pid file already cleaned up), so this state
  now means the dashboard process died after writing the pid file: check the process's
  stdout/stderr from wherever you detached it, and restart (§3).
- **`/health` answers with a different PID than the pid file** → two processes, one of them
  an orphan. Compare `ps -o pid,etime,cmd -p <pid>` for both before killing either.

## 6. Recovery ladder

### 6.1 Stale pid file (process is gone, file remains)

```bash
speclang daemon status      # run from the project dir: prints Stopped and deletes the file
speclang status -d .        # confirm: Daemon: Not running
```

`speclang daemon stop` also handles it and says so: `Daemon not running (stale PID file
removed)`. If the pid file is empty or garbage (not a number) `daemon status` prints
`Stopped` but deliberately leaves the file alone — remove it yourself if it bothers you:

```bash
rm -f .speclang/daemon.pid
```

### 6.2 Port already in use

Verified behaviour (live probe 2026-11-24, dashboard port held by a dummy listener):
`speclang start` now **fails fast and exits 1 before the watcher starts**. Nothing
half-started is left behind, and the pid file written moments earlier is removed by the
abort path, so `.speclang/` ends up empty:

```
🚀 Starting SpecLang...
   Directory: /home/kara/.hermes/cache/scratch/doc18-sandbox
   Dashboard: binding port 39871...

🚀 SpecLang Daemon Starting...

   Project: /home/kara/.hermes/cache/scratch/doc18-sandbox
   Port: 39871

❌ Dashboard port 39871 could not be bound (EADDRINUSE: listen EADDRINUSE: address already in use :::39871)
   Port 39871 is already in use by another process (EADDRINUSE).
   Refusing to announce a dashboard this process does not serve.
EXIT=1
```

A free port starts normally: the same command with `-p 39872` printed `Dashboard:
binding port 39872...`, ran the watcher, and announced
`📊 Dashboard: http://localhost:39872`.

The mechanism (post DF-SPECLANG-022, two gates, both before the watcher starts):

1. `listenDashboard()` (`src/daemon/dashboard.ts`) awaits the bind and **rejects** with
   the underlying socket error instead of swallowing it — the pre-fix code registered the
   `app.listen(port, cb)` callback, ignored its error argument, printed `Started` and a
   dashboard URL on a port that belonged to somebody else, and exited 0. That silent
   behaviour is historical (before 2026-11-20) and no longer reachable on a current build.
2. `probeDashboard()` asks the ANNOUNCED endpoint `/health` and requires this process's
   own PID back: on Linux a wildcard bind can *succeed* while another process already
   holds `127.0.0.1:<port>`, and a bind-only check would then print a dashboard URL that
   a stranger answers. A failed probe exits 1 with the same EADDRINUSE wording.

`--no-dashboard` bypasses both gates entirely (nothing binds anything): with the same
port still held, `start -p 39871 --no-dashboard` started the daemon normally and ran
until it was killed. The port only matters when the dashboard is served.

Diagnose:

```bash
ss -tlnp | grep ':3000'          # the real owner
curl -s localhost:3000/health    # its PID
ps -o pid,etime,cmd -p <pid>     # confirm it is a speclang process before touching it
```

Then pick one:

- **Another SpecLang daemon owns the port** → stop that one (`speclang stop -d <its project
  dir>`) or, if it is an orphan, `kill -TERM <pid>`, then restart on the port.
- **A foreign service owns the port** → do not kill what you cannot identify. Start SpecLang
  somewhere else: `speclang start -p 3001` — the failed bind above already names the port,
  and the success banner prints only after the bind and the `/health` probe both pass.
- **Nothing owns the port but the bind still failed** → check you are not in a container
  with a conflicting network, then re-run and read the *first* lines of output (the banner
  echoes the port it was given).

### 6.3 Two daemons, one project dir → orphan

Verified end to end. Sequence: daemon A (PID 2890801, port 18777) running; a second
`speclang start -p 18778` in the *same* project directory overwrites
`.speclang/daemon.pid` with its own PID; when that second process exits it deletes the pid
file it overwrote — and A keeps running and serving the port with no pid file anywhere.

Resulting state, measured:

```
$ curl -s localhost:18777/health   →  {"status":"ok","pid":2890801}   # A still serving
$ speclang status -d .             →  Daemon: Not running             # pid file gone
$ speclang stop                    →  Daemon not running              # cannot reach A
```

Recovery — identify by port, kill by PID, then verify:

```bash
ss -tlnp | grep ':18777'                       # → pid=2890801
curl -s localhost:18777/health                 # → {"status":"ok","pid":2890801}
kill -TERM 2890801                             # graceful: daemon unlinks its own pid file
sleep 2
ss -tlnp | grep ':18777' || echo "port free"
```

A terminated daemon shuts down cleanly and logs:

```
🛑 Shutting down...
[Daemon] Stopping...
[Watcher] Stopped
[Daemon] Stopped
```

Rule: **one daemon per project directory.** The pid file is a single slot, not a registry.

### 6.4 `speclang status` disagrees with reality

See §4: `speclang status` reads the pid file without checking liveness, so it can report
`Daemon: Running (PID <dead>)`. Use `speclang daemon status` (it probes with `kill -0` and
removes the stale file) and/or `/health` for the truth.

### 6.5 Corrupt state database

`.speclang/speclang.db` that is not SQLite makes `speclang status` refuse rather than report
a status the unreadable state cannot back (exit 1):

```
$ speclang status -d .
❌ The SpecLang state database is corrupt or not a SQLite database: /path/.speclang/speclang.db
SpecLang cannot read this project's state from that file, so it refuses to continue
rather than report a status that unreadable state does not back.

Recovery: back the file up if you need it as evidence, then delete it so SpecLang
rebuilds a fresh database on the next run. The full fresh-start procedure is in
docs/troubleshooting.md -> "Emergency Recovery":
  rm -f /path/.speclang/speclang.db
EXIT=1
```

Do what it says: back the file up if it is evidence, then delete it and re-run. The rebuild
is automatic on the next command that opens the database. `speclang daemon status` does not
touch the database, so it keeps working while `speclang status` refuses — useful when you
need *any* answer about the process.

### 6.6 `speclang stop` says "Daemon not running" but the port is still served

That is §6.3 (orphan), or you ran `speclang daemon stop` from the wrong directory (it uses
cwd, §4). Confirm with `ss` + `/health`, then kill by PID.

### 6.7 Stopping, and verifying the stop

```bash
cd <project dir>
speclang stop                 # or: speclang daemon stop   (cwd only)
```

Verified outputs:

| Situation | Output |
|---|---|
| daemon running | `✅ Daemon stopped` |
| no pid file | `Daemon not running` |
| pid file pointing at a dead PID | `Daemon not running (stale PID file removed)` |

`stop` sends `SIGTERM` and unlinks `.speclang/daemon.pid` itself; the daemon's own SIGTERM
handler also unlinks the file and tolerates it already being gone, so either side may win
without an error. `stop` does not wait for the process to die — verify:

```bash
sleep 2
ss -tlnp | grep ':3000' || echo "port free"
ls .speclang/daemon.pid 2>/dev/null || echo "no pid file"
```

## 7. Post-recovery verification (do not skip)

All four must agree before you call it fixed:

```bash
cd <project dir>
speclang status -d .                    # Daemon: Running (PID <X>)   — or Not running if you stopped it
speclang daemon status --json           # {"running":…,"pid":<X>}
ss -tlnp | grep ':3000'                 # exactly ONE listener
curl -s localhost:3000/health           # {"status":"ok","pid":<X>}   — same <X>
```

If `status` and `/health` disagree about the PID, you still have two processes. If `ss`
shows more than one listener line, you have two daemons. If `/health` answers while
`speclang status` says `Not running`, the pid file is gone and you are looking at an orphan.

## 8. Known gaps (documented, not hidden)

- `.speclang/daemon.log` has no writer (§2). Any log you rely on is the one you redirected.
- `speclang status` reports an alive-looking daemon from a dead PID (§4, §6.4).
- **A held dashboard port makes `speclang start` exit 1 with an EADDRINUSE message before
  the watcher starts** (§6.2; fixed by DF-SPECLANG-022, 2026-11-20). The historical
  behaviour — the daemon printing `📊 Dashboard: http://localhost:<port>` for a bind that
  never succeeded, with no error and exit 0 — is gone on a current build and described
  there only as history.
- There is no "already running" guard: a second `speclang start` in the same project
  directory hijacks the pid file (§6.3).
- `speclang daemon stop` / `speclang daemon status` have no `-d`; they only work from the
  project directory (§4).
- `speclang daemon start` requires a `.speclang/daemon.spec` engine artifact that is
  gitignored and absent from a fresh checkout, so it exits 1 (§1). `speclang start` is the
  supported path.
