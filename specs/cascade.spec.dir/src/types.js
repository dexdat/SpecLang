"use strict";
// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CYCLE_CONFIG = exports.DEFAULT_DEPTH_CONFIG = void 0;
exports.DEFAULT_DEPTH_CONFIG = {
    max_depth: 100,
    max_files_per_cascade: 1000,
    max_duration_ms: 10 * 60 * 1000, // 10 minutes
    quiet_period_ms: 30 * 1000 // 30 seconds
};
exports.DEFAULT_CYCLE_CONFIG = {
    max_repeats: 3,
    max_pattern_length: 5
};
//# sourceMappingURL=types.js.map