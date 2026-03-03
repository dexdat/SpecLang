"use strict";
/**
 * SPECLANG-GENERATED: Tool Registry
 * Source: @speclang/tools
 *
 * Tool registry with ownership enforcement and audit logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
exports.createToolRegistry = createToolRegistry;
// ============================================================================
// JSON SCHEMA VALIDATOR
// ============================================================================
/**
 * Validate input against JSON schema
 */
function validateJSONSchema(schema, input) {
    const errors = [];
    // Check type
    if (schema.type === 'object') {
        if (typeof input !== 'object' || input === null || Array.isArray(input)) {
            return { valid: false, error: `Expected object, got ${typeof input}` };
        }
        // Check required fields
        if (schema.required) {
            for (const field of schema.required) {
                if (!(field in input)) {
                    errors.push(`Missing required field: ${field}`);
                }
            }
        }
        // Check properties
        if (schema.properties) {
            for (const [key, value] of Object.entries(input)) {
                const propSchema = schema.properties[key];
                if (propSchema) {
                    const propValidation = validateJSONSchema(propSchema, value);
                    if (!propValidation.valid) {
                        errors.push(`${key}: ${propValidation.error}`);
                    }
                }
            }
        }
    }
    else if (schema.type === 'array') {
        if (!Array.isArray(input)) {
            return { valid: false, error: `Expected array, got ${typeof input}` };
        }
        if (schema.items) {
            input.forEach((item, index) => {
                const itemValidation = validateJSONSchema(schema.items, item);
                if (!itemValidation.valid) {
                    errors.push(`[${index}]: ${itemValidation.error}`);
                }
            });
        }
    }
    else if (schema.type === 'string') {
        if (typeof input !== 'string') {
            return { valid: false, error: `Expected string, got ${typeof input}` };
        }
        if (schema.minLength !== undefined && input.length < schema.minLength) {
            errors.push(`String too short: min ${schema.minLength}, got ${input.length}`);
        }
        if (schema.maxLength !== undefined && input.length > schema.maxLength) {
            errors.push(`String too long: max ${schema.maxLength}, got ${input.length}`);
        }
        if (schema.pattern && !new RegExp(schema.pattern).test(input)) {
            errors.push(`String does not match pattern: ${schema.pattern}`);
        }
    }
    else if (schema.type === 'number' || schema.type === 'integer') {
        if (typeof input !== 'number') {
            return { valid: false, error: `Expected number, got ${typeof input}` };
        }
        if (schema.minimum !== undefined && input < schema.minimum) {
            errors.push(`Number too small: min ${schema.minimum}, got ${input}`);
        }
        if (schema.maximum !== undefined && input > schema.maximum) {
            errors.push(`Number too large: max ${schema.maximum}, got ${input}`);
        }
    }
    else if (schema.type === 'boolean') {
        if (typeof input !== 'boolean') {
            return { valid: false, error: `Expected boolean, got ${typeof input}` };
        }
    }
    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        error: errors.length > 0 ? errors.join('; ') : undefined,
    };
}
// ============================================================================
// TOOL REGISTRY
// ============================================================================
/**
 * Tool registry with ownership enforcement and audit logging
 */
class ToolRegistry {
    tools = new Map();
    ownershipChecker;
    auditLog = [];
    constructor(ownershipChecker) {
        this.ownershipChecker = ownershipChecker || {
            canWrite: () => ({ allowed: true }),
            canRead: () => ({ allowed: true }),
            getOwner: () => null,
        };
    }
    /**
     * Register a tool
     */
    register(tool) {
        this.tools.set(tool.name, tool);
        console.log(`[ToolRegistry] Registered: ${tool.name}`);
    }
    /**
     * Execute a tool by name
     */
    async execute(name, input, context) {
        const tool = this.tools.get(name);
        if (!tool) {
            return { success: false, error: `Unknown tool: ${name}` };
        }
        // Validate input schema
        const validation = this.validateInput(tool, input);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        // Check ownership if required
        if (tool.requiresOwnership && this.ownershipChecker) {
            // Determine filepath from input
            const filepath = input.path || input.id || '';
            const ownership = this.ownershipChecker.canWrite(context.sessionId, context.agentRole, filepath);
            if (!ownership.allowed) {
                return { success: false, error: ownership.reason };
            }
        }
        // Execute with audit logging
        if (tool.auditLog !== false) {
            this.logToolCall(name, input, context);
        }
        try {
            const result = await tool.handler(input, context);
            return result;
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Get a tool by name
     */
    get(name) {
        return this.tools.get(name);
    }
    /**
     * List all registered tools
     */
    list() {
        return Array.from(this.tools.values()).map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
            requiresOwnership: t.requiresOwnership,
            auditLog: t.auditLog,
            category: t.category,
        }));
    }
    /**
     * Get tools by category
     */
    listByCategory(category) {
        return this.list().filter((t) => t.category === category);
    }
    /**
     * Validate input against tool's schema
     */
    validateInput(tool, input) {
        return validateJSONSchema(tool.inputSchema, input);
    }
    /**
     * Log tool call for audit
     */
    logToolCall(name, input, context) {
        this.auditLog.push({
            timestamp: Date.now(),
            tool: name,
            input: { ...input }, // Copy to avoid mutation
            sessionId: context.sessionId,
            agentRole: context.agentRole,
            success: true, // Will be updated on result
        });
        // Keep only last 1000 entries
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-1000);
        }
    }
    /**
     * Get audit log
     */
    getAuditLog(limit = 100) {
        return this.auditLog.slice(-limit);
    }
    /**
     * Clear audit log
     */
    clearAuditLog() {
        this.auditLog = [];
    }
    /**
     * Get count of registered tools
     */
    size() {
        return this.tools.size;
    }
    /**
     * Check if tool exists
     */
    has(name) {
        return this.tools.has(name);
    }
    /**
     * Unregister a tool
     */
    unregister(name) {
        return this.tools.delete(name);
    }
    /**
     * Clear all tools
     */
    clear() {
        this.tools.clear();
    }
}
exports.ToolRegistry = ToolRegistry;
/**
 * Create a tool registry with optional ownership checker
 */
function createToolRegistry(ownershipChecker) {
    return new ToolRegistry(ownershipChecker);
}
//# sourceMappingURL=registry.js.map