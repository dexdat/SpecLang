# speclang-header lines:10
id: "@speclang/opencode-plugin.spec.dir/event-system"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/architecture", "@speclang/opencode"]
tags: [opencode, plugin, events, implementation]
short: Event system integration for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Event System Integration

## Event Types

OpenCode provides these events that the plugin listens to:

- `file.edited`: When any file is edited in the workspace
- `agent.finished`: When an agent finishes its task
- `session.idle`: When a session has been idle for a period
- `file.created`, `file.deleted`: For completeness

## Event Handlers

### File Edited Handler

```speclang
# @block:opencode-plugin/events/file-edited @kind:code
```typescript
events.on("file.edited", async (file: { path: string, content: string }) => {
  // Filter spec files
  if (!isSpecFile(file.path)) return;
  
  // Check ownership
  const session = getCurrentSession();
  if (!await ownsFile(session, file.path)) {
    console.warn(`Session ${session} does not own ${file.path}, ignoring edit`);
    return;
  }
  
  // Parse header and index
  const header = await parseHeader(file.path);
  await indexSpec(db, file.path, header);
  
  // Route to appropriate agent based on file type
  await routeToAgent(file.path, header);
});
```
```

### Agent Finished Handler

```speclang
# @block:opencode-plugin/events/agent-finished @kind:code
```typescript
events.on("agent.finished", async (agent: { name: string, session: string }) => {
  // Check if we've been quiet for convergence period
  const lastEdit = await getLastEditTime(db);
  const quiet = Date.now() - lastEdit > QUIET_PERIOD;
  
  if (quiet && await allAgentsIdle()) {
    await runPipeline();
  }
});
```
```

### Session Idle Handler

```speclang
# @block:opencode-plugin/events/session-idle @kind:code
```typescript
events.on("session.idle", async (session: string) => {
  // Release any ownership locks held by this session
  await releaseOwnership(session);
});
```
```

## Helper Functions

### isSpecFile(path)

```speclang
# @block:opencode-plugin/events/is-spec-file @kind:code
```typescript
function isSpecFile(path: string): boolean {
  return path.match(/\.spec\.(md|yaml)$/) !== null || 
         path.endsWith('.scl') ||
         path.includes('/specs/');
}
```
```

### parseHeader(path)

```speclang
# @block:opencode-plugin/events/parse-header @kind:code
```typescript
async function parseHeader(path: string): Promise<Header> {
  const content = await fs.promises.readFile(path, 'utf-8');
  const lines = content.split('\n');
  const headerLine = lines.find(line => line.includes('speclang-header'));
  if (!headerLine) throw new Error(`No speclang-header in ${path}`);
  
  const match = headerLine.match(/speclang-header lines:(\d+)/);
  const lineCount = match ? parseInt(match[1]) : 0;
  const headerText = lines.slice(0, lineCount).join('\n');
  
  // Parse YAML after the comment line
  const yamlText = headerText.split('\n').slice(1).join('\n');
  return yaml.safeLoad(yamlText);
}
```
```

## References

- "@ref:speclang/opencode-plugin.spec.dir/session-manager (for ownership)"
- @ref:speclang/opencode-plugin.spec.dir/convergence (for pipeline)
- @ref:speclang/spec-format (header format)