/**
 * SpecLang — public library entry point (SL-GAP-018).
 *
 * This root barrel is what package.json "main"/"types" point at:
 *   main:  dist/index.js
 *   types: dist/index.d.ts
 *
 * The CLI remains bin/speclang; this module exposes the programmatic
 * surface only (cascade, compile/parse/validate, config, db, layers,
 * pipeline, meta, deployment, safety-confidence, test-specs, errors,
 * events, workflow).
 *
 * Collision policy: when two modules export the same name, a single
 * canonical owner is re-exported here:
 *   - validate / ValidationResult / ValidationError -> validation module
 *   - SpecMetadata / Block / SpecChange             -> meta module
 *   - formatSummary                                 -> validation module
 * The non-canonical copies stay reachable via deep imports
 * (dist/src/...). CLI entrypoints (bin/speclang, workflow createCLI/main,
 * meta runMetaCLI) are intentionally not re-exported.
 */

// ---------------------------------------------------------------------------
// Cascade coordinator — run a spec through the full cascade loop.
// ---------------------------------------------------------------------------
export {
  runCascade,
  parseSpec,
  CascadeCoordinator,
  DependencyTracker,
  CascadeState,
  AgentInvocation,
  VerificationResult,
  createInitialState,
  AgentInvoker,
  getAgentForTrigger,
  VerificationGates,
  createVerificationResult,
  GateResult,
  VerificationGate,
  TreeNode,
  DependencyGraph,
  CoordinatorOptions,
  CoordinatorResult,
  CascadeOptions,
  CascadeResult,
} from './src/cascade/index.js';

// ---------------------------------------------------------------------------
// Compiler — targets (TS/Go/Rust/Python) and the pipeline phases.
// `validate` (phase) is owned by the validation module below; the phase
// function stays reachable as src/compiler/phases/validate.
// ---------------------------------------------------------------------------
export {
  TargetMapping,
  TargetFeatures,
  CompilerTarget,
  TypeScriptTarget,
  GoTarget,
  RustTarget,
  PythonTarget,
  targets,
  getTarget,
  getAllTargets,
} from './src/compiler/index.js';
export {
  parse,
  parsePhase,
  resolve,
  transform,
  codegen,
  detectDrift,
  syncCodeToSpec,
  syncSpecToCode,
  compileIncremental,
  invalidateCache,
} from './src/compiler/index.js';
export {
  Location,
  SpecGraph,
  CompileWarning,
  ResolvedGraph,
  IRBlock,
  IRField,
  IROperation,
  IR,
  Artifact,
  DriftStatus,
  DriftReport,
  BlockUpdate,
  CodeUpdate,
  CompileCache,
  CacheEntry,
  Lockfile,
  LockEntry,
  ArtifactEntry,
  CompileOptions,
  CompilerPlugin,
  CompileError,
  ERROR_CODES,
  WARNING_CODES,
  ResolveError,
  TransformError,
  CodegenError,
} from './src/compiler/index.js';

// ---------------------------------------------------------------------------
// Config — project config schema, defaults and loader. (Config validation
// helpers live under src/config/validator; `validate` is owned by the
// validation module.)
// ---------------------------------------------------------------------------
export {
  ProjectConfig,
  ProjectMetadata,
  Language,
  WatcherConfig,
  IgnoreConfig,
  SplitConfig,
  SplitStrategy,
  EmbeddingConfig,
  DatabaseConfig,
  CascadeConfig,
  AgentsConfig,
  AgentConfig,
  DEFAULT_WATCHER_CONFIG,
  DEFAULT_SPLIT_CONFIG,
  DEFAULT_EMBEDDING_CONFIG,
  DEFAULT_DATABASE_CONFIG,
  DEFAULT_CASCADE_CONFIG,
  getDefaultConfig,
} from './src/config/index.js';

// ---------------------------------------------------------------------------
// DB — SQLite-backed spec database with search modules.
// ---------------------------------------------------------------------------
export {
  SpecLangDB,
  createDatabase,
  FullTextSearch,
  VectorSearch,
  GraphQueries,
  JSONQueries,
} from './src/db/index.js';

// ---------------------------------------------------------------------------
// Layers — spec layer definitions, validation and resolution.
// ---------------------------------------------------------------------------
export {
  Layer,
  LAYER_NAMES,
  LAYER_DESCRIPTIONS,
  LAYER_EXTENSIONS,
  LAYER_OWNERS,
  LayerValidationResult,
  LayerTransition,
  isValidLayer,
  getMinValidLayer,
  validateLayer,
  validateLayerDependency,
  validateLayerChain,
  getMaxLayerForMaturity,
  resolveLayer,
  resolveLayerFromPath,
  resolveLayerFromContent,
} from './src/layers/index.js';

// ---------------------------------------------------------------------------
// Validation — the core validate/parse-check surface.
// ---------------------------------------------------------------------------
export {
  ValidationRule,
  ValidationResult,
  ValidationReport,
  ValidationReportBatch,
  ValidationContext,
  ValidationFileSystem,
  ValidationConfig,
  CustomRuleConfig,
  RuleSetting,
  ResolvedReference,
  DEFAULT_VALIDATION_CONFIG,
  ValidationEngine,
  getEngine,
  resetEngine,
  validate,
  validateAll,
  ValidationReporter,
  format,
  formatBatch,
  formatJSON,
  formatSummary,
  validateCommand,
  ValidateOptions,
  ValidateResult,
  RuleRegistry,
  getRegistry,
  resetRegistry,
  headerRule,
  idRule,
  refsRule,
  blocksRule,
  autonomousRule,
  BUILTIN_RULES,
} from './src/validation/index.js';

// ---------------------------------------------------------------------------
// Pipeline — staged execution pipeline (stages/hooks/recovery).
// ---------------------------------------------------------------------------
export {
  PipelineConfig,
  Stage,
  StageHooks,
  StageResult,
  PipelineStageState,
  Hook,
  HookContext,
  HookResult,
  RecoveryActionType,
  RecoveryAction,
  RecoveryContext,
  RecoveryResult,
  PipelineResult,
  ConditionContext,
  PipelineEvent,
  ExecutorOptions,
  PipelineConfigManager,
  loadPipelineConfig,
  getPipelineConfig,
  StageExecutor,
  orderStages,
  areDependenciesMet,
  HookExecutor,
  BuiltInHooks,
  createHookContext,
  RecoveryExecutor,
  RecoveryActions,
  PipelineExecutor,
  createPipelineExecutor,
} from './src/pipeline/index.js';

// ---------------------------------------------------------------------------
// Meta — spec generation, self-consistency validation and bootstrap.
// ---------------------------------------------------------------------------
export {
  SpecMetadata,
  ProjectLevel,
  AgentSupport,
  Block,
  BlockKind,
  SpecFile,
  ProjectSpec,
  GenerateOptions,
  GenerateResult,
  UpdateResult,
  SpecChange,
  ConsistencyCheck,
  ConsistencyIssue,
  ConsistencyIssueType,
  ConsistencyReport,
  FixReport,
  FixDetail,
  BootstrapResult,
  BootstrapPhase,
  SourceSpecMapping,
  BlockMapping,
  MetaCLIOptions,
  MetaCommand,
  SpecGenerator,
  SelfConsistencyValidator,
  MetaBootstrap,
  executeMetaCommand,
} from './src/meta/index.js';

// ---------------------------------------------------------------------------
// Deployment — light/enterprise mode selection and switching.
// ---------------------------------------------------------------------------
export {
  DeploymentMode,
  LightModeConfig,
  EnterpriseModeConfig,
  ModeSelection,
  ScaleThresholds,
  EnterpriseSettings,
  DeploymentConfig,
  ModeRecommendation,
  PerformanceMetrics,
  FeatureComparison,
  MODE_SELECTION,
  DEFAULT_SCALE_THRESHOLDS,
  DEFAULT_DEPLOYMENT_CONFIG,
  MODE_RECOMMENDATION,
  PERFORMANCE_METRICS,
  FEATURE_COMPARISON,
  SwitchResult,
  ModeSwitcher,
  DeploymentModeSwitcher,
  createModeSwitcher,
  recommendMode,
  LIGHT_MODE_START_COMMAND,
  LightModeComponents,
  LightModeFileWatching,
  LightModeFeatures,
  LightModeLimitations,
  LightMode,
  LightModeSettings,
  LIGHT_MODE_PERFORMANCE,
  LIGHT_MODE,
  LIGHT_MODE_DEFAULT_CONFIG,
  LightModeService,
  createLightModeService,
  ENTERPRISE_MODE_START_COMMAND,
  EnterpriseModeComponents,
  EnterpriseModeFileWatching,
  EnterpriseModeFeatures,
  EnterpriseMode,
  EnterpriseModeSettings,
  ENTERPRISE_MODE_PERFORMANCE,
  ENTERPRISE_MODE,
  ENTERPRISE_MODE_DEFAULT_CONFIG,
  EnterpriseModeService,
  createEnterpriseModeService,
} from './src/deployment/index.js';

// ---------------------------------------------------------------------------
// Safety confidence — confidence scoring for generated output.
// ---------------------------------------------------------------------------
export {
  ConfidenceLevel,
  SignalScore,
  ConfidenceReport,
  PROJECT_LEVEL_THRESHOLDS,
  SIGNAL_SOURCE_WEIGHTS,
  ConfidenceScorer,
} from './src/safety-confidence/index.js';

// ---------------------------------------------------------------------------
// Test specs — parse/generate/run specs as test suites.
// (`formatSummary` is owned by the validation module.)
// ---------------------------------------------------------------------------
export {
  TestSpec,
  TestScenario,
  ExampleTable,
  TestResult,
  TestReport,
  SupportedLanguage,
  TestSpecHeader,
  TestSpecParser,
  parseTestSpecFile,
  TestGenerator,
  generateTestCode,
  TestRunner,
  runTestSpec,
  runAllTestSpecs,
  TestSpecReporter,
  defaultReporter,
  formatReport,
  TestResultSync,
  testResultSync,
  syncResultsToSpec,
  updateAllSpecs,
} from './src/test-specs/index.js';

// ---------------------------------------------------------------------------
// Errors — typed error hierarchy and recovery handler.
// ---------------------------------------------------------------------------
export {
  POCErrorCode,
  POCError,
  RecoveryStrategy,
  ErrorRecoveryConfig,
  DEFAULT_RECOVERY_CONFIG,
  CircuitBreakerState,
  ErrorMetrics,
  EnhancedErrorConfig,
  ENHANCED_DEFAULT_CONFIG,
  ErrorHandler,
} from './src/errors/handler.js';

// ---------------------------------------------------------------------------
// Events — typed event emitter for watcher/convergence/agent/daemon events.
// ---------------------------------------------------------------------------
export {
  FileWatcherEvents,
  ConvergenceEvents,
  AgentEvents,
  DaemonEvents,
  TypedEventEmitter,
} from './src/events/typed-emitter.js';

// ---------------------------------------------------------------------------
// Workflow — project init/validate plus status, review and conversation
// helpers. (createCLI/main are the CLI entrypoints — use bin/speclang.)
// ---------------------------------------------------------------------------
export {
  initProject,
  validateProject,
  InitOptions,
  parseNorthStarCommand,
  executeNorthStarCommand,
  downloadSkills,
  listSkills,
  NorthStarCommand,
  SkillsOptions,
  Skill,
  showStatus,
  getChanges,
  showSpecDiff,
  formatChanges,
  FileChange,
  ChangeSummary,
  StatusOutput,
  parseCommand,
  executeParsedCommand,
  processConversation,
  IntentType,
  ParsedCommand,
} from './src/workflow/index.js';
