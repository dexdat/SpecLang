# speclang-header lines:15
id: @specs/indexer
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_autonomous
tags: [indexer, core, graph, validation]
short: Spec indexer with dependency graph analysis
target: src/indexer/
---

# Spec Indexer Module

This module provides the main indexer functionality for SpecLang. It scans the specs/ directory and generates _index.json with full graph analysis including dependency tracking, cycle detection, and impact analysis.

## @block:index.ts @kind:code

Main indexer module that handles:
- Header parsing from spec files
- Reference extraction (@ref: patterns)
- Block extraction (@block: definitions)
- File discovery across specs/ directory
- Index generation with all metadata
- SQLite database population
- CLI commands for validation, tree, impact, and graph analysis

**Key Functions:**
- `parseHeader()` - Parse speclang header from file/content
- `extractRefsFromContent()` - Extract @ref: references
- `extractBlocksFromContent()` - Extract @block: definitions
- `getSpecFiles()` - Recursively find all spec files
- `generateIndex()` - Generate complete spec index
- `populateDatabase()` - Populate SQLite with index data
- `validateIndexCmd()` - Validate index references
- `treeCmd()` - Show dependency tree for a spec
- `impactCmd()` - Show impact analysis for a spec
- `graphCmd()` - Show graph statistics

## @block:types.ts @kind:code

TypeScript interfaces for the indexer module:

**Core Interfaces:**
- `SpecIndex` - Complete index structure with version, specs, graph, orphans, cycles
- `SpecEntry` - Individual spec metadata (id, file, version, layer, tags, blocks, etc.)
- `DependencyGraph` - Forward and reverse dependency mappings
- `ValidationSummary` - Reference validation results

**Graph Operation Types:**
- `ImpactAnalysis` - Impact analysis result with direct/transitive dependents
- `PathResult` - Path finding result with hops count
- `CycleResult` - Cycle detection result

**Configuration:**
- `IndexerOptions` - Configuration for indexer behavior
- `DEFAULT_INDEXER_OPTIONS` - Default configuration values

## @block:graph.ts @kind:code

Graph building and analysis operations:

**Core Functions:**
- `buildDependencyGraph()` - Build forward/reverse dependency graphs from specs
- `getTransitiveDependencies()` - Get all transitive dependencies
- `getTransitiveDependents()` - Get all transitive dependents
- `detectCycles()` - Detect circular dependencies using DFS
- `findOrphans()` - Find specs with no connections
- `findPath()` - Find path between two specs
- `topologicalSort()` - Sort specs topologically

**Helper Functions:**
- `addEdge()` - Add directed edge to graph
- `cleanReference()` - Normalize reference format
- `deduplicateGraph()` - Remove duplicate edges

## @block:analyzer.ts @kind:code

Analysis utilities for impact and validation:

**Core Functions:**
- `impactAnalysis()` - Analyze impact of changing a spec (direct/transitive dependents)
- `validateReferences()` - Validate all references point to existing specs
- `generateReport()` - Generate comprehensive analysis report

**Exported from types.ts:**
- `ImpactAnalysis` interface
- `ValidationSummary` interface
