import { VerificationResult } from './state.js';
export interface GateResult {
    passed: boolean;
    message: string;
    details?: string[];
}
export interface VerificationGate {
    name: string;
    check: () => Promise<GateResult>;
    priority: number;
}
export declare class VerificationGates {
    private gates;
    private skipTests;
    constructor(skipTests?: boolean);
    private registerDefaultGates;
    register(gate: VerificationGate): void;
    unregister(name: string): boolean;
    get(name: string): VerificationGate | undefined;
    getAll(): VerificationGate[];
    run(name: string): Promise<GateResult>;
    runAll(): Promise<Record<string, GateResult>>;
    private runReferenceValidation;
    private runCompilationCheck;
    private runTestExecution;
}
export declare function createVerificationResult(step: number, results: Record<string, GateResult>): VerificationResult;
//# sourceMappingURL=verification.d.ts.map