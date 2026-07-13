# speclang-header lines:12
id: "@speclang/implementation-sqlite-db"
version: 0.1.0
layer: 5
target: src/db/speclang_db.py
parent: ""@ref:speclang/implementationimports: ["@speclang/implementation.sqlite-schema"]
tags: [sqlite, database, python, connection]
short: Python SQLite database module for Speclang
project_level: Alpha
agent_support: agent_autonomous
status: stable
---

# Python SQLite Database Module

Python module for connecting to and querying the Speclang SQLite database.
Allows external systems to connect and interact with spec data.

## Overview

```speclang
# @block:sqlite-py/overview @kind:note
This module provides:
- Database connection management
- CRUD operations for specs
- Query functions for external systems
- Full-text search capabilities
- Session and event management
- File locking for concurrent access
```

## Connection

```speclang
# @block:sqlite-py/connection @kind:entity
Connection:
  init_db: "(db_path) -> SpeclangDB - Initialize and connect"
  get_db: "(db_path) -> SpeclangDB - Get connection"
  
  context_manager:
    - with SpeclangDB(':memory:') as db:
    - db.initialize()
    - # use db
```

## Spec Operations

```speclang
# @block:sqlite-py/spec-ops @kind:entity
SpecOperations:
  upsert_spec: "(spec_data) -> None - Insert or update"
  get_spec: "(file_path) -> Optional[Dict] - Get by path"
  get_spec_by_id: "(spec_id) -> Optional[Dict] - Get by ID"
  get_all_specs: "() -> List[Dict] - Get all specs"
  get_children: "(parent_id) -> List[Dict] - Get child specs"
  delete_spec: "(file_path) -> None - Delete spec"
```

## Search

```speclang
# @block:sqlite-py/search @kind:entity
Search:
  search_fts: "(query, limit) -> List[Dict] - Full-text search"
  search_by_tag: "(tag) -> List[Dict] - Search by tag"
  search_by_layer: "(layer) -> List[Dict] - Search by layer"
```

## Sessions & Events

```speclang
# @block:sqlite-py/sessions @kind:entity
Sessions:
  create_session: "(session_id, agent) -> None"
  update_session: "(session_id, **kwargs) -> None"
  get_session: "(session_id) -> Optional[Dict]"
  
Events:
  insert_event: "(event_data) -> None"
  get_pending_events: "() -> List[Dict]"
  mark_event_processed: "(event_pk, claimed_by) -> None"
```

## Locks

```speclang
# @block:sqlite-py/locks @kind:entity
Locks:
  acquire_lock: "(file_path, session_id, token, expires_in) -> bool"
  release_lock: "(file_path, session_id) -> bool"
  get_lock: "(file_path) -> Optional[Dict]"
```

## Cascades

```speclang
# @block:sqlite-py/cascades @kind:entity
Cascades:
  start_cascade: "(cascade_id, root_trigger_file) -> None"
  update_cascade_depth: "(cascade_id, depth) -> None"
  converge_cascade: "(cascade_id) -> None"
  get_active_cascades: "() -> List[Dict]"
```
