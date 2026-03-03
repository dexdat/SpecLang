/**
 * SPECLANG-GENERATED: Type mapper for codegen
 * Source: @speclang/codegen @block:mapper
 */
import type { TypeMapping, TargetLanguage, StdlibType } from './types';
/** Type mappings from stdlib to target languages */
export declare const TYPE_MAPPINGS: TypeMapping[];
/** Map stdlib type to target language type */
export declare function mapType(stdlibType: string, target: TargetLanguage): string;
/** Get all supported stdlib types */
export declare function getStdlibTypes(): StdlibType[];
/** Check if a type is a valid stdlib type */
export declare function isStdlibType(type: string): boolean;
/** Get mapping for a specific type */
export declare function getTypeMapping(stdlibType: string): TypeMapping | undefined;
//# sourceMappingURL=mapper.d.ts.map