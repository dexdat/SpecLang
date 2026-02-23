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

    if (!query_embedding || query_embedding.length === 0) {
      return { results: [] };
    }

    const db = this.db.getDatabase();

    try {
      const rows = db.prepare(`
        SELECT file_path, id, short_desc, content_embedding
        FROM specs
        WHERE content_embedding IS NOT NULL
      `).all() as Array<{
        file_path: string;
        id: string | null;
        short_desc: string | null;
        content_embedding: Buffer;
      }>;

      const results: SearchResult[] = [];
      
      for (const row of rows) {
        const embedding = this.bufferToEmbedding(row.content_embedding);
        if (embedding && embedding.length === query_embedding.length) {
          const distance = this.cosineSimilarity(query_embedding, embedding);
          results.push({
            id: row.id || '',
            file: row.file_path,
            score: distance,
            snippet: row.short_desc || ''
          });
        }
      }

      results.sort((a, b) => b.score - a.score);
      return { results: results.slice(0, limit) };
    } catch (error) {
      console.error('Semantic search error:', error);
      return { results: [] };
    }
  }

  private bufferToEmbedding(buffer: Buffer): number[] | null {
    try {
      const floats = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
      return Array.from(floats);
    } catch {
      return null;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
