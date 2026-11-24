"use strict";
/**
 * Convergence OUTPUT accounting for speclangd (DF-SPECLANG-024).
 *
 * The convergence detector used to count watcher events, and the watcher
 * reports the spec the user just SAVED — an input. A save that generated
 * nothing therefore printed "Files: 1" while the disk held zero new files.
 *
 * The only trustworthy source of "what did this convergence pass write" is the
 * project tree itself: fingerprint it immediately before the pipeline runs,
 * fingerprint it again once the pipeline is done, and diff. Files the pipeline
 * rewrote with identical bytes are NOT counted (a no-op rewrite did not change
 * anything a user can see); the daemon's own state, the VCS database and
 * installed dependencies are never counted at all.
 *
 * Kept separate from convergence.ts so the detector stays a pure accounting
 * state machine that unit tests can drive without touching the filesystem.
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
exports.MAX_SNAPSHOT_FILES = exports.DEFAULT_IGNORED_DIRECTORIES = void 0;
exports.snapshotProjectFiles = snapshotProjectFiles;
exports.diffOutputSnapshots = diffOutputSnapshots;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/** Directories that never hold convergence outputs. */
exports.DEFAULT_IGNORED_DIRECTORIES = ['.git', 'node_modules', '.speclang'];
/** Hard cap on the tree walk, so a pathological project cannot stall a cascade. */
exports.MAX_SNAPSHOT_FILES = 20000;
/** Files above this size are fingerprinted by size+mtime instead of content. */
const LARGE_FILE_BYTES = 4 * 1024 * 1024;
/** Compile a `*`/`?` basename glob. Everything else is literal. */
function globToRegExp(pattern) {
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
}
function fingerprint(filePath, size, mtimeMs) {
    if (size > LARGE_FILE_BYTES) {
        return `large:${size}:${mtimeMs}`;
    }
    try {
        return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');
    }
    catch {
        // Unreadable file (permissions, race with a delete): fall back to metadata
        // so the path is still tracked rather than silently dropped.
        return `unreadable:${size}:${mtimeMs}`;
    }
}
/**
 * Snapshot every file under `root`.
 *
 * Symlinks are not followed: a symlinked directory (this repo's own `src/`
 * layout) must not be walked twice, and a symlinked file is not something the
 * generator wrote.
 */
function snapshotProjectFiles(root, options = {}) {
    const ignoreDirectories = options.ignoreDirectories ?? exports.DEFAULT_IGNORED_DIRECTORIES;
    const ignoreFilePatterns = options.ignoreFilePatterns ?? [];
    const ignoreDirSet = new Set(ignoreDirectories);
    const ignoreFileRegExps = ignoreFilePatterns.map(globToRegExp);
    const maxFiles = options.maxFiles ?? exports.MAX_SNAPSHOT_FILES;
    const snapshot = {
        root,
        files: new Map(),
        truncated: false,
        ignoreDirectories: [...ignoreDirectories],
        ignoreFilePatterns: [...ignoreFilePatterns],
    };
    const walk = (absoluteDir, relativeDir) => {
        if (snapshot.truncated)
            return;
        let entries;
        try {
            entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
        }
        catch {
            return; // vanished or unreadable directory
        }
        for (const entry of entries) {
            if (snapshot.files.size >= maxFiles) {
                snapshot.truncated = true;
                return;
            }
            const absolute = path.join(absoluteDir, entry.name);
            const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                if (ignoreDirSet.has(entry.name))
                    continue;
                walk(absolute, relative);
            }
            else if (entry.isFile()) {
                if (ignoreFileRegExps.some((re) => re.test(entry.name)))
                    continue;
                let stat;
                try {
                    stat = fs.statSync(absolute);
                }
                catch {
                    continue;
                }
                snapshot.files.set(relative, fingerprint(absolute, stat.size, stat.mtimeMs));
            }
        }
    };
    walk(root, '');
    return snapshot;
}
/**
 * Paths that were CREATED or whose content CHANGED between two snapshots.
 *
 * Deletions are not outputs: a convergence pass "wrote" nothing by removing a
 * file, and counting one would reintroduce an inflated number under a different
 * name. Result is sorted so log output and assertions are deterministic.
 */
function diffOutputSnapshots(before, after) {
    const changed = [];
    for (const [relative, hash] of after.files) {
        if (before.files.get(relative) !== hash) {
            changed.push(relative);
        }
    }
    return changed.sort();
}
//# sourceMappingURL=outputs.js.map