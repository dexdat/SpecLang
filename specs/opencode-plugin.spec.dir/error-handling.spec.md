# speclang-header lines:10
id: "@speclang/opencode-plugin.spec.dir/error-handling"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/architecture"]
tags: [opencode, plugin, error, handling]
short: Error handling for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Error Handling

## Error Categories

1. **Database errors**: SQLite failures, schema mismatches
2. **File system errors**: Missing spec files, permission denied
3. **Git errors**: Not a git repository, commit failures
4. **MCP errors**: Server connection lost, tool execution failures
5. **Validation errors**: Spec parsing failures, reference resolution failures

## Error Recovery Strategies

- **Retry with backoff**: For transient errors (network, locks)
- **Fallback to default**: Use default values when config missing
- **Graceful degradation**: Disable feature but continue operation
- **User notification**: Log errors and notify via OpenCode UI

## Error Handling Implementation

```speclang
# @block:opencode-plugin/error-handling/wrapper @kind:code
```typescript
async function withErrorHandling<T>(fn: () => Promise<T>, context: string): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    
    // Log to database
    await db.run(
      `INSERT INTO errors (timestamp, context, error_message) VALUES (?, ?, ?)`,
      [Date.now(), context, error.message]
    );
    
    // Notify user via OpenCode UI
    tools.notify?.(`Speclang error in ${context}: ${error.message}`);
    
    return null;
  }
}
```
```

## References

- "@ref:speclang/recovery (recovery system)"