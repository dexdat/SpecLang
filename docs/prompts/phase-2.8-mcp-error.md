# Bootstrap Phase 2.8: MCP Error Handling

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.8 of the bootstrap process.

**Prerequisites**: Phase 2.1 (MCP Server), Phase 2.7 (MCP Auth) complete.

## Your Task
Implement comprehensive error handling with error codes and recovery strategies.

## Read These Specs First
1. `specs/mcp.spec.dir/error-handling.spec.md` - Error categories and strategies

## Error Categories

### 1. Database Errors
```yaml
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
```

### 2. Tool Errors
```yaml
tool_errors:
  invalid_params:
    return: { error: string, code: "INVALID_PARAMS" }
    
  not_found:
    return: { error: string, code: "NOT_FOUND" }
    
  unauthorized:
    return: { error: string, code: "UNAUTHORIZED" }
```

### 3. Transport Errors
```yaml
transport_errors:
  connection_lost:
    action: attempt_reconnect
    max_attempts: 3
    
  parse_error:
    action: log and ignore
```

## Error Codes

```typescript
export enum ErrorCode {
  // Database errors (1xxx)
  DB_BUSY = 1001,
  DB_CONSTRAINT = 1002,
  DB_CORRUPT = 1003,
  DB_NOT_FOUND = 1004,
  DB_MIGRATION = 1005,
  
  // Tool errors (2xxx)
  INVALID_PARAMS = 2001,
  NOT_FOUND = 2002,
  UNAUTHORIZED = 2003,
  FORBIDDEN = 2004,
  RATE_LIMITED = 2005,
  
  // Transport errors (3xxx)
  CONNECTION_LOST = 3001,
  PARSE_ERROR = 3002,
  TIMEOUT = 3003,
  
  // Internal errors (5xxx)
  INTERNAL_ERROR = 5001,
  NOT_IMPLEMENTED = 5002,
  SERVICE_UNAVAILABLE = 5003,
}

export interface MCPError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
  retryAfter?: number;
}
```

## Implementation

### 1. Error Handler (`mcp/errors.ts`)

```typescript
import { Database } from 'better-sqlite3';

interface ErrorConfig {
  retry?: boolean;
  backoff?: 'linear' | 'exponential';
  maxRetries?: number;
  log?: boolean;
  notify?: boolean | string;
  action?: 'exit' | 'continue' | 'reconnect';
  returnMessage?: string;
}

const ERROR_CONFIGS: Record<string, ErrorConfig> = {
  SQLITE_BUSY: {
    retry: true,
    backoff: 'exponential',
    maxRetries: 3,
  },
  SQLITE_CONSTRAINT: {
    log: true,
    notify: false,
    returnMessage: 'Constraint violation - data may already exist',
  },
  SQLITE_CORRUPT: {
    action: 'exit',
    notify: 'admin',
  },
};

export class ErrorHandler {
  private db: Database;
  private notifyFn?: (channel: string, message: string) => void;
  
  constructor(db: Database, notifyFn?: (channel: string, message: string) => void) {
    this.db = db;
    this.notifyFn = notifyFn;
  }
  
  handleDatabaseError(error: any): MCPError {
    const code = error.code || error.message?.match(/^SQLITE_\w+/)?.[0];
    const config = ERROR_CONFIGS[code] || {};
    
    if (config.log !== false) {
      console.error(`[DB Error] ${code}:`, error.message);
    }
    
    if (config.notify) {
      this.notifyFn?.(config.notify === true ? 'errors' : config.notify, error.message);
    }
    
    return {
      code: this.mapDbCode(code),
      message: config.returnMessage || error.message,
      recoverable: config.retry || false,
      retryAfter: config.retry ? 1000 : undefined,
    };
  }
  
  handleToolError(error: any, toolName: string): MCPError {
    if (error.code === 'INVALID_PARAMS') {
      return {
        code: ErrorCode.INVALID_PARAMS,
        message: `Invalid parameters for ${toolName}: ${error.message}`,
        details: error.details,
        recoverable: false,
      };
    }
    
    if (error.code === 'NOT_FOUND') {
      return {
        code: ErrorCode.NOT_FOUND,
        message: error.message || 'Resource not found',
        recoverable: false,
      };
    }
    
    if (error.code === 'UNAUTHORIZED') {
      return {
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
        recoverable: false,
      };
    }
    
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message || 'Internal error',
      recoverable: false,
    };
  }
  
  handleTransportError(error: any): MCPError {
    if (error.code === 'ECONNRESET' || error.code === 'EPIPE') {
      return {
        code: ErrorCode.CONNECTION_LOST,
        message: 'Connection lost',
        recoverable: true,
        retryAfter: 1000,
      };
    }
    
    if (error instanceof SyntaxError) {
      return {
        code: ErrorCode.PARSE_ERROR,
        message: 'Failed to parse message',
        recoverable: false,
      };
    }
    
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
      recoverable: false,
    };
  }
  
  private mapDbCode(code: string): ErrorCode {
    const mapping: Record<string, ErrorCode> = {
      SQLITE_BUSY: ErrorCode.DB_BUSY,
      SQLITE_CONSTRAINT: ErrorCode.DB_CONSTRAINT,
      SQLITE_CORRUPT: ErrorCode.DB_CORRUPT,
      SQLITE_NOTFOUND: ErrorCode.DB_NOT_FOUND,
    };
    return mapping[code] || ErrorCode.INTERNAL_ERROR;
  }
}
```

### 2. Retry Logic with Backoff

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    backoff = 'exponential',
    baseDelay = 100,
    maxDelay = 10000,
    onRetry,
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      const delay = backoff === 'exponential'
        ? Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        : baseDelay * (attempt + 1);
      
      onRetry?.(attempt + 1, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

### 3. Error Response Formatter

```typescript
export function formatErrorResponse(error: MCPError): any {
  return {
    jsonrpc: '2.0',
    error: {
      code: error.code,
      message: error.message,
      data: error.details,
    },
    id: null,
  };
}

export function formatToolError(error: MCPError): any {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          error: error.message,
          code: error.code,
          recoverable: error.recoverable,
        }),
      },
    ],
  };
}
```

### 4. Global Error Handler Middleware

```typescript
export function errorMiddleware(err: any, req: any, res: any, next: () => void) {
  const handler = new ErrorHandler(req.app.locals.db);
  
  let mcpError: MCPError;
  
  if (err.code?.startsWith?.('SQLITE_')) {
    mcpError = handler.handleDatabaseError(err);
  } else if (err.type === 'transport') {
    mcpError = handler.handleTransportError(err);
  } else {
    mcpError = handler.handleToolError(err, req.body?.method || 'unknown');
  }
  
  res.status(mcpError.code >= 5000 ? 500 : 400).json(formatErrorResponse(mcpError));
}
```

## Recovery Strategies

### Database Busy Recovery
```typescript
const result = await withRetry(
  () => db.prepare('SELECT * FROM specs').all(),
  {
    maxRetries: 3,
    backoff: 'exponential',
    baseDelay: 100,
    onRetry: (attempt, error) => {
      console.warn(`DB busy, retry ${attempt}/3`);
    },
  }
);
```

### Connection Recovery
```typescript
class ConnectionManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  
  async handleDisconnect() {
    while (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      try {
        await this.connect();
        this.reconnectAttempts = 0;
        return;
      } catch (error) {
        const delay = 1000 * this.reconnectAttempts;
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    throw new Error('Max reconnect attempts exceeded');
  }
}
```

## Test Cases
1. SQLITE_BUSY retries with exponential backoff
2. SQLITE_CONSTRAINT returns user-friendly message
3. SQLITE_CORRUPT exits and notifies admin
4. Invalid params returns proper error code
5. Not found returns proper error code
6. Connection lost triggers reconnect
7. Parse errors are logged and ignored
8. Retry stops after max attempts
9. Error responses follow JSON-RPC format
10. Tool errors wrapped correctly

## Output
1. ErrorHandler class
2. Error codes enum
3. Retry with backoff utility
4. Error formatters
5. Recovery strategies
6. Integration tests
