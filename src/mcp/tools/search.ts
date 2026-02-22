/**
 * SPECLANG-GENERATED: MCP Search Tool
 * Source: @speclang/mcp
 */

import type { SpecLangDB } from '../../db/index.js';
import type { SearchInput, SearchResult } from '../types.js';

/**
 * Search tool handler
 */
export class SearchToolHandler {
  private db: SpecLangDB;
  
  constructor(db: SpecLangDB) {
    this.db = db;
  }
  
  /**
   * Handle speclang_search - Full-text search using FTS5
   */
  async handleSearch(args: SearchInput): Promise<{ results: SearchResult[] }> {
    const { query, limit = 10, tags, layer } = args;
    
    if (!query || query.trim() === '') {
      return { results: [] };
    }
    
    const db = this.db.getDatabase();
    
    let sql = `
      SELECT s.file_path, s.id, s.short_desc, s.tags, s.layer,
             bm25(specs_fts) as score,
             snippet(specs_fts, 3, '<mark>', '</mark>', '...', 30) as snippet
      FROM specs_fts f
      JOIN specs s ON f.rowid = s.rowid
      WHERE specs_fts MATCH ?
    `;
    const params: unknown[] = [query];
    
    if (tags && tags.length > 0) {
      // Filter by tags (stored as JSON array in SQLite)
      const tagConditions = tags.map(() => `s.tags LIKE ?`).join(' OR ');
      sql += ` AND (${tagConditions})`;
      for (const tag of tags) {
        params.push(`%"${tag}"%`);
      }
    }
    
    if (layer !== undefined) {
      sql += ` AND s.layer = ?`;
      params.push(layer);
    }
    
    sql += ` ORDER BY score LIMIT ?`;
    params.push(limit);
    
    try {
      const rows = db.prepare(sql).all(...params) as Array<{
        file_path: string;
        id: string | null;
        short_desc: string | null;
        score: number;
        snippet: string;
      }>;
      
      const results: SearchResult[] = rows.map(row => ({
        id: row.id || '',
        file: row.file_path,
        score: row.score,
        snippet: row.snippet || row.short_desc || ''
      }));
      
      return { results };
    } catch (error) {
      // FTS table might not exist, fall back to simple LIKE search
      return this.handleSearchFallback(args);
    }
  }
  
  /**
   * Fallback search using LIKE when FTS is not available
   */
  private async handleSearchFallback(args: SearchInput): Promise<{ results: SearchResult[] }> {
    const { query, limit = 10, tags, layer } = args;
    
    const db = this.db.getDatabase();
    
    let sql = `
      SELECT file_path, id, short_desc, tags, layer,
             0 as score
      FROM specs
      WHERE (content_raw LIKE ? OR short_desc LIKE ? OR id LIKE ?)
    `;
    const searchPattern = `%${query}%`;
    const params: unknown[] = [searchPattern, searchPattern, searchPattern];
    
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(() => `tags LIKE ?`).join(' OR ');
      sql += ` AND (${tagConditions})`;
      for (const tag of tags) {
        params.push(`%"${tag}"%`);
      }
    }
    
    if (layer !== undefined) {
      sql += ` AND layer = ?`;
      params.push(layer);
    }
    
    sql += ` LIMIT ?`;
    params.push(limit);
    
    const rows = db.prepare(sql).all(...params) as Array<{
      file_path: string;
      id: string | null;
      short_desc: string | null;
      score: number;
    }>;
    
    const results: SearchResult[] = rows.map(row => ({
      id: row.id || '',
      file: row.file_path,
      score: row.score,
      snippet: row.short_desc || ''
    }));
    
    return { results };
  }
  
  /**
   * Handle speclang_semantic_search - Vector similarity search
   */
  async handleSemanticSearch(args: { query_embedding: number[]; limit?: number }): Promise<{ results: SearchResult[] }> {
    const { query_embedding, limit = 5 } = args;
    
    // This would require sqlite-vss or similar extension
    // For now, return empty results
    console.warn('Semantic search requires sqlite-vss extension');
    return { results: [] };
  }
}
