"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/index
 * Generated: 2026-02-22
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROJECT_STRUCTURE = exports.formatInitResult = exports.initProject = exports.getValidationSummary = exports.isProjectValid = exports.validateProject = exports.isSpeclangProject = exports.getProjectStructure = exports.loadProjectLayoutConfig = exports.buildProjectStructure = exports.loadSpeclangRc = exports.findProjectRoot = exports.getDefaultSpeclangRcVars = exports.getDefaultProjectSclVars = exports.generateInitialTestSpec = exports.generateInitialSpec = exports.generateGitignore = exports.generateSpeclangRc = exports.generateProjectScl = void 0;
/**
 * Project Layout Module
 *
 * Provides project initialization, validation, and configuration
 * for the speclang project structure.
 */
// Types
__exportStar(require("./types.js"), exports);
// Templates
var templates_js_1 = require("./templates.js");
Object.defineProperty(exports, "generateProjectScl", { enumerable: true, get: function () { return templates_js_1.generateProjectScl; } });
Object.defineProperty(exports, "generateSpeclangRc", { enumerable: true, get: function () { return templates_js_1.generateSpeclangRc; } });
Object.defineProperty(exports, "generateGitignore", { enumerable: true, get: function () { return templates_js_1.generateGitignore; } });
Object.defineProperty(exports, "generateInitialSpec", { enumerable: true, get: function () { return templates_js_1.generateInitialSpec; } });
Object.defineProperty(exports, "generateInitialTestSpec", { enumerable: true, get: function () { return templates_js_1.generateInitialTestSpec; } });
Object.defineProperty(exports, "getDefaultProjectSclVars", { enumerable: true, get: function () { return templates_js_1.getDefaultProjectSclVars; } });
Object.defineProperty(exports, "getDefaultSpeclangRcVars", { enumerable: true, get: function () { return templates_js_1.getDefaultSpeclangRcVars; } });
// Config
var config_js_1 = require("./config.js");
Object.defineProperty(exports, "findProjectRoot", { enumerable: true, get: function () { return config_js_1.findProjectRoot; } });
Object.defineProperty(exports, "loadSpeclangRc", { enumerable: true, get: function () { return config_js_1.loadSpeclangRc; } });
Object.defineProperty(exports, "buildProjectStructure", { enumerable: true, get: function () { return config_js_1.buildProjectStructure; } });
Object.defineProperty(exports, "loadProjectLayoutConfig", { enumerable: true, get: function () { return config_js_1.loadProjectLayoutConfig; } });
Object.defineProperty(exports, "getProjectStructure", { enumerable: true, get: function () { return config_js_1.getProjectStructure; } });
Object.defineProperty(exports, "isSpeclangProject", { enumerable: true, get: function () { return config_js_1.isSpeclangProject; } });
// Validator
var validator_js_1 = require("./validator.js");
Object.defineProperty(exports, "validateProject", { enumerable: true, get: function () { return validator_js_1.validateProject; } });
Object.defineProperty(exports, "isProjectValid", { enumerable: true, get: function () { return validator_js_1.isProjectValid; } });
Object.defineProperty(exports, "getValidationSummary", { enumerable: true, get: function () { return validator_js_1.getValidationSummary; } });
// Init
var init_js_1 = require("./init.js");
Object.defineProperty(exports, "initProject", { enumerable: true, get: function () { return init_js_1.initProject; } });
Object.defineProperty(exports, "formatInitResult", { enumerable: true, get: function () { return init_js_1.formatInitResult; } });
// Default structure constant
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "DEFAULT_PROJECT_STRUCTURE", { enumerable: true, get: function () { return types_js_1.DEFAULT_PROJECT_STRUCTURE; } });
//# sourceMappingURL=index.js.map