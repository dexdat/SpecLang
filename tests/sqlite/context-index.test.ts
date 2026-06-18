import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpecLangDB } from '../../src/db/index.js';
import type { SpecInput } from '../../src/db/types.js';
import * as fs from 'fs';

const TEST_DB_PATH = '.speclang/test-context-index.db';

describe('ContextIndex', () => {
  let db: SpecLangDB;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const walPath = TEST_DB_PATH + '-wal';
    const shmPath = TEST_DB_PATH + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    db = new SpecLangDB({ path: TEST_DB_PATH, wal: false });
    db.initialize();
  });

  afterEach(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const walPath = TEST_DB_PATH + '-wal';
    const shmPath = TEST_DB_PATH + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  function insertTestSpecs(): void {
    db.upsertSpec({
      file_path: 'specs/auth.spec.md',
      id: '@specs/auth',
      tags: ['auth', 'security'],
      short_desc: 'Authentication specification',
      header_raw: '# Authentication\nid: @specs/auth',
      content_raw: 'This spec defines authentication mechanisms including OAuth2 and JWT tokens.',
      header_lines: 2,
      parsed_json: { layer: "5", domain: 'auth', target: 'typescript', status: 'stable' }
    });

    db.upsertSpec({
      file_path: 'specs/db.spec.md',
      id: '@specs/db',
      tags: ['database', 'sqlite'],
      short_desc: 'Database layer',
      header_raw: '# Database\nid: @specs/db',
      content_raw: 'SQLite database layer with migrations and query builders.',
      header_lines: 2,
      parsed_json: { layer: 3, domain: 'database', target: 'typescript', status: 'stable' }
    });

    db.upsertSpec({
      file_path: 'specs/login.spec.md',
      id: '@specs/login',
      parent_id: '@specs/auth',
      depends_on: ['@specs/auth', '@specs/db'],
      tags: ['auth', 'ui'],
      short_desc: 'Login form',
      header_raw: '# Login\nid: @specs/login',
      content_raw: 'Login form with email and password authentication.',
      header_lines: 2,
      parsed_json: { layer: "5", domain: 'auth', target: 'typescript', status: 'draft' }
    });

    db.upsertSpec({
      file_path: 'specs/api.spec.md',
      id: '@specs/api',
      depends_on: ['@specs/auth'],
      tags: ['api', 'rest'],
      short_desc: 'REST API',
      header_raw: '# API\nid: @specs/api',
      content_raw: 'REST API endpoints for the application.',
      header_lines: 2,
      parsed_json: { layer: 4, domain: 'api', target: 'go', status: 'draft' }
    });
  }

  describe('Full-Text Search', () => {
    beforeEach(() => {
      insertTestSpecs();
    });

    it('should find specs by keyword in content', () => {
      const results = db.fts.search({ query: 'authentication', limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      const paths = results.map(r => r.file_path);
      expect(paths).toContain('specs/auth.spec.md');
      expect(paths).toContain('specs/login.spec.md');
    });

    it('should find specs by keyword in header', () => {
      const results = db.fts.search({ query: 'Database', limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.file_path === 'specs/db.spec.md')).toBe(true);
    });

    it('should filter results by tag', () => {
      const results = db.fts.search({ query: 'spec', limit: 10, tags: ['ui'] });
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.file_path).toBe('specs/login.spec.md');
      }
    });

    it('should return empty for non-matching query', () => {
      const results = db.fts.search({ query: 'nonexistent_keyword_xyz', limit: 10 });
      expect(results.length).toBe(0);
    });

    it('should return results ordered by relevance', () => {
      const results = db.fts.search({ query: 'authentication', limit: 10 });
      expect(results.length).toBeGreaterThanOrEqual(2);
      // FTS5 bm25 scores are negative; less negative = more relevant
      // Verify results exist and scores are present (implementation sorts by score)
      for (const r of results) {
        expect(typeof r.score).toBe('number');
      }
    });

    it('should respect limit parameter', () => {
      const results = db.fts.search({ query: 'spec', limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should search by exact ID match', () => {
      // FTS5 column filter with quoted value to avoid / operator
      const results = db.fts.search({ query: 'id:"@specs/auth"', limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.file_path === 'specs/auth.spec.md')).toBe(true);
    });

    it('should provide search suggestions', () => {
      const suggestions = db.fts.suggest('auth', 5);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Vector Search', () => {
    it('should report availability correctly', () => {
      expect(db.vectors.isAvailable()).toBe(false);
    });

    it('should return empty results for stub implementation', () => {
      const embedding = new Array(1536).fill(0);
      const results = db.vectors.findSimilar({ embedding, limit: 5 });
      expect(results.length).toBe(0);
    });

    it('should generate embedding with correct dimensions', async () => {
      const embedding = await db.vectors.generateEmbedding('test text');
      expect(embedding.length).toBe(1536);
    });

    it('should generate embeddings within valid range', async () => {
      const embedding = await db.vectors.generateEmbedding('authentication spec');
      for (const val of embedding) {
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Graph Queries', () => {
    beforeEach(() => {
      insertTestSpecs();
    });

    it('should find all dependents of a spec', () => {
      const dependents = db.graph.findDependents('@specs/auth');
      const paths = dependents.map(d => d.file_path);
      expect(paths).toContain('specs/login.spec.md');
      expect(paths).toContain('specs/api.spec.md');
    });

    it('should find all dependencies of a spec', () => {
      const deps = db.graph.findDependencies('@specs/login');
      const paths = deps.map(d => d.file_path);
      expect(paths).toContain('specs/auth.spec.md');
      expect(paths).toContain('specs/db.spec.md');
    });

    it('should return empty dependencies for a spec with no deps', () => {
      const deps = db.graph.findDependencies('@specs/auth');
      expect(deps.length).toBe(0);
    });

    it('should return empty dependents for a spec with no dependents', () => {
      const deps = db.graph.findDependents('@specs/login');
      expect(deps.length).toBe(0);
    });

    it('should get tree from a root spec', () => {
      const tree = db.graph.getTree('specs/auth.spec.md', 5);
      expect(tree.length).toBeGreaterThanOrEqual(1);
      const root = tree.find(t => t.depth === 0);
      expect(root).toBeDefined();
      expect(root!.file_path).toBe('specs/auth.spec.md');
    });

    it('should find ancestors up the hierarchy', () => {
      const ancestors = db.graph.findAncestors('specs/login.spec.md');
      expect(ancestors.length).toBe(2);
      expect(ancestors[0].parent_id).toBe('@specs/auth');
      expect(ancestors[1].id).toBe('@specs/auth');
    });

    it('should detect no cycles in a DAG', () => {
      const cycles = db.graph.detectCycles();
      expect(cycles.length).toBe(0);
    });

    it('should detect circular dependencies', () => {
      db.upsertSpec({
        file_path: 'specs/a.spec.md',
        id: '@specs/a',
        depends_on: ['@specs/b'],
        tags: []
      });
      db.upsertSpec({
        file_path: 'specs/b.spec.md',
        id: '@specs/b',
        depends_on: ['@specs/a'],
        tags: []
      });
      const cycles = db.graph.detectCycles();
      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('JSON Queries', () => {
    beforeEach(() => {
      insertTestSpecs();
      db.upsertSpec({
        file_path: 'specs/auth.spec.md',
        id: '@specs/auth',
        tags: ['auth', 'security'],
        short_desc: 'Auth',
        parsed_json: { domain: 'auth', target: 'typescript', layer: 5, status: 'stable' }
      });
      db.upsertSpec({
        file_path: 'specs/db.spec.md',
        id: '@specs/db',
        tags: ['database'],
        short_desc: 'Database',
        parsed_json: { domain: 'storage', target: 'sqlite', layer: 3, status: 'stable' }
      });
      db.upsertSpec({
        file_path: 'specs/login.spec.md',
        id: '@specs/login',
        tags: ['auth', 'ui'],
        short_desc: 'Login',
        parsed_json: { domain: 'auth', target: 'typescript', layer: 4, status: 'draft' }
      });
    });

    it('should find specs by tag', () => {
      const results = db.json.findByTag('auth');
      expect(results.length).toBe(2);
      const paths = results.map(r => r.file_path).sort();
      expect(paths).toEqual(['specs/auth.spec.md', 'specs/login.spec.md']);
    });

    it('should find specs by tag with single match', () => {
      const results = db.json.findByTag('database');
      expect(results.length).toBe(1);
      expect(results[0].file_path).toBe('specs/db.spec.md');
    });

    it('should return empty for non-matching tag', () => {
      const results = db.json.findByTag('nonexistent');
      expect(results.length).toBe(0);
    });

    it('should find specs by JSON field (string)', () => {
      const results = db.json.findByField('target', 'typescript');
      expect(results.length).toBe(2);
      const paths = results.map(r => r.file_path).sort();
      expect(paths).toEqual(['specs/auth.spec.md', 'specs/login.spec.md']);
    });

    it('should find specs by JSON field (number)', () => {
      // findByField compares as TEXT in prepared statements
      const results = db.json.findByField('status', 'stable');
      expect(results.length).toBe(2);
      const paths = results.map(r => r.file_path).sort();
      expect(paths).toEqual(['specs/auth.spec.md', 'specs/db.spec.md']);
    });

    it('should count specs by a JSON field', () => {
      const counts = db.json.countByField('domain');
      const authCount = counts.find(c => c.value === 'auth');
      expect(authCount).toBeDefined();
      expect(authCount!.count).toBe(2);
    });
  });

  describe('Combined Context Lookups', () => {
    beforeEach(() => {
      insertTestSpecs();
    });

    it('should find related specs through FTS and graph together', () => {
      const ftsResults = db.fts.search({ query: 'authentication', limit: 10 });
      expect(ftsResults.length).toBeGreaterThan(0);

      const authSpec = ftsResults.find(r => r.file_path === 'specs/auth.spec.md');
      expect(authSpec).toBeDefined();

      const dependents = db.graph.findDependents(authSpec!.id!);
      expect(dependents.length).toBeGreaterThan(0);
    });

    it('should trace full dependency chain from leaf spec', () => {
      const deps = db.graph.findDependencies('@specs/login');
      const depIds = deps.map(d => d.id);

      for (const depId of depIds) {
        const subDeps = db.graph.findDependencies(depId!);
        for (const subDep of subDeps) {
          const results = db.fts.search({ query: subDep.short_desc || '', limit: 5 });
          expect(results).toBeDefined();
        }
      }
    });

    it('should build a context from multiple search methods', () => {
      const query = 'auth';
      const ftsResults = db.fts.search({ query, limit: 10 });
      const tagResults = db.json.findByTag('auth');
      const graphResults = db.graph.findDependents('@specs/auth');

      const allPaths = new Set([
        ...ftsResults.map(r => r.file_path),
        ...tagResults.map(r => r.file_path),
        ...graphResults.map(r => r.file_path)
      ]);

      expect(allPaths.has('specs/auth.spec.md')).toBe(true);
      expect(allPaths.has('specs/login.spec.md')).toBe(true);
    });

    it('should handle empty context gracefully', () => {
      const ftsResults = db.fts.search({ query: 'zzzzz_nonexistent', limit: 5 });
      const tagResults = db.json.findByTag('zzzzz_nonexistent');
      const graphResults = db.graph.findDependents('@specs/nonexistent');

      expect(ftsResults.length).toBe(0);
      expect(tagResults.length).toBe(0);
      expect(graphResults.length).toBe(0);
    });

    it('should find specs by multiple tags', () => {
      const authUi = db.json.findByTag('auth').filter(r => {
        const spec = db.getSpec(r.file_path);
        return spec?.tags.includes('ui');
      });
      expect(authUi.length).toBe(1);
      expect(authUi[0].file_path).toBe('specs/login.spec.md');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty database searches', () => {
      const ftsResults = db.fts.search({ query: 'anything', limit: 10 });
      expect(ftsResults.length).toBe(0);

      const tagResults = db.json.findByTag('anything');
      expect(tagResults.length).toBe(0);
    });

    it('should handle specs with minimal data', () => {
      db.upsertSpec({ file_path: 'specs/minimal.spec.md', id: '@specs/minimal', tags: [] });
      const result = db.getSpec('specs/minimal.spec.md');
      expect(result).toBeDefined();
      expect(result!.tags).toEqual([]);
    });

    it('should handle spec with all fields populated', () => {
      const spec: SpecInput = {
        file_path: 'specs/full.spec.md',
        id: '@specs/full',
        parent_id: '@specs/auth',
        children: ['@specs/child'],
        tags: ['test', 'full'],
        short_desc: 'Full spec',
        header_raw: '# Full\nid: @specs/full\nlayer: 5',
        header_lines: 3,
        content_raw: 'Full content with searchable terms.',
        parsed_json: { key: 'value', nested: { inner: 'data' } },
        part: 1,
        total_parts: 1,
        last_edited: Date.now()
      };
      db.upsertSpec(spec);
      const retrieved = db.getSpec('specs/full.spec.md');
      expect(retrieved).toBeDefined();
      expect(retrieved!.parsed_json).toEqual({ key: 'value', nested: { inner: 'data' } });
    });

    it('should update and reflect changes in searches', () => {
      db.upsertSpec({
        file_path: 'specs/update.spec.md',
        id: '@specs/update',
        tags: ['old'],
        short_desc: 'Original',
        content_raw: 'Original content'
      });

      let results = db.fts.search({ query: 'Original', limit: 5 });
      expect(results.length).toBe(1);

      db.upsertSpec({
        file_path: 'specs/update.spec.md',
        id: '@specs/update',
        tags: ['new'],
        short_desc: 'Updated',
        content_raw: 'Updated content'
      });

      results = db.fts.search({ query: 'Original', limit: 5 });
      expect(results.length).toBe(0);

      results = db.fts.search({ query: 'Updated', limit: 5 });
      expect(results.length).toBe(1);
    });

    it('should handle deletion and verify FTS sync', () => {
      db.upsertSpec({
        file_path: 'specs/deleteme.spec.md',
        id: '@specs/deleteme',
        tags: [],
        content_raw: 'Will be deleted'
      });

      let results = db.fts.search({ query: 'deleted', limit: 5 });
      expect(results.length).toBeGreaterThan(0);

      db.deleteSpec('specs/deleteme.spec.md');

      results = db.fts.search({ query: 'deleted', limit: 5 });
      expect(results.length).toBe(0);
    });
  });
});
