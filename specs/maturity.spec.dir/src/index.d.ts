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
export * from './types';
export { MATURITY_LEVELS, getLevelDefinition, getLevelOrder, getAllLevels, getLevelByOrder, isValidTransition, getNextLevel, getPreviousLevel } from './levels';
export { CriteriaChecker, createCriteriaChecker } from './criteria';
export { TransitionManager, createTransitionManager } from './transitions';
export { AgentBehaviorResolver, createAgentBehaviorResolver, isAutonomousAllowed, isAutoDeployAllowed } from './agent-behavior';
//# sourceMappingURL=index.d.ts.map