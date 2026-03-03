/**
 * SpecLang Meta-Specifying System
 *
 * This module provides the self-specifying capabilities for SpecLang:
 * - SpecGenerator: Generate specs from code
 * - SelfConsistencyValidator: Validate spec-code consistency
 * - MetaBootstrap: Run the bootstrap sequence
 *
 * Usage:
 * ```typescript
 * import { SpecGenerator, SelfConsistencyValidator, MetaBootstrap } from './src/meta';
 *
 * // Generate specs from code
 * const generator = new SpecGenerator();
 * const spec = await generator.generateFromTypeScript('src/db/index.ts');
 *
 * // Validate consistency
 * const validator = new SelfConsistencyValidator();
 * const report = await validator.validateAll();
 *
 * // Run bootstrap
 * const bootstrap = new MetaBootstrap();
 * const result = await bootstrap.run();
 * ```
 */
export * from "./types.js";
export { SpecGenerator } from "./generator.js";
export { SelfConsistencyValidator } from "./validator.js";
export { MetaBootstrap } from "./bootstrap.js";
import { MetaCLIOptions, MetaCommand } from "./types.js";
/**
 * Execute a meta command
 */
export declare function executeMetaCommand(command: MetaCommand, options?: MetaCLIOptions): Promise<any>;
/**
 * CLI entry point for meta commands
 */
export declare function runMetaCLI(args: string[]): Promise<void>;
//# sourceMappingURL=index.d.ts.map