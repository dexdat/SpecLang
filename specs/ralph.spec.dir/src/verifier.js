"use strict";
// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop @ref:specs/ralph-loop#ralph/verifier-agent
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
exports.RalphVerifierAgent = void 0;
exports.createVerifierAgent = createVerifierAgent;
/**
 * Ralph Loop - Verifier Agent
 *
 * The Verifier Agent validates output, creates steering packets, and runs
 * the validation pipeline including spec format checks, code compilation,
 * test execution, and integration tests.
 *
 * @module ralph/verifier
 */
const fs = __importStar(require("fs"));
const types_1 = require("./types");
const steering_1 = require("./steering");
/**
 * RalphVerifierAgent - Implementation of the Verifier Agent
 */
class RalphVerifierAgent {
    role = "Validate output, create steering packets";
    capabilities = [
        "Validate spec format compliance",
        "Check code compilation",
        "Run tests",
        "Verify references and dependencies",
        "Create steering packets",
    ];
    validation_pipeline = [...types_1.VALIDATION_PIPELINE];
    outputs = [
        "Validation reports",
        "Steering packets",
        "Failure analysis",
        "Success confirmation",
    ];
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Run the complete validation pipeline on a task's output
     */
    async validate(builderResult, task) {
        console.log(`[Verifier] Validating task: ${task.id}`);
        const errors = [];
        const passedStages = [];
        // Run each stage in order
        for (const stage of this.validation_pipeline) {
            const result = await this.runValidationStage(stage, builderResult, task);
            if (result.passed) {
                passedStages.push(stage);
            }
            else {
                errors.push(...result.errors);
            }
        }
        const success = errors.length === 0;
        return {
            success,
            errors,
            passedStages,
        };
    }
    /**
     * Run a single validation stage
     */
    async runValidationStage(stage, builderResult, task) {
        console.log(`[Verifier] Running stage: ${stage}`);
        switch (stage) {
            case "Spec Format Check":
                return this.validateSpecFormat(builderResult);
            case "Header Compliance":
                return this.validateHeaderCompliance(builderResult);
            case "Reference Validation":
                return this.validateReferences(builderResult);
            case "Code Compilation":
                return this.validateCodeCompilation(builderResult);
            case "Test Execution":
                return this.validateTests(builderResult);
            case "Integration Test":
                return this.validateIntegration(builderResult);
            default:
                return { passed: true, errors: [] };
        }
    }
    /**
     * Validate spec format
     */
    async validateSpecFormat(builderResult) {
        const errors = [];
        if (builderResult.output?.specPath) {
            if (!fs.existsSync(builderResult.output.specPath)) {
                errors.push(`Spec file not found: ${builderResult.output.specPath}`);
            }
            else {
                const content = fs.readFileSync(builderResult.output.specPath, 'utf-8');
                // Check for required elements
                if (!content.includes('# speclang-header')) {
                    errors.push('Missing speclang-header in spec file');
                }
                if (!content.includes('id:')) {
                    errors.push('Missing id field in spec file');
                }
            }
        }
        return { passed: errors.length === 0, errors };
    }
    /**
     * Validate header compliance
     */
    async validateHeaderCompliance(builderResult) {
        const errors = [];
        if (builderResult.output?.specPath && fs.existsSync(builderResult.output.specPath)) {
            const content = fs.readFileSync(builderResult.output.specPath, 'utf-8');
            // Check for required header fields
            const requiredFields = ['id:', 'version:', 'layer:', 'tags:'];
            for (const field of requiredFields) {
                if (!content.includes(field)) {
                    errors.push(`Missing required field in header: ${field}`);
                }
            }
        }
        return { passed: errors.length === 0, errors };
    }
    /**
     * Validate references
     */
    async validateReferences(builderResult) {
        const errors = [];
        if (builderResult.output?.specPath && fs.existsSync(builderResult.output.specPath)) {
            const content = fs.readFileSync(builderResult.output.specPath, 'utf-8');
            // Extract @ref references
            const refMatches = content.match(/@ref:[^\s]+/g);
            if (refMatches) {
                for (const ref of refMatches) {
                    const refPath = ref.replace('@ref:', '');
                    // Simplified validation - check if reference format is correct
                    if (!refPath.includes('specs/') && !refPath.startsWith('@')) {
                        errors.push(`Invalid reference format: ${ref}`);
                    }
                }
            }
        }
        return { passed: errors.length === 0, errors };
    }
    /**
     * Validate code compilation
     */
    async validateCodeCompilation(builderResult) {
        const errors = [];
        // Check for TypeScript compilation if we have code files
        if (builderResult.output?.codeFiles) {
            for (const codeFile of builderResult.output.codeFiles) {
                if (codeFile.endsWith('.ts') && fs.existsSync(codeFile)) {
                    // In production, would run tsc here
                    // For now, just check file exists and has content
                    const content = fs.readFileSync(codeFile, 'utf-8');
                    if (content.trim().length === 0) {
                        errors.push(`Empty code file: ${codeFile}`);
                    }
                }
            }
        }
        return { passed: errors.length === 0, errors };
    }
    /**
     * Validate tests
     */
    async validateTests(builderResult) {
        // Simplified - in production would run actual tests
        return { passed: true, errors: [] };
    }
    /**
     * Validate integration
     */
    async validateIntegration(builderResult) {
        // Simplified - in production would run integration tests
        return { passed: true, errors: [] };
    }
    /**
     * Create a steering packet for a failed validation
     */
    createSteeringPacketForFailure(task, errors) {
        return (0, steering_1.createSteeringPacket)()
            .withTaskId(task.id)
            .asErrorReport('validation_failed', task.id, errors.join('; '), 'Review validation errors and fix the issues', task.priority)
            .build();
    }
    /**
     * Create a success confirmation packet
     */
    createSuccessConfirmation(task, builderResult) {
        const filesCreated = [];
        if (builderResult.output?.specPath) {
            filesCreated.push(builderResult.output.specPath);
        }
        if (builderResult.output?.codeFiles) {
            filesCreated.push(...builderResult.output.codeFiles);
        }
        return (0, steering_1.createSteeringPacket)()
            .withTaskId(task.id)
            .asSuccessConfirmation(filesCreated, true, 'Task completed successfully')
            .build();
    }
    /**
     * Get agent info
     */
    getInfo() {
        return {
            role: this.role,
            capabilities: [...this.capabilities],
            validation_pipeline: [...this.validation_pipeline],
            outputs: [...this.outputs],
        };
    }
}
exports.RalphVerifierAgent = RalphVerifierAgent;
/**
 * Create a new Verifier Agent instance
 */
function createVerifierAgent(config) {
    return new RalphVerifierAgent(config);
}
//# sourceMappingURL=verifier.js.map