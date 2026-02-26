/**
speclang-header lines:5
id: @specs/cascade
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: @speclang/cascade/triggers
// Trigger source configurations and identification

import { TriggerSourceConfig, TriggerSource } from './types';

/**
 * Predefined trigger source configurations
 */
export const TRIGGER_SOURCES: TriggerSourceConfig[] = [
  {
    source: 'user_edit',
    files: ['project.scl', 'specs/core/**'],
    priority: 'high',
    starts_cascade: true
  },
  {
    source: 'agent_write',
    files: ['specs/**/*.scl', 'specs/**/*.spec.*'],
    priority: 'normal',
    triggers: ['speclang-spec-writer', 'speclang-code-gen']
  },
  {
    source: 'agent_write',
    files: ['generated/**/*'],
    priority: 'normal',
    triggers: ['speclang-test-writer']
  },
  {
    source: 'external',
    files: ['**/*'],
    priority: 'low',
    triggers: [] // Determined dynamically
  }
];

/**
 * Default ignore patterns (system-generated files that shouldn't trigger)
 */
export const IGNORE_PATTERNS = [
  '*.log',
  'reports/**/*',
  '.speclang/**/*',
  'node_modules/**/*',
  '.git/**/*',
  '*.tmp',
  '*.swp',
  'coverage/**/*'
];

/**
 * Default watch patterns (spec and code files that trigger cascades)
 */
export const WATCH_PATTERNS = [
  '**/*.spec.{md,yaml,yml,scl}',
  '**/*.{go,ts,js,py,rs,java}.spec',
  '**/project.scl',
  '**/build.{scl,yaml}',
  '**/*.scl'
];

/**
 * Simple glob pattern matcher
 * Supports: **, *, ?, character classes, brace expansion
 */
export function matchPattern(filePath: string, pattern: string): boolean {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');
  
  // Expand brace patterns first
  if (normalizedPattern.includes('{')) {
    const expanded = expandBrace(normalizedPattern);
    for (const p of expanded) {
      if (matchGlob(normalizedPath, p)) {
        return true;
      }
    }
    return false;
  }
  
  // Try direct glob matching
  return matchGlob(normalizedPath, normalizedPattern);
}

/**
 * Expand brace patterns like {a,b,c} to [a, b, c]
 */
function expandBrace(pattern: string): string[] {
  const match = pattern.match(/\{([^}]+)\}/);
  if (!match) return [pattern];
  
  const options = match[1].split(',');
  const prefix = pattern.slice(0, match.index);
  const suffix = pattern.slice(match.index + match[0].length);
  
  const results: string[] = [];
  for (const opt of options) {
    results.push(prefix + opt + suffix);
  }
  
  return results;
}

/**
 * Custom glob matcher
 */
function matchGlob(path: string, pattern: string): boolean {
  // Handle ** (globstar) - matches any number of directories
  if (pattern.includes('**')) {
    return matchGlobstar(path, pattern);
  }
  
  // Handle simple patterns with *
  if (pattern.includes('*')) {
    return matchSimpleGlob(path, pattern);
  }
  
  // Exact match
  return path === pattern;
}

/**
 * Match ** globstar pattern
 */
function matchGlobstar(path: string, pattern: string): boolean {
  const parts = pattern.split('**');
  
  if (parts.length === 2) {
    const prefix = parts[0];
    const suffix = parts[1].replace(/^\//, '');
    
    // ** at start - match anything ending with suffix
    if (prefix === '') {
      if (suffix === '') return true;
      
      // Check if path matches suffix (as glob)
      if (matchSimpleGlob(path, suffix)) return true;
      
      // Check if path ends with suffix
      if (path === suffix) return true;
      if (path.endsWith('/' + suffix)) return true;
      
      return false;
    }
    
    // ** in middle - prefix must match, then suffix
    const cleanPrefix = prefix.replace(/\/$/, '');
    if (!path.startsWith(cleanPrefix)) return false;
    
    const afterPrefix = path.slice(cleanPrefix.length);
    
    if (suffix === '') return true;
    
    // Check remaining path
    return matchSimpleGlob(afterPrefix, '/' + suffix);
  }
  
  return false;
}

/**
 * Match simple glob pattern (no **)
 */
function matchSimpleGlob(path: string, pattern: string): boolean {
  // Convert glob to regex
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape special chars
    .replace(/\*/g, '.*')                   // * -> .*
    .replace(/\?/g, '.');                   // ? -> .
  
  const regex = new RegExp('^' + regexStr + '$', 'i');
  return regex.test(path);
}

/**
 * Identify trigger source for a given file path
 */
export function identifyTriggerSource(
  filePath: string
): TriggerSourceConfig | null {
  for (const config of TRIGGER_SOURCES) {
    for (const pattern of config.files) {
      if (matchPattern(filePath, pattern)) {
        return config;
      }
    }
  }
  return null;
}

/**
 * Get the trigger source type from file path
 */
export function getTriggerSourceType(filePath: string): TriggerSource {
  const config = identifyTriggerSource(filePath);
  return config?.source || 'external';
}

/**
 * Check if a file should be watched (matches watch patterns)
 */
export function shouldWatch(filePath: string): boolean {
  return WATCH_PATTERNS.some(pattern => matchPattern(filePath, pattern));
}

/**
 * Check if a file should be ignored
 */
export function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => matchPattern(filePath, pattern));
}
