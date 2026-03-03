"use strict";
// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.spec.md
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAutoDeployAllowed = exports.isAutonomousAllowed = exports.createAgentBehaviorResolver = exports.AgentBehaviorResolver = exports.createTransitionManager = exports.TransitionManager = exports.createCriteriaChecker = exports.CriteriaChecker = exports.getPreviousLevel = exports.getNextLevel = exports.isValidTransition = exports.getLevelByOrder = exports.getAllLevels = exports.getLevelOrder = exports.getLevelDefinition = exports.MATURITY_LEVELS = void 0;
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
__exportStar(require("./types"), exports);
// Levels
var levels_1 = require("./levels");
Object.defineProperty(exports, "MATURITY_LEVELS", { enumerable: true, get: function () { return levels_1.MATURITY_LEVELS; } });
Object.defineProperty(exports, "getLevelDefinition", { enumerable: true, get: function () { return levels_1.getLevelDefinition; } });
Object.defineProperty(exports, "getLevelOrder", { enumerable: true, get: function () { return levels_1.getLevelOrder; } });
Object.defineProperty(exports, "getAllLevels", { enumerable: true, get: function () { return levels_1.getAllLevels; } });
Object.defineProperty(exports, "getLevelByOrder", { enumerable: true, get: function () { return levels_1.getLevelByOrder; } });
Object.defineProperty(exports, "isValidTransition", { enumerable: true, get: function () { return levels_1.isValidTransition; } });
Object.defineProperty(exports, "getNextLevel", { enumerable: true, get: function () { return levels_1.getNextLevel; } });
Object.defineProperty(exports, "getPreviousLevel", { enumerable: true, get: function () { return levels_1.getPreviousLevel; } });
// Criteria
var criteria_1 = require("./criteria");
Object.defineProperty(exports, "CriteriaChecker", { enumerable: true, get: function () { return criteria_1.CriteriaChecker; } });
Object.defineProperty(exports, "createCriteriaChecker", { enumerable: true, get: function () { return criteria_1.createCriteriaChecker; } });
// Transitions
var transitions_1 = require("./transitions");
Object.defineProperty(exports, "TransitionManager", { enumerable: true, get: function () { return transitions_1.TransitionManager; } });
Object.defineProperty(exports, "createTransitionManager", { enumerable: true, get: function () { return transitions_1.createTransitionManager; } });
// Agent Behavior
var agent_behavior_1 = require("./agent-behavior");
Object.defineProperty(exports, "AgentBehaviorResolver", { enumerable: true, get: function () { return agent_behavior_1.AgentBehaviorResolver; } });
Object.defineProperty(exports, "createAgentBehaviorResolver", { enumerable: true, get: function () { return agent_behavior_1.createAgentBehaviorResolver; } });
Object.defineProperty(exports, "isAutonomousAllowed", { enumerable: true, get: function () { return agent_behavior_1.isAutonomousAllowed; } });
Object.defineProperty(exports, "isAutoDeployAllowed", { enumerable: true, get: function () { return agent_behavior_1.isAutoDeployAllowed; } });
//# sourceMappingURL=index.js.map