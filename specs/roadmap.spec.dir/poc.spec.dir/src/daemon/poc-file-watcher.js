"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
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
exports.FileWatcher = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const glob_1 = require("glob");
/**
 * POC File Watcher
 * Simple wrapper around Node.js fs.watch
 */
class FileWatcher extends events_1.EventEmitter {
    watcher;
    watchDir;
    ignorePatterns;
    constructor(options) {
        super();
        this.watchDir = options?.watchDir || './specs';
        this.ignorePatterns = options?.ignorePatterns || ['*.tmp', '*~', '.git/**', 'node_modules/**'];
    }
    /**
     * Start watching the spec directory
     */
    async watch(directory) {
        this.watchDir = directory;
        // Verify directory exists
        const { access, constants } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        try {
            await access(directory, constants.R_OK);
        }
        catch {
            throw new Error(`Cannot watch directory: ${directory} does not exist or is not readable`);
        }
        // Start file watcher
        this.watcher = (0, fs_1.watch)(directory, { recursive: true }, (eventType, filename) => {
            if (!filename)
                return;
            // Check if file should be ignored
            if (this.shouldIgnore(filename))
                return;
            // Check if it's a spec file
            if (!this.isSpecFile(filename))
                return;
            // Emit change event
            const event = {
                type: this.mapEventType(eventType),
                path: `${directory}/${filename}`.replace(/\/+/g, '/'),
                timestamp: Date.now()
            };
            this.emit('change', event);
        });
        this.watcher.on('error', (error) => {
            this.emit('error', error);
        });
        console.log(`[FileWatcher] Watching: ${directory}`);
    }
    /**
     * Check if file should be ignored
     */
    shouldIgnore(filename) {
        for (const pattern of this.ignorePatterns) {
            // Simple glob matching
            if (pattern.includes('**')) {
                const prefix = pattern.replace('/**', '').replace('**', '');
                if (filename.includes(prefix))
                    return true;
            }
            else if (filename === pattern || filename.endsWith(pattern.replace('*', ''))) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if file is a spec file
     */
    isSpecFile(filename) {
        return filename.endsWith('.spec.md') ||
            filename.endsWith('.spec.yaml') ||
            filename.endsWith('.spec.yml') ||
            filename.endsWith('.scl');
    }
    /**
     * Map fs event type to our event type
     */
    mapEventType(eventType) {
        if (eventType === 'rename')
            return 'created';
        if (eventType === 'change')
            return 'modified';
        return 'modified';
    }
    /**
     * Stop watching
     */
    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = undefined;
        }
        console.log('[FileWatcher] Stopped');
    }
    /**
     * Get initial list of spec files
     */
    async getSpecFiles() {
        const pattern = '**/*.{spec.md,spec.yaml,spec.yml,scl}';
        const files = await (0, glob_1.glob)(pattern, {
            cwd: this.watchDir,
            absolute: true
        });
        return files;
    }
}
exports.FileWatcher = FileWatcher;
//# sourceMappingURL=poc-file-watcher.js.map