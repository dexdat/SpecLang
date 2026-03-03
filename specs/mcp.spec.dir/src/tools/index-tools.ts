/**
 * SPECLANG-GENERATED: MCP Index Tools
 * Source: @speclang/mcp
 */

import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import { generateIndex, populateDatabase, getSpecFiles, parseHeader, extractRefsFromContent, extractBlocksFromContent } from '../../../indexer.spec.dir/src/index.js';
import type { IndexRefreshResult } from '../types.js';

/**
 * Index tool handler
 */
export class IndexToolHandler {
  private db: SpecLangDB;
  private specsDir: string;
  
  constructor(db: SpecLangDB, specsDir: string = 'specs') {
    this.db = db;
    this.specsDir = specsDir;
  }
  
  /**
   * Handle speclang_index_refresh - Rebuild spec index
   */
  async handleIndexRefresh(args?: { specsDir?: string }): Promise<IndexRefreshResult> {
    const dir = args?.specsDir || this.specsDir;
    const errors: string[] = [];
    
    try {
      // Get all spec files
      const specFiles = getSpecFiles(dir);
      
      let refsFound = 0;
      
      // Index each spec
      for (const filepath of specFiles) {
        try {
          const content = require('fs').readFileSync(filepath, 'utf-8');
          const { headerLines, metadata } = parseHeader(filepath);
          const refs = extractRefsFromContent(content);
          const blocks = extractBlocksFromContent(content);
          
          refsFound += refs.length;
          
          // Upsert to database
          this.db.upsertSpec({
            file_path: filepath,
            id: (metadata.id as string) || `@unknown/${require('path').basename(filepath)}`,
            tags: (metadata.tags as string[]) || [],
            short_desc: (metadata.short as string) || '',
            header_raw: content.slice(0, headerLines * 100),
            header_lines: headerLines,
            content_raw: content,
            depends_on: refs,
            children: blocks,
            part: (metadata.part as number) || 1,
            total_parts: (metadata.total_parts as number) || 1
          });
        } catch (e) {
          errors.push(`Error indexing ${filepath}: ${e}`);
        }
      }
      
      return {
        specs_indexed: specFiles.length - errors.length,
        refs_found: refsFound,
        errors
      };
    } catch (error) {
      return {
        specs_indexed: 0,
        refs_found: 0,
        errors: [`Failed to refresh index: ${error}`]
      };
    }
  }
  
  /**
   * Handle speclang_index_stats - Get index statistics
   */
  async handleIndexStats(): Promise<{
    total_specs: number;
    total_refs: number;
    total_tags: number;
    layers: Record<number, number>;
  }> {
    const db = this.db.getDatabase();
    
    // Get total specs
    const specCount = db.prepare('SELECT COUNT(*) as count FROM specs').get() as { count: number };
    
    // Get total refs (sum of depends_on arrays)
    const specs = db.prepare('SELECT depends_on FROM specs').all() as Array<{ depends_on: string }>;
    let totalRefs = 0;
    const tagSet = new Set<string>();
    const layerCounts: Record<number, number> = {};
    
    for (const spec of specs) {
      const deps = JSON.parse(spec.depends_on || '[]');
      totalRefs += deps.length;
      
      // Get tags
      const specWithTags = db.prepare('SELECT tags, layer FROM specs WHERE depends_on = ?').get(spec.depends_on) as { tags: string; layer: number } | undefined;
      if (specWithTags) {
        const tags = JSON.parse(specWithTags.tags || '[]');
        for (const tag of tags) {
          tagSet.add(tag);
        }
        layerCounts[specWithTags.layer] = (layerCounts[specWithTags.layer] || 0) + 1;
      }
    }
    
    return {
      total_specs: specCount.count,
      total_refs: totalRefs,
      total_tags: tagSet.size,
      layers: layerCounts
    };
  }
  
  /**
   * Handle speclang_index_validate - Validate index
   */
  async handleIndexValidate(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const db = this.db.getDatabase();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for missing dependencies
    const specs = db.prepare('SELECT id, depends_on FROM specs').all() as Array<{ id: string; depends_on: string }>;
    const knownIds = new Set(specs.map(s => s.id).filter(Boolean));
    
    for (const spec of specs) {
      const deps = JSON.parse(spec.depends_on || '[]');
      for (const dep of deps) {
        // Normalize dep ID
        const depId = dep.startsWith('@') ? dep.slice(1) : dep;
        if (!knownIds.has(depId) && !knownIds.has('@' + depId)) {
          warnings.push(`${spec.id} depends on unknown: ${dep}`);
        }
      }
    }
    
    // Check for orphans
    const dependents = new Set<string>();
    for (const spec of specs) {
      const deps = JSON.parse(spec.depends_on || '[]');
      for (const dep of deps) {
        dependents.add(dep);
      }
    }
    
    for (const spec of specs) {
      if (!dependents.has(spec.id) && specs.length > 1) {
        warnings.push(`Orphan spec (no dependents): ${spec.id}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
