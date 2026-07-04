"use strict";
/**
 * File watcher for speclangd - Simulated using polling
 *
 * Generated from: @speclang/daemon/events
 *
 * Uses Node.js fs.watchFile for polling-based file watching.
 * In production, this would use inotify (Linux) or FSEvents (macOS).
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
exports.Watcher = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const events_1 = require("events");
const types_1 = require("./types");
const gitignore_1 = require("./gitignore");
const debounce_1 = require("./debounce");
// Watch patterns from spec
const WATCH_PATTERNS = [
    '**/*.spec.{md,yaml,yml,scl}',
    '**/*.{go,ts,js,py,rs,java}.spec',
    '**/project.scl',
    '**/build.{scl,yaml}',
];
class Watcher extends events_1.EventEmitter {
    watchPaths;
    ignorePatterns;
    fileStates;
    pollInterval;
    running;
    pollTimer;
    gitignore;
    debouncer;
    constructor(config) {
        super();
        this.watchPaths = config.watch.paths;
        this.ignorePatterns = config.watch.ignore;
        this.fileStates = new Map();
        this.pollInterval = 1000;
        this.running = false;
        this.gitignore = new gitignore_1.Gitignore();
        this.debouncer = new debounce_1.Debouncer({ windowMs: config.watch.debounce ?? 100 });
        this.debouncer.on('batch', (batch) => {
            for (const event of batch.events) {
                this.emit('event', event);
            }
        });
    }
    /**
     * Start watching the configured directories
     */
    async start() {
        if (this.running)
            return;
        this.running = true;
        // Load .gitignore from project root
        await this.loadGitignore();
        // Initial scan to build file state
        await this.initialScan();
        // Start polling
        this.pollTimer = setInterval(() => this.poll(), this.pollInterval);
        console.log(`[Watcher] Started watching: ${this.watchPaths.join(', ')}`);
    }
    /**
     * Load .gitignore from project root
     */
    async loadGitignore() {
        for (const watchPath of this.watchPaths) {
            const gitignorePath = path.join(watchPath, '.gitignore');
            const loaded = await gitignore_1.Gitignore.fromFile(gitignorePath);
            // Add spec-specific ignores
            loaded.add('.speclang/');
            loaded.add('*.log');
            loaded.add('reports/');
            // Merge patterns (this.gitignore starts empty)
            this.gitignore = loaded;
        }
    }
    /**
     * Stop watching
     */
    stop() {
        this.running = false;
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
        console.log('[Watcher] Stopped');
    }
    /**
     * Initial scan to capture current file states
     */
    async initialScan() {
        for (const watchPath of this.watchPaths) {
            await this.scanDirectory(watchPath);
        }
    }
    /**
     * Recursively scan directory for files
     */
    async scanDirectory(dirPath) {
        try {
            const exists = await fs.pathExists(dirPath);
            if (!exists)
                return;
            const stat = await fs.stat(dirPath);
            if (stat.isDirectory()) {
                const entries = await fs.readdir(dirPath);
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry);
                    await this.scanDirectory(fullPath);
                }
            }
            else if (stat.isFile()) {
                if (this.shouldWatch(dirPath)) {
                    this.fileStates.set(dirPath, {
                        mtime: stat.mtimeMs,
                        size: stat.size,
                    });
                }
            }
        }
        catch (error) {
            // Ignore permission errors
        }
    }
    /**
     * Check if a path should be watched based on patterns
     */
    shouldWatch(filePath) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        // Check gitignore first
        if (this.gitignore.isIgnored(normalizedPath)) {
            return false;
        }
        // Check explicit ignore patterns from config
        for (const pattern of this.ignorePatterns) {
            const patternNorm = pattern.replace(/\\/g, '/');
            if (patternNorm.endsWith('/')) {
                if (normalizedPath.includes(patternNorm.slice(0, -1))) {
                    return false;
                }
            }
            else if (patternNorm.startsWith('*.')) {
                const ext = patternNorm.slice(1);
                if (normalizedPath.endsWith(ext)) {
                    return false;
                }
            }
            else if (normalizedPath.includes(patternNorm)) {
                return false;
            }
        }
        // Check watch patterns
        for (const pattern of WATCH_PATTERNS) {
            if (this.matchPattern(normalizedPath, pattern)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Convert a glob pattern (with **, *, brace expansion {a,b}, .ext) into a RegExp.
     *
     * ARCH-001 fix (2026-07-04): the prior implementation did ** → .* first,
     * then * → [^/]* last — which meant the trailing * from **\/*.spec.md
     * turned the .* (multi-segment) into .[^/]* (single-segment), causing the
     * compiled regex to only match 2-segment paths. The new approach uses
     * placeholders for **/ and; /** (multi-directory anchors) and handles
    * brace expansion before escaping.
    */
    globToRegex(pattern) {
        let regex = pattern;
        // 1. Brace expansion {a,b,c} → (a|b|c) — must run before escaping
        regex = regex.replace(/\{([^}]+)\}/g, (_, inner) => '(' + inner.replace(/,/g, '|') + ')');
        // 2. Escape regex specials (not *, not the () we just inserted)
        regex = regex.replace(/[.+^$\[\]\\]/g, '\\$&');
        // 3. Placeholder **/ and /**, then bare ** → `.*`
        regex = regex.replace(/\*\*\//g, '__DOUBLE_SLASH__');
        regex = regex.replace(/\/\*\*/g, '__SLASH_DOUBLE__');
        regex = regex.replace(/\*\*/g, '.*');
        // 4. Restore literal slashes (escaped above)
        regex = regex.replace(/\\\//g, '/');
        // 5. Single `*` (already placeholder-free) → `[^/]*`
        regex = regex.replace(/\*/g, '[^/]*');
        // 6. Multi-dir anchors:
        //    __DOUBLE_SLASH__ = `**/` prefix = zero or more directory levels
        regex = regex.replace(/__DOUBLE_SLASH__/g, '(?:[^/]*\\/)*');
        regex = regex.replace(/__SLASH_DOUBLE__/g, '(?:\\/[^/]*)*');
        return new RegExp(`^${regex}$`);
    }
    /**
     * Simple glob pattern matching
     */
    matchPattern(filePath, pattern) {
        return this.globToRegex(pattern).test(filePath);
    }
    /**
     * Poll for file changes
     */
    async poll() {
        const currentFiles = new Map();
        // Scan current state
        for (const watchPath of this.watchPaths) {
            await this.scanDirectoryToMap(watchPath, currentFiles);
        }
        // Check for new and modified files
        for (const [filePath, state] of Array.from(currentFiles.entries())) {
            const oldState = this.fileStates.get(filePath);
            if (!oldState) {
                // New file
                this.debouncer.add({
                    kind: types_1.FileEventKind.Create,
                    path: filePath,
                    timestamp: Date.now(),
                });
            }
            else if (oldState.mtime !== state.mtime || oldState.size !== state.size) {
                // Modified file
                this.debouncer.add({
                    kind: types_1.FileEventKind.Modify,
                    path: filePath,
                    timestamp: Date.now(),
                });
            }
        }
        // Check for deleted files
        for (const [filePath] of Array.from(this.fileStates.entries())) {
            if (!currentFiles.has(filePath)) {
                this.debouncer.add({
                    kind: types_1.FileEventKind.Delete,
                    path: filePath,
                    timestamp: Date.now(),
                });
            }
        }
        // Update state
        this.fileStates = currentFiles;
    }
    /**
     * Scan directory and populate file map
     */
    async scanDirectoryToMap(dirPath, fileMap) {
        try {
            const exists = await fs.pathExists(dirPath);
            if (!exists)
                return;
            const stat = await fs.stat(dirPath);
            if (stat.isDirectory()) {
                const entries = await fs.readdir(dirPath);
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry);
                    await this.scanDirectoryToMap(fullPath, fileMap);
                }
            }
            else if (stat.isFile()) {
                if (this.shouldWatch(dirPath)) {
                    fileMap.set(dirPath, {
                        mtime: stat.mtimeMs,
                        size: stat.size,
                    });
                }
            }
        }
        catch (error) {
            // Ignore permission errors
        }
    }
    /**
     * Force check a specific file (for manual triggers)
     */
    async trigger(pathToCheck) {
        try {
            const exists = await fs.pathExists(pathToCheck);
            const stat = exists ? await fs.stat(pathToCheck) : null;
            if (exists && stat?.isFile()) {
                if (this.shouldWatch(pathToCheck)) {
                    this.debouncer.add({
                        kind: types_1.FileEventKind.Modify,
                        path: pathToCheck,
                        timestamp: Date.now(),
                    });
                }
            }
            else {
                this.debouncer.add({
                    kind: types_1.FileEventKind.Delete,
                    path: pathToCheck,
                    timestamp: Date.now(),
                });
            }
        }
        catch (error) {
            console.error(`[Watcher] Error triggering ${pathToCheck}:`, error);
        }
    }
}
exports.Watcher = Watcher;
//# sourceMappingURL=watcher.js.map