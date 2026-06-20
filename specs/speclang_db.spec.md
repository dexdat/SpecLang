# speclang-header lines:10
id: "@speclang/speclang/db"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [python, generated, auto-generated]
short: "Auto-generated spec for speclang_db.py"
status: draft
---

## @block:speclangdb @kind:entity
```text
class SpeclangDB:
```


## @block:speclangdb/__init__ @kind:code
```typescript
def __init__(self, db_path: str = ".speclang/speclang.db"):
```


## @block:speclangdb/connect @kind:code
```typescript
def connect(self) -> sqlite3.Connection:
```


## @block:speclangdb/close @kind:code
```typescript
def close(self):
```


## @block:speclangdb/__enter__ @kind:code
```typescript
def __enter__(self):
```


## @block:speclangdb/__exit__ @kind:code
```typescript
def __exit__(self, exc_type, exc_val, exc_tb):
```


## @block:speclangdb/initialize @kind:code
```typescript
def initialize(self) -> None:
```


## @block:speclangdb/_create_tables @kind:code
```typescript
def _create_tables(self) -> None:
```


## @block:speclangdb/_create_fts @kind:code
```typescript
def _create_fts(self) -> None:
```


## @block:speclangdb/upsert_spec @kind:code
```typescript
def upsert_spec(self, spec_data: Dict[str, Any]) -> None:
```


## @block:speclangdb/get_spec @kind:code
```typescript
def get_spec(self, file_path: str) -> Optional[Dict[str, Any]]:
```


## @block:speclangdb/get_spec_by_id @kind:code
```typescript
def get_spec_by_id(self, spec_id: str) -> Optional[Dict[str, Any]]:
```


## @block:speclangdb/get_all_specs @kind:code
```typescript
def get_all_specs(self) -> List[Dict[str, Any]]:
```


## @block:speclangdb/get_children @kind:code
```typescript
def get_children(self, parent_id: str) -> List[Dict[str, Any]]:
```


## @block:speclangdb/delete_spec @kind:code
```typescript
def delete_spec(self, file_path: str) -> None:
```


## @block:speclangdb/search_fts @kind:code
```typescript
def search_fts(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
```


## @block:speclangdb/search_by_tag @kind:code
```typescript
def search_by_tag(self, tag: str) -> List[Dict[str, Any]]:
```


## @block:speclangdb/search_by_layer @kind:code
```typescript
def search_by_layer(self, layer: int) -> List[Dict[str, Any]]:
```


## @block:speclangdb/create_session @kind:code
```typescript
def create_session(self, session_id: str, agent: str) -> None:
```


## @block:speclangdb/update_session @kind:code
```typescript
def update_session(self, session_id: str, **kwargs) -> None:
```


## @block:speclangdb/get_session @kind:code
```typescript
def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
```


## @block:speclangdb/insert_event @kind:code
```typescript
def insert_event(self, event_data: Dict[str, Any]) -> None:
```


## @block:speclangdb/get_pending_events @kind:code
```typescript
def get_pending_events(self) -> List[Dict[str, Any]]:
```


## @block:speclangdb/mark_event_processed @kind:code
```typescript
def mark_event_processed(self, event_pk: int, claimed_by: str) -> None:
```


## @block:speclangdb/insert_command @kind:code
```typescript
def insert_command(self, command_data: Dict[str, Any]) -> None:
```


## @block:speclangdb/get_pending_commands @kind:code
```typescript
def get_pending_commands(self, limit: int = 10) -> List[Dict[str, Any]]:
```


## @block:speclangdb/acquire_lock @kind:code
```typescript
def acquire_lock(self, file_path: str, session_id: str, lock_token: str, expires_in: int = 300) -> bool:
```


## @block:speclangdb/release_lock @kind:code
```typescript
def release_lock(self, file_path: str, session_id: str) -> bool:
```


## @block:speclangdb/get_lock @kind:code
```typescript
def get_lock(self, file_path: str) -> Optional[Dict[str, Any]]:
```


## @block:speclangdb/start_cascade @kind:code
```typescript
def start_cascade(self, cascade_id: str, root_trigger_file: str) -> None:
```


## @block:speclangdb/update_cascade_depth @kind:code
```typescript
def update_cascade_depth(self, cascade_id: str, depth: int) -> None:
```


## @block:speclangdb/converge_cascade @kind:code
```typescript
def converge_cascade(self, cascade_id: str) -> None:
```


## @block:speclangdb/get_active_cascades @kind:code
```typescript
def get_active_cascades(self) -> List[Dict[str, Any]]:
```


## @block:speclangdb/get_db @kind:code
```typescript
def get_db(db_path: str = ".speclang/speclang.db") -> SpeclangDB:
```


## @block:speclangdb/init_db @kind:code
```typescript
def init_db(db_path: str = ".speclang/speclang.db") -> SpeclangDB:
```

