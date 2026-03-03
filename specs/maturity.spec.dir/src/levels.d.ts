import { LevelDefinition, MaturityLevel } from './types';
/**
 * Maturity Level Definitions
 *
 * Complete definitions for each project maturity level
 * with criteria, agent behavior, and required fields.
 */
export declare const MATURITY_LEVELS: LevelDefinition[];
/**
 * Get level definition by name
 */
export declare function getLevelDefinition(level: MaturityLevel): LevelDefinition | undefined;
/**
 * Get level order (0 = least mature)
 */
export declare function getLevelOrder(level: MaturityLevel): number;
/**
 * Get all level names
 */
export declare function getAllLevels(): MaturityLevel[];
/**
 * Get level by order
 */
export declare function getLevelByOrder(order: number): LevelDefinition | undefined;
/**
 * Check if transition is valid (must be adjacent levels, forward only)
 */
export declare function isValidTransition(from: MaturityLevel, to: MaturityLevel): boolean;
/**
 * Get next level in the hierarchy
 */
export declare function getNextLevel(current: MaturityLevel): MaturityLevel | null;
/**
 * Get previous level in the hierarchy
 */
export declare function getPreviousLevel(current: MaturityLevel): MaturityLevel | null;
//# sourceMappingURL=levels.d.ts.map