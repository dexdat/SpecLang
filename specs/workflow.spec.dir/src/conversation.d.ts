/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/conversation, @workflow/conversation-example
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
/**
 * Parsed user intent types
 *
 * @block:workflow/conversation @kind:entity
 */
export type IntentType = 'start_feature' | 'extend_feature' | 'modify_config' | 'review_changes' | 'explain_spec' | 'fix_issue' | 'unknown';
/**
 * Parsed user command
 */
export interface ParsedCommand {
    intent: IntentType;
    confidence: number;
    entities: string[];
    rawInput: string;
    suggestedAction?: string;
}
/**
 * Parse user command from natural language
 *
 * @block:workflow/conversation @kind:code
 *
 * Examples:
 * - "Build a Go API with auth" → start_feature
 * - "Add password reset" → extend_feature
 * - "Use PostgreSQL instead of SQLite" → modify_config
 * - "Show me what changed" → review_changes
 */
export declare function parseCommand(input: string): ParsedCommand;
/**
 * Execute parsed command
 */
export declare function executeParsedCommand(command: ParsedCommand, projectPath: string): Promise<string>;
/**
 * Process a user conversation turn
 *
 * @block:workflow/conversation-example @kind:code
 */
export declare function processConversation(userInput: string, projectPath: string): Promise<string>;
//# sourceMappingURL=conversation.d.ts.map