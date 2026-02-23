# Bootstrap Phase 2.19: MCP Error Codes

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.19 of the bootstrap process.

**Prerequisites**: Phase 2.8 (MCP Error Handling), Phase 2.16 (Run Modes) complete.

## Your Task
Define comprehensive error codes for the MCP server, including categories, HTTP status mapping, user-friendly messages, and recovery strategies.

## Read These Specs First
1. `specs/mcp.spec.dir/error-handling.spec.md` - Error handling spec

## Error Code Structure

### Error Code Ranges
```typescript
// Error code ranges by category
const ERROR_RANGES = {
  // 1xxx - Database errors
  DATABASE: { min: 1000, max: 1999 },
  
  // 2xxx - Authentication & Authorization
  AUTH: { min: 2000, max: 2999 },
  
  // 3xxx - Transport & Network
  TRANSPORT: { min: 3000, max: 3999 },
  
  // 4xxx - Validation & Input
  VALIDATION: { min: 4000, max: 4999 },
  
  // 5xxx - Resource & Rate Limiting
  RESOURCE: { min: 5000, max: 5999 },
  
  // 6xxx - Tool Execution
  TOOL: { min: 6000, max: 6999 },
  
  // 7xxx - Configuration
  CONFIG: { min: 7000, max: 7999 },
  
  // 9xxx - Internal Errors
  INTERNAL: { min: 9000, max: 9999 }
};
```

## Error Code Definitions

### 1. Database Errors (1xxx)
```typescript
export enum DatabaseErrorCode {
  DB_CONNECTION_FAILED = 1001,
  DB_QUERY_FAILED = 1002,
  DB_CONSTRAINT_VIOLATION = 1003,
  DB_NOT_FOUND = 1004,
  DB_MIGRATION_FAILED = 1005,
  DB_BACKUP_FAILED = 1006,
  DB_LOCK_TIMEOUT = 1007,
  DB_CORRUPT = 1008,
  DB_DISK_FULL = 1009,
  DB_READONLY = 1010,
}
```

### 2. Authentication Errors (2xxx)
```typescript
export enum AuthErrorCode {
  AUTH_REQUIRED = 2001,
  AUTH_INVALID_CREDENTIALS = 2002,
  AUTH_TOKEN_EXPIRED = 2003,
  AUTH_TOKEN_REVOKED = 2004,
  AUTH_INSUFFICIENT_PERMISSIONS = 2005,
  AUTH_API_KEY_INVALID = 2006,
  AUTH_API_KEY_EXPIRED = 2007,
  AUTH_API_KEY_REVOKED = 2008,
  AUTH_RATE_LIMITED = 2009,
  AUTH_ACCOUNT_DISABLED = 2010,
  AUTH_METHOD_NOT_SUPPORTED = 2011,
}
```

### 3. Transport Errors (3xxx)
```typescript
export enum TransportErrorCode {
  TRANSPORT_CONNECTION_FAILED = 3001,
  TRANSPORT_DISCONNECTED = 3002,
  TRANSPORT_TIMEOUT = 3003,
  TRANSPORT_MESSAGE_TOO_LARGE = 3004,
  TRANSPORT_INVALID_MESSAGE = 3005,
  TRANSPORT_PROTOCOL_ERROR = 3006,
  TRANSPORT_UNSUPPORTED_METHOD = 3007,
  TRANSPORT_SSE_DISCONNECTED = 3008,
  TRANSPORT_WEBSOCKET_ERROR = 3009,
}
```

### 4. Validation Errors (4xxx)
```typescript
export enum ValidationErrorCode {
  VALIDATION_INVALID_PARAMS = 4001,
  VALIDATION_MISSING_FIELD = 4002,
  VALIDATION_INVALID_FORMAT = 4003,
  VALIDATION_OUT_OF_RANGE = 4004,
  VALIDATION_DUPLICATE_ENTRY = 4005,
  VALIDATION_DEPENDENCY_NOT_FOUND = 4006,
  VALIDATION_CIRCULAR_DEPENDENCY = 4007,
  VALIDATION_INVALID_REFERENCE = 4008,
  VALIDATION_HEADER_INVALID = 4009,
  VALIDATION_CONTENT_INVALID = 4010,
}
```

### 5. Resource Errors (5xxx)
```typescript
export enum ResourceErrorCode {
  RESOURCE_NOT_FOUND = 5001,
  RESOURCE_ALREADY_EXISTS = 5002,
  RESOURCE_LOCKED = 5003,
  RESOURCE_BUSY = 5004,
  RESOURCE_QUOTA_EXCEEDED = 5005,
  RESOURCE_RATE_LIMIT_EXCEEDED = 5006,
  RESOURCE_TEMPORARILY_UNAVAILABLE = 5007,
  RESOURCE_CONFLICT = 5008,
}
```

### 6. Tool Errors (6xxx)
```typescript
export enum ToolErrorCode {
  TOOL_NOT_FOUND = 6001,
  TOOL_NOT_IMPLEMENTED = 6002,
  TOOL_EXECUTION_FAILED = 6003,
  TOOL_TIMEOUT = 6004,
  TOOL_INVALID_INPUT = 6005,
  TOOL_OUTPUT_TOO_LARGE = 6006,
  TOOL_QUOTA_EXCEEDED = 6007,
  TOOL_DEPENDENCY_FAILED = 6008,
}
```

### 7. Configuration Errors (7xxx)
```typescript
export enum ConfigErrorCode {
  CONFIG_INVALID = 7001,
  CONFIG_MISSING = 7002,
  CONFIG_PERMISSION_DENIED = 7003,
  CONFIG_FORMAT_ERROR = 7004,
  CONFIG_UNSUPPORTED_VERSION = 7005,
  CONFIG_DEPRECATED = 7006,
}
```

### 8. Internal Errors (9xxx)
```typescript
export enum InternalErrorCode {
  INTERNAL_ERROR = 9001,
  NOT_IMPLEMENTED = 9002,
  UNEXPECTED_STATE = 9003,
  UNHANDLED_EXCEPTION = 9004,
  ASSERTION_FAILED = 9005,
  SERVICE_UNAVAILABLE = 9006,
  MAINTENANCE_MODE = 9007,
}
```

## Implementation

### 1. Error Response Format
```typescript
// src/mcp/errors/error-response.ts
interface MCPErrorResponse {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: {
      details?: string;
      field?: string;
      hint?: string;
      traceId?: string;
    };
  };
  id: string | null;
}

interface HTTPErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
  };
  traceId?: string;
  timestamp: string;
  requestId?: string;
}

export class ErrorResponse {
  static jsonRPC(code: number, message: string, id: string | null = null, data?: any): MCPErrorResponse {
    return {
      jsonrpc: '2.0',
      error: {
        code,
        message,
        data
      },
      id
    };
  }
  
  static http(statusCode: number, code: string, message: string, details?: string): HTTPErrorResponse {
    return {
      error: {
        code,
        message,
        details
      },
      traceId: generateTraceId(),
      timestamp: new Date().toISOString()
    };
  }
}

function generateTraceId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
```

### 2. Error Catalog
```typescript
// src/mcp/errors/catalog.ts
export interface ErrorDefinition {
  code: number;
  httpStatus: number;
  message: string;
  userMessage: string;
  details?: string;
  retryable: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const ERROR_CATALOG: Record<number, ErrorDefinition> = {
  // Database errors (1xxx)
  1001: {
    code: 1001,
    httpStatus: 500,
    message: 'Database connection failed',
    userMessage: 'Unable to connect to the database. Please try again later.',
    retryable: true,
    logLevel: 'error'
  },
  1002: {
    code: 1002,
    httpStatus: 500,
    message: 'Database query failed',
    userMessage: 'A database error occurred. Please try again.',
    retryable: true,
    logLevel: 'error'
  },
  1003: {
    code: 1003,
    httpStatus: 409,
    message: 'Database constraint violation',
    userMessage: 'The operation could not be completed due to a data conflict.',
    retryable: false,
    logLevel: 'warn'
  },
  1004: {
    code: 1004,
    httpStatus: 404,
    message: 'Database record not found',
    userMessage: 'The requested resource was not found.',
    retryable: false,
    logLevel: 'info'
  },
  1007: {
    code: 1007,
    httpStatus: 503,
    message: 'Database lock timeout',
    userMessage: 'The database is busy. Please try again.',
    retryable: true,
    logLevel: 'warn'
  },
  
  // Auth errors (2xxx)
  2001: {
    code: 2001,
    httpStatus: 401,
    message: 'Authentication required',
    userMessage: 'Please provide valid authentication credentials.',
    retryable: false,
    logLevel: 'info'
  },
  2002: {
    code: 2002,
    httpStatus: 401,
    message: 'Invalid credentials',
    userMessage: 'The provided credentials are invalid.',
    retryable: false,
    logLevel: 'warn'
  },
  2003: {
    code: 2003,
    httpStatus: 401,
    message: 'Token expired',
    userMessage: 'Your session has expired. Please authenticate again.',
    retryable: false,
    logLevel: 'info'
  },
  2004: {
    code: 2004,
    httpStatus: 401,
    message: 'Token revoked',
    userMessage: 'Your access has been revoked.',
    retryable: false,
    logLevel: 'warn'
  },
  2005: {
    code: 2005,
    httpStatus: 403,
    message: 'Insufficient permissions',
    userMessage: 'You do not have permission to perform this action.',
    retryable: false,
    logLevel: 'warn'
  },
  
  // Transport errors (3xxx)
  3002: {
    code: 3002,
    httpStatus: 503,
    message: 'Transport disconnected',
    userMessage: 'Connection lost. Attempting to reconnect...',
    retryable: true,
    logLevel: 'warn'
  },
  3003: {
    code: 3003,
    httpStatus: 408,
    message: 'Request timeout',
    userMessage: 'The request took too long. Please try again.',
    retryable: true,
    logLevel: 'warn'
  },
  
  // Validation errors (4xxx)
  4001: {
    code: 4001,
    httpStatus: 400,
    message: 'Invalid parameters',
    userMessage: 'The provided parameters are invalid.',
    retryable: false,
    logLevel: 'info'
  },
  4002: {
    code: 4002,
    httpStatus: 400,
    message: 'Missing required field',
    userMessage: 'A required field is missing.',
    retryable: false,
    logLevel: 'info'
  },
  
  // Resource errors (5xxx)
  5001: {
    code: 5001,
    httpStatus: 404,
    message: 'Resource not found',
    userMessage: 'The requested resource was not found.',
    retryable: false,
    logLevel: 'info'
  },
  5003: {
    code: 5003,
    httpStatus: 423,
    message: 'Resource locked',
    userMessage: 'The resource is currently locked. Try again later.',
    retryable: true,
    logLevel: 'warn'
  },
  5006: {
    code: 5006,
    httpStatus: 429,
    message: 'Rate limit exceeded',
    userMessage: 'Too many requests. Please slow down.',
    retryable: true,
    logLevel: 'info'
  },
  
  // Tool errors (6xxx)
  6001: {
    code: 6001,
    httpStatus: 404,
    message: 'Tool not found',
    userMessage: 'The requested tool does not exist.',
    retryable: false,
    logLevel: 'info'
  },
  6002: {
    code: 6002,
    httpStatus: 501,
    message: 'Tool not implemented',
    userMessage: 'This feature is not yet implemented.',
    retryable: false,
    logLevel: 'info'
  },
  
  // Internal errors (9xxx)
  9001: {
    code: 9001,
    httpStatus: 500,
    message: 'Internal error',
    userMessage: 'An unexpected error occurred.',
    retryable: true,
    logLevel: 'error'
  },
  9006: {
    code: 9006,
    httpStatus: 503,
    message: 'Service unavailable',
    userMessage: 'The service is temporarily unavailable.',
    retryable: true,
    logLevel: 'error'
  },
};
```

### 3. Error Handler
```typescript
// src/mcp/errors/handler.ts
import { ERROR_CATALOG } from './catalog';
import { ErrorResponse } from './error-response';

export class ErrorHandler {
  private logErrors: boolean = true;
  
  constructor(options?: { logErrors?: boolean }) {
    this.logErrors = options?.logErrors ?? true;
  }
  
  handleError(
    code: number,
    details?: string,
    options?: {
      field?: string;
      hint?: string;
      id?: string | null;
    }
  ): MCPErrorResponse {
    const errorDef = ERROR_CATALOG[code] || ERROR_CATALOG[9001];
    
    if (this.logErrors && errorDef.logLevel === 'error') {
      console.error(`[ERROR] ${code}: ${errorDef.message}`, {
        details,
        field: options?.field,
        traceId: generateTraceId()
      });
    }
    
    const data: any = {};
    if (details) data.details = details;
    if (options?.field) data.field = options.field;
    if (options?.hint) data.hint = options.hint;
    data.traceId = generateTraceId();
    
    return ErrorResponse.jsonRPC(
      errorDef.code,
      errorDef.userMessage,
      options?.id ?? null,
      Object.keys(data).length > 0 ? data : undefined
    );
  }
  
  handleHTTPError(code: number, details?: string): HTTPErrorResponse {
    const errorDef = ERROR_CATALOG[code] || ERROR_CATALOG[9001];
    
    return ErrorResponse.http(
      errorDef.httpStatus,
      `E${code}`,
      errorDef.userMessage,
      details
    );
  }
  
  // Wrap async functions with error handling
  wrapAsync<T>(
    fn: () => Promise<T>,
    errorCode: number,
    context?: string
  ): Promise<T> {
    return fn().catch(error => {
      console.error(`Error in ${context}:`, error);
      throw this.createError(errorCode, error.message);
    });
  }
  
  createError(code: number, message?: string): Error {
    const error = new Error(message);
    (error as any).code = code;
    return error;
  }
}

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
```

### 4. Express Error Middleware
```typescript
// src/mcp/errors/middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from './handler';
import { ERROR_CATALOG } from './catalog';

export function createErrorMiddleware(handler: ErrorHandler) {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let errorCode = 9001;
    let message = 'An unexpected error occurred';
    
    // Extract error code from error
    if (err.code && ERROR_CATALOG[err.code]) {
      errorCode = err.code;
      const def = ERROR_CATALOG[err.code];
      statusCode = def.httpStatus;
      message = err.message || def.message;
    } else if (err.name === 'ValidationError') {
      errorCode = 4001;
      statusCode = 400;
      message = err.message;
    } else if (err.name === 'UnauthorizedError') {
      errorCode = 2001;
      statusCode = 401;
      message = 'Unauthorized';
    } else if (err.name === 'NotFoundError') {
      errorCode = 5001;
      statusCode = 404;
      message = 'Resource not found';
    }
    
    const response = handler.handleHTTPError(errorCode, err.stack);
    
    res.status(statusCode).json(response);
  };
}
```

### 5. Async Handler Wrapper
```typescript
// src/mcp/errors/async-handler.ts
import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from './handler';

export function asyncHandler(
  handler: ErrorHandler,
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      if (error.code) {
        const response = handler.handleError(
          error.code,
          error.message,
          { id: req.body?.id ?? null }
        );
        res.status(ERROR_CATALOG[error.code]?.httpStatus || 500)
          .json(response);
      } else {
        next(error);
      }
    }
  };
}
```

## HTTP Status Mapping
```typescript
const HTTP_STATUS_MAP: Record<string, number> = {
  // 1xxx -> 5xx
  '1xxx': 500,
  
  // 2xxx -> 401/403
  '2001': 401, // AUTH_REQUIRED
  '2002': 401, // AUTH_INVALID
  '2003': 401, // AUTH_EXPIRED
  '2004': 401, // AUTH_REVOKED
  '2005': 403, // AUTH_FORBIDDEN
  
  // 3xxx -> 503/408
  '3002': 503, // DISCONNECTED
  '3003': 408, // TIMEOUT
  
  // 4xxx -> 400
  '4xxx': 400,
  
  // 5xxx -> 404/409/429
  '5001': 404, // NOT_FOUND
  '5002': 409, // CONFLICT
  '5003': 423, // LOCKED
  '5006': 429, // RATE_LIMIT
  
  // 6xxx -> 500/501
  '6001': 404, // NOT_FOUND
  '6002': 501, // NOT_IMPLEMENTED
  
  // 9xxx -> 500/503
  '9001': 500, // INTERNAL
  '9006': 503, // UNAVAILABLE
};
```

## Test Cases
1. All error codes defined and documented
2. HTTP status mapping correct
3. Error responses include trace IDs
4. User messages are friendly
5. Retryable errors correctly identified
6. Async wrapper catches and handles errors
7. Express middleware formats responses
8. Logging levels correct per error type

## Output
1. Complete error code enum
2. Error catalog with all definitions
3. Error handler class
4. Express middleware
5. Async wrapper
6. Integration tests
