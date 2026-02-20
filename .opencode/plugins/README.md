# OpenCode Plugins

Custom plugins to extend OpenCode functionality for Speclang.

## What are Plugins?

Plugins are TypeScript/JavaScript extensions that:
- Hook into OpenCode events
- Enforce safety rules
- Provide tools
- Integrate with Speclang daemon

## Plugin Structure

Each plugin is defined in a markdown file with frontmatter:

```yaml
---
name: plugin-name
version: 1.0.0
description: Brief description
author: Your Name
---

# Plugin Name

Plugin documentation and configuration.
```

## Core Plugin

### speclang-guard

The main Speclang plugin:
- Hooks into file events
- Enforces ownership rules
- Manages agent sessions
- Integrates with SQLite
- Commits to git

**Implementation:** `~/.opencode/plugins/speclang.ts`

**Key Features:**
- File ownership enforcement
- Session management
- Event routing
- SQLite integration
- MCP server connection

## Event Hooks

### file.edited
```typescript
events.on("file.edited", async (file) => {
  if (!isSpecFile(file)) return;
  await validateHeader(file);
  await routeToAgent(file);
});
```

### agent.finished
```typescript
events.on("agent.finished", async () => {
  if (await isProjectQuiet(30_000)) {
    await runPipeline();
    await gitCommitPerFile();
  }
});
```

## Guard Plugin

**Ownership Enforcement:**
```typescript
// Intercept writes
if (!isOwner(session, file)) {
  blockWrite();
  logViolation();
  notifyOrchestrator();
}
```

**Exemptions:**
- North Star agent
- User's primary session

## Adding New Plugins

1. Create `speclang.ts` in `~/.opencode/plugins/`
2. Import OpenCode SDK
3. Hook into events
4. Provide tools
5. Restart OpenCode

## References

- SIP 6: Agent Protocol
- SIP 7: Cascade System
- OpenCode Plugin SDK