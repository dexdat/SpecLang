#!/usr/bin/env python3
"""
Speclang SQLite Database Module

Python module for connecting to and querying the Speclang SQLite database.
Allows external systems to connect and interact with spec data.
"""
# speclang-header lines:3
# target: src/db/speclang_db.py

import sqlite3
import json
import os
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path


class SpeclangDB:
    """Speclang SQLite database connection and query interface."""
    
    def __init__(self, db_path: str = ".speclang/speclang.db"):
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None
    
    def connect(self) -> sqlite3.Connection:
        """Connect to the database. Creates db directory if needed."""
        # Ensure db directory exists
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
        
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        return self.conn
    
    def close(self):
        """Close the database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
    
    # ============================================
    # Connection & Schema
    # ============================================
    
    def initialize(self) -> None:
        """Initialize the database with schema."""
        if not self.conn:
            self.connect()
        
        # Create tables
        self._create_tables()
        self._create_fts()
    
    def _create_tables(self) -> None:
        """Create all database tables."""
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS specs (
              file_path TEXT PRIMARY KEY,
              id TEXT NOT NULL,
              parent_id TEXT,
              children TEXT,
              owner_session TEXT,
              depends_on TEXT,
              tags TEXT,
              short_desc TEXT,
              header_raw TEXT,
              content_raw TEXT,
              content_embedding BLOB,
              parsed_json TEXT,
              part INTEGER DEFAULT 1,
              total_parts INTEGER DEFAULT 1,
              last_edited INTEGER,
              git_commit TEXT
            );
            
            CREATE TABLE IF NOT EXISTS sessions (
              session_id TEXT PRIMARY KEY,
              agent TEXT,
              status TEXT,
              current_file TEXT,
              created INTEGER,
              last_active INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS events (
              event_pk INTEGER PRIMARY KEY,
              cascade_id TEXT,
              depth INTEGER,
              trigger_file TEXT,
              agent TEXT,
              output_files TEXT,
              timestamp INTEGER,
              processed INTEGER DEFAULT 0,
              claimed_by TEXT
            );
            
            CREATE TABLE IF NOT EXISTS commands (
              command_id TEXT PRIMARY KEY,
              cascade_id TEXT,
              action TEXT,
              target_file TEXT,
              session_id TEXT,
              payload TEXT,
              priority INTEGER DEFAULT 0,
              status TEXT,
              created_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS cascades (
              cascade_id TEXT PRIMARY KEY,
              depth INTEGER DEFAULT 0,
              status TEXT DEFAULT 'active',
              started_at INTEGER,
              converged_at INTEGER,
              root_trigger_file TEXT
            );
            
            CREATE TABLE IF NOT EXISTS file_locks (
              file_path TEXT PRIMARY KEY,
              session_id TEXT,
              lock_token TEXT,
              acquired_at INTEGER,
              expires_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS recovery (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp INTEGER,
              operation TEXT,
              state TEXT,
              recovered INTEGER DEFAULT 0
            );
        """)
        self.conn.commit()
    
    def _create_fts(self) -> None:
        """Create full-text search virtual table."""
        self.conn.executescript("""
            CREATE VIRTUAL TABLE IF NOT EXISTS specs_fts USING fts5(
              id, short_desc, header_raw, content_raw,
              content='specs',
              content_rowid='rowid'
            );
        """)
        self.conn.commit()
    
    # ============================================
    # Spec Operations (CRUD)
    # ============================================
    
    def upsert_spec(self, spec_data: Dict[str, Any]) -> None:
        """Insert or update a spec."""
        self.conn.execute("""
            INSERT INTO specs (
              file_path, id, parent_id, children, owner_session,
              depends_on, tags, short_desc, header_raw, content_raw,
              content_embedding, parsed_json, part, total_parts,
              last_edited, git_commit
            ) VALUES (
              :file_path, :id, :parent_id, :children, :owner_session,
              :depends_on, :tags, :short_desc, :header_raw, :content_raw,
              :content_embedding, :parsed_json, :part, :total_parts,
              :last_edited, :git_commit
            ) ON CONFLICT(file_path) DO UPDATE SET
              id = excluded.id,
              parent_id = excluded.parent_id,
              children = excluded.children,
              owner_session = excluded.owner_session,
              depends_on = excluded.depends_on,
              tags = excluded.tags,
              short_desc = excluded.short_desc,
              header_raw = excluded.header_raw,
              content_raw = excluded.content_raw,
              content_embedding = excluded.content_embedding,
              parsed_json = excluded.parsed_json,
              part = excluded.part,
              total_parts = excluded.total_parts,
              last_edited = excluded.last_edited,
              git_commit = excluded.git_commit
        """, spec_data)
        self.conn.commit()
    
    def get_spec(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get a spec by file path."""
        row = self.conn.execute(
            "SELECT * FROM specs WHERE file_path = ?", (file_path,)
        ).fetchone()
        return dict(row) if row else None
    
    def get_spec_by_id(self, spec_id: str) -> Optional[Dict[str, Any]]:
        """Get a spec by ID."""
        row = self.conn.execute(
            "SELECT * FROM specs WHERE id = ?", (spec_id,)
        ).fetchone()
        return dict(row) if row else None
    
    def get_all_specs(self) -> List[Dict[str, Any]]:
        """Get all specs."""
        rows = self.conn.execute("SELECT * FROM specs").fetchall()
        return [dict(row) for row in rows]
    
    def get_children(self, parent_id: str) -> List[Dict[str, Any]]:
        """Get all children of a spec."""
        rows = self.conn.execute(
            "SELECT * FROM specs WHERE parent_id = ?", (parent_id,)
        ).fetchall()
        return [dict(row) for row in rows]
    
    def delete_spec(self, file_path: str) -> None:
        """Delete a spec."""
        self.conn.execute("DELETE FROM specs WHERE file_path = ?", (file_path,))
        self.conn.commit()
    
    # ============================================
    # Search Operations
    # ============================================
    
    def search_fts(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Full-text search on specs."""
        rows = self.conn.execute("""
            SELECT s.* FROM specs s
            JOIN specs_fts fts ON s.rowid = fts.rowid
            WHERE specs_fts MATCH ?
            LIMIT ?
        """, (query, limit)).fetchall()
        return [dict(row) for row in rows]
    
    def search_by_tag(self, tag: str) -> List[Dict[str, Any]]:
        """Search specs by tag."""
        rows = self.conn.execute("""
            SELECT * FROM specs WHERE tags LIKE ?
        """, (f'%"{tag}"%',)).fetchall()
        return [dict(row) for row in rows]
    
    def search_by_layer(self, layer: int) -> List[Dict[str, Any]]:
        """Search specs by layer (requires parsed_json extraction)."""
        # Layer is stored in parsed_json.header.layer
        rows = self.conn.execute("""
            SELECT * FROM specs WHERE parsed_json LIKE ?
        """, (f'%layer": {layer}%',)).fetchall()
        return [dict(row) for row in rows]
    
    # ============================================
    # Session Operations
    # ============================================
    
    def create_session(self, session_id: str, agent: str) -> None:
        """Create a new session."""
        import time
        now = int(time.time())
        self.conn.execute("""
            INSERT INTO sessions (session_id, agent, status, created, last_active)
            VALUES (?, ?, 'active', ?, ?)
        """, (session_id, agent, now, now))
        self.conn.commit()
    
    def update_session(self, session_id: str, **kwargs) -> None:
        """Update session fields."""
        import time
        fields = ", ".join(f"{k} = ?" for k in kwargs.keys())
        values = list(kwargs.values()) + [int(time.time()), session_id]
        self.conn.execute(f"""
            UPDATE sessions SET {fields}, last_active = ? WHERE session_id = ?
        """, values)
        self.conn.commit()
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID."""
        row = self.conn.execute(
            "SELECT * FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        return dict(row) if row else None
    
    # ============================================
    # Event & Command Queue
    # ============================================
    
    def insert_event(self, event_data: Dict[str, Any]) -> None:
        """Insert an event."""
        self.conn.execute("""
            INSERT INTO events (cascade_id, depth, trigger_file, agent, output_files, timestamp)
            VALUES (:cascade_id, :depth, :trigger_file, :agent, :output_files, :timestamp)
        """, event_data)
        self.conn.commit()
    
    def get_pending_events(self) -> List[Dict[str, Any]]:
        """Get unprocessed events."""
        rows = self.conn.execute("""
            SELECT * FROM events WHERE processed = 0 ORDER BY timestamp
        """).fetchall()
        return [dict(row) for row in rows]
    
    def mark_event_processed(self, event_pk: int, claimed_by: str) -> None:
        """Mark event as processed."""
        self.conn.execute("""
            UPDATE events SET processed = 1, claimed_by = ? WHERE event_pk = ?
        """, (claimed_by, event_pk))
        self.conn.commit()
    
    def insert_command(self, command_data: Dict[str, Any]) -> None:
        """Insert a command."""
        self.conn.execute("""
            INSERT INTO commands (command_id, cascade_id, action, target_file, session_id, payload, priority, status, created_at)
            VALUES (:command_id, :cascade_id, :action, :target_file, :session_id, :payload, :priority, :status, :created_at)
        """, command_data)
        self.conn.commit()
    
    def get_pending_commands(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get pending commands ordered by priority."""
        rows = self.conn.execute("""
            SELECT * FROM commands WHERE status = 'pending' ORDER BY priority DESC, created_at LIMIT ?
        """, (limit,)).fetchall()
        return [dict(row) for row in rows]
    
    # ============================================
    # Locking
    # ============================================
    
    def acquire_lock(self, file_path: str, session_id: str, lock_token: str, expires_in: int = 300) -> bool:
        """Acquire a file lock. Returns True if successful."""
        import time
        now = int(time.time())
        expires_at = now + expires_in
        
        try:
            self.conn.execute("""
                INSERT INTO file_locks (file_path, session_id, lock_token, acquired_at, expires_at)
                VALUES (?, ?, ?, ?, ?)
            """, (file_path, session_id, lock_token, now, expires_at))
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            # Lock already exists, check if expired
            row = self.conn.execute(
                "SELECT * FROM file_locks WHERE file_path = ?", (file_path,)
            ).fetchone()
            if row and row['expires_at'] < now:
                # Expired, can take it
                self.conn.execute("""
                    UPDATE file_locks SET session_id = ?, lock_token = ?, acquired_at = ?, expires_at = ?
                    WHERE file_path = ?
                """, (session_id, lock_token, now, expires_at, file_path))
                self.conn.commit()
                return True
            return False
    
    def release_lock(self, file_path: str, session_id: str) -> bool:
        """Release a file lock. Returns True if successful."""
        self.conn.execute("""
            DELETE FROM file_locks WHERE file_path = ? AND session_id = ?
        """, (file_path, session_id))
        self.conn.commit()
        return self.conn.total_changes > 0
    
    def get_lock(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get lock info for a file."""
        row = self.conn.execute(
            "SELECT * FROM file_locks WHERE file_path = ?", (file_path,)
        ).fetchone()
        return dict(row) if row else None
    
    # ============================================
    # Cascade Tracking
    # ============================================
    
    def start_cascade(self, cascade_id: str, root_trigger_file: str) -> None:
        """Start a new cascade."""
        import time
        now = int(time.time())
        self.conn.execute("""
            INSERT INTO cascades (cascade_id, status, started_at, root_trigger_file)
            VALUES (?, 'active', ?, ?)
        """, (cascade_id, now, root_trigger_file))
        self.conn.commit()
    
    def update_cascade_depth(self, cascade_id: str, depth: int) -> None:
        """Update cascade depth."""
        self.conn.execute("""
            UPDATE cascades SET depth = ? WHERE cascade_id = ?
        """, (depth, cascade_id))
        self.conn.commit()
    
    def converge_cascade(self, cascade_id: str) -> None:
        """Mark cascade as converged."""
        import time
        now = int(time.time())
        self.conn.execute("""
            UPDATE cascades SET status = 'converged', converged_at = ? WHERE cascade_id = ?
        """, (now, cascade_id))
        self.conn.commit()
    
    def get_active_cascades(self) -> List[Dict[str, Any]]:
        """Get all active cascades."""
        rows = self.conn.execute("""
            SELECT * FROM cascades WHERE status = 'active'
        """).fetchall()
        return [dict(row) for row in rows]


# ============================================
# Convenience Functions
# ============================================

def get_db(db_path: str = ".speclang/speclang.db") -> SpeclangDB:
    """Get a database connection."""
    return SpeclangDB(db_path)


def init_db(db_path: str = ".speclang/speclang.db") -> SpeclangDB:
    """Initialize a new database."""
    db = SpeclangDB(db_path)
    db.connect()
    db.initialize()
    return db
