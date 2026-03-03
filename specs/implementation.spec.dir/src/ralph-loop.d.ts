import Database from 'better-sqlite3';
export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'done' | 'failed';
    assigned_to: 'builder' | 'verifier' | null;
    created_at: number;
    updated_at: number;
}
export declare class LoopController {
    private db;
    private builder;
    private verifier;
    private isRunning;
    constructor(db: Database.Database);
    static create(dbPath?: string): Promise<LoopController>;
    start(): Promise<void>;
    private getNextTask;
    private processTask;
    private handleFailure;
    private sleep;
}
export declare class BuilderAgent {
    private db;
    constructor(db: Database.Database);
    execute(task: Task): Promise<{
        output: any;
        error?: string;
    }>;
    private loadSpecs;
    private writeImplementationSpec;
    private generateCode;
}
export declare class VerifierAgent {
    private db;
    constructor(db: Database.Database);
    validate(task: Task, output: any): Promise<{
        success: boolean;
        errors: string[];
    }>;
    private validateSpec;
    private validateCode;
    private validateReferences;
}
//# sourceMappingURL=ralph-loop.d.ts.map