"use strict";
// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop @ref:specs/ralph-loop#ralph/steering-packets
Object.defineProperty(exports, "__esModule", { value: true });
exports.SteeringPacketBuilder = void 0;
exports.createSteeringPacket = createSteeringPacket;
exports.extractErrorReport = extractErrorReport;
exports.extractFixSuggestion = extractFixSuggestion;
exports.extractPriorityChange = extractPriorityChange;
exports.extractSuccessConfirmation = extractSuccessConfirmation;
exports.getPacketPriority = getPacketPriority;
exports.serializePacket = serializePacket;
exports.deserializePacket = deserializePacket;
/**
 * SteeringPacketBuilder - Fluent builder for creating steering packets
 */
class SteeringPacketBuilder {
    packet;
    constructor() {
        this.packet = {
            created_at: Date.now(),
        };
    }
    /**
     * Set the task ID
     */
    withTaskId(taskId) {
        this.packet.task_id = taskId;
        return this;
    }
    /**
     * Create an error report packet
     */
    asErrorReport(errorType, filePath, errorMessage, suggestedFix, priority = 5) {
        this.packet.type = 'error_report';
        this.packet.payload = {
            task_id: this.packet.task_id || '',
            error_type: errorType,
            file_path: filePath,
            error_message: errorMessage,
            suggested_fix: suggestedFix,
            priority,
        };
        return this;
    }
    /**
     * Create a fix suggestion packet
     */
    asFixSuggestion(filePath, currentState, suggestedChange, rationale) {
        this.packet.type = 'fix_suggestion';
        this.packet.payload = {
            task_id: this.packet.task_id || '',
            file_path: filePath,
            current_state: currentState,
            suggested_change: suggestedChange,
            rationale,
        };
        return this;
    }
    /**
     * Create a priority change packet
     */
    asPriorityChange(newPriority, reason, dependencies = []) {
        this.packet.type = 'priority_change';
        this.packet.payload = {
            task_id: this.packet.task_id || '',
            new_priority: newPriority,
            reason,
            dependencies,
        };
        return this;
    }
    /**
     * Create a success confirmation packet
     */
    asSuccessConfirmation(filesCreated, testsPassed, nextRecommendation = '') {
        this.packet.type = 'success_confirmation';
        this.packet.payload = {
            task_id: this.packet.task_id || '',
            files_created: filesCreated,
            tests_passed: testsPassed,
            next_recommendation: nextRecommendation,
        };
        return this;
    }
    /**
     * Build the steering packet
     */
    build() {
        if (!this.packet.task_id) {
            throw new Error('task_id is required');
        }
        if (!this.packet.type) {
            throw new Error('packet type is required');
        }
        if (!this.packet.payload) {
            throw new Error('packet payload is required');
        }
        return this.packet;
    }
}
exports.SteeringPacketBuilder = SteeringPacketBuilder;
/**
 * Create a new steering packet builder
 */
function createSteeringPacket() {
    return new SteeringPacketBuilder();
}
/**
 * Extract error report from steering packet
 */
function extractErrorReport(packet) {
    if (packet.type === 'error_report') {
        return packet.payload;
    }
    return null;
}
/**
 * Extract fix suggestion from steering packet
 */
function extractFixSuggestion(packet) {
    if (packet.type === 'fix_suggestion') {
        return packet.payload;
    }
    return null;
}
/**
 * Extract priority change from steering packet
 */
function extractPriorityChange(packet) {
    if (packet.type === 'priority_change') {
        return packet.payload;
    }
    return null;
}
/**
 * Extract success confirmation from steering packet
 */
function extractSuccessConfirmation(packet) {
    if (packet.type === 'success_confirmation') {
        return packet.payload;
    }
    return null;
}
/**
 * Get packet priority (higher = more important)
 */
function getPacketPriority(packet) {
    if (packet.type === 'error_report') {
        const report = packet.payload;
        return report.priority;
    }
    if (packet.type === 'priority_change') {
        const change = packet.payload;
        return change.new_priority;
    }
    // Default priority for other types
    return 5;
}
/**
 * Serialize steering packet to JSON string
 */
function serializePacket(packet) {
    return JSON.stringify(packet);
}
/**
 * Deserialize steering packet from JSON string
 */
function deserializePacket(json) {
    return JSON.parse(json);
}
//# sourceMappingURL=steering.js.map