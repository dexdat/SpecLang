/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/config
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

/**
 * Configuration loading for project layout
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type {
  ProjectLayoutConfig,
  SpeclangRcConfig,
  ProjectStructure
} from './types.js';
import { DEFAULT_PROJECT_STRUCTURE } from './types.js';
import { getDefaultConfig } from '../config/loader.ts';

/**
 * Find project root by looking for project.scl or .speclangrc
 */
export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let current = startDir;
  
  // Check if the starting directory exists
  if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
    return null;
  }
  
  // Limit search depth to avoid infinite loops
  const maxDepth = 20;
  let depth = 0;
  
  while (depth < maxDepth) {
    // Check for marker files
    const hasNorthStar = fs.existsSync(path.join(current, 'project.scl'));
    const hasSpeclangrc = fs.existsSync(path.join(current, '.speclangrc'));
    const hasSpecs = fs.existsSync(path.join(current, 'specs'));
    
    if (hasNorthStar || (hasSpeclangrc && hasSpecs)) {
      return current;
    }
    
    const parent = path.dirname(current);
    if (parent === current) {
      // Reached filesystem root
      break;
    }
    current = parent;
    depth++;
  }
  
  return null;
}

/**
 * Load .speclangrc configuration
 */
export function loadSpeclangRc(projectRoot: string): SpeclangRcConfig | null {
  const configPath = path.join(projectRoot, '.speclangrc');
  
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = parseYamlLike(content);
    return config as SpeclangRcConfig;
  } catch (error) {
    console.warn(`Warning: Failed to parse .speclangrc: ${error}`);
    return null;
  }
}

/**
 * Simple YAML-like parser for .speclangrc
 */
function parseYamlLike(content: string): SpeclangRcConfig {
  const result: Record<string, unknown> = {};
  const lines = content.split('\n');
  
  let currentKey = '';
  let currentArray: string[] = [];
  let inArray = false;
  let inObject = false;
  let daemonObj: Record<string, unknown> = {};
  
  for (const rawLine of lines) {
    const line = rawLine.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) {
      continue;
    }
    
    // Check for array item
    if (line.startsWith('- ')) {
      const value = line.slice(2).trim();
      if (inArray) {
        currentArray.push(value);
      } else {
        currentArray = [value];
        inArray = true;
      }
      continue;
    }
    
    // Check for key: value
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      // Save previous array/object
      if (inArray && currentKey) {
        result[currentKey] = currentArray;
        currentArray = [];
        inArray = false;
      }
      if (inObject && currentKey && currentKey !== 'daemon') {
        result[currentKey] = { ...daemonObj };
        daemonObj = {};
        inObject = false;
      }
      
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      
      if (value === '' || value === 'true' || value === 'false') {
        // Boolean or empty (start of object/array)
        if (value === 'true') {
          result[key] = true;
        } else if (value === 'false') {
          result[key] = false;
        } else {
          // Start of nested object
          currentKey = key;
          if (key === 'daemon') {
            inObject = true;
          }
        }
      } else if (value.startsWith('"') || value.startsWith("'")) {
        // String
        result[key] = value.slice(1, -1);
      } else if (!isNaN(Number(value))) {
        // Number
        result[key] = Number(value);
      } else {
        // String
        result[key] = value;
      }
    }
  }
  
  // Save final array/object
  if (inArray && currentKey) {
    result[currentKey] = currentArray;
  }
  if (inObject) {
    result[currentKey] = daemonObj;
  }
  
  return result as unknown as SpeclangRcConfig;
}

/**
 * Build project structure from project root
 */
export function buildProjectStructure(projectRoot: string): ProjectStructure {
  return {
    root: projectRoot,
    specs: path.join(projectRoot, 'specs'),
    tests: path.join(projectRoot, 'tests'),
    generated: path.join(projectRoot, 'generated'),
    speclang: path.join(projectRoot, '.speclang'),
    northStar: path.join(projectRoot, 'project.scl'),
    config: path.join(projectRoot, '.speclangrc'),
    gitignore: path.join(projectRoot, '.gitignore')
  };
}

/**
 * Load full project layout configuration
 */
export function loadProjectLayoutConfig(
  projectRoot?: string
): ProjectLayoutConfig | null {
  // If projectRoot is explicitly provided, validate it exists
  // If not provided, search for it
  let root: string | null;
  if (projectRoot) {
    root = fs.existsSync(projectRoot) ? projectRoot : null;
  } else {
    root = findProjectRoot();
  }
  
  if (!root) {
    return null;
  }
  
  const structure = buildProjectStructure(root);
  const speclangrc = loadSpeclangRc(root);
  const baseConfig = getDefaultConfig();
  
  // Override with .speclangrc values if present
  if (speclangrc) {
    baseConfig.metadata.name = path.basename(root);
  }
  
  return {
    ...baseConfig,
    projectRoot: root,
    layout: structure,
    speclangrc: speclangrc || {
      version: 1,
      project_root: '.',
      spec_dirs: ['specs/', 'tests/'],
      generated_dir: 'generated/',
      daemon: {
        enabled: true,
        quiet_period: '30s'
      }
    }
  };
}

/**
 * Get project structure from current working directory
 */
export function getProjectStructure(): ProjectStructure | null {
  const root = findProjectRoot();
  if (!root) {
    return null;
  }
  return buildProjectStructure(root);
}

/**
 * Check if a directory is a speclang project
 */
export function isSpeclangProject(dir: string = process.cwd()): boolean {
  const root = findProjectRoot(dir);
  return root !== null;
}
