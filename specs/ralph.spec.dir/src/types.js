"use strict";
// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMPLEMENTATION_PHASES = exports.VALIDATION_PIPELINE = exports.DEFAULT_LOOP_CONFIG = void 0;
// ============================================================================
// Constants
// ============================================================================
/**
 * Default loop configuration
 */
exports.DEFAULT_LOOP_CONFIG = {
    maxIterations: 100,
    retryLimit: 3,
    timeout: 300000, // 5 minutes
};
/**
 * Validation pipeline order
 */
exports.VALIDATION_PIPELINE = [
    "Spec Format Check",
    "Header Compliance",
    "Reference Validation",
    "Code Compilation",
    "Test Execution",
    "Integration Test",
];
/**
 * Implementation phases in order
 */
exports.IMPLEMENTATION_PHASES = [
    {
        phase: "phase_1_manual_emulation",
        description: "Human acts as Builder, speclang-builder agent acts as Verifier, Manual steering packets",
        goal: "Complete spec set",
    },
    {
        phase: "phase_2_semi_automated",
        description: "speclang-builder as Builder, Automated validation scripts as Verifier, SQLite-based steering packets",
        goal: "Core implementation specs",
    },
    {
        phase: "phase_3_full_automation",
        description: "Dedicated Builder agent, Dedicated Verifier agent, Full validation pipeline",
        goal: "Complete Speclang system",
    },
    {
        phase: "phase_4_self_hosting",
        description: "Use built Speclang to improve itself, Evolutionary development, Continuous Ralph Loop",
        goal: "Self-improvement",
    },
];
//# sourceMappingURL=types.js.map