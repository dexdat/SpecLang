# speclang-header lines:7
id: "@speclang/mcp.error-handling"
parent: @ref:specs/mcp
part: 9/12
siblings:
  next: @ref:specs/mcp.dir/sse-stream
short: Error categories and handling strategies
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