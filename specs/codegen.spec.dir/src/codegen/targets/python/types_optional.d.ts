/**
 * SPECLANG-GENERATED: Python optional/nullable handling
 * Source: @speclang/codegen @block:python-types-optional
 */
import { type TypeResolution } from './types';
export declare function formatOptionalType(innerType: string, pythonVersion?: number): string;
export declare function hasOptionalDefault(stdlibType: string): boolean;
export declare function getOptionalDefault(stdlibType: string): string;
export interface NullableAnnotation {
    type: string;
    nullable: boolean;
    default?: string;
}
export declare function parseNullableField(typeStr: string): NullableAnnotation;
export declare function isOptionalType(stdlibType: string): boolean;
export declare function resolveOptionalType(stdlibType: string): TypeResolution | null;
//# sourceMappingURL=types_optional.d.ts.map