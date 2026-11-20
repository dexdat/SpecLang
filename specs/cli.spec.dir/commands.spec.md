# speclang-header lines:12
id: "@speclang/cli-spec-dir/commands"
version: 0.1.0
layer: 1
tags: [cli, commands]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:speclang/cli-spec"

short: CLI commands

---
## Commands

### @cli/new

```speclang
# @block:cli/new @kind:operation
speclang new <name> [options]

Creates a new speclang project.

Arguments:
  name         Project name (required)

Options:
  --path       Target directory (default: ./<name>)
  --template   Starter template (default: minimal)
  --bare       No example specs

Steps:
  - validate name is valid identifier
  - create directory structure
  - write .speclangrc
  - write initial spec
  - init git if not in repo

Example:
  speclang new my-app
  speclang new api --template=http
```

### @cli/generate

```speclang
# @block:cli/generate @kind:operation
speclang generate [spec] [options]

Compile specs to code.

Arguments:
  spec         Specific spec to compile (optional)

Options:
  --target     Output language: ts, go, rust, py
  --watch      Rebuild on changes
  --parallel   Build concurrently (default: true)
  --dry-run    Show what will be generated

Steps:
  - load all specs
  - resolve imports and refs
  - validate graph integrity
  - compile to target(s)
  - write generated files
  - update lockfile

Example:
  speclang generate
  speclang generate @auth/login --target=go
  speclang generate --watch
```

### @cli/check

```speclang
# @block:cli/check @kind:operation
speclang check [options]

Validate specs without generating.

Options:
  --strict     Fail on warnings (default: true)
  --fix        Auto-fix simple issues

Steps:
  - parse all specs
  - validate headers
  - validate refs exist
  - validate block syntax
  - report errors/warnings

Example:
  speclang check
  speclang check --fix
```

### @cli/sync

```speclang
# @block:cli/sync @kind:operation
speclang sync [options]

Sync generated code back to specs.

Options:
  --yes        Accept all changes
  --dry-run    Show what will change

Steps:
  - scan generated files for changes
  - detect @speclang-id markers
  - compare with source specs
  - propose spec updates
  - ask user to accept/reject

Example:
  speclang sync
  speclang sync --dry-run
```

### @cli/expand

```speclang
# @block:cli/expand @kind:operation
speclang expand <block> [options]

Expand a high-level block into detail.

Arguments:
  block        Block ID to expand

Options:
  --depth      Number of layers (default: 1)
  --ai         Use AI to generate (default: true)

Steps:
  - load block
  - analyze context and refs
  - generate child blocks
  - link refs appropriately
  - write expanded spec

Example:
  speclang expand @auth/login
  speclang expand @user/entity --depth=2
```

### @cli/test

```speclang
# @block:cli/test @kind:operation
speclang test [filter] [options]

Run acceptance tests from specs.

Arguments:
  filter       Test name pattern

Options:
  --coverage   Report coverage
  --watch      Re-run on changes

Steps:
  - extract @kind:acceptance blocks
  - generate test runners
  - execute tests
  - report results

Example:
  speclang test
  speclang test auth
  speclang test --coverage
```

### @cli/diff

```speclang
# @block:cli/diff @kind:operation
speclang diff [options]

Show pending changes.

Options:
  --staged     Compare staged specs
  --target     Compare specific target

Steps:
  - load current generated
  - compile in memory
  - compare with disk
  - format diff output

Example:
  speclang diff
```

### @cli/format

```speclang
# @block:cli/format @kind:operation
speclang format [files] [options]

Format spec files.

Arguments:
  files        Files to format (default: all)

Options:
  --check      Only check, don't write
  --write      Write formatted output

Example:
  speclang format
  speclang format specs/auth.spec --check
```

### @cli/search

```speclang
# @block:cli/search @kind:operation
speclang search <query>

Search across all specs.

Arguments:
  query        Search term or @id pattern

Options:
  --kind       Filter by block kind
  --tag        Filter by tag

Example:
  speclang search login
  speclang search @auth
  speclang search --kind=entity
```

### @cli/graph

```speclang
# @block:cli/graph @kind:operation
speclang graph [options]

Visualize spec relationships.

Options:
  --format     mermaid, dot, json
  --output     Write to file

Example:
  speclang graph --format=mermaid
```

### @cli/cascade

```speclang
# @block:cli/cascade @kind:operation
speclang cascade [command] [options]

Control the cascade system.

Commands:
  start         Start cascade processing
  stop          Stop cascade processing
  pause         Pause cascade (finish current, don't start new)
  resume        Resume paused cascade
  status        Show cascade status
  depth         Get/set max cascade depth
  trigger       Manually trigger cascade on specific file

Options:
  --max-depth   Maximum cascade depth (default: 50)
  --quiet-period Seconds of no changes before convergence (default: 30)
  --watch       Watch for file changes (default: true)

Example:
  speclang cascade start
  speclang cascade status
  speclang cascade trigger specs/auth.scl
  speclang cascade depth --set=20
```

### @cli/errors

```speclang
# @block:cli/errors @kind:operation
speclang errors [command] [options]

View and manage system errors.

Commands:
  list          List recent errors
  show <id>     Show error details
  retry <id>    Retry failed operation
  clear         Clear resolved errors
  stats         Show error statistics

Options:
  --type        Filter by error type
  --status      Filter by status (new, resolved, etc.)
  --since       Show errors since timestamp
  --limit       Maximum errors to show (default: 20)

Example:
  speclang errors list
  speclang errors show error-123
  speclang errors retry error-123 --force
  speclang errors stats --type=validation
```

### @cli/rollback

```speclang
# @block:cli/rollback @kind:operation
speclang rollback [target] [options]

Rollback to previous state.

Arguments:
  target        Commit hash, file, or cascade ID

Options:
  --depth       Number of commits to rollback (default: 1)
  --strategy    Rollback strategy (revert, reset, selective)
  --dry-run     Show what will be rolled back
  --force       Skip confirmation

Steps:
  1. Identify target commit(s)
  2. Calculate affected files
  3. Show diff to user
  4. Execute rollback
  5. Verify system state

Example:
  speclang rollback HEAD~1
  speclang rollback abc123def
  speclang rollback --depth=3 --dry-run
  speclang rollback specs/auth.scl --strategy=selective
```

### @cli/git-history

```speclang
# @block:cli/git-history @kind:operation
speclang git-history [command] [options]

Query git history and causality chains.

Commands:
  blame <file>  Show who wrote each line
  log <file>    Show commit history for file
  chain <hash>  Show causality chain for commit
  diff <hash>   Show changes in commit
  stats         Show git statistics

Options:
  --limit       Maximum entries to show (default: 20)
  --since       Show since timestamp
  --format      Output format (text, json, yaml)
  --follow      Follow causality chains

Example:
  speclang git-history blame specs/auth.scl
  speclang git-history log specs/auth.scl --limit=10
  speclang git-history chain abc123def --follow
  speclang git-history stats --since="1 week ago"
```

### @cli/messages

```speclang
# @block:cli/messages @kind:operation
speclang messages [command] [options]

Manage MCP messages and continuous improvement loop.

Commands:
  inbox         Show message inbox
  show <id>     Show message details
  respond <id>  Respond to message
  resolve <id>  Mark message as resolved
  escalate <id> Escalate message priority
  stats         Show message statistics

Options:
  --status      Filter by status (new, in_progress, resolved)
  --priority    Filter by priority
  --type        Filter by message type
  --unread      Show only unread messages

Example:
  speclang messages inbox
  speclang messages show msg-123
  speclang messages respond msg-123 --content="Fixed spec"
  speclang messages stats --priority=blocking
```

### @cli/agents

```speclang
# @block:cli/agents @kind:operation
speclang agents [command] [options]

Manage autonomous agents.

Commands:
  list          List all agents
  status <id>   Show agent status
  restart <id>  Restart agent
  logs <id>     Show agent logs
  health        Show system health

Options:
  --role        Filter by agent role
  --since       Show since timestamp
  --follow      Follow logs in real-time
  --verbose     Show detailed information

Example:
  speclang agents list
  speclang agents status spec-writer
  speclang agents logs code-gen --follow
  speclang agents health --verbose
```

### @cli/monitor

```speclang
# @block:cli/monitor @kind:operation
speclang monitor [command] [options]

Monitor system metrics and performance.

Commands:
  metrics       Show current metrics
  alerts        Show active alerts
  logs          Show system logs
  dashboard     Open web dashboard
  report        Generate performance report

Options:
  --interval    Polling interval in seconds
  --since       Show since timestamp
  --until       Show until timestamp
  --format      Output format (text, json, csv)

Example:
  speclang monitor metrics --interval=5
  speclang monitor alerts
  speclang monitor logs --since="1 hour ago"
  speclang monitor report --format=csv > report.csv
```

### @cli/validate

```speclang
# @block:cli/validate @kind:operation
speclang validate [spec] [options]

Run validation on specs.

Arguments:
  spec          Specific spec to validate (optional)

Options:
  --type        Validation type (basic, language-blocks, autonomous)
  --fix         Auto-fix validation issues
  --report      Generate validation report
  --strict      Fail on warnings

Steps:
  1. Parse spec(s)
  2. Run selected validators
  3. Report issues
  4. Auto-fix if requested
  5. Generate report

Example:
  speclang validate
  speclang validate specs/auth.scl --type=language-blocks
  speclang validate --fix --report=validation.json
  speclang validate --strict
```

### @cli/config

```speclang
# @block:cli/config @kind:operation
speclang config [command] [options]

Manage configuration.

Commands:
  get <key>     Get configuration value
  set <key> <value> Set configuration value
  list          List all configuration
  validate      Validate configuration
  reset         Reset to defaults

Options:
  --global      Use global configuration
  --project     Use project configuration
  --format      Output format (json, yaml, text)

Example:
  speclang config get cascade.max_depth
  speclang config set cascade.quiet_period 60
  speclang config list --format=json
  speclang config validate
```

### @cli/help

```speclang
# @block:cli/help @kind:operation
speclang help [command]

Show help information.

Arguments:
  command       Command to show help for (optional)

Options:
  --all         Show all commands
  --markdown    Output in markdown format
  --json        Output in JSON format

Example:
  speclang help
  speclang help cascade
  speclang help --all --markdown > COMMANDS.md
```
