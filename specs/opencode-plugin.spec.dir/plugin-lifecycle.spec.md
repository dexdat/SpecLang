# speclang-header lines:9
id: "@speclang/opencode-plugin.spec.dir/plugin-lifecycle"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/overview"]
tags: [opencode, plugin, lifecycle]
short: Plugin lifecycle for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Plugin Lifecycle

## Phases

1. **Initialization**: Plugin loads, reads config, sets up database, connects to MCP server.
2. **Active Monitoring**: Listens to events, routes changes, manages ownership.
3. **Convergence Detection**: Monitors quiet period, runs pipeline.
4. **Shutdown**: Releases locks, closes connections, saves state.

## Lifecycle Hooks

```speclang
# @block:opencode-plugin/lifecycle/hooks @kind:code
```typescript
export const Speclang: Plugin = async ({ events, db, tools }) => {
  // Initialization
  await initialize(db);
  await connectToMCP();
  
  // Event listeners setup
  events.on("file.edited", handleFileEdited);
  events.on("agent.finished", handleAgentFinished);
  events.on("session.idle", handleSessionIdle);
  
  // Return cleanup function
  return async () => {
    await releaseAllOwnership();
    await disconnectMCP();
  };
};
```
```

## Initialization Details

```speclang
# @block:opencode-plugin/lifecycle/initialize @kind:code
```typescript
async function initialize(db: Database): Promise<void> {
  // Create tables if not exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS specs (...);
    CREATE TABLE IF NOT EXISTS sessions (...);
    CREATE TABLE IF NOT EXISTS events (...);
    CREATE TABLE IF NOT EXISTS file_locks (...);
  `);
  
  // Load configuration
  const config = await loadConfig();
  
  // Start convergence checker interval
  setInterval(checkConvergence, 5000);
}
```
```

## References

- "@ref:speclang/opencode-plugin.spec.dir/overview (overview)
- @ref:speclang/opencode-plugin.spec.dir/configuration (config)