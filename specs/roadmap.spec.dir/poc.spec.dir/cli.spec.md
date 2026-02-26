# speclang-header lines:15
id: "@speclang/roadmap/poc/cli"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Command line interface for POC daemon"
tags: [poc, cli, commands, ux, interface]
---

# POC: Command Line Interface

Complete CLI specification for user interaction.

## Commands

### @poc/cli/commands

**Primary Command**: `speclangd` (or `speclangd-poc` for POC)

**Usage:**
```bash
speclangd [options]
```

**Options:**

| Flag | Long Form | Description | Default |
|------|-----------|-------------|---------|
| `-w` | `--watch <dir>` | Directory to watch | `./specs` |
| `-o` | `--output <dir>` | Output directory | `./src` |
| `-d` | `--debounce <ms>` | Debounce time | `300` |
| `-c` | `--convergence <ms>` | Convergence timeout | `5000` |
| `--no-symlinks` | | Copy instead of symlink | `false` |
| `-v` | `--verbose` | Verbose logging | `false` |
| `--silent` | | Silent mode | `false` |
| `-h` | `--help` | Show help | - |
| `--version` | | Show version | - |

**Examples:**

```bash
# Default usage
speclangd

# Watch different directory
speclangd --watch ./my-specs

# Custom output directory
speclangd --watch ./specs --output ./generated

# Faster convergence (2 seconds)
speclangd --convergence 2000

# Verbose mode for debugging
speclangd --verbose

# Silent mode (errors only)
speclangd --silent
```

## Output Format

### @poc/cli/output

**Normal Mode:**
```
[speclangd] Starting SpecLang POC daemon v0.1.0
[speclangd] Watching: ./specs
[speclangd] Output: ./src
[speclangd] Debounce: 300ms
[speclangd] Convergence: 5000ms
[speclangd] 
[speclangd] ✅ Ready. Watching for changes...
[speclangd] 
[speclangd] [14:32:05] Change detected: specs/hello.spec.md
[speclangd] [14:32:05] Parsing spec...
[speclangd] [14:32:05] Found 1 block: greet
[speclangd] [14:32:05] Generating code...
[speclangd] [14:32:05] Writing: specs/hello.spec.dir/src/greet.ts
[speclangd] [14:32:05] Creating symlink: src/hello
[speclangd] [14:32:05] ✅ Generated 1 file in 45ms
[speclangd] 
[speclangd] [14:32:10] ✅ Convergence detected (5005ms)
[speclangd]            Files changed: 1
[speclangd]            Depth: 1
```

**Verbose Mode (`--verbose`):**
```
[speclangd] DEBUG: Initializing file watcher
[speclangd] DEBUG: Using chokidar for file watching
[speclangd] DEBUG: Watch patterns: *.spec.md
[speclangd] DEBUG: Ignore patterns: *.tmp, *~, .git/**
[speclangd] DEBUG: Scanning existing files...
[speclangd] DEBUG: Found 12 spec files
[speclangd] DEBUG: Processing: specs/auth.spec.md
[speclangd] DEBUG:   Header parsed: @specs/auth
[speclangd] DEBUG:   Blocks found: 3
[speclangd] DEBUG:   Generated: src/auth/login.ts
[speclangd] DEBUG:   Generated: src/auth/logout.ts
[speclangd] DEBUG:   Generated: src/auth/types.ts
[speclangd] ✅ Initial processing complete
```

**Silent Mode (`--silent`):**
```
# Only errors shown
[speclangd] ERROR: Failed to parse specs/invalid.spec.md
[speclangd]   Parse error: Missing header at line 1
```

## Help Text

### @poc/cli/help

**`speclangd --help` Output:**

```
SpecLang POC Daemon v0.1.0

A reactive file watcher that generates code from specs.

USAGE:
  speclangd [options]

OPTIONS:
  -w, --watch <dir>       Directory to watch for spec files (default: ./specs)
  -o, --output <dir>      Output directory for generated code (default: ./src)
  -d, --debounce <ms>     Debounce time in milliseconds (default: 300)
  -c, --convergence <ms>  Convergence timeout in milliseconds (default: 5000)
      --no-symlinks       Copy files instead of creating symlinks
  -v, --verbose           Enable verbose logging
      --silent            Only show errors
  -h, --help              Show this help message
      --version           Show version number

EXAMPLES:
  # Start with defaults
  speclangd

  # Watch custom directory
  speclangd --watch ./my-specs

  # Faster feedback (2 second convergence)
  speclangd --convergence 2000

  # Debug mode
  speclangd --verbose

LEARN MORE:
  https://github.com/your-org/speclang
```

## Interactive Mode

### @poc/cli/interactive

**Future Enhancement (post-POC):** Interactive commands while running.

Press keys while daemon is running:

```
[speclangd] Running... Press 'h' for help, 'q' to quit

> h
Commands:
  h, help    Show this help
  s, status  Show daemon status
  r, rebuild Force rebuild all specs
  q, quit    Stop daemon

> s
Status:
  Running: 5 minutes
  Specs watched: 12
  Files generated: 45
  Last cascade: 2 seconds ago
  Success rate: 98%

> r
[speclangd] Rebuilding all specs...
[speclangd] ✅ Rebuild complete (12 specs, 45 files)

> q
[speclangd] Shutting down...
[speclangd] ✅ Daemon stopped
```

## Error Messages

### @poc/cli/errors

**User-Facing Error Messages:**

**E001: Watch directory not found (WATCH_ERROR)**
```
[speclangd] ERROR: [WATCH_ERROR] Failed to watch directory
[speclangd]   Path: ./specs
[speclangd]   
[speclangd] Create the directory or specify a different one:
[speclangd]   mkdir specs
[speclangd]   # or
[speclangd]   speclangd --watch ./my-specs
```

**E002: Permission denied (WATCH_ERROR)**
```
[speclangd] ERROR: [WATCH_ERROR] Failed to watch directory
[speclangd]   Path: ./specs/hello.spec.md
[speclangd]   
[speclangd] Check file permissions:
[speclangd]   ls -la ./specs/hello.spec.md
[speclangd]   chmod 644 ./specs/hello.spec.md
```

**E003: Invalid spec header (HEADER_ERROR)**
```
[speclangd] ERROR: [HEADER_ERROR] Invalid spec header
[speclangd]   File: specs/invalid.spec.md
[speclangd]   Line: 1
[speclangd]   
[speclangd] Spec headers must start with:
[speclangd]   # speclang-header lines:N
[speclangd]   
[speclangd] See: https://speclang.dev/docs/headers
```

**E004: Parse error (PARSE_ERROR)**
```
[speclangd] ERROR: [PARSE_ERROR] Failed to parse spec file
[speclangd]   File: specs/auth.spec.md
[speclangd]   Details: Unexpected token at line 45
[speclangd]   
[speclangd] Common causes:
[speclangd]   - Missing @block: definition
[speclangd]   - Malformed YAML header
[speclangd]   - Unclosed markdown blocks
```

**E005: Build failed (GENERATION_ERROR)**
```
[speclangd] ERROR: [GENERATION_ERROR] Failed to generate code
[speclangd]   File: specs/hello.spec.md
[speclangd]   
[speclangd] The generated code has errors. Common causes:
[speclangd]   - Invalid type names in spec
[speclangd]   - Missing imports
[speclangd]   
[speclangd] Run build manually to see errors:
[speclangd]   npm run build
[speclangd]   
[speclangd] Fix the spec and save to regenerate.
```

**E006: Template not found (TEMPLATE_ERROR)**
```
[speclangd] ERROR: [TEMPLATE_ERROR] Template not found
[speclangd]   Block kind: custom-block
[speclangd]   
[speclangd] Available templates:
[speclangd]   - function
[speclangd]   - class
[speclangd]   - interface
[speclangd]   - type
[speclangd]   - enum
[speclangd]   - constant
```

**E007: Symlink failed (SYMLINK_ERROR)**
```
[speclangd] ERROR: [SYMLINK_ERROR] Failed to create symlink
[speclangd]   Path: src/hello
[speclangd]   
[speclangd] On Windows, try:
[speclangd]   1. Run as Administrator
[speclangd]   2. Enable Developer Mode
[speclangd]   3. Use --no-symlinks flag
```

**E008: Convergence timeout (CONVERGENCE_ERROR)**
```
[speclangd] ERROR: [CONVERGENCE_ERROR] Cascade timed out
[speclangd]   Duration: 300000ms (5 minutes)
[speclangd]   Files changed: 15
[speclangd]   
[speclangd] Possible causes:
[speclangd]   - Infinite loop in generated code
[speclangd]   - Too many cascading changes
[speclangd]   
[speclangd] Check for circular dependencies in specs.
```

**Error Code Reference:**

| Code | Type | Description | Recovery |
|------|------|-------------|----------|
| WATCH_ERROR | Critical | File watcher failure | Fatal - restart required |
| PARSE_ERROR | User | Invalid spec syntax | Skip file |
| GENERATION_ERROR | User | Code generation failed | Skip block |
| WRITE_ERROR | System | File write failed | Retry |
| SYMLINK_ERROR | System | Symlink creation failed | Skip/Copy |
| HEADER_ERROR | User | Invalid spec header | Skip file |
| TEMPLATE_ERROR | User | Unknown block kind | Skip block |
| CONVERGENCE_ERROR | System | Cascade timeout | Stop cascade |
| TIMEOUT_ERROR | System | Task timeout | Retry |
| DATABASE_ERROR | System | DB operation failed | Stop cascade |
| UNKNOWN_ERROR | System | Unexpected error | Skip file |

## Progress Indicators

### @poc/cli/progress

**During Cascade:**
```
[speclangd] [14:32:05] Change detected: specs/auth.spec.md
[speclangd] [14:32:05] Processing... ⏳
[speclangd] [14:32:06] Parsing spec... ✅
[speclangd] [14:32:06] Generating code... ⏳
[speclangd] [14:32:06]   login.ts... ✅
[speclangd] [14:32:06]   logout.ts... ✅
[speclangd] [14:32:06]   types.ts... ✅
[speclangd] [14:32:06] Creating symlinks... ✅
[speclangd] [14:32:06] ✅ Done (3 files in 320ms)
```

**Convergence Waiting:**
```
[speclangd] [14:32:06] Waiting for convergence... ⏳
[speclangd] [14:32:07] No changes for 1s... ⏳
[speclangd] [14:32:08] No changes for 2s... ⏳
[speclangd] [14:32:09] No changes for 3s... ⏳
[speclangd] [14:32:10] No changes for 4s... ⏳
[speclangd] [14:32:11] ✅ Convergence detected!
```

## Exit Codes

### @poc/cli/exit-codes

| Code | Meaning |
|------|---------|
| 0 | Success / Normal exit |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Watch directory not found |
| 4 | Permission denied |
| 5 | Port in use |
| 130 | Interrupted (Ctrl+C) |

## Signal Handling

### @poc/cli/signals

**SIGINT (Ctrl+C):**
```
^C
[speclangd] Shutting down gracefully...
[speclangd] Waiting for current tasks to complete... ⏳
[speclangd] ✅ Daemon stopped
```

**SIGTERM:**
```
[speclangd] Received SIGTERM
[speclangd] Shutting down...
[speclangd] ✅ Daemon stopped
```
