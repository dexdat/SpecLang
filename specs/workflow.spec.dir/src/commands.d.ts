/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/commands
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
/**
 * Install artifacts information
 *
 * @block:workflow/install-detail @kind:entity
 */
export interface InstallArtifacts {
    binary: {
        path: string;
        size: string;
        platforms: string[];
    };
    skills: {
        path: string;
        contents: string[];
        size: string;
    };
    config: {
        path: string;
        defaults: string;
    };
}
/**
 * Skills download options
 */
export interface SkillsOptions {
    overwrite?: boolean;
    registryUrl?: string;
}
/**
 * Installed skill information
 */
export interface Skill {
    name: string;
    version: string;
    path: string;
    loaded: boolean;
}
/**
 * North Star command types
 *
 * @block:workflow/commands @kind:entity
 */
export type NorthStarCommand = '/finalize' | '/pause' | '/resume' | '/status' | '/rollback' | '/build';
/**
 * Parse a north star command
 */
export declare function parseNorthStarCommand(input: string): NorthStarCommand | null;
/**
 * Execute a north star command
 */
export declare function executeNorthStarCommand(command: NorthStarCommand, projectPath: string): Promise<void>;
/**
 * Download skills pack from registry
 *
 * @block:workflow/install @kind:operation
 */
export declare function downloadSkills(options: SkillsOptions): Promise<void>;
/**
 * List installed skills
 */
export declare function listSkills(): Promise<void>;
//# sourceMappingURL=commands.d.ts.map