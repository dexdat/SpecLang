# Bootstrap Phase 0.1: SQLite Database

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0 of the bootstrap process.

## Your Task
Implement the SQLite database layer that powers SpecLang's spec indexing, search, and reference tracking.

## Read These Specs First
1. `specs/sqlite.spec.md` - Core database schema and operations
2. `specs/sqlite.spec.dir/schema.spec.md` - Detailed schema definitions

## What to Build

### Files to Create
```
src/db/
├── index.ts          # Main database class
├── types.ts          # TypeScript types for all tables
├── migrations.ts     # Migration system
└── search.ts         # FTS5 and vector search

tests/
└── db.test.ts        # Comprehensive tests
```

### Requirements

#### 1. Tables (from sqlite.spec.md)
- `specs` - Spec files with metadata
- `blocks` - Named blocks within specs
- `refs` - Reference graph (@ref: links)
- `agents` - Agent session registry
- `locks` - File locks for concurrent access
- `commands` - Command queue for agents
- `events` - Cascade event log

#### 2. FTS5 Search
- Full-text search across spec content
- Search by ID, tags, content
- Support phrase matching

#### 3. Vector Search (Stub)
- Placeholder for embedding-based search
- Interface for future implementation

#### 4. Reference Graph
- Store all @ref: connections
- Query dependencies (what does X depend on?)
- Query dependents (what depends on X?)
- Detect cycles

#### 5. Migration System
- Versioned migrations
- Automatic migration on startup
- Rollback support

### Code Quality
- Use `bun:sqlite` or `better-sqlite3`
- All database operations should be typed
- Include JSDoc comments referencing spec blocks
- Handle errors gracefully

## Validation
After implementation, run:
```bash
bun test tests/db.test.ts
```

All tests must pass before proceeding to Phase 0.2.

## Output Format
After completing, output:
1. List of files created
2. Test results
3. Any deviations from the spec (with justification)
