# speclang-header lines:10
id: "@speclang/assembler/cli"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
tags: [assembler, cli, commands, usage]
status: draft
short: "CLI commands reference for SpecLang assembler"
---

# Assembler CLI

## speclangd — Daemon

```bash
speclangd [command]

Commands:
  start     Start the file watcher daemon
  stop      Stop the daemon
  status    Show daemon status and notification graph size
  logs      Show daemon logs

Options:
  --watch DIR       Directory to watch (default: specs/)
  --pipeline FILE   Pipeline definition (default: build.yaml)
  --port PORT       MCP server port (default: 8765)
  --config FILE     Config file (default: .speclangrc)
```

## speclang — Assembler Commands

```bash
speclang [command] [options]

Commands:
  validate [path]        Validate spec headers and @ref: links
  cascade [spec]         Trigger cascade for a spec change
  assemble [spec]        Assemble .spec.{lang}.md → .spec.{lang}
  status                 Show project status
  watch                  Start watcher (foreground)
  init                   Initialize project structure
  pool list              List model pools and their status
  pool status [name]     Show pool concurrency and rate limit state

Options:
  --help, -h             Show help
  --version, -v          Show version
  --config FILE          Config file
  --json                 JSON output (for tooling)
  --verbose, -V          Verbose output
```

## Examples

```bash
# Start the daemon
speclangd start --watch specs/ --pipeline build.yaml

# Validate all specs
speclang validate

# Trigger cascade for a specific spec change
speclang cascade specs/auth/login.spec.ts.md

# Assemble a single spec
speclang assemble specs/auth/login.spec.ts.md

# Show project status
speclang status

# List model pools
speclang pool list
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Generic error |
| 2 | Invalid spec format |
| 3 | Validation failed |
| 4 | Cascade error |
| 5 | Pipeline failure |

## See Also

- @ref:specs/assembler/config
- @ref:specs/daemon
- @ref:specs/pipeline
