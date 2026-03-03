/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/header-parser.spec.md
 * Generated: 2026-03-03T04:16:52.903044
 *
 * Edit the spec, not this file.
 */
import { SpecHeader } from './types';
export declare class HeaderParser {
    /**
     * Parse header from content
     * @param content - Full file content
     * @returns Parsed header
     * @throws {POCError} If header is invalid
     */
    parse(content: string): SpecHeader;
    /**
     * Validate a parsed header
     */
    validateHeader(data: unknown): void;
    /**
     * Parse YAML content using js-yaml library
     * Supports full YAML spec needed for headers
     */
    private parseYaml;
}
//# sourceMappingURL=header-parser.d.ts.map