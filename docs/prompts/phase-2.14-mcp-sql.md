# Bootstrap Phase 2.14: MCP SQL Query Tools

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.14 of the bootstrap process.

**Prerequisites**: 
- Phase 2.1-2.12 (MCP components) complete
- Phase 2.13 (Lock Management) complete

## Your Task
Implement MCP tools for SQL query execution that provide direct database access for spec indexing and search.

## Read These Specs First
1. `specs/mcp.spec.dir/overview.spec.md` - MCP server overview
2. `specs/mcp.spec.dir/sql-queries.spec.md` - SQL query tools
3. `specs/database.spec.md` - Database schema

## What to Build

### Files to Create
```
src/mcp/
├── sql/
│   ├── index.ts            # Main exports
│   ├── query-builder.ts   # Safe query builder
│   ├── tools.ts            # MCP tool definitions
│   ├── sanitizer.ts       # SQL sanitization
│   └── history.ts         # Query history
```

### Requirements

#### 1. SQL Sanitizer (sanitizer.ts)

```typescript
export class SQLSanitizer {
  private dangerousPatterns = [
    /;\s*drop\s+table/i,
    /;\s*delete\s+from\s+[^;]+--/i,
    /;\s*truncate/i,
    /;\s*alter\s+table/i,
    /;\s*create\s+table/i,
    /insert\s+into\s+.*\s+values\s*\(\s*select/i,
    /\/\*.*\*\//,
    /union\s+select.*\s+from/i,
    /--\s*$/m
  ];
  
  private allowedTables = [
    'specs',
    'refs',
    'commands',
    'errors',
    'locks',
    'sessions'
  ];
  
  sanitize(sql: string): { valid: boolean; error?: string } {
    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(sql)) {
        return { valid: false, error: 'Potentially dangerous SQL pattern detected' };
      }
    }
    
    // Check table references
    const tableMatch = sql.match(/(?:from|into|update|table)\s+(\w+)/i);
    if (tableMatch) {
      const table = tableMatch[1].toLowerCase();
      if (!this.allowedTables.includes(table)) {
        return { valid: false, error: `Table not allowed: ${table}` };
      }
    }
    
    return { valid: true };
  }
  
  validateSelect(sql: string): boolean {
    const trimmed = sql.trim().toLowerCase();
    return trimmed.startsWith('select');
  }
  
  extractTables(sql: string): string[] {
    const matches = sql.matchAll(/(?:from|into|update|join)\s+(\w+)/gi);
    return [...matches].map(m => m[1].toLowerCase());
  }
}
```

#### 2. Query Builder (query-builder.ts)

```typescript
import { SQLSanitizer } from './sanitizer';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export class QueryBuilder {
  private sanitizer: SQLSanitizer;
  
  constructor() {
    this.sanitizer = new SQLSanitizer();
  }
  
  buildSpecQuery(options: QueryOptions & { 
    id?: string; 
    tags?: string[];
    layer?: number;
    search?: string;
  }): string {
    const conditions: string[] = [];
    const params: string[] = [];
    
    if (options.id) {
      conditions.push('id = ?');
      params.push(options.id);
    }
    
    if (options.tags && options.tags.length > 0) {
      conditions.push(`tags LIKE ?`);
      params.push(`%${options.tags[0]}%`);
    }
    
    if (options.layer !== undefined) {
      conditions.push('layer = ?');
      params.push(options.layer.toString());
    }
    
    if (options.search) {
      conditions.push('(content LIKE ? OR id LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    
    let sql = 'SELECT * FROM specs';
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    if (options.orderBy) {
      sql += ` ORDER BY ${this.escapeIdentifier(options.orderBy)}`;
      if (options.order) {
        sql += ` ${options.order.toUpperCase()}`;
      }
    }
    
    if (options.limit) {
      sql += ` LIMIT ${parseInt(options.limit.toString(), 10)}`;
    }
    
    if (options.offset) {
      sql += ` OFFSET ${parseInt(options.offset.toString(), 10)}`;
    }
    
    const sanitized = this.sanitizer.sanitize(sql);
    if (!sanitized.valid) {
      throw new Error(sanitized.error);
    }
    
    return sql;
  }
  
  buildRefQuery(options: { sourceId?: string; targetId?: string }): string {
    const conditions: string[] = [];
    
    if (options.sourceId) {
      conditions.push(`source_id = '${this.escapeString(options.sourceId)}'`);
    }
    
    if (options.targetId) {
      conditions.push(`target_id = '${this.escapeString(options.targetId)}'`);
    }
    
    let sql = 'SELECT * FROM refs';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    return sql;
  }
  
  buildCommandQuery(options: QueryOptions & { 
    sessionId?: string;
    status?: string;
  }): string {
    const conditions: string[] = [];
    
    if (options.sessionId) {
      conditions.push(`session_id = '${this.escapeString(options.sessionId)}'`);
    }
    
    if (options.status) {
      conditions.push(`status = '${this.escapeString(options.status)}'`);
    }
    
    let sql = 'SELECT * FROM commands';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    if (options.orderBy) {
      sql += ` ORDER BY ${this.escapeIdentifier(options.orderBy)}`;
    }
    
    if (options.limit) {
      sql += ` LIMIT ${parseInt(options.limit.toString(), 10)}`;
    }
    
    return sql;
  }
  
  buildErrorQuery(options: QueryOptions & { 
    sessionId?: string;
    level?: string;
  }): string {
    const conditions: string[] = [];
    
    if (options.sessionId) {
      conditions.push(`session_id = '${this.escapeString(options.sessionId)}'`);
    }
    
    if (options.level) {
      conditions.push(`level = '${this.escapeString(options.level)}'`);
    }
    
    let sql = 'SELECT * FROM errors';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    if (options.orderBy) {
      sql += ` ORDER BY ${this.escapeIdentifier(options.orderBy)}`;
    } else {
      sql += ' ORDER BY timestamp DESC';
    }
    
    if (options.limit) {
      sql += ` LIMIT ${parseInt(options.limit.toString(), 10)}`;
    }
    
    return sql;
  }
  
  private escapeString(str: string): string {
    return str.replace(/'/g, "''");
  }
  
  private escapeIdentifier(identifier: string): string {
    return identifier.replace(/[^\w]/g, '');
  }
}
```

#### 3. Query History (history.ts)

```typescript
export interface QueryHistoryEntry {
  id: string;
  sql: string;
  sessionId: string;
  timestamp: number;
  duration: number;
  rowsReturned: number;
  error?: string;
}

export class QueryHistory {
  private history: QueryHistoryEntry[] = [];
  private maxEntries = 1000;
  
  add(entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>): string {
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.history.unshift({
      ...entry,
      id,
      timestamp: Date.now()
    });
    
    // Trim old entries
    if (this.history.length > this.maxEntries) {
      this.history = this.history.slice(0, this.maxEntries);
    }
    
    return id;
  }
  
  get(sessionId?: string, limit = 100): QueryHistoryEntry[] {
    let results = this.history;
    
    if (sessionId) {
      results = results.filter(e => e.sessionId === sessionId);
    }
    
    return results.slice(0, limit);
  }
  
  getById(id: string): QueryHistoryEntry | undefined {
    return this.history.find(e => e.id === id);
  }
  
  clear(sessionId?: string): number {
    const before = this.history.length;
    
    if (sessionId) {
      this.history = this.history.filter(e => e.sessionId !== sessionId);
    } else {
      this.history = [];
    }
    
    return before - this.history.length;
  }
  
  getStats(): { total: number; bySession: Record<string, number>; errors: number } {
    const bySession: Record<string, number> = {};
    let errors = 0;
    
    for (const entry of this.history) {
      bySession[entry.sessionId] = (bySession[entry.sessionId] || 0) + 1;
      if (entry.error) errors++;
    }
    
    return {
      total: this.history.length,
      bySession,
      errors
    };
  }
}
```

#### 4. MCP Tools (tools.ts)

```typescript
import { QueryBuilder } from './query-builder';
import { QueryHistory } from './history';
import { SQLSanitizer } from './sanitizer';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
}

export function createSQLTools(db: Database): MCPTool[] {
  const builder = new QueryBuilder();
  const history = new QueryHistory();
  const sanitizer = new SQLSanitizer();
  
  return [
    {
      name: 'speclang_query',
      description: 'Execute a raw SQL query',
      inputSchema: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'SQL query to execute (SELECT only)'
          },
          sessionId: {
            type: 'string',
            description: 'Session ID for history tracking'
          },
          params: {
            type: 'array',
            items: { type: 'string' },
            description: 'Query parameters'
          }
        },
        required: ['sql', 'sessionId']
      }
    },
    {
      name: 'speclang_query_specs',
      description: 'Query specs with filters',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
          layer: { type: 'number', description: 'Filter by layer' },
          search: { type: 'string', description: 'Search in content' },
          limit: { type: 'number', description: 'Result limit' },
          offset: { type: 'number', description: 'Result offset' },
          sessionId: { type: 'string', description: 'Session ID' }
        },
        required: ['sessionId']
      }
    },
    {
      name: 'speclang_query_refs',
      description: 'Query references',
      inputSchema: {
        type: 'object',
        properties: {
          sourceId: { type: 'string', description: 'Source spec ID' },
          targetId: { type: 'string', description: 'Target spec ID' },
          sessionId: { type: 'string', description: 'Session ID' }
        },
        required: ['sessionId']
      }
    },
    {
      name: 'speclang_query_commands',
      description: 'Query pending commands',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Filter by session' },
          status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
          limit: { type: 'number', description: 'Result limit' }
        },
        required: ['sessionId']
      }
    },
    {
      name: 'speclang_query_errors',
      description: 'Query error logs',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Filter by session' },
          level: { type: 'string', enum: ['error', 'warn', 'info'] },
          limit: { type: 'number', description: 'Result limit' }
        },
        required: ['sessionId']
      }
    },
    {
      name: 'speclang_query_history',
      description: 'Get query history',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Filter by session' },
          limit: { type: 'number', description: 'Result limit' }
        }
      }
    }
  ];
}

export async function handleSQLTool(
  toolName: string,
  input: unknown,
  db: Database,
  history: QueryHistory,
  builder: QueryBuilder,
  sanitizer: SQLSanitizer
): Promise<unknown> {
  const startTime = Date.now();
  let rowsReturned = 0;
  let error: string | undefined;
  
  try {
    switch (toolName) {
      case 'speclang_query': {
        const { sql, sessionId, params } = input as { sql: string; sessionId: string; params?: string[] };
        
        // Validate
        const sanitized = sanitizer.sanitize(sql);
        if (!sanitized.valid) {
          throw new Error(sanitized.error);
        }
        
        if (!sanitizer.validateSelect(sql)) {
          throw new Error('Only SELECT queries are allowed');
        }
        
        const result = params ? db.query(sql, params) : db.query(sql);
        rowsReturned = result.length;
        
        history.add({ sql, sessionId, duration: Date.now() - startTime, rowsReturned });
        
        return { rows: result, count: result.length };
      }
      
      case 'speclang_query_specs': {
        const { sessionId, ...options } = input as { sessionId: string; [key: string]: unknown };
        const sql = builder.buildSpecQuery(options as any);
        
        const result = db.query(sql);
        rowsReturned = result.length;
        
        history.add({ sql, sessionId, duration: Date.now() - startTime, rowsReturned });
        
        return { specs: result, count: result.length };
      }
      
      case 'speclang_query_refs': {
        const { sessionId, ...options } = input as { sessionId: string; [key: string]: unknown };
        const sql = builder.buildRefQuery(options as any);
        
        const result = db.query(sql);
        rowsReturned = result.length;
        
        history.add({ sql, sessionId, duration: Date.now() - startTime, rowsReturned });
        
        return { refs: result, count: result.length };
      }
      
      case 'speclang_query_commands': {
        const { sessionId, ...options } = input as { sessionId: string; [key: string]: unknown };
        const sql = builder.buildCommandQuery({ sessionId, ...options } as any);
        
        const result = db.query(sql);
        rowsReturned = result.length;
        
        history.add({ sql, sessionId, duration: Date.now() - startTime, rowsReturned });
        
        return { commands: result, count: result.length };
      }
      
      case 'speclang_query_errors': {
        const { sessionId, ...options } = input as { sessionId: string; [key: string]: unknown };
        const sql = builder.buildErrorQuery({ sessionId, ...options } as any);
        
        const result = db.query(sql);
        rowsReturned = result.length;
        
        history.add({ sql, sessionId: sessionId || 'system', duration: Date.now() - startTime, rowsReturned });
        
        return { errors: result, count: result.length };
      }
      
      case 'speclang_query_history': {
        const { sessionId, limit } = input as { sessionId?: string; limit?: number };
        return { history: history.get(sessionId, limit) };
      }
      
      default:
        throw new Error(`Unknown SQL tool: ${toolName}`);
    }
  } catch (e) {
    error = (e as Error).message;
    throw e;
  }
}

interface Database {
  query(sql: string, params?: string[]): unknown[];
}
```

#### 5. Main Exports (index.ts)

```typescript
export * from './query-builder';
export * from './sanitizer';
export * from './history';
export * from './tools';

export { QueryBuilder } from './query-builder';
export { SQLSanitizer } from './sanitizer';
export { QueryHistory } from './history';
export { createSQLTools, handleSQLTool } from './tools';
```

## Test Cases
1. Execute valid SELECT query
2. Reject dangerous SQL patterns
3. Reject non-SELECT queries
4. Query specs with filters
5. Query refs
6. Query commands
7. Query errors
8. Query history
9. Track query performance
10. Limit results correctly

## Validation
```bash
bun test tests/mcp/sql.test.ts

# Manual test
node -e "
const { QueryBuilder } = require('./dist/mcp/sql');
const b = new QueryBuilder();
console.log(b.buildSpecQuery({ search: 'auth', limit: 10 }));
"
```

## Output Format
After completing, output:
1. Files created
2. Tools registered
3. Test results
