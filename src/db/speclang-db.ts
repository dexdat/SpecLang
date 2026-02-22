import { Database } from 'better-sqlite3';
import { open } from 'sqlite';

export interface SpecRow {
  file_path: string;
  id: string;
  parent_id: string | null;
  children: string[]; // JSON parsed
  owner_session: string | null;
  depends_on: string[];
  tags: string[];
  short_desc: string;
  header_raw: string;
  content_raw: string;
  content_embedding: Buffer | null;
  parsed_json: any;
  part: number;
  total_parts: number;
  last_edited: number;
  git_commit: string | null;
}

export interface SessionRow {
  id: string;
  agent: string;
  owns: string[];
  status: 'active' | 'idle' | 'done' | 'error';
  last_active: number;
}

export class SpeclangDatabase {
  private db: Database;

  async initialize(path: string = '.speclang/speclang.db'): Promise<void> {
    this.db = await open({
      filename: path,
      driver: require('better-sqlite3').Database
    });
    
    // Run migrations
    await this.db.exec(await this.loadMigration('001-initial'));
    
    // Enable WAL
    await this.db.exec('PRAGMA journal_mode = WAL');
  }

  private async loadMigration(name: string): Promise<string> {
    // Load migration SQL from filesystem
    return '';
  }
}

// Example: Initialize database and insert a spec
import { SpeclangDatabase } from './speclang-db';

const db = new SpeclangDatabase();
await db.initialize();

// Insert a spec
await db.db.run(
  `INSERT INTO specs (file_path, id, short_desc, tags) VALUES (?, ?, ?, ?)`,
  ['specs/auth.spec.md', '@specs/auth', 'Authentication spec', '["auth", "security"]']
);

// Search using FTS
const results = await db.db.all(
  `SELECT file_path, id, short_desc FROM specs_fts WHERE specs_fts MATCH ?`,
  ['authentication']
);