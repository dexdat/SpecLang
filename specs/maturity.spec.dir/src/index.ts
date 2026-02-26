/**
speclang-header lines:5
id: @specs/maturity
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.spec.md

/**
 * Maturity System
 * 
 * A complete system for managing project maturity levels,
 * criteria validation, level transitions, and agent behavior.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { 
 *   getLevelDefinition, 
 *   CriteriaChecker,
 *   TransitionManager,
 *   AgentBehaviorResolver 
 * } from './maturity';
 * 
 * // Get level info
 * const level = getLevelDefinition('Production');
 * 
 * // Check if spec meets criteria
 * const checker = new CriteriaChecker();
 * const result = checker.checkLevel(spec, 'Beta');
 * 
 * // Get transition checklist
 * const transitions = new TransitionManager();
 * const canTransition = transitions.canTransition(spec, 'Production');
 * 
 * // Resolve agent behavior
 * const resolver = new AgentBehaviorResolver();
 * const behavior = resolver.resolve('Beta', 'agent_autonomous');
 * ```
 */

// Types
export * from './types';

// Levels
export { 
  MATURITY_LEVELS,
  getLevelDefinition,
  getLevelOrder,
  getAllLevels,
  getLevelByOrder,
  isValidTransition,
  getNextLevel,
  getPreviousLevel
} from './levels';

// Criteria
export { 
  CriteriaChecker,
  createCriteriaChecker 
} from './criteria';

// Transitions
export { 
  TransitionManager,
  createTransitionManager 
} from './transitions';

// Agent Behavior
export { 
  AgentBehaviorResolver,
  createAgentBehaviorResolver,
  isAutonomousAllowed,
  isAutoDeployAllowed 
} from './agent-behavior';
