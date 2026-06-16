"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/config.dir/schema.spec.md
 * Blocks: @block:config/structure, @block:config/watcher, @block:config/split, @block:config/embeddings, @block:config/database, @block:config/cascade, @block:config/agents
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CASCADE_CONFIG = exports.DEFAULT_DATABASE_CONFIG = exports.DEFAULT_EMBEDDING_CONFIG = exports.DEFAULT_SPLIT_CONFIG = exports.DEFAULT_WATCHER_CONFIG = void 0;
// Default configurations
exports.DEFAULT_WATCHER_CONFIG = {
    patterns: [
        "**/*.spec.{md,yaml,yml,scl}",
        "**/*.{go,ts,js,py,rs,java}.spec",
        "**/project.scl",
        "**/build.{scl,yaml}"
    ],
    ignore: {
        uses: ".gitignore",
        plus: [".speclang/", "*.log", "reports/", ".git/"]
    },
    debounce: 100
};
exports.DEFAULT_SPLIT_CONFIG = {
    max_tokens: 10000,
    max_lines: 800,
    max_chars: 60000,
    budget_overhead: 500,
    strategy: 'smart'
};
exports.DEFAULT_EMBEDDING_CONFIG = {
    enabled: true,
    model: 'openai/text-embedding-3-small',
    dimensions: 1536,
    batch_size: 100
};
exports.DEFAULT_DATABASE_CONFIG = {
    mode: 'WAL',
    synchronous: 'NORMAL',
    cache_size: 10000,
    temp_store: 'MEMORY'
};
exports.DEFAULT_CASCADE_CONFIG = {
    quiet_period: 30,
    max_depth: 50,
    max_files: 1000
};
//# sourceMappingURL=schema.js.map