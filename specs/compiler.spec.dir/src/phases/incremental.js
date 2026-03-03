"use strict";
/**
 * SPECLANG-GENERATED: Incremental Compilation
 * Source: @speclang/compiler.spec.dir/phases @compiler/incremental @compiler/cache
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileIncremental = compileIncremental;
exports.invalidateCache = invalidateCache;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const DEFAULT_CACHE_DIR = '.speclang/cache';
function compileIncremental(graph, changed, cacheDir = DEFAULT_CACHE_DIR) {
    const affected = findTransitiveDependents(graph, changed);
    const cache = loadCache(cacheDir);
    const artifacts = [];
    for (const blockId of affected) {
        const cached = findCachedArtifact(cache, blockId);
        const block = graph.nodes.find((b) => b.id === blockId);
        if (!block)
            continue;
        const currentHash = hashContent(block.content);
        if (cached && cached.artifactHash === currentHash) {
            continue;
        }
        artifacts.push({
            path: `generated/${blockId}.ts`,
            content: block.content,
            markers: [blockId],
            target: 'typescript',
        });
        cache.entries.push({
            blockId,
            irHash: currentHash,
            artifactHash: currentHash,
        });
    }
    saveCache(cache, cacheDir);
    return artifacts;
}
function findTransitiveDependents(graph, changed) {
    const dependents = new Set(changed);
    const queue = [...changed];
    while (queue.length > 0) {
        const current = queue.shift();
        for (const ref of graph.edges) {
            const target = ref.ref.includes('#') ? ref.ref.split('#')[1] : ref.ref;
            if (target === current && ref.sourceFile && !dependents.has(ref.sourceFile)) {
                dependents.add(ref.sourceFile);
                queue.push(ref.sourceFile);
            }
        }
    }
    return Array.from(dependents);
}
function hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}
function loadCache(cacheDir) {
    const cachePath = path.join(cacheDir, 'cache.json');
    try {
        if (fs.existsSync(cachePath)) {
            const data = fs.readFileSync(cachePath, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch {
        // Cache corrupted or doesn't exist
    }
    return { location: cacheDir, entries: [] };
}
function saveCache(cache, cacheDir) {
    try {
        fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(path.join(cacheDir, 'cache.json'), JSON.stringify(cache, null, 2));
    }
    catch {
        // Failed to save cache
    }
}
function findCachedArtifact(cache, blockId) {
    return cache.entries.find((e) => e.blockId === blockId);
}
function invalidateCache(cacheDir = DEFAULT_CACHE_DIR) {
    const cachePath = path.join(cacheDir, 'cache.json');
    if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
    }
}
//# sourceMappingURL=incremental.js.map