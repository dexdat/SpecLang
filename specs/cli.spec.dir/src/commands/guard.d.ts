/**
 * Guard CLI Commands
 *
 * SPECLANG-GENERATED
 */
/**
 * Guard command options
 */
export interface GuardOptions {
    json?: boolean;
}
/**
 * Guard check options
 */
export interface GuardCheckOptions extends GuardOptions {
    agent?: string;
}
/**
 * Guard override options
 */
export interface GuardOverrideOptions extends GuardOptions {
    agent: string;
    reason: string;
    expires?: number;
}
/**
 * Guard violations options
 */
export interface GuardViolationsOptions extends GuardOptions {
    unresolved?: boolean;
    agent?: string;
}
/**
 * Guard rules options
 */
export interface GuardRulesOptions extends GuardOptions {
    agent?: string;
}
/**
 * Main guard command
 */
export declare function guardCommand(action: string, filepath?: string, options?: GuardOptions | GuardCheckOptions | GuardOverrideOptions | GuardViolationsOptions | GuardRulesOptions): Promise<void>;
//# sourceMappingURL=guard.d.ts.map