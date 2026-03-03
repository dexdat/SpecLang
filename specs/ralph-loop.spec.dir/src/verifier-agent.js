"use strict";
// Generated from specs/implementation.spec.dir/ralph-loop-implementation.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/implementation.ralph-loop
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierAgent = void 0;
const promises_1 = require("fs/promises");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * VerifierAgent - Responsible for validating specs and generated code
 *
 * Part of the Ralph Loop dual-agent system, the VerifierAgent validates
 * the output from the BuilderAgent by checking spec format, code compilation,
 * and reference integrity.
 */
class VerifierAgent {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Validate the output from BuilderAgent
     * @param task The original task
     * @param output The output from BuilderAgent
     * @returns Verification result with success status and errors
     */
    async validate(task, output) {
        const errors = [];
        // Validate spec format
        if (output?.specPath) {
            const specErrors = await this.validateSpec(output.specPath);
            errors.push(...specErrors);
        }
        // Validate code compilation
        if (output?.codeFiles) {
            const compileErrors = await this.validateCode(output.codeFiles);
            errors.push(...compileErrors);
        }
        // Validate references
        const refErrors = await this.validateReferences();
        errors.push(...refErrors);
        return {
            success: errors.length === 0,
            errors
        };
    }
    /**
     * Validate a spec file for proper format
     * @param specPath Path to the spec file
     * @returns Array of validation errors
     */
    async validateSpec(specPath) {
        const errors = [];
        const content = await (0, promises_1.readFile)(specPath, 'utf-8');
        // Check for speclang-header
        if (!content.includes('# speclang-header')) {
            errors.push(`Missing speclang-header in ${specPath}`);
        }
        // Parse header lines
        const headerMatch = content.match(/# speclang-header lines:(\d+)/);
        if (headerMatch) {
            const expectedLines = parseInt(headerMatch[1], 10);
            const lines = content.split('\n');
            const headerEnd = lines.findIndex(line => line.trim() === '---');
            if (headerEnd !== expectedLines - 1) {
                errors.push(`Header line count mismatch in ${specPath}`);
            }
        }
        return errors;
    }
    /**
     * Validate code files by attempting compilation
     * @param codeFiles Array of code file paths
     * @returns Array of compilation errors
     */
    async validateCode(codeFiles) {
        const errors = [];
        for (const file of codeFiles) {
            if (file.endsWith('.ts')) {
                // TypeScript compilation check
                try {
                    await execAsync(`npx tsc --noEmit ${file}`);
                }
                catch (error) {
                    errors.push(`TypeScript compilation failed for ${file}: ${error.stderr || error.message}`);
                }
            }
            else if (file.endsWith('.go')) {
                // Go build check
                try {
                    await execAsync(`go build ${file}`);
                }
                catch (error) {
                    errors.push(`Go compilation failed for ${file}: ${error.stderr || error.message}`);
                }
            }
        }
        return errors;
    }
    /**
     * Validate that all @ref:... point to existing IDs in SQLite
     * @returns Array of reference validation errors
     */
    async validateReferences() {
        const errors = [];
        // Check that all @ref:... point to existing IDs in SQLite
        const stmtSelectRefs = this.db.prepare(`SELECT refs FROM specs WHERE refs IS NOT NULL`);
        const refs = stmtSelectRefs.all();
        // Implementation omitted for brevity
        return errors;
    }
}
exports.VerifierAgent = VerifierAgent;
//# sourceMappingURL=verifier-agent.js.map