/**
 * SPECLANG-GENERATED: Main exports for dynamic splitting
 * Source: @speclang/dynamic-split
 */

// Types
export type {
  SplitConfig,
  SplitStrategy,
  AgentSplitConfig,
  ProjectSplitConfig,
  SpecSize,
  SplitThreshold,
  SizeCheckResult,
  SplitResult,
  SplitFile,
  SplitDecision,
  SplitBlock,
  MergeConfig,
  SplitOptions,
} from './types';

// Constants
export { DEFAULT_SPLIT_CONFIG, DEFAULT_MERGE_CONFIG } from './types';

// Token Counter
export { TokenCounter, tokenCounter } from './token-counter';

// Size Checker
export { SizeChecker, createSizeChecker } from './size-checker';

// Strategy
export {
  SplitStrategyBase,
  SmartSplitStrategy,
  BySectionSplitStrategy,
  ByTokenSplitStrategy,
  createStrategy,
} from './strategy';

// Splitter
export {
  Splitter,
  createSplitter,
  checkSplitNeeded,
  splitContent,
} from './splitter';

// Directory Builder
export { DirectoryBuilder } from './directory-builder';

// Index Updater
export { IndexUpdater } from './index-updater';

// Config
export {
  SplitConfigLoader,
  getConfigLoader,
  loadSplitConfig,
  getAgentConfig,
} from './config';
