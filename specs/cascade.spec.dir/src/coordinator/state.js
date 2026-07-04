"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialState = createInitialState;
function createInitialState(triggerFile, maxDepth = 5) {
    return {
        cascade_id: `cascade-${Date.now()}`,
        depth: 0,
        max_depth: maxDepth,
        status: 'running',
        trigger_file: triggerFile,
        current_agent: '',
        agents_invoked: [],
        verification_results: [],
        depth_by_tree: { specs: 0, src: 0, tests: 0, docs: 0 }
    };
}
