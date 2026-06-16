"use strict";
// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop @ref:specs/ralph-loop#ralph/builder-agent
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RalphBuilderAgent = void 0;
exports.createBuilderAgent = createBuilderAgent;
/**
 * Ralph Loop - Builder Agent
 *
 * The Builder Agent writes implementation specs and code based on steering packets
 * from the Verifier Agent and todo list items.
 *
 * @module ralph/builder
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const steering_1 = require("./steering");
/**
 * RalphBuilderAgent - Implementation of the Builder Agent
 */
class RalphBuilderAgent {
    role = "Write implementation specs and code";
    capabilities = [
        "Read all SIPs and existing specs",
        "Write implementation specs (.spec.md or .spec.yaml)",
        "Generate code from specs (.go.spec, .ts.spec)",
        "Follow file naming conventions",
        "Use speclang tools (when available)",
    ];
    triggers = [
        "Steering packet from Verifier",
        "Todo list item",
        "Manual human instruction",
    ];
    outputs = [
        "New/modified spec files",
        "Generated code files",
        "Commit messages",
        "Progress report",
    ];
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Execute a task from the todo list
     */
    async executeTask(task) {
        try {
            console.log(`[Builder] Executing task: ${task.id}`);
            // Mark task as in progress
            task.status = 'in_progress';
            task.started_at = Date.now();
            // Read all existing specs to understand the context
            const existingSpecs = await this.readAllSpecs();
            // Generate implementation based on task description
            const implementation = await this.generateImplementation(task, existingSpecs);
            // Write the implementation spec
            if (implementation.specContent) {
                await this.writeSpecFile(task.id, implementation.specContent);
            }
            // Generate code from spec
            const codeFiles = await this.generateCode(task, implementation);
            // Mark task as done
            task.status = 'done';
            task.completed_at = Date.now();
            return {
                success: true,
                output: {
                    specPath: implementation.specPath,
                    codeFiles,
                },
            };
        }
        catch (error) {
            task.status = 'failed';
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Process a steering packet and generate fixes
     */
    async processSteeringPacket(packet) {
        console.log(`[Builder] Processing steering packet: ${packet.type}`);
        const errorReport = (0, steering_1.extractErrorReport)(packet);
        const fixSuggestion = (0, steering_1.extractFixSuggestion)(packet);
        if (errorReport) {
            return this.fixError(errorReport);
        }
        if (fixSuggestion) {
            return this.applyFixSuggestion(fixSuggestion);
        }
        return {
            success: false,
            error: 'Unknown steering packet type',
        };
    }
    /**
     * Fix an error based on error report
     */
    async fixError(errorReport) {
        try {
            const { file_path, suggested_fix, error_type } = errorReport;
            console.log(`[Builder] Fixing error in ${file_path}: ${error_type}`);
            // Read the file
            if (!fs.existsSync(file_path)) {
                return {
                    success: false,
                    error: `File not found: ${file_path}`,
                };
            }
            const content = fs.readFileSync(file_path, 'utf-8');
            // Apply the suggested fix (simplified - in production would use AST)
            let fixedContent = content;
            // Common fix patterns
            if (error_type === 'missing_import') {
                // Add import at top of file
                const importStatement = this.extractImportFromFix(suggested_fix);
                if (importStatement) {
                    fixedContent = importStatement + '\n' + content;
                }
            }
            else if (error_type === 'syntax_error') {
                // Try to fix syntax errors based on suggestion
                fixedContent = this.applySyntaxFix(content, suggested_fix);
            }
            // Write the fixed file
            fs.writeFileSync(file_path, fixedContent, 'utf-8');
            return {
                success: true,
                output: {
                    codeFiles: [file_path],
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Apply a fix suggestion
     */
    async applyFixSuggestion(suggestion) {
        try {
            const { file_path, suggested_change } = suggestion;
            console.log(`[Builder] Applying fix suggestion to ${file_path}`);
            if (!fs.existsSync(file_path)) {
                return {
                    success: false,
                    error: `File not found: ${file_path}`,
                };
            }
            const content = fs.readFileSync(file_path, 'utf-8');
            // Apply the suggested change (simplified)
            // In production this would use proper AST manipulation
            const fixedContent = content + '\n// Fix: ' + suggested_change;
            fs.writeFileSync(file_path, fixedContent, 'utf-8');
            return {
                success: true,
                output: {
                    codeFiles: [file_path],
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Read all existing specs
     */
    async readAllSpecs() {
        const specs = [];
        if (!fs.existsSync(this.config.specsDir)) {
            return specs;
        }
        const files = fs.readdirSync(this.config.specsDir);
        for (const file of files) {
            if (file.endsWith('.spec.md') || file.endsWith('.spec.yaml')) {
                const filePath = path.join(this.config.specsDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                specs.push(content);
            }
        }
        return specs;
    }
    /**
     * Generate implementation for a task
     */
    async generateImplementation(task, existingSpecs) {
        // Simplified implementation generation
        // In production this would use actual spec analysis and code generation
        const specContent = `# Implementation for ${task.id}

${task.description}

## Status
- Priority: ${task.priority}
- Complexity: ${task.estimated_complexity}
- Generated: ${new Date().toISOString()}
`;
        return {
            specContent,
            specPath: path.join(this.config.specsDir, `${task.id}.spec.md`),
        };
    }
    /**
     * Generate code from implementation
     */
    async generateCode(task, implementation) {
        const codeFiles = [];
        // Simplified code generation
        // In production this would use actual code generation from specs
        return codeFiles;
    }
    /**
     * Write a spec file
     */
    async writeSpecFile(taskId, content) {
        const filePath = path.join(this.config.specsDir, `${taskId}.spec.md`);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`[Builder] Written spec: ${filePath}`);
    }
    /**
     * Extract import statement from fix suggestion
     */
    extractImportFromFix(fix) {
        const importMatch = fix.match(/import\s+.*?from\s+['"].*?['"]/);
        return importMatch ? importMatch[0] : null;
    }
    /**
     * Apply syntax fix
     */
    applySyntaxFix(content, fix) {
        // Simplified - would need proper parsing in production
        return content;
    }
    /**
     * Get agent info
     */
    getInfo() {
        return {
            role: this.role,
            capabilities: [...this.capabilities],
            triggers: [...this.triggers],
            outputs: [...this.outputs],
        };
    }
}
exports.RalphBuilderAgent = RalphBuilderAgent;
/**
 * Create a new Builder Agent instance
 */
function createBuilderAgent(config) {
    return new RalphBuilderAgent(config);
}
//# sourceMappingURL=builder.js.map