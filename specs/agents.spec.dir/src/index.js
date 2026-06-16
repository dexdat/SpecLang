"use strict";
/**
 * SPECLANG-GENERATED: Agent Session Manager - Main exports
 * Source: @speclang/agent-protocol @block:protocol/overview
 *
 * This is the main entry point for the Agent Session Manager.
 * It provides session management, ownership tracking, and tools for AI agents.
 */
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
exports.parseAgentSupport = exports.parseProjectLevel = exports.createMetadataRouting = exports.createSessionApiServer = exports.SessionApiServer = exports.createViolationTracker = exports.ViolationTracker = exports.getRulesForAgent = exports.mergeRules = exports.createRule = exports.validateRules = exports.getAgentPriority = exports.isExemptFromGuard = exports.ORCHESTRATOR_RULE = exports.DEFAULT_RULES = exports.getGuardStats = exports.getViolations = exports.getFileOwner = exports.interceptWrite = exports.checkOwnership = exports.resetGuard = exports.getGuard = exports.initGuard = exports.createWriteInterceptor = exports.WriteInterceptor = exports.SessionLifecycle = exports.createStateManager = exports.StateManager = exports.commitHandler = exports.createSpecFileHandler = exports.cascadeStatusHandler = exports.triggerCascadeHandler = exports.impactAnalysisHandler = exports.getDependentsHandler = exports.getDependenciesHandler = exports.listFilesHandler = exports.writeFileHandler = exports.readFileHandler = exports.searchSpecsHandler = exports.writeSpecHandler = exports.readSpecHandler = exports.getStandardTools = exports.createToolRegistry = exports.SimpleToolRegistry = exports.createAgentRegistry = exports.AgentRegistry = exports.createOwnershipRegistry = exports.OwnershipRegistry = exports.createSessionManager = exports.SessionManager = void 0;
exports.extractMetadataFromHeader = void 0;
// Types
__exportStar(require("./types"), exports);
// Session management
var session_1 = require("./session");
Object.defineProperty(exports, "SessionManager", { enumerable: true, get: function () { return session_1.SessionManager; } });
Object.defineProperty(exports, "createSessionManager", { enumerable: true, get: function () { return session_1.createSessionManager; } });
// Ownership tracking
var ownership_1 = require("./ownership");
Object.defineProperty(exports, "OwnershipRegistry", { enumerable: true, get: function () { return ownership_1.OwnershipRegistry; } });
Object.defineProperty(exports, "createOwnershipRegistry", { enumerable: true, get: function () { return ownership_1.createOwnershipRegistry; } });
// Agent registry
var registry_1 = require("./registry");
Object.defineProperty(exports, "AgentRegistry", { enumerable: true, get: function () { return registry_1.AgentRegistry; } });
Object.defineProperty(exports, "createAgentRegistry", { enumerable: true, get: function () { return registry_1.createAgentRegistry; } });
// Tools
var tools_1 = require("./tools");
Object.defineProperty(exports, "SimpleToolRegistry", { enumerable: true, get: function () { return tools_1.SimpleToolRegistry; } });
Object.defineProperty(exports, "createToolRegistry", { enumerable: true, get: function () { return tools_1.createToolRegistry; } });
Object.defineProperty(exports, "getStandardTools", { enumerable: true, get: function () { return tools_1.getStandardTools; } });
var tools_2 = require("./tools");
Object.defineProperty(exports, "readSpecHandler", { enumerable: true, get: function () { return tools_2.readSpecHandler; } });
Object.defineProperty(exports, "writeSpecHandler", { enumerable: true, get: function () { return tools_2.writeSpecHandler; } });
Object.defineProperty(exports, "searchSpecsHandler", { enumerable: true, get: function () { return tools_2.searchSpecsHandler; } });
Object.defineProperty(exports, "readFileHandler", { enumerable: true, get: function () { return tools_2.readFileHandler; } });
Object.defineProperty(exports, "writeFileHandler", { enumerable: true, get: function () { return tools_2.writeFileHandler; } });
Object.defineProperty(exports, "listFilesHandler", { enumerable: true, get: function () { return tools_2.listFilesHandler; } });
Object.defineProperty(exports, "getDependenciesHandler", { enumerable: true, get: function () { return tools_2.getDependenciesHandler; } });
Object.defineProperty(exports, "getDependentsHandler", { enumerable: true, get: function () { return tools_2.getDependentsHandler; } });
Object.defineProperty(exports, "impactAnalysisHandler", { enumerable: true, get: function () { return tools_2.impactAnalysisHandler; } });
Object.defineProperty(exports, "triggerCascadeHandler", { enumerable: true, get: function () { return tools_2.triggerCascadeHandler; } });
Object.defineProperty(exports, "cascadeStatusHandler", { enumerable: true, get: function () { return tools_2.cascadeStatusHandler; } });
Object.defineProperty(exports, "createSpecFileHandler", { enumerable: true, get: function () { return tools_2.createSpecFileHandler; } });
Object.defineProperty(exports, "commitHandler", { enumerable: true, get: function () { return tools_2.commitHandler; } });
// State persistence
var state_1 = require("./state");
Object.defineProperty(exports, "StateManager", { enumerable: true, get: function () { return state_1.StateManager; } });
Object.defineProperty(exports, "createStateManager", { enumerable: true, get: function () { return state_1.createStateManager; } });
// Session Lifecycle
var lifecycle_1 = require("./lifecycle");
Object.defineProperty(exports, "SessionLifecycle", { enumerable: true, get: function () { return lifecycle_1.SessionLifecycle; } });
// Interceptor (Write Guard)
var interceptor_1 = require("./interceptor");
Object.defineProperty(exports, "WriteInterceptor", { enumerable: true, get: function () { return interceptor_1.WriteInterceptor; } });
Object.defineProperty(exports, "createWriteInterceptor", { enumerable: true, get: function () { return interceptor_1.createWriteInterceptor; } });
Object.defineProperty(exports, "initGuard", { enumerable: true, get: function () { return interceptor_1.initGuard; } });
Object.defineProperty(exports, "getGuard", { enumerable: true, get: function () { return interceptor_1.getGuard; } });
Object.defineProperty(exports, "resetGuard", { enumerable: true, get: function () { return interceptor_1.resetGuard; } });
Object.defineProperty(exports, "checkOwnership", { enumerable: true, get: function () { return interceptor_1.checkOwnership; } });
Object.defineProperty(exports, "interceptWrite", { enumerable: true, get: function () { return interceptor_1.interceptWrite; } });
Object.defineProperty(exports, "getFileOwner", { enumerable: true, get: function () { return interceptor_1.getFileOwner; } });
Object.defineProperty(exports, "getViolations", { enumerable: true, get: function () { return interceptor_1.getViolations; } });
Object.defineProperty(exports, "getGuardStats", { enumerable: true, get: function () { return interceptor_1.getGuardStats; } });
// Rules
var rules_1 = require("./rules");
Object.defineProperty(exports, "DEFAULT_RULES", { enumerable: true, get: function () { return rules_1.DEFAULT_RULES; } });
Object.defineProperty(exports, "ORCHESTRATOR_RULE", { enumerable: true, get: function () { return rules_1.ORCHESTRATOR_RULE; } });
Object.defineProperty(exports, "isExemptFromGuard", { enumerable: true, get: function () { return rules_1.isExemptFromGuard; } });
Object.defineProperty(exports, "getAgentPriority", { enumerable: true, get: function () { return rules_1.getAgentPriority; } });
Object.defineProperty(exports, "validateRules", { enumerable: true, get: function () { return rules_1.validateRules; } });
Object.defineProperty(exports, "createRule", { enumerable: true, get: function () { return rules_1.createRule; } });
Object.defineProperty(exports, "mergeRules", { enumerable: true, get: function () { return rules_1.mergeRules; } });
Object.defineProperty(exports, "getRulesForAgent", { enumerable: true, get: function () { return rules_1.getRulesForAgent; } });
// Violations
var violations_1 = require("./violations");
Object.defineProperty(exports, "ViolationTracker", { enumerable: true, get: function () { return violations_1.ViolationTracker; } });
Object.defineProperty(exports, "createViolationTracker", { enumerable: true, get: function () { return violations_1.createViolationTracker; } });
// Session API Server
var session_api_1 = require("./session-api");
Object.defineProperty(exports, "SessionApiServer", { enumerable: true, get: function () { return session_api_1.SessionApiServer; } });
Object.defineProperty(exports, "createSessionApiServer", { enumerable: true, get: function () { return session_api_1.createSessionApiServer; } });
// Metadata Routing
var metadata_routing_1 = require("./metadata-routing");
Object.defineProperty(exports, "createMetadataRouting", { enumerable: true, get: function () { return metadata_routing_1.createMetadataRouting; } });
Object.defineProperty(exports, "parseProjectLevel", { enumerable: true, get: function () { return metadata_routing_1.parseProjectLevel; } });
Object.defineProperty(exports, "parseAgentSupport", { enumerable: true, get: function () { return metadata_routing_1.parseAgentSupport; } });
Object.defineProperty(exports, "extractMetadataFromHeader", { enumerable: true, get: function () { return metadata_routing_1.extractMetadataFromHeader; } });
//# sourceMappingURL=index.js.map