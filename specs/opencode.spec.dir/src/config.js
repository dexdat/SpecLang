"use strict";
/**
 * OpenCode Plugin Configuration
 *
 * Configuration loading and profile management
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
exports.PROFILES = exports.DEFAULT_CONFIG = void 0;
exports.loadConfig = loadConfig;
exports.getProfile = getProfile;
exports.getAllProfiles = getAllProfiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.DEFAULT_CONFIG = {
    projectDir: process.cwd(),
    quietPeriod: 30,
    maxConcurrent: 10,
    profile: 'mvp'
};
exports.PROFILES = {
    poc: {
        agents: ['SpecWriter', 'CodeGen', 'TestWriter'],
        tests: 'basic',
        pipeline: ['build']
    },
    mvp: {
        agents: ['SpecWriter', 'CodeGen', 'TestWriter', 'BackSync'],
        tests: 'standard',
        pipeline: ['build', 'test']
    },
    enterprise: {
        agents: [
            'SpecWriter',
            'CodeGen-Go',
            'CodeGen-TS',
            'TestWriter',
            'Adversarial',
            'SecurityAudit',
            'ComplianceCheck'
        ],
        tests: 'comprehensive',
        pipeline: ['build', 'test', 'security', 'compliance'],
        coverageMin: 80,
        securityScan: true
    }
};
function loadConfig(projectDir) {
    const configPath = path.join(projectDir, '.speclangrc');
    let config = { ...exports.DEFAULT_CONFIG };
    config.projectDir = projectDir;
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            const rc = parseSpeclangRC(content);
            if (rc.profile) {
                config.profile = rc.profile;
            }
            if (rc.quietPeriod) {
                config.quietPeriod = rc.quietPeriod;
            }
            if (rc.maxConcurrent) {
                config.maxConcurrent = rc.maxConcurrent;
            }
        }
        catch (error) {
            console.warn(`Failed to load .speclangrc: ${error}`);
        }
    }
    return config;
}
function parseSpeclangRC(content) {
    const result = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('profile:')) {
            const value = trimmed.substring(8).trim();
            if (value === 'poc' || value === 'mvp' || value === 'enterprise') {
                result.profile = value;
            }
        }
        else if (trimmed.startsWith('quietPeriod:')) {
            result.quietPeriod = parseInt(trimmed.substring(12).trim(), 10);
        }
        else if (trimmed.startsWith('maxConcurrent:')) {
            result.maxConcurrent = parseInt(trimmed.substring(14).trim(), 10);
        }
    }
    return result;
}
function getProfile(profile) {
    return exports.PROFILES[profile];
}
function getAllProfiles() {
    return { ...exports.PROFILES };
}
//# sourceMappingURL=config.js.map