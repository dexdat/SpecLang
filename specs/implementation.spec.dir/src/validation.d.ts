export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface HeaderValidation {
    line1: boolean;
    line2: boolean;
    requiredFields: boolean;
    optionalFields: boolean;
}
export interface SpecValidation {
    header: ValidationResult;
    references: ValidationResult;
    format: ValidationResult;
    dependencies: ValidationResult;
}
export declare class HeaderValidator {
    static validateHeader(content: string): ValidationResult;
}
export declare class ReferenceValidator {
    private specIndex;
    constructor(specIndex: Map<string, any>);
    validateReferences(content: string): ValidationResult;
}
export declare class SpecFormatValidator {
    static validateFileExtension(filePath: string): ValidationResult;
    static validateBlockSyntax(content: string): ValidationResult;
}
export declare class SpecValidator {
    private specIndex;
    constructor(specIndex?: Map<string, any>);
    validateFile(filePath: string): Promise<SpecValidation>;
    validateSpec(spec: any): Promise<ValidationResult>;
}
export declare function validateFile(filePath: string): Promise<SpecValidation>;
export declare function validateHeader(content: string): ValidationResult;
export declare function validateReferences(content: string, specIndex: Map<string, any>): ValidationResult;
//# sourceMappingURL=validation.d.ts.map