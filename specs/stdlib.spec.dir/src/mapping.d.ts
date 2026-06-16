/**
 * Type mappings between languages
 */
/**
 * Supported target languages
 */
export type TargetLanguage = 'typescript' | 'python' | 'go' | 'rust' | 'java';
/**
 * Type mapping entry
 */
export type TypeMapping = {
    typescript: string;
    python: string;
    go: string;
    rust: string;
    java: string;
};
/**
 * Built-in type mappings
 */
export declare const TypeMappings: Record<string, TypeMapping>;
/**
 * Map a type to a specific language
 */
export declare function mapType(typeName: string, language: TargetLanguage): string;
/**
 * Map all types in a signature
 */
export declare function mapSignature(signature: string, language: TargetLanguage): string;
/**
 * Get type mapping for all languages
 */
export declare function getAllMappings(typeName: string): TypeMapping | undefined;
/**
 * Add custom type mapping
 */
export declare function addTypeMapping(name: string, mapping: Partial<TypeMapping>): void;
//# sourceMappingURL=mapping.d.ts.map