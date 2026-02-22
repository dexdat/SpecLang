/**
 * SPECLANG-GENERATED: Spec indexer main module
 * Source: docs/prompts/phase-0.3-indexer.md
 * 
 * This module provides the main indexer functionality for SpecLang.
 * It scans specs/ directory and generates _index.json with full graph analysis.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { 
  SpecIndex, 
  SpecEntry, 
  DependencyGraph, 
  ImpactAnalysis,
  IndexerOptions
} from './types';
import { DEFAULT_INDEXER_OPTIONS } from './types';

// Import graph operations
import { 
  buildDependencyGraph, 
  getTransitiveDependencies, 
  getTransitiveDependents,
  detectCycles, 
  findOrphans,
  findPath 
} from './graph';

// Import analyzer
import { impactAnalysis } from './analyzer';

// ============================================================================
// HEADER PARSING
// ============================================================================

/** Parse speclang header from file or content */
export function parseHeader(filepathOrContent: string): { headerLines: number; metadata: Record<string, unknown> } {
  let content: string;
  
  // Check if it's a file path or content
  if (filepathOrContent.includes('speclang-header')) {
    // It's content
    content = filepathOrContent;
  } else {
    // It's a file path
    content = fs.readFileSync(filepathOrContent, 'utf-8');
  }
  
  const lines = content.split('\n');
  
  let headerLines = 0;
  let metadata: Record<string, unknown> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('speclang-header')) {
      // Extract line count
      const match = line.match(/lines:\s*(\d+)/);
      if (match) {
        headerLines = parseInt(match[1], 10);
      }
      
      // Collect YAML content
      const yamlLines: string[] = [];
      let j = i + 1;
      const endIdx = headerLines > 0 
        ? Math.min(j + headerLines - 1, lines.length)
        : lines.length;
      
      for (let k = j; k < endIdx; k++) {
        if (lines[k].trim() === '---') {
          headerLines = k - i + 1;
          break;
        }
        yamlLines.push(lines[k]);
      }
      
      // Parse YAML
      if (yamlLines.length > 0) {
        try {
          const yamlContent = yamlLines.join('\n');
          metadata = yaml.parse(yamlContent) || {};
        } catch (e) {
          // Fallback to regex extraction
          const yamlContent = yamlLines.join('\n');
          metadata = extractBasicFields(yamlContent);
        }
      }
      
      break;
    }
  }
  
  return { headerLines, metadata };
}

/** Extract basic fields when YAML parsing fails */
function extractBasicFields(yamlText: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  
  const idMatch = yamlText.match(/id:\s*(@[^\s]+)/);
  if (idMatch) metadata.id = idMatch[1];
  
  const versionMatch = yamlText.match(/version:\s*([0-9.]+)/);
  if (versionMatch) metadata.version = versionMatch[1];
  
  const layerMatch = yamlText.match(/layer:\s*(\d+)/);
  if (layerMatch) metadata.layer = parseInt(layerMatch[1], 10);
  
  return metadata;
}

// ============================================================================
// REFERENCE EXTRACTION
// ============================================================================

/** Extract @ref: references from spec content or file */
export function extractRefsFromContent(filepathOrContent: string): string[] {
  let content: string;
  
  // Check if it's a file path or content
  if (filepathOrContent.includes('@ref:') || filepathOrContent.includes('@block:')) {
    // It's content
    content = filepathOrContent;
  } else {
    // It's a file path
    content = fs.readFileSync(filepathOrContent, 'utf-8');
  }
  
  const refs: string[] = [];
  
  // Match @ref:pattern
  const refPattern = /@ref:([a-zA-Z][a-zA-Z0-9_/-]*(?:#[a-zA-Z][a-zA-Z0-9_-]*)?)/g;
  let match;
  while ((match = refPattern.exec(content)) !== null) {
    refs.push(match[1]);
  }
  
  return refs;
}

/** Extract @block: definitions from spec content or file */
export function extractBlocksFromContent(filepathOrContent: string): string[] {
  let content: string;
  
  // Check if it's a file path or content
  if (filepathOrContent.includes('@ref:') || filepathOrContent.includes('@block:')) {
    // It's content
    content = filepathOrContent;
  } else {
    // It's a file path
    content = fs.readFileSync(filepathOrContent, 'utf-8');
  }
  
  const blocks: string[] = [];
  
  // Split by code blocks first
  const segments = content.split(/```[\s\S]*?```/);
  
  const blockPattern = /@block:([a-zA-Z][a-zA-Z0-9_/-]*)/g;
  for (const segment of segments) {
    let match;
    while ((match = blockPattern.exec(segment)) !== null) {
      blocks.push(match[1]);
    }
  }
  
  return blocks;
}

// ============================================================================
// FILE DISCOVERY
// ============================================================================

/** Get all spec files in directory */
export function getSpecFiles(rootDir: string): string[] {
  const specExtensions = ['.scl', '.spec.md', '.spec.yaml', '.spec'];
  const codeSpecPattern = /\.[a-z]+\.spec$/;
  
  const files: string[] = [];
  
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === '.opencode' || entry.name === '.backup_spec_files') {
        continue;
      }
      
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const relPath = path.relative(rootDir, fullPath);
        
        if (relPath.includes('.backup_spec_files')) continue;
        
        let isSpec = false;
        for (const ext of specExtensions) {
          if (entry.name.endsWith(ext)) {
            isSpec = true;
            break;
          }
        }
        
        if (!isSpec && codeSpecPattern.test(entry.name)) {
          isSpec = true;
        }
        
        if (isSpec) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(rootDir);
  return files;
}

// ============================================================================
// INDEX GENERATION
// ============================================================================

/** Generate complete spec index */
export function generateIndex(options: Partial<IndexerOptions> = {}): SpecIndex {
  const opts: IndexerOptions = { ...DEFAULT_INDEXER_OPTIONS, ...options };
  const rootDir = opts.rootDir || '.';
  
  console.log(`Generating spec index for ${rootDir}...`);
  
  // Get all spec files
  const specFiles = getSpecFiles(rootDir);
  console.log(`Found ${specFiles.length} spec files`);
  
  const entries: SpecEntry[] = [];
  const allIds = new Set<string>();
  
  // First pass: collect basic metadata
  for (const filepath of specFiles) {
    try {
      const stat = fs.statSync(filepath);
      const relPath = path.relative(rootDir, filepath);
      
      const { headerLines, metadata } = parseHeader(filepath);
      const contentRefs = extractRefsFromContent(filepath);
      const blocks = extractBlocksFromContent(filepath);
      
      const layerRaw = metadata.layer;
      const layer = typeof layerRaw === 'number' 
        ? Math.max(0, Math.min(layerRaw, 10))
        : typeof layerRaw === 'string' && /^\d+$/.test(layerRaw)
          ? parseInt(layerRaw, 10)
          : 0;
      
      const specId = (metadata.id as string) || `@unknown/${path.basename(relPath)}`;
      allIds.add(specId);
      
      const entry: SpecEntry = {
        id: specId,
        file: relPath,
        version: String(metadata.version || '0.0.0'),
        layer,
        project_level: String(metadata.project_level || ''),
        agent_support: String(metadata.agent_support || ''),
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        short: String(metadata.short || path.basename(relPath)),
        depends_on: Array.isArray(metadata.depends_on) ? metadata.depends_on : [],
        blocks,
        lastModified: stat.mtime.toISOString() + 'Z',
        lines: stat.size,
        header_lines: headerLines,
        status: String(metadata.status || 'draft'),
        target: metadata.target ? String(metadata.target) : undefined,
        content_refs: contentRefs,
      };
      
      entries.push(entry);
    } catch (e) {
      console.error(`Error processing ${filepath}: ${e}`);
    }
  }
  
  // Build graphs
  const { dependencies, dependents } = buildDependencyGraph(entries);
  
  // Detect cycles
  const cycles = detectCycles(dependencies);
  
  // Find orphans
  const orphans = findOrphans(dependencies, dependents, allIds);
  
  // Validate refs
  const { missing, valid } = validateRefs(entries, allIds);
  
  // Build specs dictionary
  const specs: Record<string, SpecEntry> = {};
  for (const entry of entries) {
    specs[entry.id] = entry;
  }
  
  // Build index
  const index: SpecIndex = {
    version: '0.2.0',
    generated: new Date().toISOString() + 'Z',
    specs,
    graph: { dependencies, dependents },
    orphans,
    cycles,
    validation: {
      missing_refs: missing,
      valid_refs: valid,
      total_specs: entries.length,
      total_refs: valid.length,
      missing_ref_count: missing.length,
    },
  };
  
  // Write output
  if (opts.outputPath) {
    fs.writeFileSync(opts.outputPath, JSON.stringify(index, null, 2));
    console.log(`Created ${opts.outputPath}`);
  }
  
  console.log(`  - Specs: ${entries.length}`);
  console.log(`  - References: ${valid.length}`);
  console.log(`  - Missing refs: ${missing.length}`);
  console.log(`  - Orphans: ${orphans.length}`);
  console.log(`  - Cycles: ${cycles.length}`);
  
  return index;
}

/** Validate references */
function validateRefs(entries: SpecEntry[], allIds: Set<string>): { missing: string[]; valid: string[] } {
  const missing: string[] = [];
  const valid: string[] = [];
  
  // Normalize allIds
  const normalizedIds = new Set(allIds);
  for (const specId of allIds) {
    if (specId.startsWith('@')) {
      normalizedIds.add(specId.slice(1));
    } else {
      normalizedIds.add('@' + specId);
    }
  }
  
  for (const entry of entries) {
    // Check depends_on
    for (const dep of entry.depends_on) {
      if (!normalizedIds.has(dep)) {
        missing.push(`${entry.id} -> ${dep} (depends_on)`);
      } else {
        valid.push(`${entry.id} -> ${dep}`);
      }
    }
  }
  
  return { missing, valid };
}

// ============================================================================
// SQLITE INTEGRATION
// ============================================================================

import type { SpecLangDB } from '../db/index.js';

/**
 * Populate SQLite database with spec index data
 */
export function populateDatabase(index: SpecIndex, db: SpecLangDB): void {
  console.log('Populating database with spec index...');
  
  for (const entry of Object.values(index.specs)) {
    try {
      db.upsertSpec({
        file_path: entry.file,
        id: entry.id,
        parent_id: undefined,
        children: entry.blocks || [],
        owner_session: undefined,
        depends_on: entry.depends_on || [],
        tags: entry.tags || [],
        short_desc: entry.short || '',
        header_raw: '',
        header_lines: entry.header_lines,
        content_raw: '',
        content_embedding: undefined,
        parsed_json: {
          version: entry.version,
          layer: entry.layer,
          project_level: entry.project_level,
          agent_support: entry.agent_support,
          status: entry.status,
          target: entry.target,
        },
        part: 1,
        total_parts: 1,
        last_edited: new Date(entry.lastModified).getTime(),
        git_commit: undefined,
      });
    } catch (e) {
      console.error(`Error populating spec ${entry.id}: ${e}`);
    }
  }
  
  console.log('Database populated successfully');
}

// ============================================================================
// CLI COMMANDS
// ============================================================================

/**
 * Validate index
 */
export function validateIndexCmd(index: SpecIndex): boolean {
  const validation = index.validation;
  
  console.log('=== Index Validation ===');
  console.log(`Total specs: ${validation?.total_specs || 0}`);
  console.log(`Total refs: ${validation?.total_refs || 0}`);
  console.log(`Missing refs: ${validation?.missing_ref_count || 0}`);

  if (validation?.missing_refs && validation.missing_refs.length > 0) {
    console.log('\n❌ Missing references:');
    for (const ref of validation.missing_refs.slice(0, 10)) {
      console.log(`  - ${ref}`);
    }
    if (validation.missing_refs.length > 10) {
      console.log(`  ... and ${validation.missing_refs.length - 10} more`);
    }
    return false;
  } else {
    console.log('\n✅ All references valid');
  }

  const cycles = index.cycles || [];
  if (cycles.length > 0) {
    console.log(`\n❌ Circular dependencies detected (${cycles.length}):`);
    for (const cycle of cycles.slice(0, 5)) {
      console.log(`  - ${cycle.join(' -> ')}`);
    }
    return false;
  } else {
    console.log('\n✅ No circular dependencies');
  }

  const orphans = index.orphans || [];
  if (orphans.length > 0) {
    console.log(`\n⚠️  Orphan specs (${orphans.length}):`);
    for (const orphan of orphans.slice(0, 10)) {
      console.log(`  - ${orphan}`);
    }
    return true;
  } else {
    console.log('\n✅ No orphan specs');
  }

  return true;
}

/**
 * Show dependency tree for a spec
 */
export function treeCmd(index: SpecIndex, specId: string): void {
  const deps = index.graph.dependencies;
  const dents = index.graph.dependents;
  
  console.log(`=== Dependency Tree for ${specId} ===`);
  
  const transitiveDeps = getTransitiveDependencies(specId, deps);
  const transitiveDents = getTransitiveDependents(specId, dents);
  
  console.log(`\nDepends on (${transitiveDeps.length}):`);
  for (const d of transitiveDeps) {
    console.log(`  └─ ${d}`);
  }
  
  console.log(`\nDepended on by (${transitiveDents.length}):`);
  for (const d of transitiveDents) {
    console.log(`  └─ ${d}`);
  }
}

/**
 * Show impact analysis
 */
export function impactCmd(index: SpecIndex, specId: string): void {
  const deps = index.graph.dependencies;
  const dents = index.graph.dependents;
  const entries = Object.values(index.specs);
  
  console.log(`=== Impact Analysis for ${specId} ===`);
  
  const direct = dents[specId] || [];
  const transitive = getTransitiveDependents(specId, dents);
  
  // Find actual file paths
  const specMap: Record<string, string> = {};
  for (const entry of entries) {
    specMap[entry.id] = entry.file;
  }
  const files = transitive.map(s => specMap[s]).filter(Boolean);
  
  console.log(`\nDirect dependents (${direct.length}):`);
  for (const d of direct) {
    console.log(`  - ${d}`);
  }
  
  console.log(`\nTransitive impact (${transitive.length}):`);
  for (const d of transitive) {
    console.log(`  - ${d}`);
  }
  
  console.log(`\nFiles affected (${files.length}):`);
  for (const f of files) {
    console.log(`  - ${f}`);
  }
}

/**
 * Show graph statistics
 */
export function graphCmd(index: SpecIndex): void {
  const deps = index.graph.dependencies;
  const dents = index.graph.dependents;
  
  console.log('=== Graph Statistics ===');
  console.log(`Nodes: ${Object.keys(index.specs).length}`);
  console.log(`Dependency edges: ${Object.values(deps).reduce((sum, arr) => sum + arr.length, 0)}`);
  console.log(`Dependent edges: ${Object.values(dents).reduce((sum, arr) => sum + arr.length, 0)}`);
  
  // Find most connected
  if (Object.keys(deps).length > 0) {
    let maxDeps = 0;
    let maxDepsSpec = '';
    for (const [specId, depList] of Object.entries(deps)) {
      if (depList.length > maxDeps) {
        maxDeps = depList.length;
        maxDepsSpec = specId;
      }
    }
    console.log(`Most dependencies: ${maxDepsSpec} (${maxDeps})`);
  }
  
  if (Object.keys(dents).length > 0) {
    let maxDents = 0;
    let maxDentsSpec = '';
    for (const [specId, dentList] of Object.entries(dents)) {
      if (dentList.length > maxDents) {
        maxDents = dentList.length;
        maxDentsSpec = specId;
      }
    }
    console.log(`Most depended on: ${maxDentsSpec} (${maxDents})`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from './types';
export * from './graph';
export * from './analyzer';
