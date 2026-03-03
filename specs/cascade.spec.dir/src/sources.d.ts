import { TriggerSourceConfig, TriggerSource } from './types';
/**
 * Predefined trigger source configurations
 */
export declare const TRIGGER_SOURCES: TriggerSourceConfig[];
/**
 * Default ignore patterns (system-generated files that shouldn't trigger)
 */
export declare const IGNORE_PATTERNS: string[];
/**
 * Default watch patterns (spec and code files that trigger cascades)
 */
export declare const WATCH_PATTERNS: string[];
/**
 * Simple glob pattern matcher
 * Supports: **, *, ?, character classes, brace expansion
 */
export declare function matchPattern(filePath: string, pattern: string): boolean;
/**
 * Identify trigger source for a given file path
 */
export declare function identifyTriggerSource(filePath: string): TriggerSourceConfig | null;
/**
 * Get the trigger source type from file path
 */
export declare function getTriggerSourceType(filePath: string): TriggerSource;
/**
 * Check if a file should be watched (matches watch patterns)
 */
export declare function shouldWatch(filePath: string): boolean;
/**
 * Check if a file should be ignored
 */
export declare function shouldIgnore(filePath: string): boolean;
//# sourceMappingURL=sources.d.ts.map