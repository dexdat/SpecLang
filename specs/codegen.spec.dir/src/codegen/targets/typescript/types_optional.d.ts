/**
 * SPECLANG-GENERATED: TypeScript optional/null handling
 * Source: @speclang/codegen @block:typescript-optional
 */
export type NullModifier = 'optional' | 'nullable' | 'nullish';
export declare function formatOptional(innerType: string, modifier: NullModifier): string;
export declare function hasNullModifier(stdlibType: string): boolean;
export declare function getTypeScriptDefault(stdlibType: string): string;
export interface FieldTypeResult {
    type: string;
    optional: boolean;
    nullable: boolean;
    readonly: boolean;
}
export declare function parseFieldType(typeStr: string): FieldTypeResult;
export declare function detectNullModifier(stdlibType: string): NullModifier | null;
//# sourceMappingURL=types_optional.d.ts.map