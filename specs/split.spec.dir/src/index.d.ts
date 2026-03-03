/**
 * SPECLANG-GENERATED: Main exports for dynamic splitting
 * Source: @speclang/dynamic-split
 */
export type { SplitConfig, SplitStrategy, AgentSplitConfig, ProjectSplitConfig, SpecSize, SplitThreshold, SizeCheckResult, SplitResult, SplitFile, SplitDecision, SplitBlock, MergeConfig, SplitOptions, } from './types';
export { DEFAULT_SPLIT_CONFIG, DEFAULT_MERGE_CONFIG } from './types';
export { TokenCounter, tokenCounter } from './token-counter';
export { SizeChecker, createSizeChecker } from './size-checker';
export { SplitStrategyBase, SmartSplitStrategy, BySectionSplitStrategy, ByTokenSplitStrategy, createStrategy, } from './strategy';
export { Splitter, createSplitter, checkSplitNeeded, splitContent, } from './splitter';
export { DirectoryBuilder } from './directory-builder';
export { IndexUpdater } from './index-updater';
export { SplitConfigLoader, getConfigLoader, loadSplitConfig, getAgentConfig, } from './config';
//# sourceMappingURL=index.d.ts.map