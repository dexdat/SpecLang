"use strict";
/**
 * SPECLANG-GENERATED: TypeScript types for spec indexer
 * Source: phase-0.3-indexer.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_INDEXER_OPTIONS = void 0;
/** Default indexer options */
exports.DEFAULT_INDEXER_OPTIONS = {
    rootDir: 'specs',
    outputPath: '_index.json',
    validateRefs: true,
    detectCycles: true,
    findOrphans: true,
    useDatabase: true,
    dbPath: '.speclang/speclang.db',
};
