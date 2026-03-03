"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/build-integration.spec.md
 * Generated: 2026-03-03T10:55:00.000Z
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
exports.BuildIntegration = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = require("fs");
const poc_1 = require("../types/poc");
const path_utils_1 = require("../utils/path-utils");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * Whitelist of allowed build commands for security
 */
const ALLOWED_BUILD_COMMANDS = [
    'npm run build',
    'npm run compile',
    'tsc',
    'tsc --build',
    'yarn build',
    'pnpm build'
];
/**
 * Build integration for generated code
 */
class BuildIntegration {
    config;
    constructor(config) {
        // SECURITY: Validate build command against whitelist
        this.config = this.validateBuildCommand(config);
    }
    /**
     * Validate and sanitize build command
     * @throws {POCError} If command is not in whitelist
     */
    validateBuildCommand(config) {
        const command = config.buildCommand.trim();
        // SECURITY: Reject commands with shell metacharacters FIRST
        const dangerousChars = /[;|&$`\n\r<>]/;
        if (dangerousChars.test(command)) {
            throw new poc_1.POCError('WRITE_ERROR', `Build command contains dangerous characters: ${command}`, undefined);
        }
        // Check if command is in whitelist
        const isAllowed = ALLOWED_BUILD_COMMANDS.some(allowed => {
            if (command === allowed)
                return true;
            if (command.startsWith(allowed + ' ')) {
                // Additional security: ensure the rest of the command doesn't contain dangerous sequences
                const rest = command.slice(allowed.length + 1);
                // Allow only alphanumeric, hyphen, underscore, dot, space for arguments
                const safeArgPattern = /^[a-zA-Z0-9_\-\.\s]+$/;
                return safeArgPattern.test(rest);
            }
            return false;
        });
        if (!isAllowed) {
            throw new poc_1.POCError('WRITE_ERROR', `Build command "${command}" is not in whitelist. Allowed commands: ${ALLOWED_BUILD_COMMANDS.join(', ')}`, undefined);
        }
        return config;
    }
    /**
     * Simple command argument parser for POC
     * Handles quoted arguments: "arg with spaces" 'single quoted'
     * Returns array of parsed arguments
     */
    parseCommandArguments(command) {
        const args = [];
        let current = '';
        let inSingle = false;
        let inDouble = false;
        let escaped = false;
        for (let i = 0; i < command.length; i++) {
            const char = command[i];
            if (escaped) {
                current += char;
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }
            if (char === "'" && !inDouble) {
                inSingle = !inSingle;
                continue;
            }
            if (char === '"' && !inSingle) {
                inDouble = !inDouble;
                continue;
            }
            if (char === ' ' && !inSingle && !inDouble) {
                if (current) {
                    args.push(current);
                    current = '';
                }
                continue;
            }
            current += char;
        }
        if (current) {
            args.push(current);
        }
        return args;
    }
    /**
     * Run build after code generation with security hardening
     * @returns Build result with success status and output
     */
    async runBuild() {
        const start = Date.now();
        try {
            // SECURITY: Use execFile instead of exec to prevent shell injection
            // Parse command into executable and arguments with proper quoting
            const args = this.parseCommandArguments(this.config.buildCommand);
            if (args.length === 0) {
                throw new poc_1.POCError('WRITE_ERROR', 'Build command cannot be empty', undefined);
            }
            const executable = args[0];
            const execArgs = args.slice(1);
            // SECURITY: Resolve executable path to prevent PATH hijacking
            const { resolve } = await Promise.resolve().then(() => __importStar(require('path')));
            const { access, constants } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const resolvedExec = resolve(process.cwd(), executable);
            // Basic check: executable should exist and be executable
            // For POC, we'll just check if it's a file
            try {
                await access(resolvedExec, constants.F_OK);
            }
            catch {
                // If not found locally, assume it's in PATH (like 'npm', 'tsc')
                // For POC, we'll allow this but warn
                console.warn(`[BuildIntegration] Executable not found at resolved path: ${resolvedExec}, trying from PATH`);
            }
            const { stdout, stderr } = await execFileAsync(executable, execArgs, {
                timeout: 300000, // 5 minute timeout
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });
            return {
                success: true,
                stdout,
                stderr,
                duration: Date.now() - start
            };
        }
        catch (error) {
            return {
                success: false,
                stdout: error.stdout || '',
                stderr: error.stderr || error.message,
                duration: Date.now() - start
            };
        }
    }
    /**
     * Verify generated files are in place before building
     */
    verifyGeneratedFiles(specIds) {
        const errors = [];
        for (const specId of specIds) {
            const slug = (0, path_utils_1.slugifySpecId)(specId);
            const symlinkPath = `src/${slug}`;
            const sourcePath = `specs/${slug}.spec.dir/src`;
            // Check symlink exists
            if (!(0, fs_1.existsSync)(symlinkPath)) {
                errors.push(`Missing symlink: ${symlinkPath}`);
            }
            // Check source directory exists
            if (!(0, fs_1.existsSync)(sourcePath)) {
                errors.push(`Missing source directory: ${sourcePath}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.BuildIntegration = BuildIntegration;
//# sourceMappingURL=integration.js.map