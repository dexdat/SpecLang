/**
 * SPECLANG-GENERATED: Incremental Compilation
 * Source: @speclang/compiler.spec.dir/phases @compiler/incremental @compiler/cache
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { SpecGraph, Artifact, CompileCache, CacheEntry } from './types';

const DEFAULT_CACHE_DIR = '.speclang/cache';

export function compileIncremental(
  graph: SpecGraph,
  changed: string[],
  cacheDir: string = DEFAULT_CACHE_DIR
): Artifact[] {
  const affected = findTransitiveDependents(graph, changed);
  const cache = loadCache(cacheDir);
  const artifacts: Artifact[] = [];

  for (const blockId of affected) {
    const cached = findCachedArtifact(cache, blockId);
    const block = graph.nodes.find((b) => b.id === blockId);

    if (!block) continue;

    const currentHash = hashContent(block.content);

    if (cached && cached.artifactHash === currentHash) {
      continue;
    }

    artifacts.push({
      path: `generated/${blockId}.ts`,
      content: block.content,
      markers: [blockId],
      target: 'typescript',
    });

    cache.entries.push({
      blockId,
      irHash: currentHash,
      artifactHash: currentHash,
    });
  }

  saveCache(cache, cacheDir);
  return artifacts;
}

function findTransitiveDependents(graph: SpecGraph, changed: string[]): string[] {
  const dependents = new Set<string>(changed);
  const queue = [...changed];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const ref of graph.edges) {
      const target = ref.ref.includes('#') ? ref.ref.split('#')[1] : ref.ref;

      if (target === current && ref.sourceFile && !dependents.has(ref.sourceFile)) {
        dependents.add(ref.sourceFile);
        queue.push(ref.sourceFile);
      }
    }
  }

  return Array.from(dependents);
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function loadCache(cacheDir: string): CompileCache {
  const cachePath = path.join(cacheDir, 'cache.json');

  try {
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // Cache corrupted or doesn't exist
  }

  return { location: cacheDir, entries: [] };
}

function saveCache(cache: CompileCache, cacheDir: string): void {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(
      path.join(cacheDir, 'cache.json'),
      JSON.stringify(cache, null, 2)
    );
  } catch {
    // Failed to save cache
  }
}

function findCachedArtifact(cache: CompileCache, blockId: string): CacheEntry | undefined {
  return cache.entries.find((e) => e.blockId === blockId);
}

export function invalidateCache(cacheDir: string = DEFAULT_CACHE_DIR): void {
  const cachePath = path.join(cacheDir, 'cache.json');
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }
}
