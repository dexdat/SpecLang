import Database = require('better-sqlite3');
import { readFile } from 'fs/promises';
import * as path from 'path';

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
  private db!: InstanceType<typeof Database>;

  async initialize(path: string = '.speclang/speclang.db'): Promise<void> {
    this.db = new Database(path);
    
    // Run migrations
    await this.db.exec(await this.loadMigration('001-initial'));
    
    // Enable WAL
    await this.db.exec('PRAGMA journal_mode = WAL');
  }

  private async loadMigration(name: string): Promise<string> {
    // Load migration SQL from filesystem
    const migrationPath = path.join(process.cwd(), 'migrations', `${name}.sql`);
    return await readFile(migrationPath, 'utf-8');
  }
}