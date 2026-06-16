import { MaturityLevel, ParsedSpec, TransitionChecklist, TransitionResult } from './types';
/**
 * Transition Manager
 *
 * Handles level transitions with checklists to ensure
 * specs are properly validated before advancing.
 */
export declare class TransitionManager {
    private transitionChecklists;
    constructor();
    /**
     * Initialize default transition checklists
     */
    private initializeChecklists;
    /**
     * Check if a spec can transition to a target level
     */
    canTransition(spec: ParsedSpec, targetLevel: MaturityLevel): TransitionResult;
    /**
     * Get the checklist for a specific transition
     */
    getChecklist(from: MaturityLevel, to: MaturityLevel): TransitionChecklist | null;
    /**
     * Get all available transitions from a level
     */
    getAvailableTransitions(from: MaturityLevel): MaturityLevel[];
    /**
     * Get transition steps to reach a target level
     */
    getTransitionPath(from: MaturityLevel, to: MaturityLevel): MaturityLevel[];
    /**
     * Run a single check
     */
    private runCheck;
    /**
     * Check documentation requirements
     */
    private checkDocumentation;
    /**
     * Check testing requirements
     */
    private checkTesting;
    /**
     * Check deployment requirements
     */
    private checkDeployment;
    /**
     * Simple documentation score
     */
    private scoreDocumentation;
    /**
     * Add custom transition checklist
     */
    addChecklist(checklist: TransitionChecklist): void;
}
/**
 * Create a new TransitionManager instance
 */
export declare function createTransitionManager(): TransitionManager;
//# sourceMappingURL=transitions.d.ts.map