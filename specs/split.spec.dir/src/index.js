"use strict";
/**
 * SPECLANG-GENERATED: Main exports for dynamic splitting
 * Source: @speclang/dynamic-split
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentConfig = exports.loadSplitConfig = exports.getConfigLoader = exports.SplitConfigLoader = exports.IndexUpdater = exports.DirectoryBuilder = exports.splitContent = exports.checkSplitNeeded = exports.createSplitter = exports.Splitter = exports.createStrategy = exports.ByTokenSplitStrategy = exports.BySectionSplitStrategy = exports.SmartSplitStrategy = exports.SplitStrategyBase = exports.createSizeChecker = exports.SizeChecker = exports.tokenCounter = exports.TokenCounter = exports.DEFAULT_MERGE_CONFIG = exports.DEFAULT_SPLIT_CONFIG = void 0;
// Constants
var types_1 = require("./types");
Object.defineProperty(exports, "DEFAULT_SPLIT_CONFIG", { enumerable: true, get: function () { return types_1.DEFAULT_SPLIT_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_MERGE_CONFIG", { enumerable: true, get: function () { return types_1.DEFAULT_MERGE_CONFIG; } });
// Token Counter
var token_counter_1 = require("./token-counter");
Object.defineProperty(exports, "TokenCounter", { enumerable: true, get: function () { return token_counter_1.TokenCounter; } });
Object.defineProperty(exports, "tokenCounter", { enumerable: true, get: function () { return token_counter_1.tokenCounter; } });
// Size Checker
var size_checker_1 = require("./size-checker");
Object.defineProperty(exports, "SizeChecker", { enumerable: true, get: function () { return size_checker_1.SizeChecker; } });
Object.defineProperty(exports, "createSizeChecker", { enumerable: true, get: function () { return size_checker_1.createSizeChecker; } });
// Strategy
var strategy_1 = require("./strategy");
Object.defineProperty(exports, "SplitStrategyBase", { enumerable: true, get: function () { return strategy_1.SplitStrategyBase; } });
Object.defineProperty(exports, "SmartSplitStrategy", { enumerable: true, get: function () { return strategy_1.SmartSplitStrategy; } });
Object.defineProperty(exports, "BySectionSplitStrategy", { enumerable: true, get: function () { return strategy_1.BySectionSplitStrategy; } });
Object.defineProperty(exports, "ByTokenSplitStrategy", { enumerable: true, get: function () { return strategy_1.ByTokenSplitStrategy; } });
Object.defineProperty(exports, "createStrategy", { enumerable: true, get: function () { return strategy_1.createStrategy; } });
// Splitter
var splitter_1 = require("./splitter");
Object.defineProperty(exports, "Splitter", { enumerable: true, get: function () { return splitter_1.Splitter; } });
Object.defineProperty(exports, "createSplitter", { enumerable: true, get: function () { return splitter_1.createSplitter; } });
Object.defineProperty(exports, "checkSplitNeeded", { enumerable: true, get: function () { return splitter_1.checkSplitNeeded; } });
Object.defineProperty(exports, "splitContent", { enumerable: true, get: function () { return splitter_1.splitContent; } });
// Directory Builder
var directory_builder_1 = require("./directory-builder");
Object.defineProperty(exports, "DirectoryBuilder", { enumerable: true, get: function () { return directory_builder_1.DirectoryBuilder; } });
// Index Updater
var index_updater_1 = require("./index-updater");
Object.defineProperty(exports, "IndexUpdater", { enumerable: true, get: function () { return index_updater_1.IndexUpdater; } });
// Config
var config_1 = require("./config");
Object.defineProperty(exports, "SplitConfigLoader", { enumerable: true, get: function () { return config_1.SplitConfigLoader; } });
Object.defineProperty(exports, "getConfigLoader", { enumerable: true, get: function () { return config_1.getConfigLoader; } });
Object.defineProperty(exports, "loadSplitConfig", { enumerable: true, get: function () { return config_1.loadSplitConfig; } });
Object.defineProperty(exports, "getAgentConfig", { enumerable: true, get: function () { return config_1.getAgentConfig; } });
//# sourceMappingURL=index.js.map