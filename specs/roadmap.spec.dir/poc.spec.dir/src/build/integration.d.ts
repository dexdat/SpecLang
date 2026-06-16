/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/build-integration.spec.md
 * Generated: 2026-03-03T10:55:00.000Z
 *
 * Edit the spec, not this file.
 */
/**
 * Build integration for generated code
 */
export declare class BuildIntegration {
    private config;
    constructor(config: {
        buildCommand: string;
        verifyCommand?: string;
    });
    /**
     * Validate and sanitize build command
     * @throws {POCError} If command is not in whitelist
     */
    private validateBuildCommand;
    /**
     * Simple command argument parser for POC
     * Handles quoted arguments: "arg with spaces" 'single quoted'
     * Returns array of parsed arguments
     */
    private parseCommandArguments;
    /**
     * Run build after code generation with security hardening
     * @returns Build result with success status and output
     */
    runBuild(): Promise<{
        success: boolean;
        stdout: string;
        stderr: string;
        duration: number;
    }>;
    /**
     * Verify generated files are in place before building
     */
    verifyGeneratedFiles(specIds: string[]): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=integration.d.ts.map