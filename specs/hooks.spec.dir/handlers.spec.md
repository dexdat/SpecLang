---
id: "@speclang/hooks/handlers"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, hooks, handlers]
parent: @ref:specs/hooks
part: 2/2
siblings:
  prev: @ref:specs/hooks.spec.dir/lifecycle
short: "Built-in hook handlers and utilities"
---
# Hook Handlers

Provides built‑in hook utilities for common tasks: notifications, logging, and integration.

## @block:builtinhooks @kind:code

```typescript
export const BuiltInHooks = {
  echo: (message: string): string => `echo "${message}"`,
  
  notifyDiscord: (webhookUrl: string, message: string): string => {
    return `curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '{"content": "${message}"}'`;
  },
  
  notifySlack: (webhookUrl: string, message: string): string => {
    return `curl -X POST -H 'Content-type: application/json' --data '{"text":"${message}"}' "${webhookUrl}"`;
  },
  
  logToFile: (filePath: string, message: string): string => {
    return `echo "[$(date)] ${message}" >> ${filePath}`;
  },
  
  notifyOrchestrator: (message: string): string => {
    // This would integrate with the orchestrator notification system
    return `echo "NOTIFY: ${message}"`;
  },
};
```

## @block:customhook @kind:entity

```typescript
export interface CustomHook {
  name: string;
  script: string;
  description?: string;
}
```

To create a custom hook, define a script string that can be executed by the HookExecutor.