---
id: "@speclang/pi-extension-examples"
version: 0.1.0
target: src/pi-extension/
layer: 1
tags: [pi, extensions, tools, commands, guard]
imports: ["@speclang/pi-integration", "@speclang/agent-protocol"]
status: draft

project_level: Alpha
agent_support: agent_autonomous
short: Pi Extension Examples for Speclang
---

# Pi Extension Examples

How to write Pi extensions for SpecLang.

## Overview

Pi Agent extensions are TypeScript modules that register custom tools, commands, and event interceptors using the Pi API.

```speclang
# @block:pi-extension/overview @kind:entity
PiExtension:
  registration:
    - pi.registerTool(name, handler, schema)
    - pi.registerCommand(name, handler)
    - onToolCall(callback)
    - onSessionEvent(callback)

  lifecycle:
    - Loaded on daemon start
    - Hot-reloaded via /reload
    - Intercepted calls logged for debugging
```

## Custom Tools

### create_spec_file

```speclang
# @block:pi-extension/tool-create-spec @kind:code
```typescript
import { pi } from '@earendil-works/pi-coding-agent';

pi.registerTool('create_spec_file', async (params, context) => {
  const { file_path, headers, content } = params;
  
  // Validate agent has permission
  const agent = context.session.agent;
  if (!canWriteFile(agent, file_path)) {
    return { error: `Agent ${agent} cannot write to ${file_path}` };
  }
  
  // Generate header and write file
  const header = generateHeader(headers);
  await fs.writeFile(file_path, header + '\n' + (content || ''));
  
  return { success: true, file_path };
}, {
  parameters: {
    file_path: { type: 'string', description: 'Full path to new file' },
    headers: { type: 'object', description: 'YAML header content' },
    content: { type: 'string', description: 'Initial file content', optional: true }
  }
});
```
```

### validate_specs

```speclang
# @block:pi-extension/tool-validate @kind:code
```typescript
pi.registerTool('validate_specs', async (params, context) => {
  const results = [];
  const files = params.files || await glob('specs/**/*.spec.md');
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const errors = validateHeader(content);
    if (errors.length > 0) {
      results.push({ file, errors });
    }
  }
  
  return { valid: results.length === 0, results };
}, {
  parameters: {
    files: { type: 'array', items: { type: 'string' }, optional: true }
  }
});
```
```

### run_cascade

```speclang
# @block:pi-extension/tool-cascade @kind:code
```typescript
pi.registerTool('run_cascade', async (params, context) => {
  const { trigger_file } = params;
  const session = context.session;
  
  // Create Pi agent session for the owning agent
  const agentSession = await pi.createAgentSession({
    agent: determineAgent(trigger_file),
    skills: ['spec-writer'],
    parentSession: session.id
  });
  
  const result = await agentSession.prompt(
    `Process file change: ${trigger_file}\n${await fs.readFile(trigger_file, 'utf-8')}`
  );
  
  return { session_id: agentSession.id, result };
}, {
  parameters: {
    trigger_file: { type: 'string', description: 'Path to changed file' }
  }
});
```
```

## Guard Interceptor

```speclang
# @block:pi-extension/guard @kind:code
```typescript
import { pi } from '@earendil-works/pi-coding-agent';

// Intercept file writes to enforce ownership
pi.onToolCall(async (toolCall, context) => {
  if (toolCall.name === 'edit' || toolCall.name === 'write') {
    const filePath = toolCall.parameters.filePath;
    const agent = context.session?.agent;
    
    if (agent && !isOwnedBy(filePath, agent)) {
      return {
        error: `Ownership violation: ${filePath} is not owned by ${agent}`
      };
    }
  }
  return null; // Allow call to proceed
});
```
```

## Custom Commands

```speclang
# @block:pi-extension/commands @kind:code
```typescript
pi.registerCommand('speclang:status', async (args, context) => {
  return {
    daemon: daemonStatus(),
    agents: activeSessions.map(s => ({
      id: s.id,
      agent: s.agent,
      status: s.status,
      file: s.currentFile
    })),
    queue: eventQueue.length,
    converged: convergenceDetector.isConverged()
  };
});

pi.registerCommand('speclang:cascade', async (args, context) => {
  const [file] = args;
  if (!file) return { error: 'Usage: /speclang:cascade <file>' };
  return await triggerCascade(file);
});
```
```

## See Also

- @ref:specs/pi-integration - Pi Agent integration overview
- @ref:specs/agent-protocol - Agent ownership and guard rules
- @ref:specs/daemon-setup - Daemon setup and configuration
