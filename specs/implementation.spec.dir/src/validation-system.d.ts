import Database from 'better-sqlite3';
export interface ValidationError {
    code: string;
    message: string;
    filePath: string;
    line?: number;
    column?: number;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}
export declare class ValidationEngine {
    private db;
    constructor(db: Database.Database);
    validateSpec(filePath: string): Promise<ValidationResult>;
    private validateHeader;
    private extractMetadata;
    private validateId;
    private validateLayer;
    private validateTags;
    private validateReferences;
    private validateImports;
    private validateFileName;
    private validateBlockSyntax;
}
export declare function validateCommand(args: string[]): Promise<void>;
export declare class ValidationGuard {
    private engine;
    constructor(engine: ValidationEngine);
    beforeFileWrite(filePath: string, content: string): Promise<boolean>;
    private sendValidationErrors;
}
//# sourceMappingURL=validation-system.d.ts.map