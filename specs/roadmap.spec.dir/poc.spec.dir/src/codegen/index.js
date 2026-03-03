"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/code-generation.spec.md
 * Generated: 2026-03-03T05:31:00.000Z
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
exports.createSpecSymlink = exports.CodeGenerator = exports.TemplateRegistry = void 0;
var template_registry_1 = require("./template-registry");
Object.defineProperty(exports, "TemplateRegistry", { enumerable: true, get: function () { return template_registry_1.TemplateRegistry; } });
var generator_1 = require("./generator");
Object.defineProperty(exports, "CodeGenerator", { enumerable: true, get: function () { return generator_1.CodeGenerator; } });
var symlink_manager_1 = require("./symlink-manager");
Object.defineProperty(exports, "createSpecSymlink", { enumerable: true, get: function () { return symlink_manager_1.createSpecSymlink; } });
__exportStar(require("./templates/function"), exports);
__exportStar(require("./templates/class"), exports);
__exportStar(require("./templates/interface"), exports);
__exportStar(require("./templates/type"), exports);
__exportStar(require("./templates/enum"), exports);
__exportStar(require("./templates/constant"), exports);
//# sourceMappingURL=index.js.map