# speclang-header lines:11
id: "@speclang/scripts.generate-sqlite-schema"
version: 0.1.0
layer: 2
tags: [scripts, generation, sqlite]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Generate SQLite Schema Script
target: scripts/generate_sqlite_schema.py
---

# Generate SQLite Schema Script

Script that generates SQLite database schema from SpecLang specification definitions.

## Overview

```speclang
# @block:overview @kind:note
The generate-sqlite-schema script analyzes specs that define database entities
and generates a complete SQLite schema with tables, indexes, and constraints.
It reads entity definitions from specs and produces SQL that can be executed
to create the database.
```

## Purpose

```speclang
# @block:purpose @kind:note
Database schemas are typically defined separately from specs, causing drift.
This script:
1. Reads entity definitions from specs
2. Extracts field types, constraints, relationships
3. Generates complete SQLite schema
4. Supports indexes, foreign keys, and triggers
5. Enables schema versioning and migrations
```

## Input Format

```speclang
# @block:input @kind:entity
InputSpec:
  format: SpecLang .spec.md or .spec.yaml
  contains: @kind:entity blocks with field definitions
  example:
    entity: User
    fields:
      - name: id
        type: INTEGER
        primary_key: true
      - name: email
        type: TEXT
        unique: true
      - name: created_at
        type: TIMESTAMP
```

## Output

```speclang
# @block:output @kind:note
Generates SQL file with:
1. CREATE TABLE statements
2. CREATE INDEX statements
3. FOREIGN KEY constraints
4. Default values
5. Comments from spec documentation
```

## Implementation

```speclang
# @block:implementation @kind:function
def generate_sqlite_schema(spec_paths: list[str], output_file: str) -> dict:
    """
    Generate SQLite schema from spec definitions.
    
    Args:
        spec_paths: List of spec files to analyze
        output_file: Path to write SQL schema
    
    Returns:
        Dict with tables_created, indexes_created, errors
    """
```

## Supported Field Types

```speclang
# @block:field-types @kind:table
| Spec Type | SQLite Type | Notes |
|-----------|-------------|-------|
| INTEGER | INTEGER | Primary keys, counters |
| TEXT | TEXT | Strings, UUIDs |
| REAL | REAL | Floating point |
| BLOB | BLOB | Binary data |
| BOOLEAN | INTEGER | 0 or 1 |
| TIMESTAMP | TEXT | ISO 8601 format |
| JSON | TEXT | JSON stored as text |
| UUID | TEXT | String representation |
```

## Field Options

```speclang
# @block:field-options @kind:entity
FieldOptions:
  constraints:
    - primary_key: Mark as primary key
    - unique: Unique constraint
    - not_null: NOT NULL constraint
    - default: Default value
    - check: CHECK constraint
  
  relationships:
    - foreign_key: Reference to another table
    - on_delete: CASCADE, SET NULL, etc.
  
  indexes:
    - indexed: Create index for this field
    - index_name: Custom index name
```

## Usage

```speclang
# @block:usage @kind:note
# Generate schema from single spec
python3 scripts/generate_sqlite_schema.py specs/db/users.spec.md

# Generate from multiple specs
python3 scripts/generate_sqlite_schema.py specs/db/*.spec.md -o schema.sql

# Generate with migrations
python3 scripts/generate_sqlite_schema.py specs/db/ --migrations

# Dry run to see output
python3 scripts/generate_sqlite_schema.py specs/db/ --dry-run
```

## Examples

```speclang
# @block:example @kind:note
Input (spec):
  ### @block::user @kind:entity
  User:
    id: INTEGER PRIMARY KEY
    email: TEXT UNIQUE NOT NULL
    name: TEXT
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Output (SQL):
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX idx_users_email ON users(email);
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/sqlite - SQLite specification
- @ref:speclang/scripts.generate-from-spec - Generic generation
- @ref:speclang/scripts.validate-refs - Reference validation
