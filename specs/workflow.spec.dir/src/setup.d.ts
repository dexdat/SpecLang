/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/setup.spec.md
 * Blocks: @workflow/start, @workflow/init-creates
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
/**
 * Project initialization options
 *
 * @block:workflow/start @kind:code
 */
export interface InitOptions {
    mode: 'light' | 'enterprise';
    dryRun: boolean;
    path: string;
}
/**
 * Structure created by init (from @workflow/init-creates)
 */
export interface ProjectStructure {
    'project.scl': string;
    'specs': string;
    'tests': string;
    'generated': string;
    '.speclang/config.json': string;
    '.speclang/locks': string;
    '.speclangrc': string;
    'build.yaml': string;
    '.gitignore': string;
}
/**
 * Initialize a new Speclang project
 *
 * @block:workflow/start @kind:operation
 */
export declare function initProject(options: InitOptions): Promise<void>;
/**
 * Validate project structure
 */
export declare function validateProject(projectPath: string): {
    valid: boolean;
    issues: string[];
};
//# sourceMappingURL=setup.d.ts.map