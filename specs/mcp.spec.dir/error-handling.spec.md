# speclang-header lines:11
id: "@speclang/mcp-error-handling"
parent: "@ref:speclang/mcppart: 9/12
siblings:
  next: ""@ref:specs/mcp.spec.dir/sse-streamshort: Error categories and handling strategies
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, speclang]
version: 0.1.0
layer: 3
---
# MCP Error Handling

### @mcp/errors

```speclang
# @block:mcp/errors @kind:entity
ErrorHandling:
  database_errors:
    SQLITE_BUSY:
      retry: true
      backoff: exponential
      max_retries: 3
      
    SQLITE_CONSTRAINT:
      log: true
      notify: false
      return: user-friendly message
      
    SQLITE_CORRUPT:
      action: exit
      notify: admin
      
  tool_errors:
    invalid_params:
      return: { error: string, code: "INVALID_PARAMS" }
      
    not_found:
      return: { error: string, code: "NOT_FOUND" }
      
    unauthorized:
      return: { error: string, code: "UNAUTHORIZED" }
      
  transport_errors:
    connection_lost:
      action: attempt_reconnect
      max_attempts: 3
      
    parse_error:
      action: log and ignore
```
