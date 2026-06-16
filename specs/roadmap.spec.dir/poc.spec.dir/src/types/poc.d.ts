/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/types.spec.md
 * Generated: 2026-03-03T03:54:00.000Z
 *
 * Edit the spec, not this file.
 */
/**
 * File system event types
 */
export type FileEventType = 'created' | 'modified' | 'deleted' | 'renamed';
/**
 * File change event
 */
export interface FileEvent {
    /** Database ID (auto-generated) */
    id?: number;
    /** Event type */
    type: FileEventType;
    /** Absolute path to file */
    path: string;
    /** Unix timestamp (ms) */
    timestamp: number;
    /** Previous path (for renames) */
    oldPath?: string;
    /** File content hash (for modifications) */
    hash?: string;
    /** Associated cascade ID (set when processed) */
    cascadeId?: number;
    /** Processing status */
    processed?: boolean;
}
/**
 * Batch of file events
 */
export interface FileEventBatch {
    events: FileEvent[];
    batchTimestamp: number;
}
/**
 * Parameter definition from spec
 */
export interface Parameter {
    /** Parameter name */
    name: string;
    /** TypeScript type */
    type: string;
    /** Description from spec */
    description: string;
    /** Is optional */
    optional?: boolean;
    /** Default value */
    default?: string;
}
/**
 * Return type definition
 */
export interface ReturnType {
    /** TypeScript return type */
    type: string;
    /** Description from spec */
    description: string;
}
/**
 * Code example from spec
 */
export interface CodeExample {
    /** Language (typescript, javascript, etc) */
    language: string;
    /** Code content */
    code: string;
    /** Optional description */
    description?: string;
}
/**
 * Property definition for interfaces/classes
 */
export interface Property {
    /** Property name */
    name: string;
    /** TypeScript type */
    type: string;
    /** Description */
    description: string;
    /** Is optional */
    optional?: boolean;
}
/**
 * Block data for template rendering
 */
export interface BlockData {
    /** Block ID */
    id: string;
    /** Block kind */
    kind: BlockKind;
    /** Description */
    description: string;
    /** Parameters */
    parameters: Parameter[];
    /** Properties (for interfaces/classes) */
    properties?: Property[];
    /** Return type (for functions) */
    returns?: ReturnType;
    /** Code examples */
    examples?: CodeExample[];
    /** Raw markdown content */
    rawContent: string;
}
/**
 * Parsed block from spec
 */
export interface ParsedBlock {
    /** Block ID (e.g., "greet") */
    id: string;
    /** Block kind (function, class, interface) */
    kind: BlockKind;
    /** Description text */
    description: string;
    /** Parameters */
    parameters: Parameter[];
    /** Properties (for classes/interfaces) */
    properties?: Property[];
    /** Return type (for functions) */
    returns?: ReturnType;
    /** Code examples */
    examples?: CodeExample[];
    /** Raw markdown content */
    rawContent: string;
}
/**
 * Supported block kinds
 */
export type BlockKind = 'function' | 'class' | 'interface' | 'type' | 'enum' | 'constant';
/**
 * Valid block kinds for validation
 */
export declare const VALID_BLOCK_KINDS: BlockKind[];
/**
 * Validate block kind
 * @param kind - The kind to validate
 * @returns True if valid BlockKind
 */
export declare function isValidBlockKind(kind: string): kind is BlockKind;
/**
 * Complete parsed spec
 */
export interface ParsedSpec {
    /** Spec ID from header */
    id: string;
    /** Spec version */
    version: string;
    /** Short description */
    short: string;
    /** File path */
    filePath: string;
    /** Parsed blocks */
    blocks: ParsedBlock[];
    /** Raw header lines */
    headerLines: string[];
    /** Parse timestamp */
    parsedAt: number;
}
/**
 * Spec block as referenced by code-generation.spec.md
 * Alias for BlockData for consistency
 */
export type SpecBlock = BlockData;
/**
 * Agent configuration
 */
export interface AgentConfig {
    /** Max concurrent tasks */
    maxConcurrency: number;
    /** Task timeout (ms) */
    timeoutMs: number;
    /** Retry attempts */
    retryAttempts: number;
}
/**
 * Task for agent to process
 */
export interface AgentTask {
    /** Task ID */
    id: string;
    /** Task type */
    type: 'parse' | 'generate' | 'write' | 'symlink';
    /** Associated file event */
    event: FileEvent;
    /** Created timestamp */
    createdAt: number;
    /** Started timestamp (null if pending) */
    startedAt?: number;
    /** Completed timestamp (null if pending) */
    completedAt?: number;
    /** Task status */
    status: TaskStatus;
    /** Error message (if failed) */
    error?: string;
}
/**
 * Task status
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
/**
 * Task result
 */
export interface TaskResult {
    /** Task ID */
    taskId: string;
    /** Success flag */
    success: boolean;
    /** Generated files */
    generatedFiles?: string[];
    /** Error message */
    error?: string;
    /** Duration (ms) */
    duration: number;
}
/**
 * Convergence event
 */
export interface ConvergenceEvent {
    /** Detection timestamp */
    timestamp: number;
    /** Files that changed in this cascade */
    filesChanged: string[];
    /** Cascade depth reached */
    cascadeDepth: number;
    /** Cascade history for debugging */
    history?: string[];
    /** Duration from first change to convergence (ms) */
    duration: number;
    /** Number of agent tasks executed */
    tasksExecuted: number;
    /** Success rate */
    successRate: number;
}
/**
 * Convergence state
 */
export interface ConvergenceState {
    /** Currently tracking changes */
    isTracking: boolean;
    /** First change timestamp */
    startTime?: number;
    /** Files changed in current cascade */
    filesChanged: Set<string>;
    /** Current depth */
    currentDepth: number;
    /** Cascade history for loop detection */
    cascadeHistory: string[];
    /** Timer reference */
    timer?: NodeJS.Timeout;
}
/**
 * Generated code file
 */
export interface GeneratedFile {
    /** File path */
    path: string;
    /** File content */
    content: string;
    /** Source spec */
    specId: string;
    /** Source block */
    blockId: string;
    /** Generation timestamp */
    generatedAt: number;
}
/**
 * Template data for generation
 */
export interface TemplateData {
    /** Block ID (function name, class name, etc) */
    id: string;
    /** Description */
    description: string;
    /** Parameters string (for signature) */
    params: string;
    /** Parameter documentation */
    paramDocs: string;
    /** Return type */
    returnType: string;
    /** Return documentation */
    returnDoc: string;
    /** Spec reference */
    specRef: string;
}
/**
 * Code generation result
 */
export interface GenerationResult {
    /** Success flag */
    success: boolean;
    /** Generated files */
    files: GeneratedFile[];
    /** Errors */
    errors?: string[];
}
/**
 * Record of a generated file for database storage
 */
export interface GeneratedFileRecord {
    /** File path */
    path: string;
    /** Source spec ID */
    specId: string;
    /** Source block ID */
    blockId: string;
    /** Content hash (MD5) */
    contentHash: string;
    /** Generation timestamp */
    generatedAt: number;
    /** Last modification timestamp */
    lastModified: number;
    /** Associated cascade ID */
    cascadeId?: number;
    /** Is a symlink */
    isSymlink?: boolean;
    /** Symlink target path */
    symlinkTarget?: string;
}
/**
 * Daemon configuration
 */
export interface DaemonConfig {
    /** Watch directory */
    watchDirectory: string;
    /** Debounce interval (ms) */
    debounceMs: number;
    /** Convergence quiet period (ms) */
    convergenceMs: number;
    /** Max cascade depth */
    maxDepth: number;
    /** Output directory for code */
    outputDirectory: string;
    /** Create symlinks */
    useSymlinks: boolean;
    /** Ignore patterns */
    ignorePatterns: string[];
}
/**
 * Daemon state
 */
export interface DaemonState {
    /** Is running */
    isRunning: boolean;
    /** Start time */
    startedAt?: number;
    /** Current cascade */
    currentCascade?: ConvergenceState;
    /** Total cascades completed */
    cascadesCompleted: number;
    /** Total files generated */
    filesGenerated: number;
    /** Current errors */
    errors: string[];
}
/**
 * Daemon statistics
 */
export interface DaemonStats {
    /** Uptime (ms) */
    uptime: number;
    /** Total events processed */
    eventsProcessed: number;
    /** Average cascade duration */
    avgCascadeDuration: number;
    /** Success rate */
    successRate: number;
    /** Files being watched */
    filesWatched: number;
}
/**
 * Cascade statistics for database storage
 */
export interface CascadeStats {
    /** Duration in milliseconds */
    duration: number;
    /** Max cascade depth reached */
    depth: number;
    /** Number of files changed */
    filesChanged: number;
    /** Tasks completed successfully */
    tasksCompleted: number;
    /** Tasks that failed */
    tasksFailed: number;
    /** Error message if failed */
    error?: string;
}
/**
 * POC error types
 */
export type POCErrorCode = 'WATCH_ERROR' | 'PARSE_ERROR' | 'GENERATION_ERROR' | 'WRITE_ERROR' | 'SYMLINK_ERROR' | 'CONVERGENCE_ERROR' | 'TIMEOUT_ERROR' | 'HEADER_ERROR' | 'TEMPLATE_ERROR';
/**
 * POC error class
 * Used across all POC components for error handling
 */
export declare class POCError extends Error {
    /** Error code */
    code: POCErrorCode;
    /** File path (if applicable) */
    filePath?: string;
    /** Timestamp */
    timestamp: number;
    /** Original error (if wrapped) */
    cause?: Error;
    constructor(code: POCErrorCode, message: string, filePath?: string, cause?: Error);
    /**
     * Convert to user-friendly message
     */
    toUserMessage(): string;
}
/**
 * Error handler result
 */
export interface ErrorHandlerResult {
    /** Should retry */
    shouldRetry: boolean;
    /** Retry delay (ms) */
    retryDelay?: number;
    /** Is fatal */
    isFatal: boolean;
}
/**
 * Error recovery strategy
 */
export type RecoveryStrategy = 'skip' | 'retry' | 'retry-delayed' | 'stop' | 'fatal';
/**
 * Error recovery config
 */
export interface ErrorRecoveryConfig {
    /** Strategy per error code */
    strategies: Partial<Record<POCErrorCode, RecoveryStrategy>>;
    /** Max retries */
    maxRetries: number;
    /** Delay between retries (ms) */
    retryDelayMs: number;
    /** Stop cascade after N consecutive errors */
    maxConsecutiveErrors: number;
}
/**
 * Event emitter interface
 * Provides typed event handling
 */
export interface EventEmitter<T extends Record<string, any>> {
    /** Register event handler */
    on<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
    /** Remove event handler */
    off<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
    /** Emit event */
    emit<K extends keyof T>(event: K, data: T[K]): void;
    /** Register one-time handler */
    once<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
}
/**
 * File watcher events
 */
export interface FileWatcherEvents {
    'change': FileEvent;
    'error': POCError;
    'ready': void;
}
/**
 * Convergence events
 */
export interface ConvergenceEvents {
    'converged': ConvergenceEvent;
    'reset': void;
}
/**
 * Agent events
 */
export interface AgentEvents {
    'task-start': {
        taskId: string;
        specId: string;
    };
    'task-complete': TaskResult;
    'task-error': {
        taskId: string;
        error: string;
    };
}
/**
 * Parsed spec header
 */
export interface SpecHeader {
    /** Spec ID */
    id: string;
    /** Version */
    version: string;
    /** Layer number */
    layer: number;
    /** Short description */
    short: string;
    /** Tags */
    tags?: string[];
    /** Number of header lines */
    lineCount: number;
    /** Raw header content */
    rawHeader: string;
}
/**
 * Spec header validation result
 */
export interface HeaderValidationResult {
    /** Is valid */
    valid: boolean;
    /** Validation errors */
    errors: string[];
    /** Parsed header (if valid) */
    header?: SpecHeader;
}
/**
 * Template function type
 */
export type Template = (data: BlockData) => string;
/**
 * Template metadata
 */
export interface TemplateMetadata {
    name: string;
    description: string;
    blockKind: BlockKind;
}
/**
 * Template registry entry
 */
export interface TemplateRegistry {
    /** Get template for block kind */
    get(kind: BlockKind): Template;
    /** Register template */
    register(kind: BlockKind, template: Template): void;
    /** Check if template exists */
    has(kind: BlockKind): boolean;
    /** Get all registered templates */
    getAll(): Map<BlockKind, TemplateMetadata>;
}
/**
 * POC Daemon Configuration
 */
export interface POCConfig {
    /** Watch settings */
    watch: {
        /** Directory to watch */
        directory: string;
        /** Watch recursively */
        recursive: boolean;
        /** Debounce time (ms) */
        debounce: number;
        /** Ignore patterns */
        ignore: string[];
    };
    /** Cascade settings */
    cascade: {
        /** Quiet period for convergence (ms) */
        quietPeriod: number;
        /** Maximum cascade depth */
        maxDepth: number;
    };
    /** Output settings */
    output: {
        /** Output directory for generated code */
        codeDirectory: string;
        /** Create symlinks (vs copy) */
        useSymlinks: boolean;
    };
    /** Logging settings */
    logging: {
        /** Log level */
        level: 'debug' | 'info' | 'warn' | 'error';
        /** Enable colors */
        colors: boolean;
        /** Include timestamps */
        timestamps: boolean;
    };
}
/**
 * POC Configuration Constants
 */
export declare const POC_CONSTANTS: {
    /** Debounce time for file changes (ms) */
    readonly DEBOUNCE_MS: 300;
    /** Convergence quiet period (ms) */
    readonly CONVERGENCE_MS: 5000;
    /** Max cascade depth */
    readonly MAX_DEPTH: 10;
    /** Max task duration (ms) */
    readonly MAX_TASK_DURATION_MS: 30000;
    /** Watch directory */
    readonly WATCH_DIR: "./specs";
    /** Output directory */
    readonly OUTPUT_DIR: "./src";
    /** Ignore patterns */
    readonly IGNORE_PATTERNS: readonly ["*.tmp", "*~", ".git/**", "node_modules/**", ".speclang/**"];
    /** Header marker in generated files */
    readonly GENERATED_HEADER: "// SPECLANG-GENERATED";
    /** Block pattern regex */
    readonly BLOCK_PATTERN: RegExp;
    /** Parameter pattern regex */
    readonly PARAM_PATTERN: RegExp;
};
//# sourceMappingURL=poc.d.ts.map